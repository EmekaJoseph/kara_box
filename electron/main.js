import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import ffmpegPathRaw from 'ffmpeg-static';

const ffmpegPath = ffmpegPathRaw.replace('app.asar', 'app.asar.unpacked');

const __dirname = dirname(fileURLToPath(import.meta.url));

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.wmv', '.flv', '.ogv']);
const CONVERTED_DIR_NAME = '.converted';

let mainWindow;

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
        const files = readdirSync(folderPath); // Synchronous read
        return files.filter((file) => VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase()));
    } catch (err) {
        console.error('Error reading folder:', err);
        throw err; // Throw the error to be handled in the renderer
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
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
