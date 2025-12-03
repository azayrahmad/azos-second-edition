import { Application } from "../Application.js";
import { cursors } from "../../config/cursors.js";
import { convertAniBinaryToCSS } from "ani-cursor";

export class CursorExplorerApp extends Application {
  _createWindow() {
    const win = new window.$Window({
      title: "Cursor Explorer",
      outerWidth: 400,
      outerHeight: 500,
      resizable: true,
      icons: this.icon,
    });

    win.$content[0].style.display = "flex";
    win.$content[0].style.flexDirection = "column";

    this._createUI(win.$content[0]);
    return win;
  }

  _createUI(container) {
    const selectorContainer = document.createElement("div");
    selectorContainer.style.padding = "10px";
    selectorContainer.style.borderBottom = "1px solid var(--border-color)";

    const label = document.createElement("label");
    label.textContent = "Cursor Scheme: ";
    label.style.marginRight = "10px";
    selectorContainer.appendChild(label);

    const select = document.createElement("select");
    const schemes = Object.keys(cursors);
    schemes.forEach((scheme) => {
      const option = document.createElement("option");
      option.value = scheme;
      option.textContent = scheme;
      select.appendChild(option);
    });

    selectorContainer.appendChild(select);
    container.appendChild(selectorContainer);

    const listContainer = document.createElement("div");
    listContainer.className = "cursor-list-container";
    listContainer.style.flex = "1";
    listContainer.style.overflowY = "auto";
    container.appendChild(listContainer);

    select.addEventListener("change", (event) => {
      this._populateCursorList(listContainer, event.target.value);
    });

    // Initial population
    this._populateCursorList(listContainer, select.value);
  }

  _populateCursorList(container, scheme) {
    container.innerHTML = "";
    const cursorSet = cursors[scheme];

    if (!cursorSet) return;

    Object.entries(cursorSet).forEach(([name, url]) => {
      const item = document.createElement("div");
      item.className = "cursor-list-item";

      const preview = document.createElement("div");
      preview.className = "cursor-preview";
      preview.style.width = "32px";
      preview.style.height = "32px";

      const nameLabel = document.createElement("span");
      nameLabel.textContent = name;

      item.appendChild(preview);
      item.appendChild(nameLabel);
      container.appendChild(item);

      if (url.endsWith(".ani")) {
        this._applyAniCursorPreview(preview, url, `${scheme}-${name}`);
      } else {
        preview.style.backgroundImage = `url(${url})`;
        preview.style.backgroundRepeat = 'no-repeat';
        preview.style.backgroundPosition = 'center';
      }
    });
  }

  async _applyAniCursorPreview(element, url, id) {
    try {
      const response = await fetch(url);
      const data = new Uint8Array(await response.arrayBuffer());
      const styleId = `ani-cursor-style-${id}`;
      let style = document.getElementById(styleId);

      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }

      const className = `cursor-preview-${id}`;
      element.classList.add(className);
      style.innerText = convertAniBinaryToCSS(`.${className}`, data);
    } catch (error) {
      console.error("Failed to apply animated cursor preview:", error);
    }
  }
}
