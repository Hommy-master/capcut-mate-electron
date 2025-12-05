/**
 * Electron API服务层
 * 封装Electron API调用，实现浏览器和Electron环境的兼容
 */

// 检查是否在Electron环境中
const isElectron = () => {
  return window && window.electronAPI;
};

// 空实现或模拟实现（用于浏览器环境）
const mockElectronAPI = {
  getConfigData: async () => {
    console.warn('Electron API not available in browser: getConfigData');
    return { targetDirectory: '' };
  },
  getDownloadLog: async () => {
    console.warn('Electron API not available in browser: getDownloadLog');
    return [];
  },
  onFileOperationLog: (callback) => {
    console.warn('Electron API not available in browser: onFileOperationLog');
    return () => {}; // 返回空的卸载函数
  },
  removeAllFileOperationLogListeners: () => {
    console.warn('Electron API not available in browser: removeAllFileOperationLogListeners');
  },
  getUrlJsonData: async (url) => {
    console.warn('Electron API not available in browser: getUrlJsonData');
    // 在浏览器环境中，可以直接使用axios请求
    try {
      // const response = await fetch(url);
      // return response.json();
      return {};
    } catch (error) {
      console.error('Error fetching data in browser:', error);
      return { code: -1, message: 'Browser fetch failed' };
    }
  },
  saveFile: async (options) => {
    console.warn('Electron API not available in browser: saveFile');
    alert('保存文件功能仅在桌面应用中可用');
    return { success: false, message: 'Not available in browser' };
  },
  clearDownloadLog: () => {
    console.warn('Electron API not available in browser: clearDownloadLog');
  },
  openExternalUrl: (url) => {
    console.warn('Electron API not available in browser: openExternalUrl');
    window.open(url, '_blank');
  },
  updateDraftPath: async () => {
    console.warn('Electron API not available in browser: updateDraftPath');
    alert('选择路径功能仅在桌面应用中可用');
    return { success: false, message: 'Not available in browser' };
  }
};

// 实际的Electron API（用于Electron环境）
const electronAPI = {
  getConfigData: async () => {
    return await window.electronAPI.getConfigData();
  },
  getDownloadLog: async () => {
    return await window.electronAPI.getDownloadLog();
  },
  onFileOperationLog: async (callback) => {
    return await window.electronAPI.onFileOperationLog(callback);
  },
  removeAllFileOperationLogListeners: () => {
    window.electronAPI.removeAllFileOperationLogListeners();
  },
  getUrlJsonData: async (url) => {
    return await window.electronAPI.getUrlJsonData(url);
  },
  saveFile: async (options) => {
    return await window.electronAPI.saveFile(options);
  },
  clearDownloadLog: () => {
    window.electronAPI.clearDownloadLog();
  },
  openExternalUrl: (url) => {
    window.electronAPI.openExternalUrl(url);
  },
  updateDraftPath: async () => {
    return await window.electronAPI.updateDraftPath();
  }
};

// 根据环境选择使用哪个API实现
const electronService = isElectron() && window.electronAPI ? electronAPI : mockElectronAPI;

export default electronService;
