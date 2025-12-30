import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { MenuBar } from "/public/os-gui/MenuBar.js";
import { ShowDialogWindow, ShowComingSoonDialog } from "../../components/DialogWindow.js";

function ShowAboutDialog(title, icon) {
  const content = document.createElement('div');
  content.style.textAlign = 'center';
  content.style.padding = '20px';
  content.innerHTML = `
    <img src="${icon}" alt="${title}" width="32" height="32" style="margin-bottom: 10px;" />
    <p><b>${title}</b></p>
    <p>azOS Second Edition</p>
  `;

  ShowDialogWindow({
    title: `About ${title}`,
    content: content,
    buttons: [{ label: 'OK', isDefault: true }],
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
      id: "spidersolitaire",
      resizable: true,
      icons: ICONS.spidersolitaire,
    });

    const menu = [
      {
        label: "Game",
        submenu: [
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
            ]
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
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Help Topics",
            action: () => ShowComingSoonDialog("Help Topics"),
          },
          {
            label: "About Spider Solitaire",
            action: () => ShowAboutDialog("Spider Solitaire", ICONS.spidersolitaire[32]),
          },
        ],
      },
    ];

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.src = "src/apps/spidersolitaire/game.html";

    iframe.onload = () => {
        gameInstance = iframe.contentWindow.spiderSolitaireGame;
    };

    win.$content.append(iframe);

    const menuBar = new MenuBar(menu);

    win.setMenuBar(menuBar.element);

    return win;
  }
}
