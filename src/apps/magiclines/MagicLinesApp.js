import { Application } from '../Application.js';
import { getIcon } from '../../utils/iconManager.js';
import { MenuBar } from '/public/os-gui/MenuBar.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import { Window as $Window } from '/public/os-gui/$Window.js';
import './magiclines.css';

export class MagicLinesApp extends Application {
  static config = {
    id: 'magiclines',
    title: 'Magic Lines',
    icon: getIcon('magiclines'),
    width: 600,
    height: 480,
    resizable: false,
    minimizeButton: true,
    maximizeButton: false,
  };

  async _onLaunch() {
    this.newGame();
  }

  newGame() {
    this.board = Array(9).fill(null).map(() => Array(9).fill(null));
    this.score = 0;
    this.colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080', '#ffa500', '#00ffff'];
    this.selectedBall = null;
    this.turnHistory = [];
    this.placeNewBalls(5);
    this.renderBoard();
  }

  renderBoard() {
    const boardElement = this.win.$content.find('.game-board');
    const scoreElement = this.win.$content.find('#score');
    boardElement.empty();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = $('<div>').addClass('cell').attr('data-r', r).attr('data-c', c);

        if (this.board[r][c]) {
          const ball = $('<div>').addClass('ball').css('background-color', this.board[r][c]);
          cell.append(ball);
        }

        if (this.selectedBall && this.selectedBall.r === r && this.selectedBall.c === c) {
          cell.addClass('selected');
        }

        boardElement.append(cell);
      }
    }
    scoreElement.text(this.score);
  }

  placeNewBalls(count) {
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.board[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }

    const newBallCoords = [];
    const ballsToPlace = Math.min(count, emptyCells.length);
    for (let i = 0; i < ballsToPlace; i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(randomIndex, 1)[0];
      const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.board[cell.r][cell.c] = randomColor;
      newBallCoords.push(cell);
    }
    return newBallCoords;
  }

  findPath(start, end) {
    const queue = [[start]];
    const visited = new Set([`${start.r},${start.c}`]);

    while (queue.length > 0) {
      const path = queue.shift();
      const { r, c } = path[path.length - 1];

      if (r === end.r && c === end.c) {
        return true; // Path found
      }

      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 },
      ];

      for (const neighbor of neighbors) {
        const { r: nr, c: nc } = neighbor;
        const key = `${nr},${nc}`;

        if (
          nr >= 0 && nr < 9 &&
          nc >= 0 && nc < 9 &&
          !visited.has(key) &&
          this.board[nr][nc] === null
        ) {
          visited.add(key);
          const newPath = [...path, neighbor];
          queue.push(newPath);
        }
      }
    }
    return false; // No path found
  }

  checkLines(coords) {
    const color = this.board[coords.r][coords.c];
    if (!color) return false;

    const directions = [
      { r: 0, c: 1 }, // Horizontal
      { r: 1, c: 0 }, // Vertical
      { r: 1, c: 1 }, // Diagonal /
      { r: 1, c: -1 }, // Diagonal \
    ];

    let totalScore = 0;
    const ballsToRemove = new Set();

    for (const dir of directions) {
      const line = [{...coords}];
      // Check in the positive direction
      for (let i = 1; i < 9; i++) {
        const r = coords.r + i * dir.r;
        const c = coords.c + i * dir.c;
        if (r >= 0 && r < 9 && c >= 0 && c < 9 && this.board[r][c] === color) {
          line.push({ r, c });
        } else {
          break;
        }
      }
      // Check in the negative direction
      for (let i = 1; i < 9; i++) {
        const r = coords.r - i * dir.r;
        const c = coords.c - i * dir.c;
        if (r >= 0 && r < 9 && c >= 0 && c < 9 && this.board[r][c] === color) {
          line.push({ r, c });
        } else {
          break;
        }
      }

      if (line.length >= 5) {
        let scoreForLine = 10;
        for (let i = 6; i <= line.length; i++) {
          scoreForLine += i - 4;
        }
        totalScore += scoreForLine;
        line.forEach(ball => ballsToRemove.add(`${ball.r},${ball.c}`));
      }
    }

    if (ballsToRemove.size > 0) {
      ballsToRemove.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        this.board[r][c] = null;
      });
      this.score += totalScore;
      return true;
    }

    return false;
  }

  handleCellClick(event) {
    const cell = $(event.currentTarget);
    const r = parseInt(cell.attr('data-r'));
    const c = parseInt(cell.attr('data-c'));

    if (this.board[r][c]) {
      // Clicked on a ball
      this.selectedBall = { r, c, color: this.board[r][c] };
      this.renderBoard();
    } else {
      // Clicked on an empty cell
      if (this.selectedBall) {
        const start = this.selectedBall;
        const end = { r, c };

        if (this.findPath(start, end)) {
          // Valid move
          this.turnHistory.push({
            board: JSON.parse(JSON.stringify(this.board)),
            score: this.score,
          });

          this.board[end.r][end.c] = this.selectedBall.color;
          this.board[start.r][start.c] = null;
          this.selectedBall = null;

          const lineCleared = this.checkLines(end);
          if (!lineCleared) {
            const newBalls = this.placeNewBalls(3);
            for (const ball of newBalls) {
              this.checkLines(ball);
            }
          }

          this.renderBoard();
          this.checkGameOver();
        }
      }
    }
  }

  checkGameOver() {
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!this.board[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length === 0) {
      ShowDialogWindow({
        title: 'Game Over',
        text: `The board is full. Your final score is ${this.score}.`,
        buttons: [
          {
            label: 'New Game',
            action: () => this.newGame(),
          },
        ],
      });
    }
  }

  undoMove() {
    if (this.turnHistory.length > 0) {
      const lastState = this.turnHistory.pop();
      this.board = lastState.board;
      this.score = lastState.score;
      this.renderBoard();
    }
  }

  _createWindow() {
    const win = new $Window({
      title: this.config.title,
      width: this.config.width,
      height: this.config.height,
      icon: this.config.icon,
      resizable: this.config.resizable,
      minimizeButton: this.config.minimizeButton,
      maximizeButton: this.config.maximizeButton,
    });

    const menuBar = new MenuBar([
      {
        label: 'Game',
        submenu: [
          {
            label: 'New Game',
            action: () => this.newGame(),
          },
          {
            label: 'Undo',
            action: () => this.undoMove(),
          },
        ],
      },
    ]);
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

    // Attach event listener after content is added
    win.$content.on('click', '.cell', this.handleCellClick.bind(this));

    return win;
  }
}
