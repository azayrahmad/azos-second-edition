import { MinesweeperGame } from "../../games/minesweeper-common/MinesweeperGame.js";
import { SpriteDisplay } from "../../games/minesweeper-common/SpriteDisplay.js";
import { getItem, setItem } from "../../utils/localStorage.js";

// Import assets so Vite can process them
import "./minesweeper.css";
import iconSmall from "./assets/minesweeper-icon-small.png";
import iconLarge from "./assets/minesweeper-icon-large.png";
import smileyNeutral from "./assets/minesweeper-smiley-neutral.png";
import smileyClick from "./assets/minesweeper-smiley-click.png";
import smileyLose from "./assets/minesweeper-smiley-lose.png";
import smileyWin from "./assets/minesweeper-smiley-win.png";

const HIGH_SCORES_KEY = "minesweeper_high_scores";
const STYLE_KEY = "minesweeper.use98style";

class MinesweeperApp {
  constructor() {
    this.title = "Minesweeper";
    this.width = 200;
    this.height = 280;
    this.resizable = false;
    this.icon = {
      16: iconSmall,
      32: iconLarge,
    };
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      icons: this.icon,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
    });

    this.difficulty = "beginner";

    const menuBar = new MenuBar({
      Game: [
        { label: "New", action: () => this.resetGame() },
        "MENU_DIVIDER",
        {
          radioItems: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Expert", value: "expert" },
            { label: "Custom...", value: "custom" },
          ],
          getValue: () => this.difficulty,
          setValue: (value) => {
            switch (value) {
              case "beginner":
                this.setDifficulty(9, 9, 10, "beginner");
                break;
              case "intermediate":
                this.setDifficulty(16, 16, 40, "intermediate");
                break;
              case "expert":
                this.setDifficulty(30, 16, 99, "expert");
                break;
              case "custom":
                this.showCustomDialog();
                break;
            }
          },
        },
        "MENU_DIVIDER",
        {
          label: "Win9x Style",
          checkbox: {
            check: () => this.use98Style,
            toggle: () => {
              this.use98Style = !this.use98Style;
              setItem(STYLE_KEY, this.use98Style);
              this.win.$content
                .find(".minesweeper-app")
                .toggleClass("style-98", this.use98Style);
              this.renderBoard();
            },
          },
        },
        "MENU_DIVIDER",
        { label: "Best Times...", action: () => this.showHighScores() },
        "MENU_DIVIDER",
        { label: "Exit", enabled: false },
      ],
      Help: [
        {
          label: "About Minesweeper...",
          action: () => this.showAboutDialog(),
        },
      ],
    });
    this.menuBar = menuBar;
    win.setMenuBar(this.menuBar);

    win.$content.html(`
        <div class="minesweeper-app">
          <div class="game-header">
            <div class="mine-count inset-shallow"></div>
            <div class="smiley"></div>
            <div class="timer inset-shallow"></div>
          </div>
          <div class="game-board"></div>
        </div>
      `);

    this.win = win;
    this.difficulty = "beginner";
    this.isGameStarted = false;

    this.use98Style = getItem(STYLE_KEY);
    if (this.use98Style === null) {
      this.use98Style = true;
    }

    this.highScores = getItem(HIGH_SCORES_KEY);
    if (!this.highScores || typeof this.highScores.beginner === "number") {
      this.highScores = {
        beginner: { time: 999, name: "Anonymous" },
        intermediate: { time: 999, name: "Anonymous" },
        expert: { time: 999, name: "Anonymous" },
      };
    }
    this.explodedMine = null;

    this.setDifficulty(9, 9, 10, "beginner");

    this.boardEl = win.$content.find(".game-board");
    if (this.use98Style) {
      win.$content.find(".minesweeper-app").addClass("style-98");
    }

    const mineCountContainer = win.$content.find(".mine-count")[0];
    this.mineCountDisplay = new SpriteDisplay();
    mineCountContainer.appendChild(this.mineCountDisplay.element);

    const timerContainer = win.$content.find(".timer")[0];
    this.timerDisplay = new SpriteDisplay();
    timerContainer.appendChild(this.timerDisplay.element);

    this.smileyEl = win.$content.find(".smiley");

    this.isMouseDown = false;
    this.pressedCellEl = null;
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);

    this.boardEl.on("mousedown", this.handleMouseDown.bind(this));
    $(document).on("mouseup", this.boundHandleMouseUp);
    this.boardEl.on("mouseover", this.handleMouseOver.bind(this));
    this.boardEl.on("mouseout", this.handleMouseOut.bind(this));
    this.boardEl.on("contextmenu", this.handleCellFlag.bind(this));
    this.smileyEl.on("click", this.resetGame.bind(this));
    this.renderBoard();

    win.on("close", () => {
      $(document).off("mouseup", this.boundHandleMouseUp);
    });

    return win;
  }

  setDifficulty(width, height, mines, difficulty) {
    this.difficulty = difficulty;
    this.game = new MinesweeperGame(width, height, mines);
    this.resetGame();
    this.menuBar.element.dispatchEvent(new Event("update"));
  }

  showCustomDialog() {
    alert("Custom difficulty is not available in this version.");
  }

  showHighScores() {
    const scores = this.highScores;
    alert(
      `Fastest Mine Sweepers:\n\n` +
      `Beginner: ${scores.beginner.time} seconds by ${scores.beginner.name}\n` +
      `Intermediate: ${scores.intermediate.time} seconds by ${scores.intermediate.name}\n` +
      `Expert: ${scores.expert.time} seconds by ${scores.expert.name}\n`
    );
  }

  showAboutDialog() {
    alert("About Minesweeper\n\nMinesweeper clone for azOS.");
  }

  resetGame() {
    this.game = new MinesweeperGame(
      this.game.width,
      this.game.height,
      this.game.mines,
    );
    this.isGameStarted = false;
    this.explodedMine = null;
    if (this.boardEl) {
      this.renderBoard();
      this.stopTimer();
      this.updateMineCount();
      this.timerDisplay.setValue(0);
      this.smileyEl.css("backgroundImage", `url('${smileyNeutral}')`);
    }
  }

  startTimer() {
    this.timer = 0;
    this.timerDisplay.setValue(0);
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.timer < 999) {
        this.timer++;
        this.timerDisplay.setValue(this.timer);
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  updateMineCount() {
    const flags = this.game.board
      .flat()
      .filter((cell) => cell.isFlagged).length;
    const remainingMines = this.game.mines - flags;
    this.mineCountDisplay.setValue(remainingMines);
  }

  handleMouseDown(e) {
    if (e.button !== 0 || this.game.isGameOver) return;

    const cellEl = e.target.closest(".cell");
    if (!cellEl) return;

    const { x, y } = cellEl.dataset;
    const cell = this.game.board[y][x];

    if (!cell.isRevealed && !cell.isFlagged) {
      this.isMouseDown = true;
      this.smileyEl.css("backgroundImage", `url('${smileyClick}')`);
      cellEl.classList.add("pressed");
      this.pressedCellEl = cellEl;
    }
  }

  handleMouseUp(e) {
    if (e.button !== 0 || !this.isMouseDown) return;

    this.isMouseDown = false;
    const cellEl = this.pressedCellEl;

    if (cellEl) {
      cellEl.classList.remove("pressed");
      this._revealCellAndUpdateGameState(cellEl);
      this.pressedCellEl = null;
    }

    if (!this.game.isGameOver) {
      this.smileyEl.css("backgroundImage", `url('${smileyNeutral}')`);
    }
  }

  handleMouseOver(e) {
    if (!this.isMouseDown) return;

    if (this.pressedCellEl) {
      this.pressedCellEl.classList.remove("pressed");
    }

    const cellEl = e.target.closest(".cell");
    if (cellEl) {
      const { x, y } = cellEl.dataset;
      const cell = this.game.board[y][x];
      if (!cell.isRevealed && !cell.isFlagged) {
        cellEl.classList.add("pressed");
        this.pressedCellEl = cellEl;
      } else {
        this.pressedCellEl = null;
      }
    } else {
      this.pressedCellEl = null;
    }
  }

  handleMouseOut(e) {
    if (!this.isMouseDown) return;

    const cellEl = e.target.closest(".cell");
    if (cellEl && cellEl === this.pressedCellEl) {
      cellEl.classList.remove("pressed");
      this.pressedCellEl = null;
    }
  }

  _revealCellAndUpdateGameState(cellEl) {
    if (!this.isGameStarted) {
      this.startTimer();
      this.isGameStarted = true;
    }

    const { x, y } = cellEl.dataset;
    const result = this.game.revealCell(parseInt(x), parseInt(y));

    if (result === "mine") {
      this.game.isGameOver = true;
      this.explodedMine = { x: parseInt(x), y: parseInt(y) };
      this.stopTimer();
      this.smileyEl.css("backgroundImage", `url('${smileyLose}')`);
      this.renderBoard();
    } else if (result === "win") {
      this.game.isGameOver = true;
      this.stopTimer();
      this.smileyEl.css("backgroundImage", `url('${smileyWin}')`);
      if (
        this.difficulty !== "custom" &&
        this.timer < this.highScores[this.difficulty].time
      ) {
        const name = prompt(`You have the fastest time for the ${this.difficulty} level: ${this.timer} seconds!\nPlease enter your name.`, "Anonymous");
        this.highScores[this.difficulty] = {
            time: this.timer,
            name: name || "Anonymous",
        };
        setItem(HIGH_SCORES_KEY, this.highScores);
        this.showHighScores();
      }
      this.renderBoard();
    } else {
      this.renderBoard();
    }
  }

  handleCellFlag(e) {
    e.preventDefault();
    const cellEl = e.target.closest(".cell");
    if (!cellEl) return;
    const { x, y } = cellEl.dataset;
    this.game.toggleFlag(parseInt(x), parseInt(y));
    this.renderBoard();
    this.updateMineCount();
  }

  renderBoard() {
    this.boardEl.html("");
    this.boardEl.css("gridTemplateColumns", `repeat(${this.game.width}, 16px)`);
    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        const cellEl = document.createElement("div");
        cellEl.classList.add("cell");
        cellEl.dataset.x = x;
        cellEl.dataset.y = y;

        if (this.use98Style) {
          const tile = document.createElement("div");
          tile.classList.add("tile");
          let tileClass = "unopened";

          if (this.game.isGameOver) {
            if (cell.isMine && !cell.isFlagged) {
              tileClass =
                this.explodedMine &&
                this.explodedMine.x === x &&
                this.explodedMine.y === y
                  ? "mine-exploded"
                  : "mine";
            } else if (!cell.isMine && cell.isFlagged) {
              tileClass = "not-mine";
            } else if (cell.isFlagged) {
              tileClass = "flag";
            } else if (cell.isRevealed) {
              tileClass = `cell-${cell.neighborMines}`;
            } else if (cell.isQuestion) {
              tileClass = "question";
            }
          } else {
            if (cell.isRevealed) {
              tileClass = `cell-${cell.neighborMines}`;
            } else if (cell.isFlagged) {
              tileClass = "flag";
            } else if (cell.isQuestion) {
              tileClass = "question";
            }
          }

          tile.classList.add(tileClass);
          cellEl.appendChild(tile);
        } else {
          if (cell.isRevealed) {
            cellEl.classList.add("revealed");
            if (cell.isMine) {
              cellEl.classList.add("mine");
            } else if (cell.neighborMines > 0) {
              cellEl.textContent = cell.neighborMines;
            }
          } else if (cell.isFlagged) {
            cellEl.classList.add("flagged");
          } else if (this.game.isGameOver && cell.isMine) {
            cellEl.classList.add("mine");
            cellEl.classList.add("revealed");
          }
        }
        this.boardEl.append(cellEl);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new MinesweeperApp();
  const win = app._createWindow();
  document.body.appendChild(win.element);
  win.center();
});
