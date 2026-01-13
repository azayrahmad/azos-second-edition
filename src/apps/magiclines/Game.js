import { Board } from './Board.js';
import { Ball } from './Ball.js';

export class Game {
  constructor() {
    this.newGame();
  }

  newGame() {
    this.board = new Board();
    this.score = 0;
    this.colors = [
      '#ff0000',
      '#0000ff',
      '#00ff00',
      '#ffff00',
      '#800080',
      '#ffa500',
      '#00ffff',
    ];
    this.turnHistory = [];
    this.nextBalls = [];
    this._placeRandomBalls(5);
    this._generateNextBalls();
  }

  _generateNextBalls() {
    this.nextBalls = [];
    const emptyCells = this.board.getEmptyCells();
    const ballsToPlace = Math.min(3, emptyCells.length);

    for (let i = 0; i < ballsToPlace; i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(randomIndex, 1)[0];
      const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.nextBalls.push({ r: cell.r, c: cell.c, color: randomColor, isNew: true });
    }
  }

  _placeRandomBalls(count) {
    const emptyCells = this.board.getEmptyCells();
    const ballsToPlace = Math.min(count, emptyCells.length);
    const newBallCoords = [];

    for (let i = 0; i < ballsToPlace; i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(randomIndex, 1)[0];
      const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.board.placeBall(new Ball(randomColor), cell.r, cell.c);
      newBallCoords.push(cell);
    }
    return newBallCoords;
  }

  placeNewBalls() {
    const newBallCoords = [];
    for (const ball of this.nextBalls) {
      if (this.board.getBall(ball.r, ball.c)) {
        const emptyCells = this.board.getEmptyCells();
        if (emptyCells.length > 0) {
          const randomIndex = Math.floor(Math.random() * emptyCells.length);
          const cell = emptyCells.splice(randomIndex, 1)[0];
          this.board.placeBall(new Ball(ball.color), cell.r, cell.c);
          newBallCoords.push(cell);
        }
      } else {
        this.board.placeBall(new Ball(ball.color), ball.r, ball.c);
        newBallCoords.push({ r: ball.r, c: ball.c });
      }
    }
    this.nextBalls = [];
    return newBallCoords;
  }

  moveBall(start, end) {
    if (!this.board.getBall(start.r, start.c) || this.board.getBall(end.r, end.c)) {
      return null; // Invalid move
    }

    const path = this.board.findPath(start, end);
    if (path) {
      this.turnHistory.push({
        board: JSON.parse(JSON.stringify(this.board.grid)),
        score: this.score,
      });

      this.board.moveBall(start, end);
      const clearedBalls = this.board.findAndClearLines(end);

      if (clearedBalls.length > 0) {
        this.updateScore(clearedBalls.length);
        return { path, clearedBalls };
      }

      const newBalls = this.placeNewBalls();
      let allClearedAfterNew = new Set();
      for (const ball of newBalls) {
        const clearedAfterNew = this.board.findAndClearLines(ball);
        if (clearedAfterNew.length > 0) {
          clearedAfterNew.forEach(b => allClearedAfterNew.add(`${b.r},${b.c}`));
        }
      }

      if (allClearedAfterNew.size > 0) {
        this.updateScore(allClearedAfterNew.size);
      }

      this._generateNextBalls();
      return {
        path,
        clearedBalls: Array.from(allClearedAfterNew).map(key => {
          const [r, c] = key.split(",").map(Number);
          return { r, c };
        })
      };
    }
    return null; // No path
  }

  updateScore(clearedCount) {
    let scoreForLine = 10;
    for (let i = 6; i <= clearedCount; i++) {
        scoreForLine += i - 4;
    }
    this.score += scoreForLine;
  }

  clearBalls(coords) {
    this.board.clearBalls(coords);
  }

  isGameOver() {
    return this.board.getEmptyCells().length === 0;
  }

  undoMove() {
    if (this.turnHistory.length > 0) {
      const lastState = this.turnHistory.pop();
      // This is a simplified undo. A more robust implementation
      // would deserialize the board state into Ball objects.
      for (let r = 0; r < this.board.size; r++) {
        for (let c = 0; c < this.board.size; c++) {
          const ballData = lastState.board[r][c];
          this.board.grid[r][c] = ballData ? new Ball(ballData.color) : null;
        }
      }
      this.score = lastState.score;
    }
  }
}
