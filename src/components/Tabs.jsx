import React, { useState } from 'react';

function Tabs({ onTabChange, initialContent }) {
  const templates = {
    template1: {
      title: "案例一",
      content: "https://cm.jcaigc.cn/openapi/v1/get_draft?draft_id=2025090716400922f559b4"
    },
    template2: {
      title: "案例二",
      content: "https://cm.jcaigc.cn/openapi/v1/get_draft?draft_id=202509151914009cdf8766"
    }
  };

  const [activeTab, setActiveTab] = useState('template1');

  const handleTabClick = (templateId) => {
    setActiveTab(templateId);
    onTabChange(templates[templateId].content);
  };

  return (
    <section className="module tabs-module">
      <span><i className="fas fa-folder-open"></i> 案例草稿：</span>
      <div className="tabs" id="tabContainer">
        {Object.entries(templates).map(([key, template]) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => handleTabClick(key)}
            data-template={key}
          >
            {template.title}
          </button>
        ))}
      </div>
    </section>
  );
}

export default Tabs;
