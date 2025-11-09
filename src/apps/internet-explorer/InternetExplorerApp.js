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

    const statusText = window.os_gui_utils.E("p", {
      className: "status-bar-field",
      style:
        "flex: 1; padding: 2px 4px; border: 1px inset; margin-block-start: 0; margin-block-end: 0;",
    });
    statusText.textContent = "Done";

    const statusBar = window.os_gui_utils.E("div", {
      className: "status-bar",
      style: "display: flex; gap: 2px;",
    });
    statusBar.append(statusText);

    // Assign iframe.onload handler once, outside the navigation function.
    iframe.onload = () => {
      // If the iframe has loaded our custom 404 page, explicitly set the status.
      // This happens after a redirect from a failed Wayback Machine attempt.
      if (iframe.src.includes("/src/apps/internet-explorer/404.html")) {
        statusText.textContent = "Page not found.";
        return;
      }

      try {
        // Attempt to check content for 404 indicators from Wayback Machine or the target site.
        if (
          iframe.contentWindow.document.title.includes("Not Found") ||
          iframe.contentDocument.body.innerHTML.includes(
            "Wayback Machine doesn",
          )
        ) {
          // If a 404 is detected, redirect to our internal 404 page.
          // This will trigger the onload handler again, caught by the check above.
          iframe.src = "/src/apps/internet-explorer/404.html";
          statusText.textContent = "Page not found.";
        } else {
          // If no specific error detected, assume successful load.
          statusText.textContent = "Done";
        }
      } catch (e) {
        // Cross-origin access errors prevent inspecting iframe content.
        // In this case, assume the page loaded (or at least we can't determine otherwise).
        statusText.textContent = "Done";
      }
    };

    const navigateTo = (url) => {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = `https://${finalUrl}`;
      }
      input.value = finalUrl;

      const waybackUrl = `https://web.archive.org/web/1998/${finalUrl}`;

      statusText.textContent = "Connecting to site...";
      iframe.src = "about:blank";
      iframe.src = waybackUrl;
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
