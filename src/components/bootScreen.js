function hideBootScreen() {
  const bootScreenEl = document.getElementById('boot-screen');
  if (bootScreenEl) {
    bootScreenEl.remove();
  }
}

function updateBootLog(message) {
  const bootLogEl = document.getElementById('boot-log');
  if (bootLogEl) {
    bootLogEl.innerHTML += `<div>${message}</div>`;
  }
}

export { hideBootScreen, updateBootLog };
