import { useState, useEffect } from "react";

import "react-toastify/dist/ReactToastify.css";

import { ToastContainer, toast } from "react-toastify";

import electronService from "./services/electronService";
import SettingsButton from "./components/SettingsButton";
import Carousel from "./components/Carousel";
import Textarea from "./components/Textarea";
import Tabs from "./components/Tabs";
import DownloadControls from "./components/DownloadControls";
import DownloadButton from "./components/DownloadButton";
import LogModule from "./components/LogModule";
import SettingsWindow from "./components/SettingsWindow";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");
  const [isDownloadOpen, setIsDownloadOpen] = useState(true);
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({ targetDirectory: "" });
  const [isLoading, setIsLoading] = useState(false);

  // 加载配置
  useEffect(() => {
    // 监听日志更新
    electronService.onFileOperationLog((logEntry) => {
      setLogs((prevLogs) => [...prevLogs, logEntry]);
    });

    loadConfig();

    return () => {
      try {
        electronService.removeAllFileOperationLogListeners();
      } catch (error) {
        console.error("取消订阅日志失败:", error);
      }
    };
  }, []);

  const loadConfig = async () => {
    try {
      const configData = await electronService.getConfigData();
      setConfig(configData || { targetDirectory: "" });
    } catch (error) {
      console.error("加载配置失败:", error);
    }
  };

  // const loadLogs = async () => {
  //   try {
  //     const logData = await electronService.getDownloadLog();
  //     if (logData && logData.length > 0) {
  //       setLogs(logData);
  //     }
  //   } catch (error) {
  //     console.error("加载日志失败:", error);
  //   }
  // };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handlePathUpdate = (newPath) => {
    setConfig((prevConfig) => ({ ...prevConfig, targetDirectory: newPath }));
  };

  const handleDownload = async () => {
    if (!textareaValue.trim()) {
      toast.warn("请输入草稿地址，多个使用回车换行分隔");
      return;
    }

    const valArray = textareaValue.split("\n").map((line) => line.trim());
    for (const val of valArray) {
      if (val) {
        await saveFile(val);
      }
    }
  };

  const saveFile = async (value) => {
    // 从URL中提取draft_id
    const urlParams = new URLSearchParams(
      value.includes("?") ? value.split("?")[1] : ""
    );
    const targetId = urlParams.get("draft_id");

    if (!targetId) {
      // 显示提示消息
      return;
    }

    try {
      const jsonData = await electronService.getUrlJsonData(value);
      if (jsonData?.code !== 0 || !jsonData?.files) {
        toast.error("获取文件列表失败");
        return;
      }

      const matchedFiles = jsonData.files.filter((fileUrl) =>
        fileUrl.includes(targetId)
      );

      if (matchedFiles.length === 0) {
        toast.error("未找到匹配的文件");
        return;
      }

      await electronService.saveFile({
        remoteFileUrls: matchedFiles,
        targetId,
        isOpenDir: isDownloadOpen,
      });
      toast.success(`剪映草稿下载完成！请前往剪映查看`);
    } catch (error) {
      toast.error("保存文件失败", error);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    // electronService.clearDownloadLog();
  };

  return (
    <div className="app">
      <div
        className="top-tip"
        onClick={() => electronService.openExternalUrl("https://jcaigc.cn")}
      >
        点击进入官网
      </div>
      <div className="container">
        <SettingsButton onClick={handleSettingsClick} />

        <Carousel />

        <Textarea value={textareaValue} onChange={setTextareaValue} />

        <Tabs
          onTabChange={(content) => setTextareaValue(content)}
          initialContent={textareaValue}
        />

        <DownloadControls
          isOpen={isDownloadOpen}
          isLoading={isLoading}
          onToggle={setIsDownloadOpen}
        />

        <DownloadButton
          onClick={handleDownload}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          textValue={textareaValue.trim()}
        />

        <LogModule logs={logs} onClear={handleClearLogs} />

        <SettingsWindow
          isOpen={showSettings}
          onClose={handleCloseSettings}
          currentPath={config.targetDirectory}
          onPathUpdate={handlePathUpdate}
        />
      </div>

      <ToastContainer style={{ top: "55px" }} />
    </div>
  );
}

export default App;
