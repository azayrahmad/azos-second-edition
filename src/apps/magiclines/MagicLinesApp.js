import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./magiclines.css";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { getItem, setItem } from "../../utils/localStorage.js";

const MAGIC_LINES_3D_VIEW_KEY = "magic-lines-3d-view";

export class MagicLinesApp extends Application {
  static config = {
    id: "magiclines",
    isSingleton: true,
    title: "Magic Lines",
    icon: ICONS.magiclines,
    width: 550,
    height: 450,
    resizable: false,
    minimizeButton: true,
    maximizeButton: false,
  };

  async _onLaunch() {
    this.is3dView = getItem(MAGIC_LINES_3D_VIEW_KEY) ?? false;
    this.game = new Game();
    this.selectedBallCoords = null;
    this.renderBoard();
  }

  newGame() {
    this.game.newGame();
    this.selectedBallCoords = null;
    this.renderBoard();
  }

  renderBoard() {
    const boardElement = this.win.$content.find(".game-board");
    const scoreElement = this.win.$content.find("#score");

    const previousPreviewCoords = new Set();
    boardElement.find(".preview-ball").each(function () {
      const cell = $(this).closest(".cell");
      const r = cell.data("r");
      const c = cell.data("c");
      previousPreviewCoords.add(`${r},${c}`);
    });

    boardElement.empty();

    const grid = this.game.board.grid;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = $("<div>")
          .addClass("cell")
          .attr("data-r", r)
          .attr("data-c", c);

        const ball = grid[r][c];
        if (ball) {
          const ballElement = $("<div>")
            .addClass("ball")
            .css("--ball-color", ball.color)
            .css("background-color", ball.color);

          if (this.is3dView) {
            ballElement.addClass("three-d");
          }

          const coordKey = `${r},${c}`;
          if (previousPreviewCoords.has(coordKey)) {
            ballElement.addClass("animate-ball-grow");
          } else if (ball.isNew) {
            ballElement.addClass("animate-ball-enter");
          }
          ball.isNew = false;

          if (
            this.selectedBallCoords &&
            this.selectedBallCoords.r === r &&
            this.selectedBallCoords.c === c
          ) {
            ballElement.addClass("selected-ball");
          }

          cell.append(ballElement);
        } else {
          const nextBall = this.game.nextBalls.find(
            (b) => b.r === r && b.c === c,
          );
          if (nextBall) {
            const ballElement = $("<div>")
              .addClass("preview-ball")
              .css("--ball-color", nextBall.color)
              .css("background-color", nextBall.color);

            if (this.is3dView) {
              ballElement.addClass("three-d");
            }

            if (nextBall.isNew) {
              ballElement.addClass("animate-preview-enter");
            }
            nextBall.isNew = false;

            cell.append(ballElement);
          }
        }

        boardElement.append(cell);
      }
    }
    scoreElement.text(this.game.score);
  }

  async animateBallMove(path, startCoords) {
    const boardElement = this.win.$content.find(".game-board");
    boardElement.css("pointer-events", "none");

    const startCell = boardElement.find(
      `.cell[data-r='${startCoords.r}'][data-c='${startCoords.c}']`,
    );
    const ballElement = startCell.find(".ball").first();

    if (!ballElement.length) {
      this.renderBoard();
      boardElement.css("pointer-events", "auto");
      return;
    }

    const startOffset = ballElement.position();
    ballElement.removeClass("selected-ball");

    ballElement.css({
      position: "absolute",
      top: startOffset.top,
      left: startOffset.left,
      transition: "all 100ms linear",
      "z-index": 10,
    });
    boardElement.append(ballElement);

    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];

      const startCellEl = boardElement.find(
        `.cell[data-r='${start.r}'][data-c='${start.c}']`,
      );
      const endCellEl = boardElement.find(
        `.cell[data-r='${end.r}'][data-c='${end.c}']`,
      );
      const startPos = startCellEl.position();
      const endPos = endCellEl.position();

      const midTop = (startPos.top + endPos.top) / 2;
      const midLeft = (startPos.left + endPos.left) / 2;

      let transform = "scale(1)";
      if (end.r !== start.r) {
        // Vertical move
        transform = "scale(0.7, 1)";
      } else {
        // Horizontal move
        transform = "scale(1, 0.7)";
      }

      await new Promise((r) => setTimeout(r, 50));

      ballElement.css({
        top: midTop,
        left: midLeft,
        transform: transform,
      });
      await new Promise((r) => setTimeout(r, 100));

      ballElement.css({
        top: endPos.top,
        left: endPos.left,
        transform: "scale(1)",
      });
      await new Promise((r) => setTimeout(r, 100));
    }

    ballElement.remove();
    this.renderBoard();
    this.checkGameOver();
    boardElement.css("pointer-events", "auto");
  }

  handleCellClick(event) {
    if (
      this.win.$content.find(".game-board").css("pointer-events") === "none"
    ) {
      return;
    }

    const cell = $(event.currentTarget);
    const r = parseInt(cell.attr("data-r"));
    const c = parseInt(cell.attr("data-c"));
    const clickedBall = this.game.board.getBall(r, c);

    if (clickedBall) {
      this.selectedBallCoords = { r, c };
      this.renderBoard();
    } else {
      if (this.selectedBallCoords) {
        const startCoords = this.selectedBallCoords;
        const path = this.game.moveBall(startCoords, { r, c });
        if (path) {
          this.selectedBallCoords = null;
          this.animateBallMove(path, startCoords);
        }
      }
    }
  }

  checkGameOver() {
    if (this.game.isGameOver()) {
      ShowDialogWindow({
        title: "Game Over",
        text: `The board is full. Your final score is ${this.game.score}.`,
        buttons: [
          {
            label: "New Game",
            action: () => this.newGame(),
          },
        ],
      });
    }
  }

  undoMove() {
    this.game.undoMove();
    this.renderBoard();
  }

  showOptionsDialog() {
    const content = `
      <div class="field-row" style="padding-block: 10px;">
        <input type="checkbox" id="magic-lines-3d-view" ${this.is3dView ? "checked" : ""}>
        <label for="magic-lines-3d-view">3D View</label>
      </div>
    `;
    const contentElement = document.createElement("div");
    contentElement.innerHTML = content;

    ShowDialogWindow({
      title: "Options",
      content: contentElement,
      buttons: [
        {
          label: "OK",
          action: (win) => {
            const checkbox = win.$content.find("#magic-lines-3d-view")[0];
            this.is3dView = checkbox.checked;
            setItem(MAGIC_LINES_3D_VIEW_KEY, this.is3dView);
            this.renderBoard();
          },
        },
        {
          label: "Cancel",
        },
      ],
      modal: true,
    });
  }

  _createWindow() {
    const win = new $Window({
      title: this.config.title,
      width: this.config.width,
      height: this.config.height,
      icons: this.config.icon,
      resizable: this.config.resizable,
      minimizeButton: this.config.minimizeButton,
      maximizeButton: this.config.maximizeButton,
    });

    const menuBar = new MenuBar({
      Game: [
        {
          label: "New Game",
          action: () => this.newGame(),
        },
        {
          label: "Undo",
          action: () => this.undoMove(),
        },
        {
          label: "Options",
          action: () => this.showOptionsDialog(),
        },
      ],
    });
    win.setMenuBar(menuBar);

    const content = `
      <div class="magic-lines-app">
        <div class="sidebar">
          <h2>Score</h2>
          <p id="score">0</p>
        </div>
        <div class="game-board"></div>
      </div>
    `;
    win.$content.html(content);

    win.$content.on("click", ".cell", this.handleCellClick.bind(this));

    const boardElement = win.$content.find(".game-board");

    boardElement.on("mousemove", (e) => {
      if (!this.is3dView) return;
      const boardRect = boardElement[0].getBoundingClientRect();
      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;
      const lightX = (x / boardRect.width) * 100;
      const lightY = (y / boardRect.height) * 100;

      boardElement[0].style.setProperty("--light-x", `${lightX}%`);
      boardElement[0].style.setProperty("--light-y", `${lightY}%`);
    });

    return win;
  }
}
