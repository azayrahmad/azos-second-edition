export const tipOfTheDayContent = `
  <div class="tip-of-the-day-content">
    <div style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
      <div style="display: flex; flex: 1;">
        <div style="margin-right: 16px; padding: 20px 0 20px 20px;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iY3VycmVudENvbG9yIiBjbGFzcz0iYmkgYmktbGlnaHRidWxiIiB2aWV3Qm94PSIwIDAgMTYgMTYiPiA8cGF0aCBkPSJNMiA2YTYgNiAwIDEgMSAxMC4xNzQgNC4zMWMtLjIwMy4xOTYtLjM1OS40LS40NTMuNjE5bC0uNzYyIDEuNzY5QS41LjUgMCAwIDEgMTAuNSAxM2EuNS41IDAgMCAxIDAgMSAuNS41IDAgMCAxIDAgMWwtLjIyNC40NDdhMSAxIDAgMCAxLS44OTQuNTUzSDYuNjE4YTEgMSAwIDAgMS0uODk0LS41NTNMNS41IDE1YS41LjUgMCAwIDEgMC0xIC41LjUgMCAwIDEgMC0xIC41LjUgMCAwIDEtLjQ2LS4zMDJsLS43NjEtMS43N2EyIDIgMCAwIDAtLjQ1My0uNjE4QTUuOTggNS45OCAwIDAgMSAyIDZtNi01YTUgNSAwIDAgMC0zLjQ3OSA4LjU5MmMuMjYzLjI1NC41MTQuNTY0LjY3Ni45NDFMNS44MyAxMmg0LjM0MmwuNjMyLTEuNDY3Yy4xNjItLjM3Ny40MTMtLjY4Ny42NzYtLjk0MUE1IDUgMCAwIDAgOCAxIi8+IDwvc3ZnPg==" alt="Lightbulb Icon" width="32" height="32">
        </div>
        <div style="flex-grow: 1; display: flex; flex-direction: column;">
            <p><strong>Did you know...</strong></p>
            <div class="sunken-panel" style="padding: 8px; flex: 1;">
                <p id="tip-text">You can scroll text up one screen by pressing Page Up. Pressing Page Down scrolls text down one screen.</p>
            </div>
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div class="field-row">
            <input type="checkbox" id="show-tips">
            <label for="show-tips">Show tips at startup</label>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="default" id="next-tip">Next Tip</button>
            <button onclick="this.closest('.window').close()">Close</button>
        </div>
      </div>
    </div>
  </div>
`;

export function setup(contentElement) {
  const tips = [
    "You can scroll text up one screen by pressing Page Up. Pressing Page Down scrolls text down one screen.",
    "To open a file, click the File menu, and then click Open.",
    "To save a file, click the File menu, and then click Save.",
    "You can switch between open windows by pressing Alt+Tab.",
    "To close a window, click the X in the top-right corner."
  ];

  let currentTipIndex = 0;

  const tipTextElement = contentElement.querySelector('#tip-text');
  const nextTipButton = contentElement.querySelector('#next-tip');

  if (nextTipButton && tipTextElement) {
    nextTipButton.addEventListener('click', () => {
      currentTipIndex = (currentTipIndex + 1) % tips.length;
      tipTextElement.textContent = tips[currentTipIndex];
    });
  }
}