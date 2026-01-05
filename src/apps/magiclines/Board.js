import { Ball } from './Ball.js';

export class Board {
  constructor(size = 9) {
    this.size = size;
    this.grid = Array(size).fill(null).map(() => Array(size).fill(null));
  }

  getBall(r, c) {
    return this.grid[r][c];
  }

  placeBall(ball, r, c) {
    if (this.grid[r][c] === null) {
      this.grid[r][c] = ball;
      return true;
    }
    return false;
  }

  moveBall(start, end) {
    if (this.grid[start.r][start.c] && !this.grid[end.r][end.c]) {
      this.grid[end.r][end.c] = this.grid[start.r][start.c];
      this.grid[start.r][start.c] = null;
      return true;
    }
    return false;
  }

  clearBall(r, c) {
    this.grid[r][c] = null;
  }

  findPath(start, end) {
    const queue = [[start]];
    const visited = new Set([`${start.r},${start.c}`]);

    while (queue.length > 0) {
      const path = queue.shift();
      const { r, c } = path[path.length - 1];

      if (r === end.r && c === end.c) {
        return path; // Path found
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
          nr >= 0 &&
          nr < this.size &&
          nc >= 0 &&
          nc < this.size &&
          !visited.has(key) &&
          this.grid[nr][nc] === null
        ) {
          visited.add(key);
          const newPath = [...path, neighbor];
          queue.push(newPath);
        }
      }
    }
    return null; // No path found
  }

  findAndClearLines(coords) {
    const ball = this.getBall(coords.r, coords.c);
    if (!ball) return 0;
    const color = ball.color;

    const directions = [
      { r: 0, c: 1 }, // Horizontal
      { r: 1, c: 0 }, // Vertical
      { r: 1, c: 1 }, // Diagonal /
      { r: 1, c: -1 }, // Diagonal \
    ];

    const ballsToRemove = new Set();
    ballsToRemove.add(`${coords.r},${coords.c}`);

    for (const dir of directions) {
      const line = [{ ...coords }];
      // Check in the positive direction
      for (let i = 1; i < this.size; i++) {
        const r = coords.r + i * dir.r;
        const c = coords.c + i * dir.c;
        const currentBall = r >= 0 && r < this.size && c >= 0 && c < this.size ? this.getBall(r, c) : null;
        if (currentBall && currentBall.color === color) {
          line.push({ r, c });
        } else {
          break;
        }
      }
      // Check in the negative direction
      for (let i = 1; i < this.size; i++) {
        const r = coords.r - i * dir.r;
        const c = coords.c - i * dir.c;
        const currentBall = r >= 0 && r < this.size && c >= 0 && c < this.size ? this.getBall(r, c) : null;
        if (currentBall && currentBall.color === color) {
          line.push({ r, c });
        } else {
          break;
        }
      }

      if (line.length >= 5) {
        line.forEach((ball) => ballsToRemove.add(`${ball.r},${ball.c}`));
      }
    }

    if (ballsToRemove.size >= 5) {
      ballsToRemove.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        this.clearBall(r, c);
      });
      return ballsToRemove.size;
    }

    return 0;
  }

  getEmptyCells() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }
    return emptyCells;
  }
}
