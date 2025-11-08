import { Application } from '../Application.js';

export class InternetExplorerApp extends Application {
  async _onLaunch() {
    const stylePath = `/src/apps/internet-explorer/internet-explorer.css`;
    if (!document.querySelector(`link[href="${stylePath}"]`)) {
      const link = window.os_gui_utils.E('link', { rel: 'stylesheet', href: stylePath });
      document.head.append(link);
    }
  }

  _createWindow() {
    const win = new window.$Window({
      title: 'Internet Explorer',
      width: 800,
      height: 600,
      icons: this.icon,
      id: this.id,
    });

    const iframe = window.os_gui_utils.E('iframe', { className: 'content-window' });
    const input = window.os_gui_utils.E('input', { type: 'text', placeholder: 'Enter address' });

    const navigateTo = (url) => {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      input.value = finalUrl;

      const waybackUrl = `https://web.archive.org/web/1998/${finalUrl}`;

      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = waybackUrl;
      }, 100);

      // Simple check for failed load
      iframe.onload = () => {
        try {
          if (iframe.contentWindow.document.title.includes('Not Found') || iframe.contentDocument.body.innerHTML.includes('Wayback Machine doesn')) {
            iframe.src = '/src/apps/internet-explorer/404.html';
          }
        } catch (e) {
          // Cross-origin error, assume it loaded correctly
        }
      };
    };

    win.setMenuBar(new window.MenuBar({
      "Go": [
          {
            label: 'Back',
            action: () => iframe.contentWindow.history.back(),
          },
          {
            label: 'Forward',
            action: () => iframe.contentWindow.history.forward(),
          },
          {
            label: 'Up',
            action: () => {
              try {
                const currentUrl = new URL(input.value);
                const pathParts = currentUrl.pathname.split('/').filter(p => p);
                if (pathParts.length > 0) {
                  pathParts.pop();
                  currentUrl.pathname = pathParts.join('/');
                  navigateTo(currentUrl.toString());
                }
              } catch (e) {
                // Invalid URL in address bar, do nothing
              }
            },
          },
        ]
    }));

    const addressBar = window.os_gui_utils.E('div', { className: 'address-bar' });
    addressBar.append(input);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        navigateTo(input.value);
      }
    });

    win.$content.append(addressBar, iframe);

    return win;
  }
}
