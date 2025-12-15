import { Application } from "../Application.js";

export class DefragApp extends Application {
  constructor(config) {
    super(config);
    this.data = [];
    this.gridContainer = null;
    this.startButton = null;
    this.isDefragging = false;
    this.isPaused = false;
    this.isComplete = false;
    this.animationFrameId = null;
    this.win = null;
    this.progressInfo = null;
    this.progressText = null;
    this.progressBar = null;
    this.progressPercent = null;
  }

  _createWindow() {
    const win = new $Window({
      title: "Disk Defragmenter",
      outerWidth: 400,
      outerHeight: 350,
      resizable: true,
      id: "defrag",
    });

    const initialContent = `
      <div class="defrag-container">
        <div class="defrag-grid"></div>
        <div class="progress-info">
          <div class="progress-text" style="visibility: hidden;"></div>
          <div class="progress-indicator segmented">
            <span class="progress-indicator-bar" style="width: 0%;"></span>
          </div>
          <div class="progress-percent" style="visibility: hidden;"></div>
        </div>
        <div class="defrag-controls">
          <button class="start-button">Start</button>
        </div>
      </div>
    `;
    win.$content.append(initialContent);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "src/apps/defrag/defrag.css";
    document.head.appendChild(link);

    this.gridContainer = win.$content.find(".defrag-grid")[0];
    this.startButton = win.$content.find(".start-button")[0];
    this.progressInfo = win.$content.find(".progress-info")[0];
    this.progressText = win.$content.find(".progress-text")[0];
    this.progressBar = win.$content.find(".progress-indicator-bar")[0];
    this.progressPercent = win.$content.find(".progress-percent")[0];

    this.startButton.addEventListener("click", () => this._handleButtonClick());

    win.on("close", () => this._stopDefrag());

    return win;
  }

  _updateProgress(text, percentage) {
    this.progressText.textContent = text;
    this.progressBar.style.width = `${percentage}%`;
    this.progressPercent.textContent = `${Math.floor(percentage)}% Complete`;
  }

  _showProgress() {
    this.progressText.style.visibility = "visible";
    this.progressPercent.style.visibility = "visible";
  }

  _hideProgress() {
    this.progressText.style.visibility = "hidden";
    this.progressPercent.style.visibility = "hidden";
  }

  async _generateData() {
    this.data = [];
    this._showProgress();
    const totalSteps = 2000;

    for (let i = 0; i < totalSteps; i++) {
      const percentage = (i / totalSteps) * 5;
      this._updateProgress("Reading drive information...", percentage);

      var diskStatus = Math.round(Math.random() * 2) > 0 ? 1 : 0;
      for (let j = 0; j < 10; j++) {
        this.data.push(diskStatus);
      }

      if (i % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    this._updateProgress("Reading drive information...", 5);
  }

  _renderGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.data.length; i++) {
      const cell = this._createCell(i);
      fragment.appendChild(cell);
    }
    this.gridContainer.appendChild(fragment);
  }

  _createCell(index) {
    const value = this.data[index];
    const cell = document.createElement("div");
    cell.className = "defrag-cell";
    cell.dataset.index = index;
    this._updateCellClass(cell, value);
    return cell;
  }

  _updateCellClass(cell, value) {
    cell.classList.remove(
      "free",
      "unoptimized",
      "optimized",
      "source",
      "destination",
    );
    if (value === 0) cell.classList.add("free");
    else if (value === 1) cell.classList.add("unoptimized");
    else if (value === 2) cell.classList.add("optimized");
  }

  _handleButtonClick() {
    if (this.isComplete) return;

    if (this.isDefragging) {
      this._stopDefrag();
      this.startButton.textContent = "Start";
    } else {
      this._startDefrag();
      this.startButton.textContent = "Stop";
    }
  }

  async _startDefrag() {
    if (this.isDefragging && !this.isPaused) return;

    if (!this.isDefragging) {
      // First start
      await this._generateData();
      this._renderGrid();
      this._optimizeInitialBlock();
      this._renderGrid();
    }

    this.isDefragging = true;
    this.isPaused = false;
    this.animationFrameId = requestAnimationFrame(() => this._defragStep());
  }

