
const path = require('path');
const axios = require('axios');
const { app, dialog, shell } = require('electron');
const { createWriteStream } = require('fs');
const fs = require('fs').promises; // 使用 fs.promises 进行异步文件操作
const logger = require('./logger');

const axiosConfig = {
    method: 'GET',
    timeout: 30000, // 30秒超时
    headers: { // 添加常见的浏览器User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
}

function getConfigPath() {
    return path.join(app.getPath('userData'), 'app-config.json');
}

async function readConfig() {
    const configPath = getConfigPath();
    logger.info('[log] Config path:', configPath);
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
        logger.error('写入配置文件失败:', error);
        return false;
    }
}

function getDownloadLogPath() {
    return path.join(app.getPath('userData'), 'download-log.json');
}


async function readDownloadLog() {
    const logPath = getDownloadLogPath();
    logger.info('[log] Log path:', logPath);
    try {
        const data = await fs.readFile(logPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}


/**
 * 
 * @param {*} entry { level: 'error', message: '日志内容' }
 */
async function appendDownloadLog(entry, parentWindow) {
    const logPath = getDownloadLogPath();
    let logs = [];
    try {
        logs = await readDownloadLog();
    } catch (error) {
        // 如果文件不存在或无法读取，初始化为空数组
        logs = [];
    }
    logs.push(entry);

    const now = new Date();
    entry.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    await parentWindow.webContents.send('file-operation-log', entry);
    try {
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (writeErr) {
        logger.error('写入日志文件失败:', writeErr);
    }
}

async function clearDownloadLog() {
    const logPath = getDownloadLogPath();
    try {
        await fs.writeFile(logPath, JSON.stringify([], null, 2), 'utf8');
        return true;
    } catch (error) {
        logger.error('清空日志文件失败:', error);
        return false;
    }
}

// 更精确的错误处理
function errorHandler(error = {}, url = '') {
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

async function getDraftUrls(remoteUrl, parentWindow) {
    logger.info('[info] get draft url');
    try {
        const response = await axios({
            ...axiosConfig,
            url: remoteUrl,
            responseType: 'json'
        });

        // 检查HTTP状态码
        if (response.status !== 200) {
            await appendDownloadLog({ level: 'error', message: `获取草稿地址信息失败` }, parentWindow);
            throw new Error(`[error] [draft url] request failed, status code: ${response.status}`);
        }
        logger.info('[success] get draft url');
        return response.data;
    } catch (error) {
        errorHandler(error, remoteUrl);
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
            logger.warn('配置的目录已不存在，将重新选择。');
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


function updateValue(current, finalKey, targetDir, oldVal, targetId) {
    if (oldVal) {
        // 找到ID在路径中的位置
        const idIndex = oldVal.indexOf(targetId);
        if (idIndex === -1) return;

        // 提取ID及之后的部分作为将要下载的路径
        const relativePath = oldVal.substring(idIndex).replaceAll('/', path.sep); // 替换为系统路径分隔符
        // targetDir 已包含 targetId 目录，所以relativePath中的targetId要去重
        const newRelativePath = relativePath.replace(`${targetId}${path.sep}`, '');
        const newValue = path.join(targetDir, newRelativePath);
        current[finalKey] = newValue;

        logger.info(`✅ newValue to:`, newValue);
    }
}

/**
 * 修改 JSON 对象的指定键值（支持嵌套键）
 * @param {Object} jsonData - 要修改的 JSON 对象
 * @param {string} keyPath - 要修改的键的路径（例如 'user.profile.name'）
 * @return {string} newValue - 要设置的新值
 */
function modifyJsonValue(jsonData, keyPath, targetDir, targetId) {
    const keys = keyPath.split('.');
    const lastIndex = keys.length - 1;
    let current = jsonData;
    logger.info(`[log] keys:`, jsonData, keys);
    // 遍历键路径，直到最后一个键之前
    for (let i = 0; i < lastIndex; i++) {
        const key = keys[i];

        // logger.info(`[log] current[${key}]:`, current[key]);
        // 如果路径中的某个键不存在或不是对象，则创建一个空对象（或根据需求抛出错误）
        if (!current.hasOwnProperty(key) || typeof current[key] !== 'object') {
            return;
        }
        current = current[key];
    }

    if (!current) return;

    // 设置最终键的值
    const finalKey = keys[lastIndex];

    if (current instanceof Array) {
        current.forEach(item => {
            if (item.hasOwnProperty(finalKey)) {
                const oldVal = item[finalKey];
                updateValue(item, finalKey, targetDir, oldVal, targetId);
            }
        });
    } else {
        const oldVal = current[finalKey];
        if (oldVal) {
            updateValue(current, finalKey, targetDir, oldVal, targetId);
        }
    }
}

async function downloadJsonFile({ fileUrl, filePath, targetDir, targetId }, parentWindow) {
    // 1. 使用 Axios 下载 JSON 文件
    try {
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'json', // 直接告诉 Axios 解析 JSON
        });

        // 检查HTTP状态码
        if (response.status !== 200) {
            await appendDownloadLog({ level: 'error', message: `下载草稿内容文件失败` }, parentWindow);
            throw new Error(`[error] [json] request failed, status code: ${response.status}`);
        }

        // 2. 解析获取到的数据（Axios 会根据 responseType: 'json' 自动解析）
        const jsonData = response.data;

        // 3. 修改 JSON 数据中指定键的值
        const keyToModify = 'materials.videos.path'; // 你想修改的键

        logger.info(`[log] start modifyJsonValue: ${keyToModify}`);
        modifyJsonValue(jsonData, keyToModify, targetDir, targetId);

        await appendDownloadLog({ level: 'loading', message: `正在将草稿内容文件写入本地草稿目录 ${targetDir}` }, parentWindow);

        // 4. 将修改后的 JSON 对象转换为格式化的字符串并写入本地文件
        const jsonString = JSON.stringify(jsonData, null, 2); // 使用 2 个空格进行缩进，美化输出
        await fs.writeFile(filePath, jsonString, 'utf8'); // 指定编码为 utf8
    } catch (error) {
        errorHandler(error, fileUrl);
    }
}

async function downloadNotJsonFile({ fileUrl, filePath, targetDir }, parentWindow) {
    try {
        // 1. 使用 Axios 下载非 JSON 文件
        const response = await axios({
            ...axiosConfig,
            url: fileUrl,
            responseType: 'stream', // 设置响应类型为 'stream' 以处理大文件
        });

        // 检查HTTP状态码
        if (response.status !== 200) {
            await appendDownloadLog({ level: 'error', message: `下载草稿内容文件失败` }, parentWindow);
            throw new Error(`[error] [stream] request failed, status code: ${response.status}`);
        }

        logger.info(`[log] start create writable stream: ${filePath}`);

        await appendDownloadLog({ level: 'loading', message: `正在将草稿内容文件写入本地草稿目录 ${targetDir}` }, parentWindow);

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
        errorHandler(error, fileUrl);
    }
}

/**
 * 下载单个文件并保存到指定路径的辅助函数
 * @param {string} url 远程文件的URL
 * @param {string} filePath 要保存到的本地文件路径
 */
async function downloadSingleFile(config, parentWindow) {
    const filePath = config.filePath;
    const fileUrl = config.fileUrl;

    if (fileUrl.endsWith('.json')) {
        logger.info(`[log] start download json file : ${filePath}`);
        await downloadJsonFile(config, parentWindow);
    } else {
        logger.info(`[log] start download non-json file : ${filePath}`);
        await downloadNotJsonFile(config, parentWindow);
    }
}

// 打开目录
async function openDraftDirectory(dirPath) {
    try {
        const errorMsg = await shell.openPath(dirPath);
        if (errorMsg) {
            logger.error(`[error] Failed to open path: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
        return { success: true };
    } catch (error) {
        logger.error(`[error] Error opening path: ${error}`);
        return { success: false, error: error.message };
    }
}

async function downloadFiles({ remoteFileUrls, targetId, isOpenDir }, parentWindow) {
    try {
        let baseTargetDir = '';
        // 然后获取目标目录，将主窗口作为父窗口传递
        try {
            baseTargetDir = await getTargetDirectory(parentWindow);
            logger.info('[log] get target dir:', baseTargetDir);
        } catch (error) {
            logger.error('[log] get target dir fail:', error);
            await appendDownloadLog({ level: 'error', message: `获取目录失败：${error}` }, parentWindow);
            return;
        }

        await appendDownloadLog({ level: 'info', message: `创建剪映草稿目录：${targetId}` }, parentWindow);

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

                // 提取ID及之后的部分作为将要下载的路径
                relativePath = fullPath.substring(idIndex).replaceAll('/', path.sep); // 替换为系统路径分隔符

                const fullTargetPath = path.join(baseTargetDir, relativePath);
                const targetDir = path.dirname(fullTargetPath);

                logger.info('[log] fullTargetPath: ' + fullTargetPath);

                logger.info('[log] targetDir: ' + targetDir);

                // 3. 确保目标目录存在
                await fs.mkdir(targetDir, { recursive: true }); // recursive: true 可以创建多级目录
                // return { success: true, message: targetDir };

                // 4. 下载文件

                logger.info(`[log] start get file context : ${fileUrl}`);
                await appendDownloadLog({ level: 'loading', message: `正在下载草稿内容文件: ${relativePath}` }, parentWindow);

                await downloadSingleFile({ fileUrl, filePath: fullTargetPath, targetDir, targetId }, parentWindow);

                logger.info(`[log] file saved to : ${fullTargetPath}`);
                await appendDownloadLog({ level: 'success', message: `第 ${++i} 个草稿信息文件保存成功` }, parentWindow);
            } catch (error) {
                logger.error(`[error] download file ${fileUrl} failed:`, error);

                await appendDownloadLog({ level: 'error', message: `第 ${++i} 个草稿信息文件保存失败` }, parentWindow);
                // 你可以决定是继续下载其他文件还是直接抛出错误
                // 这里记录错误但继续尝试下载下一个文件
            }
        }
        await appendDownloadLog({ level: 'all', message: `下载完成：所有 ${targetId} 中的剪映草稿已下载！` }, parentWindow);
        const jointPath = path.join(baseTargetDir, targetId);
        logger.info(`[finish] all download: ${jointPath}`);
        if (isOpenDir) await openDraftDirectory(jointPath);
        return { success: true, message: `文件批量保存完成，保存至目录: ${jointPath}` };
    } catch (error) {
        logger.error(`[error] 批量保存过程发生错误:`, error);

        await appendDownloadLog({ level: 'error', message: `下载失败：批量保存 ${targetId} 中的剪映草稿过程发生错误！` }, parentWindow);
        return { success: false, message: `保存失败: ${error.message} ` };
    }
}


module.exports = {
    readDownloadLog,
    clearDownloadLog,

    getDraftUrls,

    downloadFiles
};