const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises; // 使用 fs.promises 进行异步文件操作
const { createWriteStream } = require('fs');
const axios = require('axios');

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // 禁用 Node.js 集成（出于安全考虑，强烈推荐）:cite[5]:cite[7]
      contextIsolation: true, // 启用上下文隔离（Electron 12 后默认 true，推荐开启）:cite[3]:cite[7]
      preload: path.join(__dirname, 'preload.js') // 指定预加载脚本的绝对路径
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 开发环境下打开DevTools
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}


// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);


ipcMain.handle('save-file', async (event, remoteFileUrls) => {
  try {
    // 1. 弹出对话框让用户选择要保存到的目标目录
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'], // 选择目录:cite[6]
      title: '请选择要保存文件的主目录'
    });

    if (result.canceled) {
      return { success: false, message: '用户取消了操作' };
    }

    let baseTargetDir = result.filePaths[0]; // 用户选择的目标目录

    // 移除可能存在的域名部分或特定前缀（根据你的URL结构调整）
    // 例如，如果URL路径都以 '/2025090716400922f559b4/' 开头，你可以把它去掉
    const targetId = '/2025090716400922f559b4/';

    // 2. 遍历远程文件URL数组
    for (const fileUrl of remoteFileUrls) {
      try {
        // 从URL中提取相对路径部分
        // 假设你的URL结构固定，可以从特定部分之后开始提取
        const urlObj = new URL(fileUrl);
        // 提取路径名中可能包含的部分路径（根据你的URL结构调整）
        let fullPath = urlObj.pathname;

        // 找到ID在路径中的位置
        const idIndex = fullPath.indexOf(targetId);
        if (idIndex === -1) continue;

        // 提取ID之后的部分作为将要下载的路径
        const relativePath = fullPath.substring(idIndex);

        const fullTargetPath = path.join(baseTargetDir, relativePath);
        const targetDir = path.dirname(fullTargetPath);

        console.log('[log] fullTargetPath: ' + fullTargetPath);

        console.log('[log] targetDir: ' + targetDir);

        // 3. 确保目标目录存在
        await fs.mkdir(targetDir, { recursive: true }); // recursive: true 可以创建多级目录
        // return { success: true, message: targetDir };

        // 4. 下载文件
        // await startDownload({}, { url: fileUrl, fileName: 'draft_meta_info.json', targetDirectory: targetDir });
        await downloadFile(fileUrl, fullTargetPath);
        console.log(`[log] file saved to : ${fullTargetPath}`);
      } catch (error) {
        console.error(`[error] download file ${fileUrl} failed:`, error);
        // 你可以决定是继续下载其他文件还是直接抛出错误
        // 这里记录错误但继续尝试下载下一个文件
      }
    }

    return { success: true, message: `文件批量保存完成，保存至目录: ${path.join(baseTargetDir, targetId)}` };
  } catch (error) {
    console.error(`[error] 批量保存过程发生错误:`, error);
    return { success: false, message: `保存失败: ${error.message} ` };
  }
});

/**
 * 增强版下载函数：下载文件并保存到指定路径，包含详细错误处理
 * @param {string} url 远程文件的URL
 * @param {string} filePath 要保存到的本地文件路径
 */

ipcMain.handle('download-file', async (event, fileUrl, filePath) => {
  return new Promise(async (resolve, reject) => {
    // 创建可写流
    const fileStream = createWriteStream(filePath);
    fileStream.on('error', (err) => {
      console.error(`[ERROR] 写入文件流错误 ${filePath}:`, err.message);
      reject(err);
    });
    fileStream.on('finish', () => {
      console.log(`[SUCCESS] 文件下载完成: ${filePath}`);
      resolve();
    });

    // 设置响应类型为 'stream' 以处理大文件
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 30000, // 30秒超时
        headers: { // 添加常见的浏览器User-Agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // 检查HTTP状态码
      if (response.status !== 200) {
        throw new Error(`请求失败，状态码: ${response.status}`);
      }

      // 创建可写流
      const writer = response.data.pipe(fileStream);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', (err) => {
          // 尝试删除可能不完整的文件
          fs.unlink(filePath).catch(() => { });
          reject(new Error(`写入文件失败: ${err.message}`));
        });
        response.data.on('error', (err) => {
          reject(new Error(`下载流错误: ${err.message}`));
        });
      });

    } catch (error) {
      // 更精确的错误处理
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`无法连接到服务器: ${url}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`域名无法解析: ${url}`);
      } else if (error.response) {
        // 服务器返回了错误状态码（如4xx, 5xx）
        throw new Error(`服务器错误 (${error.response.status}): ${url}`);
      } else {
        throw error; // 重新抛出其他未知错误
      }
    }
  });
});

/**
 * 下载单个文件并保存到指定路径的辅助函数
 * @param {string} url 远程文件的URL
 * @param {string} filePath 要保存到的本地文件路径
 */
async function downloadFile(url, filePath) {

  console.log(`[log] start get file context : ${filePath}`);
  // 设置响应类型为 'stream' 以处理大文件
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000, // 30秒超时
      headers: { // 添加常见的浏览器User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 检查HTTP状态码
    if (response.status !== 200) {
      throw new Error(`[error] request failed, status code: ${response.status}`);
    }

    console.log(`[log] start create writable stream: ${filePath}`);

    // 创建可写流
    const writer = response.data.pipe(createWriteStream(filePath));

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        // 尝试删除可能不完整的文件
        fs.unlink(filePath).catch(() => { });
        reject(new Error(`[error] write file failed: ${err.message}`));
      });
      response.data.on('error', (err) => {
        reject(new Error(`[error] download stream error: ${err.message}`));
      });
    });

  } catch (error) {
    // 更精确的错误处理
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`[error] not connect to server: ${url}`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error(`[error] domain not found: ${url}`);
    } else if (error.response) {
      // 服务器返回了错误状态码（如4xx, 5xx）
      throw new Error(`[error] server error (${error.response.status}): ${url}`);
    } else {
      throw error; // 重新抛出其他未知错误
    }
  }
}

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