const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const {
  readDownloadLog,
  clearDownloadLog,
  getDraftUrls,
  clearDefaultDraftPath,
  downloadFiles
} = require('./script/download');

const logger = require("./script/logger");

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 888,
    icon: path.join(__dirname, 'res', 'logo.png'), // 设置窗口图标
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成（出于安全考虑，强烈推荐）
      contextIsolation: true, // 启用上下文隔离（Electron 12 后默认 true，推荐开启）
      preload: path.join(__dirname, 'script', 'preload.js') // 指定预加载脚本的绝对路径
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'web', 'index.html'));

  // 开发环境下打开DevTools
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

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

// 清空默认草稿路径
ipcMain.handle('clear-default-draft-path', async (event) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'app-config.json');
    let config = {};
    
    // 尝试读取现有配置
    try {
      const data = await fs.promises.readFile(configPath, 'utf8');
      config = JSON.parse(data);
    } catch (error) {
      // 如果文件不存在，保持config为空对象
    }
    
    // 删除targetDirectory字段
    delete config.targetDirectory;
    
    // 写回配置文件
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    logger.info('默认草稿路径已清空');
    return { success: true };
  } catch (error) {
    logger.error('清空默认草稿路径失败:', error);
    return { success: false, error: error.message };
  }
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