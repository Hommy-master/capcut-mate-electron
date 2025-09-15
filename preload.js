const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is loaded!');

// 通过 contextBridge 安全地将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 保存文件
    saveFile: (data) => ipcRenderer.invoke('save-file', data),

    downloadFile: (fileUrl, relativePath) => ipcRenderer.invoke('download-file', fileUrl, relativePath),

    startDownload: (downloadOptions) => ipcRenderer.invoke('start-download', downloadOptions),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
    onDownloadDone: (callback) => ipcRenderer.on('download-done', (event, data) => callback(data)),
    onDownloadError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data))
});