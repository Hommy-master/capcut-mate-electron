import React, { useState, useEffect } from 'react';
import SettingsButton from './components/SettingsButton';
import Carousel from './components/Carousel';
import Textarea from './components/Textarea';
import Tabs from './components/Tabs';
import DownloadControls from './components/DownloadControls';
import DownloadButton from './components/DownloadButton';
import LogModule from './components/LogModule';
import SettingsWindow from './components/SettingsWindow';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [textareaValue, setTextareaValue] = useState('');
  const [isDownloadOpen, setIsDownloadOpen] = useState(true);
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({ targetDirectory: '' });

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadLogs();
    // 监听日志更新
    if (window.electronAPI) {
      window.electronAPI.onFileOperationLog((logEntry) => {
        setLogs(prevLogs => [...prevLogs, logEntry]);
      });
    }
  }, []);

  const loadConfig = async () => {
    if (window.electronAPI) {
      try {
        const configData = await window.electronAPI.getConfigData();
        setConfig(configData || { targetDirectory: '' });
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    }
  };

  const loadLogs = async () => {
    if (window.electronAPI) {
      try {
        const logData = await window.electronAPI.getDownloadLog();
        if (logData && logData.length > 0) {
          setLogs(logData);
        }
      } catch (error) {
        console.error('加载日志失败:', error);
      }
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handlePathUpdate = (newPath) => {
    setConfig(prevConfig => ({ ...prevConfig, targetDirectory: newPath }));
  };

  const handleClearDraftPath = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.clearDefaultDraftPath();
        if (result.success) {
          setConfig(prevConfig => ({ ...prevConfig, targetDirectory: '' }));
          // 显示成功消息
        }
      } catch (error) {
        console.error('清除草稿路径失败:', error);
      }
    }
  };

  const handleDownload = async () => {
    if (!textareaValue.trim()) {
      // 显示提示消息
      return;
    }

    const valArray = textareaValue.split('\n').map(line => line.trim());
    for (const val of valArray) {
      if (val) {
        await saveFile(val);
      }
    }
  };

  const saveFile = async (value) => {
    // 从URL中提取draft_id
    const urlParams = new URLSearchParams(value.includes('?') ? value.split('?')[1] : '');
    const targetId = urlParams.get('draft_id');

    if (!targetId) {
      // 显示提示消息
      return;
    }

    if (window.electronAPI) {
      try {
        const jsonData = await window.electronAPI.getUrlJsonData(value);
        if (jsonData?.code !== 0 || !jsonData?.files) {
          // 显示错误消息
          return;
        }

        const matchedFiles = jsonData.files.filter(fileUrl => 
          fileUrl.includes(targetId)
        );

        if (matchedFiles.length === 0) {
          // 显示错误消息
          return;
        }

        await window.electronAPI.saveFile({
          remoteFileUrls: matchedFiles,
          targetId,
          isOpenDir: isDownloadOpen,
        });
      } catch (error) {
        console.error('保存文件失败:', error);
        // 显示错误消息
      }
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    if (window.electronAPI) {
      window.electronAPI.clearDownloadLog();
    }
  };

  return (
    <div className="container">
      <div className="top-tip" onClick={() => window.electronAPI?.openExternalUrl('https://jcaigc.cn')}>
        点击进入官网
      </div>
      
      <SettingsButton onClick={handleSettingsClick} />
      
      <Carousel />
      
      <Textarea 
        value={textareaValue} 
        onChange={setIsDownloadOpen} 
      />
      
      <Tabs 
        onTabChange={content => setTextareaValue(content)} 
        initialContent={textareaValue}
      />
      
      <DownloadControls 
        isOpen={isDownloadOpen} 
        onToggle={setIsDownloadOpen}
        hasCustomPath={!!config.targetDirectory}
        onClearPath={handleClearDraftPath}
      />
      
      <DownloadButton onClick={handleDownload} />
      
      <LogModule 
        logs={logs} 
        onClear={handleClearLogs} 
      />
      
      <SettingsWindow 
        isOpen={showSettings} 
        onClose={handleCloseSettings} 
        currentPath={config.targetDirectory}
        onPathUpdate={handlePathUpdate}
      />
    </div>
  );
}

export default App;
