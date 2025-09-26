function getQueryParam(paramName, url) {
    // 构造正则表达式：匹配 ? 或 & 后面跟随的参数名称和其值
    const regex = new RegExp("[?&]" + paramName + "=([^&#]*)", "i");
    const result = regex.exec(url);
    // 如果找到匹配项，则解码后返回；否则返回 null
    return result ? decodeURIComponent(result[1]) : null;
}

async function initDownload() {
    // 监听来自主进程的日志消息
    window.electronAPI.onFileOperationLog((logEntry) => {
        addLog(logEntry);
    });

    // 可选：在页面卸载或关闭时移除监听器，防止内存泄漏
    window.addEventListener("beforeunload", () => {
        window.electronAPI.removeAllFileOperationLogListeners();
    });

    // 下载开关功能
    const downloadToggle = document.getElementById("downloadToggle");
    const downloadBtn = document.getElementById("downloadBtn");
    const textarea = document.querySelector(".auto-resize-textarea");

    // 保存文件
    async function saveFile(value) {
        const targetId = getQueryParam("draft_id", value);

        if (!targetId) {
            alert(`${value} 中缺少 draft_id 参数`);
            return;
        }

        const jsonData = await window.electronAPI.getUrlJsonData(value);

        if (jsonData?.code !== 0 || !jsonData?.files) {
            alert("获取文件列表失败");
            return;
        }

        const matchedFiles = jsonData.files.filter((fileUrl) =>
            fileUrl.includes(targetId)
        );

        if (matchedFiles.length === 0) {
            alert("未找到");
            return;
        }
        downloadBtn.disabled = true;
        downloadToggle.disabled = true;
        const iconItem = downloadBtn.querySelector("i.fas");
        iconItem.classList.remove('fa-download');
        iconItem.classList.add('fa-spinner');
        iconItem.classList.add('fa-spin');
        try {
            await window.electronAPI.saveFile({
                remoteFileUrls: matchedFiles,
                targetId,
                isOpenDir: downloadToggle.checked,
            });
        } catch (error) {
            alert("保存文件时出错: " + error.message);
        }

        iconItem.classList.remove('fa-spin');
        iconItem.classList.remove('fa-spinner');
        iconItem.classList.add('fa-download');
        downloadBtn.disabled = false;
        downloadToggle.disabled = false;
    }

    // 下载按钮功能
    downloadBtn.addEventListener("click", async function () {
        const value = textarea.value.trim();
        if (value === "") {
            alert("内容为空，无法下载");
            return;
        }

        const valArray = value.split("\n").map((line) => line.trim());
        for (const val of valArray) {
            if (val) {
                await saveFile(val);
            }
        }
    });

    // 清空日志功能
    const clearLogBtn = document.getElementById("clearLogBtn");
    const logList = document.getElementById("downloadLog");
    const emptyLog = document.getElementById("emptyLog");

    clearLogBtn.addEventListener("click", function () {
        window.electronAPI.clearDownloadLog();
        logList.innerHTML = "";
        logList.classList.add("hide");
        emptyLog.classList.remove("hide");
    });

    const logData = await window.electronAPI.getDownloadLog();
    if (logData && logData.length > 0) {
        logData.forEach((logEntry) => {
            addLog(logEntry, false);
        });
    }

    function removeListIcon() {
        const existingItems = logList.querySelectorAll(".log-item");

        existingItems.forEach((item) => {
            const iconItem = item.querySelector(".log-icon");

            const oldLevel = Array.from(iconItem.classList).find((cls) =>
                ["loading", "show"].includes(cls)
            );

            iconItem.classList.remove(oldLevel);
        });
    }

    // 添加日志函数
    function addLog({ message, time, level = "info" }, isNew = true) {
        emptyLog.classList.add("hide");
        logList.classList.remove("hide");

        const logIconMap = {
            info: "fas fa-info-circle",
            success: "fas fa-check-circle",
            error: "fas fa-times-circle",
            loading: "fas fa-spinner fa-spin",
            all: "fas fa-check-circle", // check-square
        };

        const logItem = document.createElement("li");
        const iconClass = isNew ? `${level} show` : '';
        logItem.className = `log-item ${level}`;
        logItem.innerHTML = `
                                <span class="log-time">[${time}] </span>
                                <i class="${logIconMap[level]} ${iconClass} log-icon"></i>
                                <span class="log-message">${message}</span>
                            `;

        removeListIcon();

        // 将新日志添加到顶部
        logList.appendChild(logItem);
    }
}