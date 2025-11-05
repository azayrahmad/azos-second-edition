const bootScreen = `
  <div id="boot-screen" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black; color: white; font-family: monospace; padding: 20px; box-sizing: border-box; z-index: 9999; cursor: none;">
    <div id="boot-log"></div>
  </div>
`;

function showBootScreen() {
  document.body.insertAdjacentHTML('beforeend', bootScreen);
  const bootScreenEl = document.getElementById('boot-screen');
  if (bootScreenEl) {
    bootScreenEl.style.display = 'block';
  }
}

function hideBootScreen() {
  const bootScreenEl = document.getElementById('boot-screen');
  if (bootScreenEl) {
    bootScreenEl.style.display = 'none';
  }
}

function updateBootLog(message) {
  const bootLogEl = document.getElementById('boot-log');
  if (bootLogEl) {
    bootLogEl.innerHTML += `<div>${message}</div>`;
  }
}

export { showBootScreen, hideBootScreen, updateBootLog };
