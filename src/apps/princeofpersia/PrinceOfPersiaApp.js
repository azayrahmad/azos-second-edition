import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";

// The $Window and MenuBar classes are loaded globally via <script> tags in index.html,
// so they are available here without explicit imports.

export class PrinceOfPersiaApp extends Application {
  static config = {
    id: "princeofpersia",
    title: "Prince of Persia",
    icon: "princeofpersia",
    width: 640,
    height: 480,
    resizable: true,
  };

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
    });
    this.win = win;

    this.gameState = {
      level: 1,
      health: 3,
      time: 60,
      strength: 100, // Normal difficulty
    };

    this.iframe = document.createElement("iframe");
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.style.border = "none";
    this.updateGameUrl();
    win.$content.append(this.iframe);

    const menuItems = this.createMenuBar();
    const menuBar = new MenuBar(menuItems);
    win.setMenuBar(menuBar);

    return win;
  }

  async _onLaunch(data) {
    // No specific launch data handling needed for this app
  }

  updateGameUrl() {
    const params = new URLSearchParams({
      l: this.gameState.level,
      h: this.gameState.health,
      t: this.gameState.time,
      s: this.gameState.strength,
      _: true,
    });
    this.iframe.src = `https://princejs.com/?${params.toString()}`;
  }

  createMenuBar() {
    return {
      "&Game": [
        {
          label: "&New Game",
          action: () => {
            this.gameState = {
              level: 1,
              health: 3,
              time: 60,
              strength: this.gameState.strength,
            };
            this.updateGameUrl();
          },
        },
        {
          label: "&Restart Level",
          action: () => {
            this.iframe.contentWindow.location.reload();
          },
        },
      ],
      "&Difficulty": [
        {
          label: "&Easy",
          action: () => {
            this.gameState.strength = 50;
            this.updateGameUrl();
          },
        },
        {
          label: "&Normal",
          action: () => {
            this.gameState.strength = 100;
            this.updateGameUrl();
          },
        },
        {
          label: "&Hard",
          action: () => {
            this.gameState.strength = 150;
            this.updateGameUrl();
          },
        },
      ],
      "&Cheats": [
        {
          label: "Max &Health",
          submenu: [3, 4, 5, 6, 7, 8, 9, 10].map((hp) => ({
            label: `${hp} Health`,
            action: () => {
              this.gameState.health = hp;
              this.updateGameUrl();
            },
          })),
        },
        {
          label: "&Time",
          submenu: [15, 30, 60, 90, 120].map((time) => ({
            label: `${time} Minutes`,
            action: () => {
              this.gameState.time = time;
              this.updateGameUrl();
            },
          })),
        },
      ],
      "&Help": [
        {
          label: "&Controls",
          action: () => {
            this.showControls();
          },
        },
      ],
    };
  }

  showControls() {
    const controlsText = `
      <b>Keyboard:</b><br>
      - <b>Cursor keys:</b> Movement<br>
      - <b>SHIFT:</b> Action (Drink Potion, Grab Edge, Strike)<br>
      - <b>SPACE:</b> Show Remaining Time<br>
      - <b>ENTER:</b> Continue<br>
      <br>
      <b>Gamepad:</b><br>
      - <b>DPad/Stick:</b> Movement<br>
      - <b>A / R / ZR:</b> Jump/Block<br>
      - <b>B / Y / L / ZL:</b> Action<br>
      - <b>X:</b> Show Time / Restart Level (2x)<br>
    `;
    ShowDialogWindow({
      title: "Prince of Persia Controls",
      text: controlsText,
      buttons: [{ label: "OK", isDefault: true }],
    });
  }
}
