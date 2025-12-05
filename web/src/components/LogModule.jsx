import React from 'react';

function LogModule({ logs, onClear }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <section className="module log-module">
      <h2 className="module-title">
        <span><i className="fas fa-list-alt"></i> 下载日志</span>
        <button id="clearLogBtn" className="btn btn-clear" onClick={onClear}>
          <i className="fas fa-trash"></i> 清空日志
        </button>
      </h2>
      {logs.length === 0 ? (
        <div className="log-empty" id="emptyLog">暂无日志记录</div>
      ) : (
        <ul className="log-list" id="downloadLog">
          {logs.map((log, index) => (
            <li key={index}>
              <span className="log-time">{formatDate(log.timestamp)}</span>
              <span className={`log-message log-${log.type || 'info'}`}>
                {log.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default LogModule;
