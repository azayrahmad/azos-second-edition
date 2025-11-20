import SpaceObject from './SpaceObject.js';
import { CONFIG } from './config.js';

class HubbleTelescope extends SpaceObject {
  constructor(element) {
    super(element, CONFIG.hubble);
    this.bottom = 0;
    this.right = 0;
  }

  loadInitialImage() {
    return new Promise((resolve) => {
      if (this.element.complete && this.element.naturalWidth > 0) {
        resolve();
      } else {
        this.element.onload = resolve;
        this.element.onerror = () => {
          console.error("Failed to load Hubble image.");
          resolve(); // Resolve anyway to avoid blocking other animations
        };
      }
    });
  }

  /**
   * Sets Hubble's starting position randomly on the bottom or right edge.
   */
  resetPosition() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const minEdgeOffset = this.config.minEdgeOffset;

    // Randomly choose to start from the bottom edge or the right edge
    if (Math.random() < 0.5) {
      // Start from bottom edge (hubbleBottom = -hubbleHeight means it's fully off-screen below)
      this.bottom = -this.element.offsetHeight;

      const maxAllowedRight = windowWidth - this.element.offsetWidth - minEdgeOffset;
      const minPossibleRight = -this.element.offsetWidth;
      const actualMaxRight = Math.max(minPossibleRight, maxAllowedRight);

      this.right = Math.floor(
        Math.random() * (actualMaxRight - minPossibleRight + 1),
      ) + minPossibleRight;
    } else {
      // Start from right edge (hubbleRight = -hubbleWidth means it's fully off-screen to the right)
      this.right = -this.element.offsetWidth;

      const maxAllowedBottom = windowHeight - this.element.offsetHeight - minEdgeOffset;
      const minPossibleBottom = -this.element.offsetHeight;
      const actualMaxBottom = Math.max(minPossibleBottom, maxAllowedBottom);

      this.bottom = Math.floor(
        Math.random() * (actualMaxBottom - minPossibleBottom + 1),
      ) + minPossibleBottom;
    }
  }

  updatePosition() {
    this.bottom += this.config.speed;
    this.right += this.config.speed;
  }

  render() {
    this.element.style.bottom = `${this.bottom}px`;
    this.element.style.right = `${this.right}px`;
  }

  checkOffScreen() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // It's off-screen when its bottom is above the viewport (hubbleBottom > windowHeight)
    // or its right is to the left of the viewport (hubbleRight > windowWidth)
    return this.bottom > windowHeight || this.right > windowWidth;
  }
}

export default HubbleTelescope;
