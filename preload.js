const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is loaded!');

// 通过 contextBridge 安全地将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 保存文件
    saveFile: (data) => ipcRenderer.invoke('save-file', data),

    getUrlJsonData: (url) => ipcRenderer.invoke('get-url-json-data', url),

    getTargetDir: () => ipcRenderer.invoke('get-target-dir'),

    // 监听来自主进程的日志消息
    onFileOperationLog: (callback) => {
        ipcRenderer.on('file-operation-log', (event, logEntry) => {
            // 调用渲染进程提供的回调函数，并传递日志数据
            callback(logEntry);
        });
    },
    // 清理监听器，避免内存泄漏
    removeAllFileOperationLogListeners: () => {
        ipcRenderer.removeAllListeners('file-operation-log');
    },
    // 示例：也暴露一个调用主进程操作的方法（如果你使用 invoke/handle 方式）
    performWrite: (filePath, data) => ipcRenderer.invoke('perform-write', filePath, data)
});