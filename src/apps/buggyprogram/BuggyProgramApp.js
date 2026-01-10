import { Application } from '../Application.js';
import { launchApp } from '../../utils/appManager.js';

export class BuggyProgramApp extends Application {
  static config = {
    id: 'buggyprogram',
    title: 'buggyprogram.exe',
    description: 'An intentionally buggy program that leaves trails when moved.',
    icon: 'buggyprogram',
    width: 400,
    height: 200,
    resizable: true,
  };

  _createWindow() {
    const win = new window.$Window({
      title: this.config.title,
      width: this.config.width,
      height: this.config.height,
      resizable: this.config.resizable,
    });

    const content = `
      <div style="padding: 20px; text-align: center;">
        <p>An error has occurred in your application.</p>
        <p>To continue:</p>
        <p>Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</p>
      </div>
    `;
    win.$content.html(content);

    setTimeout(() => {
      const desktop = document.querySelector('.desktop');
      const trailsParent = document.createElement('div');
      trailsParent.className = 'buggy-window-trails';
      desktop.appendChild(trailsParent);

      const observer = new MutationObserver(() => {
        const trail = win.element.cloneNode(true);
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = parseInt(win.element.style.zIndex) - 1;
        trailsParent.appendChild(trail);
      });
      observer.observe(win.element, { attributes: true, attributeFilter: ['style'] });

      win.on('closed', () => {
        observer.disconnect();
        desktop.removeChild(trailsParent);
        launchApp('buggyprogram');
      });
    }, 100);

    return win;
  }
}
