import { app, BrowserWindow, ipcMain, screen, dialog, shell } from 'electron';
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { readdirSync, existsSync, mkdirSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { watch as fsWatch } from 'fs';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { networkInterfaces } from 'os';
import { randomUUID } from 'crypto';
import ffmpegPathRaw from 'ffmpeg-static';
import QRCode from 'qrcode';
import log from 'electron-log/main.js';

// Guarded: a failure here must never take down the rest of this file, since
// every ipcMain handler below depends on this module finishing evaluation.
try {
    log.initialize();
} catch (err) {
    console.error('electron-log failed to initialize:', err);
}
process.on('uncaughtException', (err) => log.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => log.error('Unhandled rejection:', reason));

const ffmpegPath = ffmpegPathRaw.replace('app.asar', 'app.asar.unpacked');

const __dirname = dirname(fileURLToPath(import.meta.url));

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.wmv', '.flv', '.ogv']);
const CONVERTED_DIR_NAME = '.converted';
const VOLUME_CACHE_FILE = '.volume-cache.json';
const TARGET_LUFS = -16;
const WATCH_DEBOUNCE_MS = 500;

let mainWindow;
let projectorWindow = null;
let currentSongsFolders = [];
let guestServer = null;
let guestServerPort = null;
const requestQueue = [];
const folderWatchers = new Map(); // folderPath -> { watcher, debounceTimer }

function listVideoFiles(folderPath) {
    return readdirSync(folderPath).filter((file) => VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase()));
}

// Scans every configured folder and returns the merged list of full,
// absolute file paths (the canonical song identifier used everywhere:
// playback, the queue, the guest API, conversion/volume caches).
function scanAllFolders(folderPaths) {
    const songs = [];
    const failedFolders = [];
    for (const folderPath of folderPaths) {
        try {
            for (const file of listVideoFiles(folderPath)) {
                songs.push(path.join(folderPath, file));
            }
        } catch (err) {
            failedFolders.push(folderPath);
            log.error(`Error reading folder ${folderPath}:`, err);
        }
    }
    return { songs, failedFolders };
}

function broadcastSongs() {
    if (!mainWindow) return;
    const { songs, failedFolders } = scanAllFolders(currentSongsFolders);
    mainWindow.webContents.send('songs-updated', { songs, failedFolders });
}

// Keeps a live fs.watch on every configured library folder so adding or
// removing files shows up without needing to reopen Settings. Watch events
// fire multiple times for a single file operation, so each folder's
// callback is debounced before triggering a re-scan.
function syncFolderWatchers(folderPaths) {
    for (const [folderPath, entry] of folderWatchers) {
        if (!folderPaths.includes(folderPath)) {
            clearTimeout(entry.debounceTimer);
            entry.watcher.close();
            folderWatchers.delete(folderPath);
        }
    }

    for (const folderPath of folderPaths) {
        if (folderWatchers.has(folderPath)) continue;
        try {
            const entry = { watcher: null, debounceTimer: null };
            entry.watcher = fsWatch(folderPath, { persistent: true }, () => {
                clearTimeout(entry.debounceTimer);
                entry.debounceTimer = setTimeout(broadcastSongs, WATCH_DEBOUNCE_MS);
            });
            folderWatchers.set(folderPath, entry);
        } catch (err) {
            log.error(`Could not watch folder ${folderPath}:`, err);
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 820,
        height: 700,
        minWidth: 820,
        minHeight: 680,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true, // Set to true for better security
        },
    });

    // Load the Vue app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:8185'); // Vite's default port
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    log.info('Vue app path:', path.join(__dirname, '../dist/index.html'));
}

function loadRoute(win, hash) {
    if (process.env.NODE_ENV === 'development') {
        win.loadURL(`http://localhost:8185/#${hash}`);
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'), { hash });
    }
}

function getSecondaryDisplay() {
    const displays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    return displays.find((d) => d.id !== primary.id) || null;
}

function broadcastProjectorStatus() {
    if (mainWindow) {
        mainWindow.webContents.send('projector-status', !!projectorWindow);
    }
}

function createProjectorWindow(display) {
    projectorWindow = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false,
        fullscreen: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    loadRoute(projectorWindow, '/projector');

    projectorWindow.on('closed', () => {
        projectorWindow = null;
        broadcastProjectorStatus();
    });

    broadcastProjectorStatus();
}

function destroyProjectorWindow() {
    if (projectorWindow) {
        projectorWindow.close();
    }
}

// Keeps a second, dedicated fullscreen window in sync with whatever
// secondary display (projector/TV) is currently connected, creating or
// tearing it down as displays are plugged/unplugged.
function syncProjectorWindow() {
    const secondary = getSecondaryDisplay();
    if (secondary && !projectorWindow) {
        createProjectorWindow(secondary);
    } else if (!secondary && projectorWindow) {
        destroyProjectorWindow();
    } else if (secondary && projectorWindow) {
        projectorWindow.setBounds(secondary.bounds);
    }
}

