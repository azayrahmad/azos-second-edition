import { Application } from "../Application.js";

export class InternetExplorerApp extends Application {
  _createWindow() {
    const win = new window.$Window({
      title: "Internet Explorer",
      outerWidth: 600,
      outerHeight: 400,
      icons: this.icon,
      id: this.id,
      resizable: this.resizable,
    });

    win.addStylesheet('src/apps/internet-explorer/internet-explorer.css');

    const iframe = window.os_gui_utils.E("iframe", {
      className: "content-window",
      style:
        "width: 100%; height: 100%; flex-grow: 1; background-color: var(--Window);",
    });
    const input = window.os_gui_utils.E("input", {
      type: "text",
      placeholder: "Enter address",
      style: "flex-grow: 1; font-family: 'MSW98UI'; width: 100%;",
    });

    const statusText = window.os_gui_utils.E("p", { className: "status-bar-field" });
    statusText.textContent = "Done";

    const statusBar = window.os_gui_utils.E("div", { className: "status-bar" });
    statusBar.append(statusText);

    const navigateTo = (url) => {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
      input.value = finalUrl;

      const waybackUrl = `https://web.archive.org/web/1998/${finalUrl}`;

      statusText.textContent = "Connecting to site...";
      iframe.src = "about:blank";
      setTimeout(() => {
        iframe.src = waybackUrl;
      }, 100);

      // Simple check for failed load
      iframe.onload = () => {
        if (iframe.src.includes("/404.html")) {
          return;
        }

        try {
          if (
            iframe.contentWindow.document.title.includes("Not Found") ||
            iframe.contentDocument.body.innerHTML.includes(
              "Wayback Machine doesn",
            )
          ) {
            iframe.src = "/src/apps/internet-explorer/404.html";
            statusText.textContent = "Page not found.";
          } else {
            statusText.textContent = "Done";
          }
        } catch (e) {
          // Cross-origin error, assume it loaded correctly
          statusText.textContent = "Done";
        }
      };
    };

    win.setMenuBar(
      new window.MenuBar({
        Go: [
          {
            label: "Back",
            action: () => iframe.contentWindow.history.back(),
          },
          {
            label: "Forward",
            action: () => iframe.contentWindow.history.forward(),
          },
          {
            label: "Up",
            action: () => {
              try {
                const currentUrl = new URL(input.value);
                const pathParts = currentUrl.pathname
                  .split("/")
                  .filter((p) => p);
                if (pathParts.length > 0) {
                  pathParts.pop();
                  currentUrl.pathname = pathParts.join("/");
                  navigateTo(currentUrl.toString());
                }
              } catch (e) {
                // Invalid URL in address bar, do nothing
              }
            },
          },
        ],
      }),
    );

    const addressBar = window.os_gui_utils.E("div", {
      className: "address-bar",
      style: {
        display: "flex",
        padding: "4px",
        borderBottom: "1px solid var(--border-color)",
      },
    });
    addressBar.append(input);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        navigateTo(input.value);
      }
    });

    win.$content.append(addressBar, iframe, statusBar);

    return win;
  }
}
