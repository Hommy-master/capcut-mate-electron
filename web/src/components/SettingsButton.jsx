function SettingsButton({ onClick }) {
  return (
    <div className="settings-button-container">
      <button className="btn btn-settings" onClick={onClick}>
        <i className="fas fa-cog"></i> 设置
      </button>
    </div>
  );
}

export default SettingsButton;
