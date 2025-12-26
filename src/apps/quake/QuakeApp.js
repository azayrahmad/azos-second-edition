import { Application } from '../Application.js';
import { setItem, getItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';

const SAVE_STATE_KEY = LOCAL_STORAGE_KEYS.QUAKE_SAVE_STATE;

export class QuakeApp extends Application {
  static config = {
    id: 'quake',
    title: 'Quake',
    icon: 'quake',
    width: 640,
    height: 480,
    resizable: false,
    maximizable: false,
    closable: true,
  };

  _createWindow() {
    const win = new $Window({
      title: this.config.title,
      width: this.config.width,
      height: this.config.height,
      resizable: this.config.resizable,
      maximizable: this.config.maximizable,
      closable: this.config.closable,
      id: this.config.id
    });

    win.$content.css('background', 'black');
    return win;
  }

  async _onLaunch() {
    const canvas = document.createElement('canvas');
    this.win.$content.append(canvas);

    const emulators = new Emulators(this.win, {
      emulatorsUiUrl: '/emulators-ui/',
    });

    const dosOptions = {
      dosboxConf: `
        [dosbox]
        memsize=64
        [cpu]
        cycles=max
        [autoexec]
        mount C .
        C:
        QUAKE.EXE
      `,
    };

    const savedState = getItem(SAVE_STATE_KEY);
    if (savedState) {
      dosOptions.changesUrl = savedState;
    }

    this.dos = await emulators.dosbox(canvas, dosOptions);

    this.win.on('close', async () => {
      const changes = await this.dos.persist();
      if (changes) {
        setItem(SAVE_STATE_KEY, changes);
      }
    });

    this.dos.run('/games/quake/');
  }
}
