import { Application } from '../Application.js';
import { MinesweeperGame } from './MinesweeperGame.js';
import { MenuBar } from '/public/os-gui/MenuBar.js';
import { getItem, setItem } from '../../utils/localStorage.js';

const HIGH_SCORES_KEY = 'minesweeper_high_scores';

export class MinesweeperApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: 'Minesweeper',
      width: 200,
      height: 280,
      resizable: false,
    });

    const menuBar = new MenuBar([
        {
          label: 'Game',
          submenu: [
            { label: 'New', action: () => this.resetGame() },
            { type: 'separator' },
            { label: 'Beginner', radio: 'difficulty', checked: true, action: () => this.setDifficulty(9, 9, 10, 'beginner') },
            { label: 'Intermediate', radio: 'difficulty', action: () => this.setDifficulty(16, 16, 40, 'intermediate') },
            { label: 'Expert', radio: 'difficulty', action: () => this.setDifficulty(30, 16, 99, 'expert') },
            { label: 'Custom...', action: () => this.showCustomDialog() },
            { type: 'separator' },
            { label: 'High Scores...', action: () => this.showHighScores() },
            { type: 'separator' },
            { label: 'Exit', action: () => this.win.close() },
          ],
        },
        {
          label: 'Help',
          submenu: [
            { label: 'About Minesweeper...', action: () => this.showAboutDialog() },
          ],
        },
      ]);
    win.setMenuBar(menuBar);

    win.content.innerHTML = `
        <div class="minesweeper-app">
          <div class="game-header">
            <div class="mine-count">010</div>
            <div class="smiley"></div>
            <div class="timer">000</div>
          </div>
          <div class="game-board"></div>
        </div>
      `;

    this.win = win;
    this.difficulty = 'beginner';
    this.highScores = getItem(HIGH_SCORES_KEY, {
        beginner: 999,
        intermediate: 999,
        expert: 999
    });

    this.setDifficulty(9, 9, 10, 'beginner');

    this.boardEl = win.$content.querySelector('.game-board');
    this.mineCountEl = win.$content.querySelector('.mine-count');
    this.timerEl = win.$content.querySelector('.timer');
    this.smileyEl = win.$content.querySelector('.smiley');

    this.boardEl.addEventListener('click', this.handleCellClick.bind(this));
    this.boardEl.addEventListener('contextmenu', this.handleCellFlag.bind(this));
    this.smileyEl.addEventListener('click', this.resetGame.bind(this));

    return win;
  }

  setDifficulty(width, height, mines, difficulty) {
    this.difficulty = difficulty;
    this.game = new MinesweeperGame(width, height, mines);
    this.resetGame();
    // Adjust window size
    const newWidth = width * 16 + 40;
    const newHeight = height * 16 + 110;
    this.win.resize(newWidth, newHeight);
  }

  showCustomDialog() {
    const content = `
      <div class="field-row-stacked">
        <label for="ms-width">Width:</label>
        <input type="number" id="ms-width" value="${this.game.width}" />
      </div>
      <div class="field-row-stacked">
        <label for="ms-height">Height:</label>
        <input type="number" id="ms-height" value="${this.game.height}" />
      </div>
      <div class="field-row-stacked">
        <label for="ms-mines">Mines:</label>
        <input type="number" id="ms-mines" value="${this.game.mines}" />
      </div>
    `;
    ShowDialogWindow({
      title: 'Custom Field',
      content,
      buttons: {
        'ok': {
          label: 'OK',
          action: () => {
            const width = parseInt(document.getElementById('ms-width').value);
            const height = parseInt(document.getElementById('ms-height').value);
            const mines = parseInt(document.getElementById('ms-mines').value);
            this.setDifficulty(width, height, mines, 'custom');
          }
        },
        'cancel': 'Cancel'
      }
    });
  }

  showHighScores() {
     const content = `
      <div style="text-align: center;">
        <p>Beginner: ${this.highScores.beginner} seconds</p>
        <p>Intermediate: ${this.highScores.intermediate} seconds</p>
        <p>Expert: ${this.highScores.expert} seconds</p>
      </div>
    `;
    ShowDialogWindow({
        title: 'High Scores',
        content,
        buttons: { 'ok': 'OK' }
    });
  }

  showAboutDialog() {
    ShowDialogWindow({
        title: 'About Minesweeper',
        text: 'Minesweeper clone for azOS.',
        buttons: { 'ok': 'OK' }
    });
  }

  resetGame() {
    this.game = new MinesweeperGame(this.game.width, this.game.height, this.game.mines);
    if(this.boardEl) { // Check if UI is initialized
        this.renderBoard();
        this.stopTimer();
        this.startTimer();
        this.updateMineCount();
        this.timerEl.textContent = '000';
        this.smileyEl.style.backgroundImage = "url('/src/assets/minesweeper/minesweeper-smiley-neutral.png')";
    }
  }

  startTimer() {
    this.timer = 0;
    this.timerEl.textContent = '000';
    this.stopTimer(); // ensure no multiple timers
    this.timerInterval = setInterval(() => {
      if (this.timer < 999) {
          this.timer++;
          this.timerEl.textContent = this.timer.toString().padStart(3, '0');
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  updateMineCount() {
    const flags = this.game.board.flat().filter(cell => cell.isFlagged).length;
    const remainingMines = this.game.mines - flags;
    this.mineCountEl.textContent = remainingMines.toString().padStart(3, '0');
  }

  handleCellClick(e) {
    if (!e.target.classList.contains('cell')) return;
    const { x, y } = e.target.dataset;
    const result = this.game.revealCell(parseInt(x), parseInt(y));
    this.renderBoard();

    if (result === 'mine') {
      this.stopTimer();
      this.smileyEl.style.backgroundImage = "url('/src/assets/minesweeper/minesweeper-smiley-lose.png')";
      ShowDialogWindow({ title: 'Game Over', text: 'You hit a mine!', buttons: { 'ok': 'OK' } });
    } else if (result === 'win') {
      this.stopTimer();
      this.smileyEl.style.backgroundImage = "url('/src/assets/minesweeper/minesweeper-smiley-win.png')";
      if (this.difficulty !== 'custom' && this.timer < this.highScores[this.difficulty]) {
        this.highScores[this.difficulty] = this.timer;
        setItem(HIGH_SCORES_KEY, this.highScores);
        ShowDialogWindow({ title: 'New High Score!', text: `New high score for ${this.difficulty}: ${this.timer} seconds!`, buttons: { 'ok': 'OK' } });
      } else {
        ShowDialogWindow({ title: 'You Win!', text: 'You cleared the board!', buttons: { 'ok': 'OK' } });
      }
    }
  }

  handleCellFlag(e) {
    e.preventDefault();
    if (!e.target.classList.contains('cell')) return;
    const { x, y } = e.target.dataset;
    this.game.toggleFlag(parseInt(x), parseInt(y));
    this.renderBoard();
    this.updateMineCount();
  }

  renderBoard() {
    this.boardEl.innerHTML = '';
    this.boardEl.style.gridTemplateColumns = `repeat(${this.game.width}, 16px)`;
    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        const cellEl = document.createElement('div');
        cellEl.classList.add('cell');
        cellEl.dataset.x = x;
        cellEl.dataset.y = y;

        if (cell.isRevealed) {
          cellEl.classList.add('revealed');
          if (cell.isMine) {
            cellEl.classList.add('mine');
          } else if (cell.neighborMines > 0) {
            cellEl.textContent = cell.neighborMines;
            cellEl.classList.add(`c${cell.neighborMines}`);
          }
        } else if (cell.isFlagged) {
          cellEl.classList.add('flagged');
        }
        this.boardEl.appendChild(cellEl);
      }
    }
  }
}