// Scans the given folders, starts watching them for live changes, and
// returns the merged song list (full absolute paths) plus any folders that
// couldn't be read.
ipcMain.handle('read-folders', async (event, folderPaths) => {
    if (!Array.isArray(folderPaths)) {
        throw new Error('Invalid folder list');
    }
    currentSongsFolders = folderPaths.filter((f) => typeof f === 'string' && f.trim());
    syncFolderWatchers(currentSongsFolders);
    return scanAllFolders(currentSongsFolders);
});

ipcMain.handle('pick-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.handle('open-log-folder', () => {
    const logFile = log.transports.file.getFile().path;
    shell.showItemInFolder(logFile);
});


const VIRTUAL_ADAPTER_PATTERN = /virtual|vmware|virtualbox|hyper-v|vethernet|docker|wsl|tailscale|zerotier|loopback|tap|tun|vpn/i;

// Picks the LAN-facing IPv4 address guests would actually use to reach this
// machine, preferring a real Wi-Fi/Ethernet adapter over virtual ones (VPNs,
// Docker, VMware/Hyper-V, etc. commonly sort before the real adapter and
// aren't reachable from other devices on the network).
function getLanAddress() {
    const interfaces = networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                candidates.push({ name, address: iface.address });
            }
        }
    }

    const real = candidates.find((c) => !VIRTUAL_ADAPTER_PATTERN.test(c.name));
    return (real || candidates[0])?.address || null;
}

function broadcastQueue() {
    if (mainWindow) {
        mainWindow.webContents.send('queue-updated', requestQueue);
    }
}

function guestPageHtml() {
    return readFileSync(path.join(__dirname, 'guest-page.html'), 'utf-8');
}

function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 10_000) req.destroy(); // guard against abuse
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

// Local HTTP server guests on the same network can reach via QR code, to
// browse the current song library and add requests to a shared queue.
function ensureGuestServer() {
    if (guestServer) return;

    guestServer = createServer(async (req, res) => {
        try {
            const url = new URL(req.url, 'http://localhost');

            if (req.method === 'GET' && url.pathname === '/') {
                const html = guestPageHtml();
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
                return;
            }

            if (req.method === 'GET' && url.pathname === '/api/songs') {
                return sendJson(res, 200, scanAllFolders(currentSongsFolders).songs);
            }

            if (req.method === 'POST' && url.pathname === '/api/queue') {
                const body = JSON.parse((await readRequestBody(req)) || '{}');
                const song = typeof body.song === 'string' ? body.song : '';
                const name = typeof body.name === 'string' ? body.name.trim().slice(0, 30) : '';

                // Whitelist: the requested song must be a real file in one of
                // the current folders, since this endpoint is reachable by
                // any device on the network.
                const validSongs = scanAllFolders(currentSongsFolders).songs;
                if (!validSongs.includes(song)) {
                    return sendJson(res, 400, { error: 'Unknown song' });
                }

                requestQueue.push({
                    id: randomUUID(),
                    song,
                    name: name || 'Guest',
                    requestedAt: Date.now(),
                });
                broadcastQueue();
                return sendJson(res, 200, { ok: true });
            }

            res.writeHead(404);
            res.end();
        } catch (err) {
            log.error('Guest server error:', err);
            sendJson(res, 500, { error: 'Server error' });
        }
    });

    guestServer.listen(0, '0.0.0.0', () => {
        guestServerPort = guestServer.address().port;
    });
}

ipcMain.handle('get-guest-url', async () => {
    ensureGuestServer();
    const address = getLanAddress();
    if (!address) return null;
    // Port is assigned asynchronously by listen(); wait for it briefly.
    for (let i = 0; i < 20 && !guestServerPort; i++) {
        await new Promise((r) => setTimeout(r, 50));
    }
    if (!guestServerPort) return null;
    return `http://${address}:${guestServerPort}/`;
});

ipcMain.handle('get-guest-qrcode', async (event, url) => {
    if (typeof url !== 'string' || !url) throw new Error('Invalid URL');
    return QRCode.toDataURL(url, { margin: 1, width: 320 });
});

ipcMain.handle('queue-get', () => requestQueue);

ipcMain.handle('queue-remove', (event, id) => {
    const index = requestQueue.findIndex((item) => item.id === id);
    if (index !== -1) requestQueue.splice(index, 1);
    broadcastQueue();
    return requestQueue;
});

ipcMain.handle('queue-clear', () => {
    requestQueue.length = 0;
    broadcastQueue();
    return requestQueue;
});

ipcMain.handle('get-projector-status', () => !!projectorWindow);

// Remote-control commands from the main window's UI (play/pause/seek/volume/
// stop/load) forwarded straight to whichever window owns the actual <video>
// element on the projector display.
ipcMain.on('projector-command', (event, command) => {
    if (projectorWindow) {
        projectorWindow.webContents.send('projector-command', command);
    }
});

