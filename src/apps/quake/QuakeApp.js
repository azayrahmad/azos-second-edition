import { Application } from '../Application.js';
import { getItem, setItem } from '../../utils/localStorage.js';
import * as emulators from 'emulators';

const SAVE_DATA_KEY = 'quake_save_data';

export class QuakeApp extends Application {
  static config = {
    id: 'quake',
    title: 'Quake',
    icon: 'quake',
    width: 640,
    height: 480,
    resizable: true,
  };

  constructor(args) {
    super(args);
    this.commandInterface = null;
    this.canvas = null;
    this.ctx = null;
    this.loadingMessage = null;
  }

  async _onLaunch(win) {
    this.loadingMessage = win.$content.querySelector('.loading-message');
    this.canvas = win.$content.querySelector('.quake-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    try {
      const saveData = getItem(SAVE_DATA_KEY);
      const initialFs = [
        'https://www.dosgames.com/files/DOSBOX_QUAKE.ZIP',
      ];

      if (saveData) {
        const binaryString = atob(saveData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        initialFs.push({ path: 'C:/save.dat', contents: bytes });
      }

      this.commandInterface = await emulators.dosboxWorker(initialFs, {
         onExtractProgress: (bundleIndex, file, extracted, total) => {
           const percent = Math.round(extracted / total * 100);
           this.loadingMessage.textContent = `Downloading Quake... (${percent}%)`;
         }
      });

      this.loadingMessage.style.display = 'none';
      this.canvas.style.display = 'block';

      const ci = this.commandInterface;
      ci.events().onFrame((rgb, rgba) => {
        if (rgba) {
          const frame = new ImageData(rgba, ci.width(), ci.height());
          this.canvas.width = ci.width();
          this.canvas.height = ci.height();
          this.ctx.putImageData(frame, 0, 0);
        }
      });

      ci.events().onExit(() => {
        this.win.close();
      });

    } catch (error) {
      console.error('Failed to launch Quake:', error);
      this.loadingMessage.textContent = `Error: ${error.message}`;
    }
  }

  _createWindow() {
    // Correctly access properties from 'this', not 'this.args'
    const win = new $Window({
      title: this.title,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      id: this.id,
    });

    const menuBar = new MenuBar([
      {
        label: 'Game',
        submenu: [
          {
            label: 'Save Progress',
            action: async () => {
              if (this.commandInterface) {
                const saveData = await this.commandInterface.persist(true);
                if (saveData instanceof Uint8Array) {
                  const base64 = btoa(String.fromCharCode.apply(null, saveData));
                  setItem(SAVE_DATA_KEY, base64);
                  alert('Game progress saved!');
                }
              }
            },
          },
          {
            label: 'Exit',
            action: () => this.win.close(),
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Fullscreen',
            action: () => this.win.toggleFullscreen(),
          },
        ],
      },
    ]);
    win.setMenuBar(menuBar);
    this.menuBar = menuBar;

    win.$content.style.background = 'black';
    win.$content.style.display = 'flex';
    win.$content.style.alignItems = 'center';
    win.$content.style.justifyContent = 'center';

    win.$content.innerHTML = `
      <div class="loading-message" style="color: white; font-family: 'Fixedsys Excelsior 3.01', monospace;">Downloading Quake...</div>
      <canvas class="quake-canvas" style="display: none; width: 100%; height: 100%;"></canvas>
    `;

    win.on('close', () => {
      this.commandInterface?.exit();
      this.appManager.closeApp(this.id);
    });

    return win;
  }
}
