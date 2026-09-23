// Never let logging setup take the rest of the preload script down with it.
try {
    require('electron-log/preload.js');
} catch (err) {
    console.error('electron-log preload failed to initialize:', err);
}

const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    console.log("Preload script loaded");
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})


// Expose the readFolders/convertVideo/guest-queue/projector/logging functions
contextBridge.exposeInMainWorld('electronAPI', {
    readFolders: (folderPaths) => ipcRenderer.invoke('read-folders', folderPaths),
    onSongsUpdated: (callback) => {
        const listener = (event, payload) => callback(payload);
        ipcRenderer.on('songs-updated', listener);
        return () => ipcRenderer.removeListener('songs-updated', listener);
    },
    pickFolder: () => ipcRenderer.invoke('pick-folder'),
    openLogFolder: () => ipcRenderer.invoke('open-log-folder'),
    convertVideo: (fullPath, forceReencode) => ipcRenderer.invoke('convert-video', fullPath, forceReencode),
    getVolumeLevel: (fullPath) => ipcRenderer.invoke('get-volume-level', fullPath),
    getGuestUrl: () => ipcRenderer.invoke('get-guest-url'),
    getGuestQrCode: (url) => ipcRenderer.invoke('get-guest-qrcode', url),
    queueGet: () => ipcRenderer.invoke('queue-get'),
    queueRemove: (id) => ipcRenderer.invoke('queue-remove', id),
    queueClear: () => ipcRenderer.invoke('queue-clear'),
    onQueueUpdated: (callback) => {
        const listener = (event, queue) => callback(queue);
        ipcRenderer.on('queue-updated', listener);
        return () => ipcRenderer.removeListener('queue-updated', listener);
    },
    getProjectorStatus: () => ipcRenderer.invoke('get-projector-status'),
    onProjectorStatus: (callback) => {
        const listener = (event, active) => callback(active);
        ipcRenderer.on('projector-status', listener);
        return () => ipcRenderer.removeListener('projector-status', listener);
    },
    sendProjectorCommand: (command) => ipcRenderer.send('projector-command', command),
    onProjectorCommand: (callback) => {
        const listener = (event, command) => callback(command);
        ipcRenderer.on('projector-command', listener);
        return () => ipcRenderer.removeListener('projector-command', listener);
    },
    reportProjectorState: (state) => ipcRenderer.send('projector-state', state),
    onProjectorState: (callback) => {
        const listener = (event, state) => callback(state);
        ipcRenderer.on('projector-state', listener);
        return () => ipcRenderer.removeListener('projector-state', listener);
    },
});
