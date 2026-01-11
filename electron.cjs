const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { resolveConfig } = require('vite');

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (!app.isPackaged) {
    const viteConfig = await resolveConfig({}, 'serve');
    const port = viteConfig.server.port || 5173;
    const base = viteConfig.base || '/';
    const url = `http://localhost:${port}${base}`;
    win.loadURL(url);
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          click: () => {
            app.quit();
          },
          accelerator: 'CmdOrCtrl+Q',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
