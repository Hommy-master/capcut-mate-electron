import React from 'react';

function DownloadControls({ isOpen, onToggle, hasCustomPath, onClearPath }) {
  return (
    <section className="module flex space-between">
      <div className="switch-container">
        <label className="switch">
          <input 
            type="checkbox" 
            id="downloadToggle" 
            checked={isOpen} 
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
        <span>下载后打开草稿路径文件</span>
      </div>
      <button 
        id="clearDraftPathBtn" 
        className={`btn btn-small ${hasCustomPath ? '' : 'hide'}`}
        onClick={onClearPath}
      >
        <i className="fas fa-trash-alt"></i> 删除草稿默认保存目录
      </button>
    </section>
  );
}

export default DownloadControls;
