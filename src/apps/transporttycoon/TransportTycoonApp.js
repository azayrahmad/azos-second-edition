import { Application } from '../Application.js';

export class TransportTycoonApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: this.config.title,
      icon: this.config.icon,
      width: this.config.width,
      height: this.config.height,
      id: this.config.id,
    });

    const iframe = document.createElement('iframe');
    iframe.src = 'https://atalbayrak.github.io/openttd/';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    win.$content.append(iframe);

    return win;
  }
}
