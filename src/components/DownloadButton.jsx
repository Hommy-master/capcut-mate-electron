import React, { useState } from 'react';

function DownloadButton({ onClick }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="module">
      <button 
        id="downloadBtn" 
        className="btn btn-download"
        onClick={handleClick}
        disabled={isLoading}
      >
        <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
        {' '}创建剪映草稿
      </button>
    </section>
  );
}

export default DownloadButton;
