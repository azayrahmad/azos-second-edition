import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import {
  ShowDialogWindow,
  ShowComingSoonDialog,
} from "../../components/DialogWindow.js";

function ShowAboutDialog(title, icon) {
  const content = document.createElement("div");
  content.style.textAlign = "center";
  content.style.padding = "20px";
  content.innerHTML = `
    <img src="${icon}" alt="${title}" width="32" height="32" style="margin-bottom: 10px;" />
    <p><b>${title}</b></p>
    <p>azOS Second Edition</p>
  `;

  ShowDialogWindow({
    title: `About ${title}`,
    content: content,
    buttons: [{ label: "OK", isDefault: true }],
    modal: true,
  });
}

export class SpiderSolitaireApp extends Application {
  _createWindow() {
    let gameInstance = null;

    const win = new $Window({
      title: "Spider Solitaire",
      outerWidth: 1000,
      outerHeight: 600,
      id: "spidersolitaire", // Keep original ID for the window
      resizable: true,
      icons: ICONS.spidersolitaire,
    });

    const menu = {
      Game: [
        {
          label: "Deal",
          action: () => gameInstance?.deal(),
        },
        {
          label: "New Game",
          action: () => gameInstance?.checkForNewGame(),
        },
        {
          label: "Difficulty",
          submenu: [
            {
              label: "1 Suit",
              action: () => gameInstance?.setDifficulty(1),
            },
            {
              label: "2 Suits",
              action: () => gameInstance?.setDifficulty(2),
            },
            {
              label: "4 Suits",
              action: () => gameInstance?.setDifficulty(4),
            },
          ],
        },
        {
          label: "Undo",
          action: () => gameInstance?.undo(),
          enabled: () => gameInstance && gameInstance.moves.length > 0,
        },
        {
          label: "Exit",
          action: () => this.close(),
        },
      ],
      Help: [
        {
          label: "Help Topics",
          action: () => ShowComingSoonDialog("Help Topics"),
        },
        {
          label: "About Spider Solitaire",
          action: () =>
            ShowAboutDialog("Spider Solitaire", ICONS.spidersolitaire[32]),
        },
      ],
    };

    const gameContainerId = "spidersolitaire-game-container";
    const gameContainer = document.createElement("div");
    gameContainer.id = gameContainerId;

    // The game's CSS expects the container to take up all the space.
    // The game's own JS will add the 'spidersolitaire' class to this container.
    win.$content.css({
      display: "flex",
      height: "100%",
    });
    gameContainer.style.width = "100%";
    gameContainer.style.height = "100%";


    win.$content.append(gameContainer);

    const menuBar = new MenuBar(menu);
    win.setMenuBar(menuBar);

    const styleId = "spidersolitaire-styles";
    const jqueryUiStyleId = "jquery-ui-styles";

    const loadScript = (url) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = url;
        script.async = false; // Ensure scripts load in order
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadCss = async () => {
      const response = await fetch("src/apps/spidersolitaire/sscss/spider-solitaire.css");
      let css = await response.text();
      const selector = `#${win.id}`;

      // Fix image paths
      let scopedCss = css.replace(/url\(\.\.\/ssimages/g, "url(src/apps/spidersolitaire/ssimages");

      // Scope the main game container styles to the window
      scopedCss = scopedCss.replace(/(\.spidersolitaire|\.ssParent)/g, `${selector} $1`);

      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = scopedCss;
      document.head.appendChild(style);
    };

    const initGame = async () => {
      try {
        await loadCss();
        await loadScript("https://code.jquery.com/jquery-1.12.4.min.js");
        await loadScript("https://code.jquery.com/ui/1.12.0/jquery-ui.min.js");

        if (!document.getElementById(jqueryUiStyleId)) {
          const link = document.createElement("link");
          link.id = jqueryUiStyleId;
          link.rel = "stylesheet";
          link.href = "https://code.jquery.com/ui/1.12.0/themes/base/jquery-ui.css";
          document.head.appendChild(link);
        }

        // This script is not a module and defines `SpiderSolitaire` globally.
        await loadScript("src/apps/spidersolitaire/ssjs/spider-solitaire.js");

        if (window.SpiderSolitaire) {
          const game = new window.SpiderSolitaire();
          game.init(gameContainerId); // Init with our container's ID
          gameInstance = window.spiderSolitaireGame;
          // After init, the game JS adds ssParent to win.$content and spidersolitaire to gameContainer
          // So the CSS scoping should work.
        } else {
          console.error("SpiderSolitaire object not found after loading script.");
        }
      } catch (error) {
        console.error("Failed to initialize Spider Solitaire:", error);
        win.$content.text("Failed to load game assets.");
      }
    };

    initGame();

    win.on("close", () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) styleElement.remove();

      const jqueryUiStyleElement = document.getElementById(jqueryUiStyleId);
      if (jqueryUiStyleElement) jqueryUiStyleElement.remove();
    });

    return win;
  }
}
