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


// Expose the readFolder/convertVideo functions
contextBridge.exposeInMainWorld('electronAPI', {
    readFolder: (folderPath) => ipcRenderer.invoke('read-folder', folderPath),
    convertVideo: (folderPath, fileName, forceReencode) => ipcRenderer.invoke('convert-video', folderPath, fileName, forceReencode),
});