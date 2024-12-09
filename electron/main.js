import { app, BrowserWindow, ipcMain } from 'electron';
// const path = require('path');
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
    try {
        const files = readdirSync(folderPath); // Synchronous read
        return files; // Return the list of files to the renderer
    } catch (err) {
        console.error('Error reading folder:', err);
        throw err; // Throw the error to be handled in the renderer
    }
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
