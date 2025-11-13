import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { getItem, setItem } from "../../utils/localStorage.js";

const HIGH_SCORES_KEY = "pinballHighScores";

export class PinballApp extends Application {
  constructor(config) {
    super(config);
    this.highScores = getItem(HIGH_SCORES_KEY) || [];
  }

  _saveHighScores() {
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10); // Keep top 10
    setItem(HIGH_SCORES_KEY, this.highScores);
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: 620,
      outerHeight: 480,
      resizable: false,
      maximizable: false,
      icons: this.icon,
    });

    const menuBar = this._createMenuBar();
    win.setMenuBar(menuBar);

    const iframe = document.createElement("iframe");
    iframe.src = "games/pinball/index.html";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    // Instead of appending, set the inner HTML to allow $Window.js to observe
    win.$content.html(iframe.outerHTML);

    // Get the actual iframe element that was added to the DOM
    this.iframe = win.$content.find("iframe")[0];

    return win;
  }

  _createMenuBar() {
    return new MenuBar({
      "&Game": [
        {
          label: "&New Game",
          shortcutLabel: "F2",
          action: () => this.sendKey("F2"),
        },
        {
          label: "&High Scores",
          action: () => this._showHighScoresDialog(),
        },
        "MENU_DIVIDER",
        {
          label: "&Launch Ball",
          shortcutLabel: "Space",
          action: () => this.sendKey(" "),
        },
        {
          label: "&Pause/Resume",
          shortcutLabel: "F3",
          action: () => this.sendKey("F3"),
        },
        "MENU_DIVIDER",
        {
          label: "E&xit",
          action: () => this.win.close(),
        },
      ],
      "&Options": [
        {
          label: "Full Screen",
          action: () => this.toggleFullScreen(),
        },
        {
          label: "Player &Keys...",
          action: () => this.showPlayerKeysDialog(),
        },
      ],
      "&Help": [
        {
          label: "&About Pinball",
          action: () => {
            ShowDialogWindow({
              title: "About Pinball",
              text: "3D Pinball for Windows - Space Cadet<br>Emscripten port by alula<br><br>Integrated into azOS by Jules.",
              buttons: [{ label: "OK", isDefault: true }],
            });
          },
        },
      ],
    });
  }

  _onLaunch() {
    // Most of the logic is now handled by the iframe
    this.win.focus();

    window.addEventListener("message", this._handleGameMessage.bind(this));

    this.win.on("close", () => {
      window.removeEventListener(
        "message",
        this._handleGameMessage.bind(this)
      );
    });
  }

  _handleGameMessage(event) {
    // Basic security: check the origin of the message
    if (event.origin !== window.location.origin) {
      return;
    }

    const { type, payload } = event.data;

    if (type === "PINBALL_GAME_OVER") {
      this._handleGameOver(payload.score);
    }
  }

  _handleGameOver(scores) {
    let newHighScore = false;
    for (const score of scores) {
      const lowestScore =
        this.highScores.length < 10 ? 0 : this.highScores[9].score;

      if (score > lowestScore) {
        // Prompt for name
        const name = prompt("New high score! Enter your name:", "Player");
        if (name) {
          this.highScores.push({ name, score });
          newHighScore = true;
        }
      }
    }

    if (newHighScore) {
      this._saveHighScores();
      this._showHighScoresDialog();
    }
  }

  sendKey(key) {
    // To send a key to the iframe, we need to dispatch the event on its contentWindow
    const event = new KeyboardEvent("keydown", {
      key: key,
      code: key,
      bubbles: true,
      cancelable: true,
    });
    this.iframe.contentWindow.dispatchEvent(event);
    setTimeout(() => {
      const eventUp = new KeyboardEvent("keyup", {
        key: key,
        code: key,
        bubbles: true,
        cancelable: true,
      });
      this.iframe.contentWindow.dispatchEvent(eventUp);
    }, 100);
  }

  toggleFullScreen() {
    this.iframe.requestFullscreen();
  }

  showPlayerKeysDialog() {
    const dialogText = `
            <div style="text-align: left; padding: 0 20px;">
                <p><b>Left Flipper:</b> Z</p>
                <p><b>Right Flipper:</b> / (Slash)</p>
                <p><b>Left Table Bump:</b> X</p>
                <p><b>Right Table Bump:</b> . (Period)</p>
                <p><b>Plunger:</b> Spacebar</p>
            </div>
        `;
    ShowDialogWindow({
      title: "Player Keys",
      text: dialogText,
      buttons: [{ label: "OK", isDefault: true }],
    });
  }

  _showHighScoresDialog() {
    const scores = this.highScores
      .map(
        (score, i) =>
          `<tr><td style="text-align: right; padding-right: 1em;">${
            i + 1
          }.</td><td>${score.name}</td><td style="text-align: right;">${score.score.toLocaleString()}</td></tr>`
      )
      .join("");

    const dialogText = `
            <div style="padding: 0 20px;">
                <p>High scores for 3D Pinball:</p>
                <table style="width: 100%;">
                    ${scores || "<tr><td colspan='3'>No scores yet!</td></tr>"}
                </table>
            </div>
        `;
    ShowDialogWindow({
      title: "High Scores",
      text: dialogText,
      buttons: [
        {
          label: "OK",
          isDefault: true,
        },
        {
          label: "Reset Scores",
          action: () => {
            this.highScores = [];
            this._saveHighScores();
            this.win.close(); // Close and reopen to refresh
            this._showHighScoresDialog();
          },
        },
      ],
    });
  }
}
