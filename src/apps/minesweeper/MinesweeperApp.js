import { Application } from '../Application.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import './minesweeper.css';

export class MinesweeperApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: 200,
      outerHeight: 300,
      resizable: true,
      icons: this.icon,
    });

    const menuBar = this._createMenuBar();
    win.setMenuBar(menuBar);

    const container = document.createElement('div');
    container.className = 'minesweeper-container';

    const header = document.createElement('div');
    header.className = 'game-header sunken-panel';
    header.innerHTML = `
      <div class="mine-count seven-segment">000</div>
      <button class="smiley-face"></button>
      <div class="timer seven-segment">000</div>
    `;

    container.appendChild(header);
    win.$content.append(container);

    header.querySelector('.smiley-face').addEventListener('click', () => this.newGame());

    return win;
  }

  _onLaunch() {
    this.container = this.win.$content.find('.minesweeper-container')[0];
    this.difficulty = 'beginner';
    this.newGame(this.difficulty);
  }

    _createMenuBar() {
        return new MenuBar({
            "&Game": [
                {
                    label: "&New",
                    action: () => this.newGame(this.difficulty),
                },
                "MENU_DIVIDER",
                {
                    label: "&Beginner",
                    radioItems: [
                        { label: "Beginner", value: "beginner" },
                        { label: "Intermediate", value: "intermediate" },
                        { label: "Expert", value: "expert" },
                        { label: "Custom...", value: "custom" },
                    ],
                    getValue: () => this.difficulty,
                    setValue: (value) => this.setDifficulty(value),
                },
                "MENU_DIVIDER",
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&Help": [
                {
                    label: "&About Minesweeper",
                    action: () => alert("Minesweeper clone."),
                },
            ],
        });
    }

  newGame(difficulty) {
    this.stopTimer();

    this.difficulty = difficulty;
    const settings = {
        beginner: { rows: 9, cols: 9, mines: 10 },
        intermediate: { rows: 16, cols: 16, mines: 40 },
        expert: { rows: 16, cols: 30, mines: 99 },
        custom: this.customSettings || { rows: 9, cols: 9, mines: 10 },
    };

    const { rows, cols, mines } = settings[difficulty];
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.flags = 0;
    this.time = 0;
    this.timerInterval = null;
    this.gameOver = false;
    this.firstClick = true;

    this.generateBoard();
    this.renderBoard();
    this.updateMineCount();
    this._resizeWindow();
  }

  _resizeWindow() {
    const BORDER_WIDTH = 2;
    const PADDING = 5;
    const HEADER_HEIGHT = 36;
    const CELL_SIZE = 16;

    const width = this.cols * CELL_SIZE + (BORDER_WIDTH * 2) + (PADDING * 2);
    const height = this.rows * CELL_SIZE + HEADER_HEIGHT + (BORDER_WIDTH * 2) + (PADDING * 2);

    this.win.setDimensions({ outerWidth: width, outerHeight: height });
  }

  generateBoard() {
    // Create a 2D array for the board
    this.board = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        isQuestion: false,
        adjacentMines: 0,
      })));

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < this.mines) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      if (!this.board[row][col].isMine) {
        this.board[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.board[row][col].isMine) continue;
        let count = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols && this.board[newRow][newCol].isMine) {
              count++;
            }
          }
        }
        this.board[row][col].adjacentMines = count;
      }
    }
  }

  renderBoard() {
    let gameBoard = this.container.querySelector('.game-board');
    if (!gameBoard) {
        gameBoard = document.createElement('div');
        gameBoard.className = 'game-board';
        this.container.appendChild(gameBoard);
    } else {
        gameBoard.innerHTML = '';
    }

    gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 16px)`;

    for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.addEventListener('mousedown', (e) => this.handleCellClick(e));
            gameBoard.appendChild(cell);
        }
    }
    this.updateBoard();
}

  handleCellClick(e) {
    if (this.gameOver) return;

    const cellElement = e.target.closest('.cell');
    if (!cellElement) return;

    this.updateSmiley('surprised');
    const releaseHandler = () => {
      if (!this.gameOver) this.updateSmiley('happy');
      document.removeEventListener('mouseup', releaseHandler);
    };
    document.addEventListener('mouseup', releaseHandler);

    const row = parseInt(cellElement.dataset.row, 10);
    const col = parseInt(cellElement.dataset.col, 10);
    const cellData = this.board[row][col];

    if (e.button === 0 && !cellData.isFlagged) { // Left click
      this.revealCell(row, col);
    } else if (e.button === 2) { // Right click
      e.preventDefault();
      this.toggleFlag(row, col);
    } else if (e.buttons === 3 || e.button === 1) { // Middle or both buttons
      e.preventDefault();
      this.chord(row, col);
    }
  }

  revealCell(row, col) {
    const cellData = this.board[row][col];
    if (cellData.isRevealed || cellData.isFlagged) return;

    if (this.firstClick) {
        this.startTimer();
      if (cellData.isMine) {
        this.moveMine(row, col);
      }
      this.firstClick = false;
    }

    cellData.isRevealed = true;

    if (cellData.isMine) {
      this.gameOver = true;
      this.stopTimer();
      this.updateSmiley('dead');
      this.revealAllMines();
    } else if (cellData.adjacentMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newRow = row + i;
          const newCol = col + j;
          if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
            this.revealCell(newRow, newCol);
          }
        }
      }
    }

    this.updateBoard();
    this.checkWinCondition();
  }

  toggleFlag(row, col) {
    const cellData = this.board[row][col];
    if (cellData.isRevealed) return;

    if (!cellData.isFlagged && !cellData.isQuestion) {
      cellData.isFlagged = true;
      this.flags++;
    } else if (cellData.isFlagged) {
      cellData.isFlagged = false;
      cellData.isQuestion = true;
      this.flags--;
    } else if (cellData.isQuestion) {
      cellData.isQuestion = false;
    }

    this.updateBoard();
    this.updateMineCount();
  }

  chord(row, col) {
    const cellData = this.board[row][col];
    if (!cellData.isRevealed || cellData.adjacentMines === 0) return;

    let flaggedNeighbors = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols && this.board[newRow][newCol].isFlagged) {
          flaggedNeighbors++;
        }
      }
    }

    if (flaggedNeighbors === cellData.adjacentMines) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newRow = row + i;
          const newCol = col + j;
          if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
            this.revealCell(newRow, newCol);
          }
        }
      }
    }
  }

  moveMine(row, col) {
    let newRow, newCol;
    do {
      newRow = Math.floor(Math.random() * this.rows);
      newCol = Math.floor(Math.random() * this.cols);
    } while (this.board[newRow][newCol].isMine || (newRow === row && newCol === col));

    this.board[newRow][newCol].isMine = true;
    this.board[row][col].isMine = false;

    // Recalculate adjacent mines for all cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c].isMine) continue;
        let count = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const newR = r + i;
            const newC = c + j;
            if (newR >= 0 && newR < this.rows && newC >= 0 && newC < this.cols && this.board[newR][newC].isMine) {
              count++;
            }
          }
        }
        this.board[r][c].adjacentMines = count;
      }
    }
  }

  revealAllMines() {
    this.board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.isMine) {
          cell.isRevealed = true;
        }
      });
    });
    this.updateBoard();
  }

  updateBoard() {
    const cells = this.container.querySelectorAll('.cell');
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);
      const cellData = this.board[row][col];

      cell.className = 'cell'; // Reset classes
      if (cellData.isRevealed) {
        cell.classList.add('revealed');
        if (cellData.isMine) {
          cell.classList.add('mine');
        } else if (cellData.adjacentMines > 0) {
          cell.textContent = cellData.adjacentMines;
          cell.classList.add(`c${cellData.adjacentMines}`);
        }
      } else if (cellData.isFlagged) {
        cell.classList.add('flagged');
      } else if (cellData.isQuestion) {
        cell.classList.add('question');
      }
    });
  }

  checkWinCondition() {
    let revealedCount = 0;
    this.board.forEach(row => {
      row.forEach(cell => {
        if (cell.isRevealed && !cell.isMine) {
          revealedCount++;
        }
      });
    });

    if (revealedCount === this.rows * this.cols - this.mines) {
      this.gameOver = true;
      this.stopTimer();
      this.updateSmiley('cool');
      this.revealAllMines();
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
        this.time++;
        this.updateTimer();
    }, 1000);
  }

  stopTimer() {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
  }

  updateTimer() {
    const timerEl = this.container.querySelector('.timer');
    if (timerEl) {
      timerEl.textContent = this.time.toString().padStart(3, '0');
    }
  }

  updateMineCount() {
    const mineCountEl = this.container.querySelector('.mine-count');
    if (mineCountEl) {
      const remaining = this.mines - this.flags;
      mineCountEl.textContent = remaining.toString().padStart(3, '0');
    }
  }

  updateSmiley(state) {
    const smileyEl = this.container.querySelector('.smiley-face');
    if (smileyEl) {
      smileyEl.className = `smiley-face ${state}`;
    }
  }

  setDifficulty(difficulty) {
    if (difficulty === 'custom') {
      this.showCustomDialog();
    } else {
      this.difficulty = difficulty;
      this.newGame(this.difficulty);
      this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }
  }

  showCustomDialog() {
    const dialogContent = `
      <div style="display: grid; grid-template-columns: auto auto; gap: 5px; align-items: center;">
        <label for="custom-height">Height:</label>
        <input type="number" id="custom-height" min="9" max="24" value="${this.rows}">
        <label for="custom-width">Width:</label>
        <input type="number" id="custom-width" min="9" max="30" value="${this.cols}">
        <label for="custom-mines">Mines:</label>
        <input type="number" id="custom-mines" min="10" max="668" value="${this.mines}">
      </div>
    `;

    ShowDialogWindow({
      title: 'Custom Field',
      width: 200,
      height: 'auto',
      text: dialogContent,
      buttons: [
        {
          label: 'OK',
          action: (win) => {
            const height = parseInt(win.element.querySelector('#custom-height').value, 10);
            const width = parseInt(win.element.querySelector('#custom-width').value, 10);
            const mines = parseInt(win.element.querySelector('#custom-mines').value, 10);

            if (height >= 9 && height <= 24 && width >= 9 && width <= 30 && mines >= 10 && mines <= (height * width - 1)) {
              this.customSettings = { rows: height, cols: width, mines };
              this.difficulty = 'custom';
              this.newGame('custom');
              this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
              return true;
            } else {
              alert('Invalid custom settings.');
              return false;
            }
          },
          isDefault: true,
        },
        { label: 'Cancel' }
      ],
    });
  }
}
