import { Application } from "../Application.js";
import { AnimatedLogo } from "../../components/AnimatedLogo.js";

export class InternetExplorerApp extends Application {
  async _onLaunch(filePath) {
    const url = filePath || "microsoft.com";
    this.navigateTo(url);
  }

  _createWindow() {
    const win = new window.$Window({
      title: "Internet Explorer",
      outerWidth: 600,
      outerHeight: 400,
      icons: this.icon,
      id: this.id,
      resizable: this.resizable,
    });

    this.iframe = window.os_gui_utils.E("iframe", {
      className: "content-window",
      style:
        "width: 100%; height: 100%; flex-grow: 1; background-color: var(--Window);",
    });
    this.input = window.os_gui_utils.E("input", {
      type: "text",
      placeholder: "Enter address",
      style: "flex-grow: 1; font-family: 'MSW98UI'; width: 100%;",
    });

    this.statusText = window.os_gui_utils.E("p", {
      className: "status-bar-field",
      style:
        "flex: 1; padding: 2px 4px; border: 1px inset; margin-block-start: 0; margin-block-end: 0;",
    });
    this.statusText.textContent = "Done";

    const statusBar = window.os_gui_utils.E("div", {
      className: "status-bar",
      style: "display: flex; gap: 2px;",
    });
    statusBar.append(this.statusText);

    this.iframe.onload = () => {
      if (this.iframe.src.includes("/src/apps/internet-explorer/404.html")) {
        this.statusText.textContent = "Page not found.";
        return;
      }

      try {
        if (
          this.iframe.contentWindow.document.title.includes("Not Found") ||
          this.iframe.contentDocument.body.innerHTML.includes(
            "Wayback Machine doesn",
          )
        ) {
          this.iframe.src = "/src/apps/internet-explorer/404.html";
          this.statusText.textContent = "Page not found.";
        } else {
          this.statusText.textContent = "Done";
        }
      } catch (e) {
        this.statusText.textContent = "Done";
      }
    };

    this.navigateTo = (url) => {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
      this.input.value = finalUrl;

      const waybackUrl = `https://web.archive.org/web/1998/${finalUrl}`;

      this.statusText.textContent = "Connecting to site...";
      this.iframe.src = "about:blank";
      this.iframe.src = waybackUrl;
    };

    const menuBar = new window.MenuBar({
      Go: [
        {
          label: "Back",
          action: () => this.iframe.contentWindow.history.back(),
        },
        {
          label: "Forward",
          action: () => this.iframe.contentWindow.history.forward(),
        },
        {
          label: "Up",
          action: () => {
            try {
              const currentUrl = new URL(this.input.value);
              const pathParts = currentUrl.pathname
                .split("/")
                .filter((p) => p);
              if (pathParts.length > 0) {
                pathParts.pop();
                currentUrl.pathname = pathParts.join("/");
                this.navigateTo(currentUrl.toString());
              }
            } catch (e) {
              // Invalid URL in address bar, do nothing
            }
          },
        },
      ],
    });
    win.setMenuBar(menuBar);

    const logo = new AnimatedLogo();
    const menuBarContainer = document.createElement("div");
    menuBarContainer.style.display = "flex";
    menuBarContainer.style.alignItems = "center";
    menuBarContainer.style.width = "100%";
    menuBarContainer.style.justifyContent = "space-between";

    // Wrap the existing menu bar element
    const menuBarElement = menuBar.element;
    menuBarElement.parentNode.insertBefore(menuBarContainer, menuBarElement);
    menuBarContainer.appendChild(menuBarElement);
    menuBarContainer.appendChild(logo);

    const addressBar = window.os_gui_utils.E("div", {
      className: "address-bar",
      style: {
        display: "flex",
        padding: "4px",
        borderBottom: "1px solid var(--border-color)",
      },
    });
    addressBar.append(this.input);

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.navigateTo(this.input.value);
      }
    });

    win.$content.append(addressBar, this.iframe, statusBar);

    return win;
  }
}
