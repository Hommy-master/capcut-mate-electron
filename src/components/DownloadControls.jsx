import React from 'react';

function DownloadControls({ isOpen, onToggle }) {
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
    </section>
  );
}

export default DownloadControls;
