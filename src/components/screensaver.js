import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../utils/localStorage.js';

const SCREENSAVERS = {
  flowerbox: {
    name: 'FlowerBox',
    path: 'screensaver/index.html',
  },
  maze: {
    name: '3D Maze',
    path: 'maze/maze.html',
  },
};

class Screensaver {
  constructor() {
    this.element = null;
    this.active = false;
    this.currentScreensaver = this.getCurrentScreensaver();
  }

  getCurrentScreensaver() {
    return getItem(LOCAL_STORAGE_KEYS.SCREENSAVER) || 'flowerbox';
  }

  setCurrentScreensaver(id) {
    this.currentScreensaver = id;
    setItem(LOCAL_STORAGE_KEYS.SCREENSAVER, id);
  }

  show() {
    const screensaver = SCREENSAVERS[this.currentScreensaver];
    if (!screensaver) {
      return;
    }

    if (!this.element) {
      this.element = document.createElement('iframe');
      this.element.src = `${import.meta.env.BASE_URL}${screensaver.path}`;
      this.element.style.position = 'fixed';
      this.element.style.top = '0';
      this.element.style.left = '0';
      this.element.style.width = '100%';
      this.element.style.height = '100%';
      this.element.style.border = 'none';
      this.element.style.zIndex = '9999';

      this.element.onload = () => {
        const iframeDoc = this.element.contentWindow.document;
        iframeDoc.addEventListener('mousemove', () => window.System.resetInactivityTimer());
        iframeDoc.addEventListener('mousedown', () => window.System.resetInactivityTimer());
        iframeDoc.addEventListener('keydown', () => window.System.resetInactivityTimer());
      };

      document.body.appendChild(this.element);
    }
    this.element.style.display = 'block';
    this.active = true;
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
    this.active = false;
  }
}

export default new Screensaver();
