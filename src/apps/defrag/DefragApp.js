import { Application } from '../Application.js';
import './defrag.css';

const BLOCK_SIZE = 11; // 10px block + 1px gap
const SIMULATION_SPEED_MS = 1;

const BLOCK_STATE = {
  FREE: 0,
  FRAGMENTED: 1,
  UNMOVABLE: 2,
  READING: 3,
  WRITING: 4,
};

const STATE_TO_CLASS = {
  [BLOCK_STATE.FREE]: 'block-free',
  [BLOCK_STATE.FRAGMENTED]: 'block-fragmented',
  [BLOCK_STATE.UNMOVABLE]: 'block-unmovable',
  [BLOCK_STATE.READING]: 'block-reading',
  [BLOCK_STATE.WRITING]: 'block-writing',
};

export class DefragApp extends Application {
  diskData = [];
  gridContainer = null;
  resizeObserver = null;

  isAnalyzing = false;
  isDefragging = false;
  isPaused = false;
  stopRequested = false;

  _createWindow() {
    const win = new window.$Window({
      title: 'Defragmenting Drive C',
      width: 500,
      height: 400,
      resizable: true,
      minWidth: 300,
      minHeight: 200,
      id: this.id,
    });

    win.$content.html(`
      <div class="defrag-app">
        <div class="defrag-grid-container inset-deep"></div>
        <div class="status-bar">
          <div class="status-text">Ready</div>
        </div>
        <div class="progress-bar inset-deep">
          <div class="progress" style="width: 0%"></div>
        </div>
        <div class="control-panel">
          <button class="start-button">Start</button>
          <button class="pause-button" disabled>Pause</button>
          <button class="stop-button" disabled>Stop</button>
        </div>
      </div>
    `);

    this.win = win;
    this.gridContainer = this.win.$content.find('.defrag-grid-container')[0];

    // Hardcode data and render synchronously
    this.diskData = Array.from({ length: 2000 }, (_, i) => i % 3);
    this.renderGrid();

    return win;
  }

  async _onLaunch() {
    this.bindControlEvents();

    this.resizeObserver = new ResizeObserver(() => this.renderGrid());
    this.resizeObserver.observe(this.gridContainer);

    this.win.on('closed', () => {
        this.stopRequested = true;
        this.resizeObserver.disconnect();
    });
  }

  bindControlEvents() {
      const startButton = this.win.$content.find('.start-button')[0];
      const pauseButton = this.win.$content.find('.pause-button')[0];
      const stopButton = this.win.$content.find('.stop-button')[0];

      startButton.addEventListener('click', () => {
          this.generateDiskData(); // Regenerate random data on start
          this.renderGrid();
          this.updateUIForStart();
          this.startDefrag();
      });

      pauseButton.addEventListener('click', () => {
          this.isPaused = !this.isPaused;
          pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
      });

      stopButton.addEventListener('click', () => {
          this.stopRequested = true;
      });
  }

  generateDiskData() {
    this.diskData = Array.from({ length: 2000 }, () => {
      const rand = Math.random();
      if (rand < 0.4) return BLOCK_STATE.FRAGMENTED;
      if (rand < 0.8) return BLOCK_STATE.FREE;
      return BLOCK_STATE.UNMOVABLE;
    });
  }

  renderGrid() {
    if (!this.gridContainer) return;

    const { width, height } = this.gridContainer.getBoundingClientRect();
    if (width === 0 || height === 0) {
      // If we're here, it means the container isn't visible yet.
      // We'll rely on the ResizeObserver to trigger a render when it is.
      return;
    }

    const fragment = document.createDocumentFragment();
    const columns = Math.floor(width / BLOCK_SIZE);
    const visibleBlocks = Math.floor(width / BLOCK_SIZE) * Math.floor(height / BLOCK_SIZE);

    this.gridContainer.style.gridTemplateColumns = `repeat(${columns}, 10px)`;
    this.gridContainer.innerHTML = '';

    for (let i = 0; i < visibleBlocks && i < this.diskData.length; i++) {
        const blockState = this.diskData[i];
        const block = document.createElement('div');
        block.className = `block ${STATE_TO_CLASS[blockState] || ''}`;
        fragment.appendChild(block);
    }
    this.gridContainer.appendChild(fragment);
  }

