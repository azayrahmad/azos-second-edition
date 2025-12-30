import { Application } from '../Application.js';
import { ICONS } from '../../config/icons.js';

export class DiggerApp extends Application {
  static config = {
    id: 'digger',
    title: 'Digger',
    icons: ICONS.digger,
    width: 640,
    height: 480,
    resizable: false,
  };

  _createWindow() {
    // This method is required by the base Application class.
    // It should create and return a new $Window instance.
    return new window.$Window(this.config);
  }

  async _onLaunch() {
    const content = this.win.$content;
    content.style.display = 'flex';
    content.style.justifyContent = 'center';
    content.style.alignItems = 'center';
    content.style.backgroundColor = 'black';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    content.appendChild(canvas);

    if (window.Dos) {
      try {
        const dos = await window.Dos(canvas);
        await dos.run('https://js-dos.com/games/digger.jsdos');
      } catch (error) {
        console.error('Failed to start js-dos:', error);
        content.innerHTML = '<div style="color: white; padding: 1em;">Failed to load Digger. See console for details.</div>';
      }
    } else {
      console.error('js-dos library not found.');
      content.innerHTML = '<div style="color: white; padding: 1em;">Error: js-dos library is not loaded.</div>';
    }
  }
}

export default DiggerApp;
