const { app, BrowserWindow, ipcMain, dialog, nativeImage  } = require('electron');
const path = require('path');
const fs = require('fs');

const {
  readDownloadLog,
  clearDownloadLog,
  getDraftUrls,
  updateDraftPath,
  downloadFiles,
  readConfig
} = require('./script/download');

const logger = require("./script/logger");

let mainWindow;

function createWindow() {
  mainWindow = null;

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成（出于安全考虑，强烈推荐）
      contextIsolation: true, // 启用上下文隔离（Electron 12 后默认 true，推荐开启）
      preload: path.join(__dirname, 'script', 'preload.js') // 指定预加载脚本的绝对路径
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'web', 'index.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle('get-download-log', async (event) => {
  return await readDownloadLog();
});

ipcMain.handle('clear-download-log', async (event) => {
  return await clearDownloadLog();
});

ipcMain.handle('get-url-json-data', async (event, remoteUrl) => {
  try {
    return await getDraftUrls(remoteUrl, mainWindow);
  } catch (error) {
    logger.error(`[error] get draft url:`, error);
    return {};
  }
});

ipcMain.handle('save-file', async (event, config) => {
  await downloadFiles(config, mainWindow);
});

ipcMain.handle('show-message-box', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, {
    type: options.type || 'info',
    title: options.title || '提示',
    message: options.message || '',
    buttons: ['确定'],
    noLink: true, // 防止按钮以链接样式显示，这通常会使按钮更小更紧凑
    normalizeAccessKeys: true // 标准化访问键，确保按钮文本格式一致
  });
});

ipcMain.handle('get-config-data', async (event) => {
  return await readConfig();
});

// 设置默认草稿路径
ipcMain.handle('update-draft-path', async (event) => {
  return await updateDraftPath(mainWindow);
});

// 在默认浏览器中打开URL
ipcMain.handle('open-external-url', async (event, url) => {
  try {
    const { shell } = require('electron');
    await shell.openExternal(url);
    logger.info(`已在默认浏览器中打开URL: ${url}`);
    return { success: true };
  } catch (error) {
    logger.error(`打开URL失败: ${url}`, error);
    return { success: false, error: error.message };
  }
});


// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用及其菜单栏通常保持活动状态，直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});