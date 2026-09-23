import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { readdirSync, existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { networkInterfaces } from 'os';
import { randomUUID } from 'crypto';
import ffmpegPathRaw from 'ffmpeg-static';
import QRCode from 'qrcode';

const ffmpegPath = ffmpegPathRaw.replace('app.asar', 'app.asar.unpacked');

const __dirname = dirname(fileURLToPath(import.meta.url));

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.wmv', '.flv', '.ogv']);
const CONVERTED_DIR_NAME = '.converted';

let mainWindow;
let currentSongsFolder = null;
let guestServer = null;
let guestServerPort = null;
const requestQueue = [];

function listVideoFiles(folderPath) {
    return readdirSync(folderPath).filter((file) => VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase()));
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

    console.log('Vue app path:', path.join(__dirname, '../dist/index.html'));
}


// Handle folder reading via IPC
ipcMain.handle('read-folder', async (event, folderPath) => {
    if (typeof folderPath !== 'string' || folderPath.trim() === '') {
        throw new Error('Invalid folder path');
    }
    try {
        currentSongsFolder = folderPath;
        return listVideoFiles(folderPath);
    } catch (err) {
        console.error('Error reading folder:', err);
        throw err; // Throw the error to be handled in the renderer
    }
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
// browse the current song folder and add requests to a shared queue.
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
                if (!currentSongsFolder) return sendJson(res, 200, []);
                return sendJson(res, 200, listVideoFiles(currentSongsFolder));
            }

            if (req.method === 'POST' && url.pathname === '/api/queue') {
                const body = JSON.parse((await readRequestBody(req)) || '{}');
                const song = typeof body.song === 'string' ? body.song : '';
                const name = typeof body.name === 'string' ? body.name.trim().slice(0, 30) : '';

                // Whitelist: the requested song must be a real file in the
                // current folder, since this endpoint is reachable by any
                // device on the network.
                const validSongs = currentSongsFolder ? listVideoFiles(currentSongsFolder) : [];
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
            console.error('Guest server error:', err);
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
ipcMain.handle('convert-video', async (event, folderPath, fileName, forceReencode) => {
    if (typeof folderPath !== 'string' || typeof fileName !== 'string' || !folderPath.trim() || !fileName.trim()) {
        throw new Error('Invalid arguments');
    }

    const inputPath = path.join(folderPath, fileName);
    const cacheDir = path.join(folderPath, CONVERTED_DIR_NAME);
    const outputName = `${path.basename(fileName, path.extname(fileName))}.mp4`;
    const outputPath = path.join(cacheDir, outputName);

    if (!forceReencode && existsSync(outputPath)) {
        return outputName;
    }

    if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
    }

    const reencode = () => runFfmpeg([
        '-y', '-i', inputPath,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
        '-c:a', 'aac', '-movflags', '+faststart',
        outputPath,
    ]);

    if (forceReencode) {
        try {
            await reencode();
        } catch (err) {
            removeIfExists(outputPath);
            throw err;
        }
        return outputName;
    }

    try {
        // Fast path: repackage into MP4 without re-encoding video. Fixes the
        // common case (e.g. an MKV with AC3/DTS audio) where the video
        // stream is already playable and only the container/audio isn't.
        await runFfmpeg(['-y', '-i', inputPath, '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart', outputPath]);
    } catch {
        removeIfExists(outputPath);
        // Slow path: the video codec itself is unsupported, so re-encode it.
        try {
            await reencode();
        } catch (err) {
            removeIfExists(outputPath);
            throw err;
        }
    }

    return outputName;
});



app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (guestServer) guestServer.close();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