  _stopDefrag() {
    this.isDefragging = false;
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  _defragStep() {
    if (!this.isDefragging) return;

    const move = this._analyzeDiskForNextMove();

    if (!move) {
      this._completeDefrag();
      return;
    }

    const freeStart = this.data.indexOf(0);
    const progress = 5 + (freeStart / this.data.length) * 95;
    this._updateProgress("Defragmenting file system...", progress);

    this._highlightAndMove(move.source, move.destination).then(() => {
      this.animationFrameId = requestAnimationFrame(() => this._defragStep());
    });
  }

  _completeDefrag() {
    this.isDefragging = false;
    this.isComplete = true;
    this.startButton.textContent = "Finished";
    this.startButton.disabled = true;
    this._updateProgress("Defragmentation complete.", 100);
  }

  async _highlightAndMove(sourceBlock, destinationBlock) {
    const cells = this.gridContainer.children;

    // Highlight source cells in green
    for (let i = 0; i < sourceBlock.length; i++) {
      if (!this.isDefragging) return;
      const sourceIndex = sourceBlock.start + i;
      cells[sourceIndex].classList.add("source");
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!this.isDefragging) return;

    // Make the source empty first, all at once.
    for (let i = 0; i < sourceBlock.length; i++) {
      if (!this.isDefragging) return;
      const sourceIndex = sourceBlock.start + i;
      this.data[sourceIndex] = 0;
      this._updateCellClass(cells[sourceIndex], 0);
    }

    // After that, move to the destination cells one by one.
    for (let i = 0; i < destinationBlock.length; i++) {
      if (!this.isDefragging) return;
      const destIndex = destinationBlock.start + i;
      const cell = cells[destIndex];

      // 1. make it red
      cell.classList.add("destination");
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!this.isDefragging) return;

      // 2. make it cyan first (unoptimized)
      this.data[destIndex] = 1;
      this._updateCellClass(cell, 1);
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!this.isDefragging) return;
    }

    for (let i = 0; i < destinationBlock.length; i++) {
      // 3. mark as blue (optimized)
      const destIndex = destinationBlock.start + i;
      const cell = cells[destIndex];
      this.data[destIndex] = 2;
      this._updateCellClass(cell, 2);
    }
  }

  _optimizeInitialBlock() {
    const firstFree = this.data.indexOf(0);
    const limit = firstFree === -1 ? this.data.length : firstFree;

    for (let i = 0; i < limit; i++) {
      if (this.data[i] === 1) {
        this.data[i] = 2;
      }
    }
  }

  _analyzeDiskForNextMove() {
    // Find the first contiguous block of free space.
    const freeStart = this.data.indexOf(0);
    if (freeStart === -1) return null; // No free space, defrag is done.

    let freeEnd = freeStart;
    while (freeEnd + 1 < this.data.length && this.data[freeEnd + 1] === 0) {
      freeEnd++;
    }
    const freeLength = freeEnd - freeStart + 1;

    // Find the first contiguous block of unoptimized data *after* the free space.
    let unoptimizedStart = -1;
    for (let i = freeEnd + 1; i < this.data.length; i++) {
      if (this.data[i] === 1) {
        unoptimizedStart = i;
        break;
      }
    }
    if (unoptimizedStart === -1) return null; // No more unoptimized blocks to move.

    let unoptimizedEnd = unoptimizedStart;
    while (
      unoptimizedEnd + 1 < this.data.length &&
      this.data[unoptimizedEnd + 1] === 1
    ) {
      unoptimizedEnd++;
    }
    const unoptimizedLength = unoptimizedEnd - unoptimizedStart + 1;

    // Determine the number of cells to move.
    const moveLength = Math.min(freeLength, unoptimizedLength);

    return {
      source: { start: unoptimizedStart, length: moveLength },
      destination: { start: freeStart, length: moveLength },
    };
  }
}
