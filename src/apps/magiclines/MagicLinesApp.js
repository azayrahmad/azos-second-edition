import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./magiclines.css";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";

export class MagicLinesApp extends Application {
  static config = {
    id: "magiclines",
    isSingleton: true,
    title: "Magic Lines",
    icon: ICONS.magiclines,
    width: 600,
    height: 480,
    resizable: false,
    minimizeButton: true,
    maximizeButton: false,
  };

  async _onLaunch() {
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
            .css("background-color", ball.color);
          cell.append(ballElement);
        }

        if (
          this.selectedBallCoords &&
          this.selectedBallCoords.r === r &&
          this.selectedBallCoords.c === c
        ) {
          cell.addClass("selected");
        }

        boardElement.append(cell);
      }
    }
    scoreElement.text(this.game.score);
  }

  handleCellClick(event) {
    const cell = $(event.currentTarget);
    const r = parseInt(cell.attr("data-r"));
    const c = parseInt(cell.attr("data-c"));
    const clickedBall = this.game.board.getBall(r, c);

    if (clickedBall) {
      this.selectedBallCoords = { r, c };
      this.renderBoard();
    } else {
      if (this.selectedBallCoords) {
        const moveSuccessful = this.game.moveBall(this.selectedBallCoords, { r, c });
        if (moveSuccessful) {
          this.selectedBallCoords = null;
          this.renderBoard();
          this.checkGameOver();
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

    return win;
  }
}
