import { Application } from "../Application.js";
import {
  createTaskbarButton,
  removeTaskbarButton,
  updateTaskbarButton,
} from "../../components/taskbar.js";
import { ICONS } from "../../config/icons.js";
import { appManager } from "../../utils/appManager.js";
import { getWebampMenuItems } from "./webamp.js";

let webampInstance = null;
let webampContainer = null;
let webampTaskbarButton = null;
let isMinimized = false;

export class WebampApp extends Application {
  static config = {
    id: "webamp",
    title: "Winamp",
    description: "A classic music player.",
    icon: ICONS.webamp,
    hasTaskbarButton: true,
    isSingleton: true,
    tray: {
      contextMenu: getWebampMenuItems,
    },
    tips: [
      "Webamp is a music player that looks and feels like the classic Winamp.",
      "You can minimize and restore Webamp using its button in the taskbar.",
    ],
  };

  constructor(config) {
    super(config);
    this.hasTaskbarButton = true;
  }

  _createWindow() {
    // Webamp doesn't use a standard OS-GUI window, it renders directly to the body.
    // We manage its container and lifecycle here.
    return null; // Return null to prevent default window creation.
  }

  async _onLaunch(file) {
    const createTrackFromFile = (f) => ({
      metaData: {
        artist: f.artist || "Unknown Artist",
        title: f.title || f.name,
      },
      url: f.contentUrl || f.content,
    });

    if (webampInstance) {
      this.showWebamp();
      if (file) {
        const track = createTrackFromFile(file);
        webampInstance.setTracksToPlay([track]);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      webampContainer = document.createElement("div");
      webampContainer.id = "webamp-container";
      webampContainer.style.position = "absolute";
      webampContainer.style.zIndex = $Window.Z_INDEX++;
      webampContainer.style.left = "50px";
      webampContainer.style.top = "50px";
      document.body.appendChild(webampContainer);

      webampContainer.addEventListener(
        "mousedown",
        () => {
          webampContainer.style.zIndex = $Window.Z_INDEX++;
        },
        true,
      );

      const initialTracks = [
        {
          metaData: {
            artist: "DJ Mike Llama",
            title: "Llama Whippin' Intro",
          },
          url: "https://dn721609.ca.archive.org/0/items/llamawhippinintrobydjmikellama/demo.mp3",
        },
      ];

      import("https://unpkg.com/webamp@^2")
        .then((Webamp) => {
          const { default: WebampClass } = Webamp;

          webampInstance = new WebampClass({
            availableSkins: [
              {
                url: "https://archive.org/cors/winampskin_Expensive_Hi-Fi_1_2/ExpensiveHi-Fi.wsz",
                name: "Expensive Hi-Fi",
              },
              {
                url: "https://archive.org/cors/winampskin_Green-Dimension-V2/Green-Dimension-V2.wsz",
                name: "Green Dimension V2",
              },
              {
                url: "https://archive.org/cors/winampskin_mac_os_x_1_5-aqua/mac_os_x_1_5-aqua.wsz",
                name: "Mac OSX v1.5 (Aqua)",
              },
            ],
            initialTracks,
          });

          webampInstance.onMinimize(() => this.minimizeWebamp());
          webampInstance.onClose(() => appManager.closeApp(this.id));

          webampInstance
            .renderWhenReady(webampContainer)
            .then(() => {
              this.setupTaskbarButton();
              this.showWebamp();
              if (file) {
                const track = createTrackFromFile(file);
                webampInstance.setTracksToPlay([track]);
              }
              resolve(); // Resolve the promise once Webamp is ready
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  setupTaskbarButton() {
    const taskbarButtonId = "webamp-taskbar-button";
    webampTaskbarButton = createTaskbarButton(
      taskbarButtonId,
      ICONS.webamp,
      "Winamp",
    );

    if (webampTaskbarButton) {
      webampTaskbarButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isMinimized) {
          this.showWebamp();
        } else {
          this.minimizeWebamp();
        }
      });
    }
  }

  showWebamp() {
    const webampElement = document.getElementById("webamp");
    if (!webampElement) return;

    webampElement.style.display = "block";
    webampElement.style.visibility = "visible";
    isMinimized = false;
    webampContainer.style.zIndex = $Window.Z_INDEX++;
    if (webampTaskbarButton) {
      updateTaskbarButton("webamp-taskbar-button", true, false);
    }
  }

  minimizeWebamp() {
    const webampElement = document.getElementById("webamp");
    if (!webampElement) return;

    webampElement.style.display = "none";
    webampElement.style.visibility = "hidden";
    isMinimized = true;
    if (webampTaskbarButton) {
      updateTaskbarButton("webamp-taskbar-button", false, true);
    }
  }

  _cleanup() {
    if (webampContainer) {
      webampContainer.remove();
      webampContainer = null;
    }

    if (webampInstance) {
      webampInstance.dispose();
      webampInstance = null;
    }

    if (webampTaskbarButton) {
      removeTaskbarButton("webamp-taskbar-button");
      webampTaskbarButton = null;
    }
    isMinimized = false;
  }
}
