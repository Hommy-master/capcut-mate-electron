const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

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