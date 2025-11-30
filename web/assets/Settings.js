/**
 * 初始化设置功能
 */
function initSettings() {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsWindow = document.getElementById('settingsWindow');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsOverlay = settingsWindow.querySelector('.settings-overlay');

  // 设置按钮点击事件 - 显示设置窗口
  settingsBtn.addEventListener('click', () => {
    settingsWindow.classList.remove('hide');
    // 加载当前设置
    loadCurrentSettings();
  });

  // 关闭按钮点击事件 - 隐藏设置窗口
  closeSettingsBtn.addEventListener('click', () => {
    settingsWindow.classList.add('hide');
  });

  // 点击遮罩层事件 - 隐藏设置窗口
  settingsOverlay.addEventListener('click', () => {
    settingsWindow.classList.add('hide');
  });

  // 防止点击设置内容区域时关闭窗口
  const settingsContent = settingsWindow.querySelector('.settings-content');
  settingsContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 路径选择功能
  updatePathSelection();
}

/**
 * 加载当前设置
 */
async function loadCurrentSettings() {
  const draftPathInput = document.getElementById('draftPath');

  const ret = await window.electronAPI.getConfigData();

  draftPathInput.value = ret?.targetDirectory || '';
}

/**
 * 初始化路径选择功能
 */
function updatePathSelection() {
  const selectPathBtn = document.getElementById('selectPathBtn');
  const draftPathInput = document.getElementById('draftPath');

  const startUpdate = async () => {
     try {
      const result = await window.electronAPI.updateDraftPath();
      if (result.success) {
        draftPathInput.value = result.targetDir;
      } else {
        // window.electronAPI.showMessageBox({
        //   title: '错误',
        //   type: 'error',
        //   message: '更改路径失败: ' + result.error
        // });
      }
    } catch (error) {
      // window.electronAPI.showMessageBox({
      //   title: '错误',
      //   type: 'error',
      //   message: '更改路径失败: ' + error.message
      // });
    }
  }

  selectPathBtn.addEventListener('click', startUpdate);
  draftPathInput.addEventListener('click', startUpdate);
}