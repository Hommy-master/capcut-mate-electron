const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises; // 使用 fs.promises 进行异步文件操作
const { createWriteStream } = require('fs');
const axios = require('axios');

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
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

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

async function readConfig() {
  const configPath = getConfigPath();
  console.log('[log] Config path:', configPath);
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writeConfig(config) {
  const configPath = getConfigPath();
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入配置文件失败:', error);
    return false;
  }
}

// 提取出来的函数，可选参数parentWindow用于显示对话框时附加到对话框
async function getTargetDirectory(parentWindow = null) {
  let config = await readConfig();
  if (config.targetDirectory) {
    try {
      await fs.access(config.targetDirectory);
      return config.targetDirectory;
    } catch (accessErr) {
      console.warn('配置的目录已不存在，将重新选择。');
    }
  }

  const dialogOptions = {
    properties: ['openDirectory'],
    title: '请选择目标目录',
    buttonLabel: '选择此目录'
  };

  // 如果有父窗口，则附加到父窗口
  if (parentWindow) {
    dialogOptions.window = parentWindow;
  }

  const result = await dialog.showOpenDialog(dialogOptions);

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedDir = result.filePaths[0];
    config.targetDirectory = selectedDir;
    await writeConfig(config);
    return selectedDir;
  } else {
    throw new Error('用户取消了目录选择');
  }
}

// 注册IPC处理器，这里我们假设渲染进程会发送'get-target-dir'消息，并且我们希望对话框附加到发送消息的渲染进程窗口
ipcMain.handle('get-target-dir', async (event) => {
  // 从事件对象中获取发送消息的窗口
  const window = BrowserWindow.fromWebContents(event.sender);
  return getTargetDirectory(window);
});

ipcMain.handle('get-url-json-data', async (event, remoteUrl) => {
  try {
    const response = await axios({
      method: 'GET',
      url: remoteUrl,
      responseType: 'json',
      timeout: 30000, // 30秒超时
      headers: { // 添加常见的浏览器User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 检查HTTP状态码
    if (response.status !== 200) {
      mainWindow.webContents.send('file-operation-log', { level: 'error', message: `读取 ${remoteUrl} 数据失败` });
      throw new Error(`[error] request failed, status code: ${response.status}`);
    }

    return response.data;
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
});


ipcMain.handle('save-file', async (event, { remoteFileUrls, targetId, isOpenDir }) => {
  try {
    let baseTargetDir = '';
    // 然后获取目标目录，将主窗口作为父窗口传递
    try {
      baseTargetDir = await getTargetDirectory(mainWindow);
      console.log('[log] get target dir:', baseTargetDir);
    } catch (error) {
      console.error('[log] get target dir fail:', error);
      mainWindow.webContents.send('file-operation-log', { level: 'error', message: `获取目录失败：${error}` });
      return;
    }

    mainWindow.webContents.send('file-operation-log', { level: 'info', message: `创建剪映草稿目录：${targetId}` });

    let i = 0;
    let relativePath = '';
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


        console.log('[log] idIndex: ' + idIndex);

        // 提取ID及之后的部分作为将要下载的路径
        relativePath = fullPath.substring(idIndex).replaceAll('/', path.sep); // 替换为系统路径分隔符


        console.log('[log] relativePath: ' + relativePath);

        const fullTargetPath = path.join(baseTargetDir, relativePath);
        const targetDir = path.dirname(fullTargetPath);

        console.log('[log] fullTargetPath: ' + fullTargetPath);

        console.log('[log] targetDir: ' + targetDir);

        // 3. 确保目标目录存在
        await fs.mkdir(targetDir, { recursive: true }); // recursive: true 可以创建多级目录
        // return { success: true, message: targetDir };

        // 4. 下载文件
        await downloadFile(fileUrl, fullTargetPath, relativePath, targetDir);
        console.log(`[log] file saved to : ${fullTargetPath}`);

        mainWindow.webContents.send('file-operation-log', { level: 'success', message: `第 ${++i} 个草稿信息文件保存成功` });
      } catch (error) {
        console.error(`[error] download file ${fileUrl} failed:`, error);

        mainWindow.webContents.send('file-operation-log', { level: 'error', message: `第 ${++i} 个草稿信息文件保存失败` });
        // 你可以决定是继续下载其他文件还是直接抛出错误
        // 这里记录错误但继续尝试下载下一个文件
      }
    }
    mainWindow.webContents.send('file-operation-log', { level: 'all', message: `下载完成：所有 ${targetId} 中的剪映草稿已成功下载！` });
    const jointPath = path.join(baseTargetDir, targetId);
    console.log(`[finish] all download: ${jointPath}`);
    if (isOpenDir) await openDirectory(null, jointPath);
    return { success: true, message: `文件批量保存完成，保存至目录: ${jointPath}` };
  } catch (error) {
    console.error(`[error] 批量保存过程发生错误:`, error);

    mainWindow.webContents.send('file-operation-log', { level: 'error', message: `下载完成：批量保存 ${targetId} 中的剪映草稿过程发生错误！` });
    return { success: false, message: `保存失败: ${error.message} ` };
  }
});

/**
 * 下载单个文件并保存到指定路径的辅助函数
 * @param {string} url 远程文件的URL
 * @param {string} filePath 要保存到的本地文件路径
 */
async function downloadFile(url, filePath, relativePath, targetDir) {

  console.log(`[log] start get file context : ${filePath}`);
  mainWindow.webContents.send('file-operation-log', { level: 'loading', message: `正在下载草稿内容文件: ${relativePath}` });
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
      mainWindow.webContents.send('file-operation-log', { level: 'error', message: `下载草稿内容文件失败` });
      throw new Error(`[error] request failed, status code: ${response.status}`);
    }

    console.log(`[log] start create writable stream: ${filePath}`);


    mainWindow.webContents.send('file-operation-log', { level: 'loading', message: `正在将草稿内容文件写入本地草稿目录 ${targetDir}` });

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

// 打开目录
async function openDirectory(event, dirPath) {
  try {
    const errorMsg = await shell.openPath(dirPath);
    if (errorMsg) {
      console.error(`[error] Failed to open path: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
    return { success: true };
  } catch (error) {
    console.error(`[error] Error opening path: ${error}`);
    return { success: false, error: error.message };
  }
}

// 从URL提取文件名
function getFileNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.substring(pathname.lastIndexOf('/') + 1) || 'download';
  } catch (e) {
    return 'download';
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