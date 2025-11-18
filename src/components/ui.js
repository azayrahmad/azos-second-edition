function createMainUI() {
  const appContainer = document.createElement('div');
  appContainer.id = 'app-container';
  appContainer.className = 'app-container';

  const desktopArea = document.createElement('div');
  desktopArea.id = 'desktop-area';
  desktopArea.className = 'desktop-area';

  const desktopWrapper = document.createElement('div');
  desktopWrapper.id = 'desktop-wrapper';

  const desktop = document.createElement('div');
  desktop.className = 'desktop';

  desktopWrapper.appendChild(desktop);
  desktopArea.appendChild(desktopWrapper);
  appContainer.appendChild(desktopArea);

  const taskbar = document.createElement('div');
  taskbar.className = 'taskbar';

  document.body.appendChild(appContainer);
  document.body.appendChild(taskbar);
}

export { createMainUI };
