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
    this.placeNewBalls(5);
  }

  placeNewBalls(count) {
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

  moveBall(start, end) {
    if (!this.board.getBall(start.r, start.c) || this.board.getBall(end.r, end.c)) {
      return false; // Invalid move
    }

    if (this.board.isPathAvailable(start, end)) {
      this.turnHistory.push({
        board: JSON.parse(JSON.stringify(this.board.grid)),
        score: this.score,
      });

      this.board.moveBall(start, end);
      const clearedCount = this.board.findAndClearLines(end);

      if (clearedCount > 0) {
        this.updateScore(clearedCount);
      } else {
        const newBalls = this.placeNewBalls(3);
        for (const ball of newBalls) {
          const clearedCountAfterNew = this.board.findAndClearLines(ball);
          if (clearedCountAfterNew > 0) {
            this.updateScore(clearedCountAfterNew);
          }
        }
      }
      return true; // Move successful
    }
    return false; // No path
  }

  updateScore(clearedCount) {
    let scoreForLine = 10;
    for (let i = 6; i <= clearedCount; i++) {
        scoreForLine += i - 4;
    }
    this.score += scoreForLine;
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
