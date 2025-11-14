import { Application } from '../../Application.js';
import { $Window } from '/public/os-gui/$Window.js';
import { MenuBar } from '/public/os-gui/MenuBar.js';
import { paintMenus } from './menus.js';

export class PaintApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: 'Paint',
      width: 800,
      height: 600,
      icon: this.appInfo.icon,
      id: this.appInfo.id,
    });

    win.$content.style.overflow = 'hidden';

    const iframe = document.createElement('iframe');
    iframe.src = '/src/apps/paint/index.html';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    const menuBar = new MenuBar(paintMenus);
    win.setMenuBar(menuBar);

    win.on('action', (action) => {
      iframe.contentWindow.postMessage({ type: 'menu-action', action }, '*');
    });

    win.$content.appendChild(iframe);

    iframe.addEventListener('load', () => {
      const sendTheme = () => {
        const currentTheme = window.getComputedStyle(document.documentElement);
        const theme = {};
        const themeProperties = [
          '--ButtonFace', '--ButtonHilight', '--ButtonShadow', '--GrayText',
          '--Highlight', '--HighlightText', '--Window', '--WindowText'
        ];
        for (const prop of themeProperties) {
          theme[prop.substring(2)] = currentTheme.getPropertyValue(prop);
        }
        iframe.contentWindow.postMessage({ type: 'theme-changed', theme }, '*');
      };

      sendTheme();
      window.addEventListener('theme-changed', sendTheme);
    });

    return win;
  }
}
