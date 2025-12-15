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
  }

  _createWindow() {
    const win = new $Window({
      title: "Disk Defragmenter",
      outerWidth: 400,
      outerHeight: 300,
      resizable: true,
      id: "defrag",
    });

    const initialContent = `
      <div class="defrag-container">
        <div class="defrag-grid"></div>
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

    this._generateData();
    this._renderGrid();

    this.startButton.addEventListener("click", () => this._handleButtonClick());

    win.on("close", () => this._stopDefrag());

    return win;
  }

  _generateData() {
    this.data = [];
    for (let i = 0; i < 2000; i++) {
      this.data.push(Math.round(Math.random()));
    }
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

  _startDefrag() {
    if (this.isDefragging && !this.isPaused) return;

    if (!this.isDefragging) {
      // First start
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

    const unoptimizedBlock = this._findNextUnoptimizedBlock();
    if (!unoptimizedBlock) {
      this._completeDefrag();
      return;
    }

    let freeSlotsToFill = [];
    for (
      let i = 0;
      i < this.data.length && freeSlotsToFill.length < unoptimizedBlock.length;
      i++
    ) {
      if (this.data[i] === 0) {
        freeSlotsToFill.push(i);
      }
    }

    if (freeSlotsToFill.length < unoptimizedBlock.length) {
      this._completeDefrag();
      return;
    }

    this._highlightAndMove(unoptimizedBlock, freeSlotsToFill).then(() => {
      this.animationFrameId = requestAnimationFrame(() => this._defragStep());
    });
  }

  _completeDefrag() {
    this.isDefragging = false;
    this.isComplete = true;
    this.startButton.textContent = "Finished";
    this.startButton.disabled = true;
  }

  async _highlightAndMove(unoptimizedBlock, freeSlots) {
    const cells = this.gridContainer.children;
    const sourceIndices = [];
    const destIndices = [];

    for (let i = 0; i < unoptimizedBlock.length; i++) {
      const sourceIndex = unoptimizedBlock.start + i;
      const destIndex = freeSlots[i];
      sourceIndices.push(sourceIndex);
      destIndices.push(destIndex);
      cells[sourceIndex].classList.add("source");
      cells[destIndex].classList.add("destination");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (this.isDefragging) {
      // Check if process was stopped during delay
      for (let i = 0; i < unoptimizedBlock.length; i++) {
        const sourceIndex = sourceIndices[i];
        const destIndex = destIndices[i];

        this.data[destIndex] = 2;
        this.data[sourceIndex] = 0;

        this._updateCellClass(cells[destIndex], 2);
        this._updateCellClass(cells[sourceIndex], 0);
      }
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

  _findNextUnoptimizedBlock() {
    const start = this.data.indexOf(1);
    if (start === -1) return null;

    let end = start;
    while (end + 1 < this.data.length && this.data[end + 1] === 1) {
      end++;
    }
    return { start, end, length: end - start + 1 };
  }
}