  async startDefrag() {
    if (this.isDefragging) return;

    await this.analyze();
    if (this.stopRequested) {
        this.resetState();
        return;
    }

    this.isDefragging = true;
    this.isPaused = false;
    this.stopRequested = false;

    this.defragLoop();
  }

  async analyze() {
      this.isAnalyzing = true;
      const progressEl = this.win.$content.find('.progress')[0];
      const statusTextEl = this.win.$content.find('.status-text')[0];

      for (let i = 0; i <= 100; i++) {
          if (this.stopRequested) break;
          statusTextEl.textContent = `Analyzing... ${i}%`;
          progressEl.style.width = `${i}%`;
          await new Promise(r => setTimeout(r, 10));
      }

      this.isAnalyzing = false;
      if (!this.stopRequested) {
        statusTextEl.textContent = 'Analysis complete.';
      }
  }

  async defragLoop() {
    const statusTextEl = this.win.$content.find('.status-text')[0];
    const progressEl = this.win.$content.find('.progress')[0];
    const initialFragmentedCount = this.diskData.filter(b => b === BLOCK_STATE.FRAGMENTED).length;
    let consolidatedBlocks = 0;

    let freePtr = 0;
    let fragmentedPtr = this.diskData.length - 1;

    while (freePtr < fragmentedPtr && !this.stopRequested) {
        if (this.isPaused) {
            statusTextEl.textContent = 'Paused';
            await new Promise(r => setTimeout(r, 100));
            continue;
        }

        while (this.diskData[freePtr] !== BLOCK_STATE.FREE && freePtr < fragmentedPtr) {
            freePtr++;
        }
        while (this.diskData[fragmentedPtr] !== BLOCK_STATE.FRAGMENTED && freePtr < fragmentedPtr) {
            fragmentedPtr--;
        }

        if (freePtr < fragmentedPtr) {
            this.diskData[fragmentedPtr] = BLOCK_STATE.READING;
            this.diskData[freePtr] = BLOCK_STATE.WRITING;
            this.renderGrid();
            await new Promise(r => setTimeout(r, SIMULATION_SPEED_MS));

            this.diskData[freePtr] = BLOCK_STATE.FRAGMENTED;
            this.diskData[fragmentedPtr] = BLOCK_STATE.FREE;
            this.renderGrid();

            consolidatedBlocks++;
            const percentComplete = initialFragmentedCount > 0 ? (consolidatedBlocks / initialFragmentedCount) * 100 : 100;
            progressEl.style.width = `${percentComplete}%`;
            statusTextEl.textContent = `Defragmenting... ${Math.round(percentComplete)}% Complete`;
        }
    }

    if (!this.stopRequested) {
        statusTextEl.textContent = 'Defragmentation complete.';
        progressEl.style.width = '100%';
    }
    this.resetState();
  }

  resetState() {
      this.isDefragging = false;
      this.isAnalyzing = false;
      this.isPaused = false;
      this.stopRequested = false;

      const startButton = this.win.$content.find('.start-button')[0];
      const pauseButton = this.win.$content.find('.pause-button')[0];
      const stopButton = this.win.$content.find('.stop-button')[0];
      const statusTextEl = this.win.$content.find('.status-text')[0];
      const progressEl = this.win.$content.find('.progress')[0];

      startButton.disabled = false;
      pauseButton.disabled = true;
      stopButton.disabled = true;
      pauseButton.textContent = 'Pause';
      statusTextEl.textContent = 'Ready';
      progressEl.style.width = '0%';
  }

  updateUIForStart() {
      const startButton = this.win.$content.find('.start-button')[0];
      const pauseButton = this.win.$content.find('.pause-button')[0];
      const stopButton = this.win.$content.find('.stop-button')[0];

      startButton.disabled = true;
      pauseButton.disabled = false;
      stopButton.disabled = false;
  }
}
