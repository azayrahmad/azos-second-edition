import { Application } from "../Application.js";
import { networkNeighborhood } from "../../config/networkNeighborhood.js";
import { ICONS } from "../../config/icons.js";

export class NetworkNeighborhoodApp extends Application {
  _createWindow() {
    const win = new window.$Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      minimizeButton: this.minimizeButton,
      maximizeButton: this.maximizeButton,
      id: this.id,
    });
    this.win = win;

    // Create a disabled menu bar for visual consistency
    const menuItems = {
      File: [{ label: "Close", action: () => this.win.close() }],
      Edit: [{ label: "Cut", disabled: true }, { label: "Copy", disabled: true }, { label: "Paste", disabled: true }],
      View: [{ label: "Refresh", disabled: true }],
      Go: [{ label: "Back", disabled: true }, { label: "Forward", disabled: true }, { label: "Up", disabled: true }],
    };
    const menuBar = new MenuBar(menuItems);
    win.setMenuBar(menuBar);

    const content = document.createElement("div");
    content.className = "explorer-content sunken-panel";
    win.$content.append(content);
    this.content = content;

    this.render();

    return win;
  }

  render() {
    this.win.title("Network Neighborhood");
    this.win.setIcons(ICONS.networkNeighborhood);
    this.content.innerHTML = "";

    networkNeighborhood.forEach((item) => {
      const icon = this.createExplorerIcon(item);
      this.content.appendChild(icon);
    });
  }

  createExplorerIcon(item) {
    const iconDiv = document.createElement("div");
    iconDiv.className = "desktop-icon";
    iconDiv.setAttribute("title", item.title);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconImg = document.createElement("img");
    iconImg.src = ICONS.computer[32];
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = item.title;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    iconDiv.addEventListener("dblclick", () => {
      window.open(item.url, "_blank");
    });

    return iconDiv;
  }
}
