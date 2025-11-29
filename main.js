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

function findIconPath() {
  let iconPath = null;

  // 根据不同平台选择不同的图标文件
  let iconName = 'logo.png';
  if (process.platform === 'win32') {
    iconName = 'logo.ico';
  } else if (process.platform === 'darwin') {
    iconName = 'logo.icns';
  }

  // 尝试多个可能的图标路径
  const possiblePaths = [
    path.join(__dirname, 'resources', 'icon', iconName),
    path.join(__dirname, 'resources', 'icon', 'logo.png'), // fallback to png
    path.join(process.resourcesPath, 'icon', iconName),
    path.resolve(__dirname, 'resources', 'icon', iconName)
  ];

  // 找到第一个存在的图标文件
  for (const possiblePath of possiblePaths) {
    console.info(`[win icon check] path: ${possiblePath}`);
    if (fs.existsSync(possiblePath)) {
      iconPath = possiblePath;
      console.info(`[win icon haved] path: ${iconPath}`);
      break;
    } else {
      console.warn(`[win icon noexist] path: ${possiblePath}`);
    }
  }

  return iconPath;
}

function setWindowIcon() {
  const iconPath = findIconPath();

  // 设置窗口图标
  if (iconPath && mainWindow) {
    try {
      mainWindow.setIcon(iconPath);
      console.info('[win icon set] success');
    } catch (error) {
      console.error('[win icon set] fail:', error);
    }
  } else {
    console.warn('[WARN] no find icon or mainWindow not ready');
  }
}

function createWindow() {
  // 先查找图标路径
  const iconPath = findIconPath();

  // 创建浏览器窗口，直接在选项中设置icon
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 888,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成（出于安全考虑，强烈推荐）
      contextIsolation: true, // 启用上下文隔离（Electron 12 后默认 true，推荐开启）
      preload: path.join(__dirname, 'script', 'preload.js') // 指定预加载脚本的绝对路径
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'web', 'index.html'));

  // 延迟设置图标，确保窗口完全创建
  if (process.platform !== 'darwin') { // macOS不需要额外设置图标
    setTimeout(() => {
      setWindowIcon();
    }, 500);
  }
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

// 清空默认草稿路径
ipcMain.handle('clear-default-draft-path', async (event) => {
  return await clearDefaultDraftPath();
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