// Playback state reported back from the projector window (current time,
// duration, paused/ended/error) so the main window's remote control can
// stay in sync.
ipcMain.on('projector-state', (event, state) => {
    if (mainWindow) {
        mainWindow.webContents.send('projector-state', state);
    }
});

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, args);
        proc.on('error', reject);
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });
    });
}

function removeIfExists(filePath) {
    if (existsSync(filePath)) {
        try { unlinkSync(filePath); } catch { /* best effort */ }
    }
}

// Convert a video to a widely-compatible MP4 on demand, caching the result
// so repeat plays of the same file are instant. `forceReencode` skips the
// fast stream-copy attempt: it's used when a previously "converted" file
// still failed to play, meaning the copied video codec itself (not just the
// container/audio) is the real problem, since ffmpeg's exit code alone
// can't tell us whether the copied codec is actually browser-decodable.
ipcMain.handle('convert-video', async (event, fullPath, forceReencode) => {
    if (typeof fullPath !== 'string' || !fullPath.trim()) {
        throw new Error('Invalid arguments');
    }

    const folderPath = path.dirname(fullPath);
    const fileName = path.basename(fullPath);
    const cacheDir = path.join(folderPath, CONVERTED_DIR_NAME);
    const outputName = `${path.basename(fileName, path.extname(fileName))}.mp4`;
    const outputPath = path.join(cacheDir, outputName);

    if (!forceReencode && existsSync(outputPath)) {
        return outputPath;
    }

    if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
    }

    const reencode = () => runFfmpeg([
        '-y', '-i', fullPath,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
        '-c:a', 'aac', '-movflags', '+faststart',
        outputPath,
    ]);

    if (forceReencode) {
        try {
            await reencode();
        } catch (err) {
            removeIfExists(outputPath);
            log.error(`Video re-encode failed for ${fullPath}:`, err);
            throw err;
        }
        return outputPath;
    }

    try {
        // Fast path: repackage into MP4 without re-encoding video. Fixes the
        // common case (e.g. an MKV with AC3/DTS audio) where the video
        // stream is already playable and only the container/audio isn't.
        await runFfmpeg(['-y', '-i', fullPath, '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart', outputPath]);
    } catch {
        removeIfExists(outputPath);
        // Slow path: the video codec itself is unsupported, so re-encode it.
        try {
            await reencode();
        } catch (err) {
            removeIfExists(outputPath);
            log.error(`Video conversion failed for ${fullPath}:`, err);
            throw err;
        }
    }

    return outputPath;
});

function readJsonSafe(filePath) {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return {};
    }
}

// Runs ffmpeg's EBU R128 loudness filter in measure-only mode (output
// discarded via -f null) and parses the integrated loudness (LUFS) it
// reports. This only analyzes the file; it doesn't alter it.
function measureLoudness(inputPath) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, ['-i', inputPath, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
        let stderr = '';
        proc.stderr.on('data', (chunk) => { stderr += chunk; });
        proc.on('error', reject);
        proc.on('close', () => {
            const start = stderr.lastIndexOf('{');
            const end = stderr.lastIndexOf('}');
            if (start === -1 || end === -1 || end < start) {
                reject(new Error('Could not parse loudness measurement'));
                return;
            }
            try {
                const parsed = JSON.parse(stderr.slice(start, end + 1));
                resolve(parseFloat(parsed.input_i));
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Computes (and caches) a per-song starting volume so a quiet dialogue-heavy
// track and a loud, hot-mastered one don't blast the room back to back.
// Deliberately attenuate-only: a plain <video> element's volume tops out at
// 1.0 (unity gain), so a quiet file simply keeps its natural level rather
// than needing amplification we can't apply safely here.
ipcMain.handle('get-volume-level', async (event, fullPath) => {
    if (typeof fullPath !== 'string' || !fullPath.trim()) return 1;

    const folderPath = path.dirname(fullPath);
    const fileName = path.basename(fullPath);
    const cachePath = path.join(folderPath, VOLUME_CACHE_FILE);
    const cache = readJsonSafe(cachePath);

    if (typeof cache[fileName] === 'number') {
        return cache[fileName];
    }

    let ratio = 1;
    try {
        const measuredLufs = await measureLoudness(fullPath);
        const gainDb = TARGET_LUFS - measuredLufs;
        ratio = Math.min(1, Math.max(0.15, 10 ** (gainDb / 20)));
    } catch (err) {
        log.error(`Volume measurement failed for ${fullPath}:`, err);
        ratio = 1;
    }

    cache[fileName] = ratio;
    try {
        writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    } catch (err) {
        log.error('Failed to write volume cache:', err);
    }

    return ratio;
});



app.on('ready', () => {
    createWindow();
    syncProjectorWindow();
    screen.on('display-added', syncProjectorWindow);
    screen.on('display-removed', syncProjectorWindow);
    screen.on('display-metrics-changed', syncProjectorWindow);
});

app.on('window-all-closed', () => {
    if (guestServer) guestServer.close();
    if (projectorWindow) projectorWindow.close();
    for (const entry of folderWatchers.values()) {
        clearTimeout(entry.debounceTimer);
        entry.watcher.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
