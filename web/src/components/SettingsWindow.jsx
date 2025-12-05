import React from 'react';
import electronService from '../services/electronService';

function SettingsWindow({ isOpen, onClose, currentPath, onPathUpdate }) {
  if (!isOpen) return null;

  const handleSelectPath = async () => {
    try {
      const result = await electronService.updateDraftPath();
      if (result.success) {
        onPathUpdate(result.targetDir);
      }
    } catch (error) {
      console.error('选择路径失败:', error);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div id="settingsWindow" className="settings-window">
      <div className="settings-overlay" onClick={handleOverlayClick}></div>
      <div className="settings-content">
        <div className="settings-header">
          <h3><i className="fas fa-cog"></i> 设置</h3>
          <button id="closeSettingsBtn" className="settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="settings-body">
          <div className="settings-group">
            <label htmlFor="draftPath">剪映路径设置</label>
            <div className="path-input-group">
              <input 
                type="text" 
                id="draftPath" 
                className="draft-path-input" 
                placeholder="请选择草稿保存路径" 
                value={currentPath} 
                readOnly 
                onClick={handleSelectPath}
              />
              <button id="selectPathBtn" className="btn btn-small" onClick={handleSelectPath}>选择...</button>
            </div>
            <p className="settings-hint">设置剪映软件的草稿路径以导入草稿至剪映</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsWindow;
