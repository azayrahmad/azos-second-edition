import { getItem, setItem, LOCAL_STORAGE_KEYS } from "../utils/localStorage.js";

export const SCREENSAVERS = {
  none: {
    name: "(None)",
    path: null,
  },
  flowerbox: {
    name: "3D Flower Box",
    path: "screensaver/index.html",
    configurable: true,
  },
  maze: {
    name: "3D Maze",
    path: "maze/maze.html",
  },
  pipes: {
    name: "3D Pipes",
    path: "pipes/index.html",
  },
  space: {
    name: "Space",
    path: "plus-screensavers/space/index.html",
  },
};

class Screensaver {
  constructor() {
    this.element = null;
    this.previewElement = null;
    this.active = false;
    this.currentScreensaver = this.getCurrentScreensaver();
  }

  getCurrentScreensaver() {
    return getItem(LOCAL_STORAGE_KEYS.SCREENSAVER) || "flowerbox";
  }

  setCurrentScreensaver(id) {
    this.currentScreensaver = id;
    setItem(LOCAL_STORAGE_KEYS.SCREENSAVER, id);
  }

  getScreensaverUrl(id) {
    const screensaver = SCREENSAVERS[id];
    if (!screensaver || !screensaver.path) {
      return null;
    }

    let src = `${import.meta.env.BASE_URL}${screensaver.path}`;
    if (id === "flowerbox") {
      const settings = getItem("flowerbox.settings");
      if (settings) {
        const params = new URLSearchParams(settings);
        const queryString = params.toString();
        if (queryString) {
          src += `?${queryString}`;
        }
      }
    }
    return src;
  }

  show() {
    const url = this.getScreensaverUrl(this.currentScreensaver);
    if (!url) {
      return;
    }

    if (!this.element) {
      this.element = document.createElement("iframe");
      this.element.src = url;
      this.element.style.position = "fixed";
      this.element.style.top = "0";
      this.element.style.left = "0";
      this.element.style.width = "100%";
      this.element.style.height = "100%";
      this.element.style.border = "none";
      this.element.style.zIndex = "9999";

      this.element.onload = () => {
        const iframeDoc = this.element.contentWindow.document;
        iframeDoc.addEventListener("mousemove", () =>
          window.System.resetInactivityTimer(),
        );
        iframeDoc.addEventListener("mousedown", () =>
          window.System.resetInactivityTimer(),
        );
        iframeDoc.addEventListener("keydown", () =>
          window.System.resetInactivityTimer(),
        );
      };

      document.body.appendChild(this.element);
    }
    this.element.style.display = "block";
    this.active = true;
  }

  hide() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.active = false;
  }

  showPreview(id) {
    this.hidePreview();

    const url = this.getScreensaverUrl(id);
    if (!url) {
      return;
    }

    this.previewElement = document.createElement("iframe");
    this.previewElement.src = url;
    this.previewElement.style.position = "fixed";
    this.previewElement.style.top = "0";
    this.previewElement.style.left = "0";
    this.previewElement.style.width = "100%";
    this.previewElement.style.height = "100%";
    this.previewElement.style.border = "none";
    this.previewElement.style.zIndex = "9999";

    this.previewElement.onload = () => {
      const iframeDoc = this.previewElement.contentWindow.document;
      const hidePreviewCallback = () => this.hidePreview();
      iframeDoc.addEventListener("mousemove", hidePreviewCallback);
      iframeDoc.addEventListener("mousedown", hidePreviewCallback);
      iframeDoc.addEventListener("keydown", hidePreviewCallback);
    };

    document.body.appendChild(this.previewElement);
  }

  hidePreview() {
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }
  }
}

export default new Screensaver();
