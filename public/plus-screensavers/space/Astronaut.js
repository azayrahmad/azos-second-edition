import SpaceObject from './SpaceObject.js';
import { CONFIG } from './config.js';

class Astronaut extends SpaceObject {
  constructor(element) {
    super(element, CONFIG.astronaut);
    this.currentImageIndex = 0;
    this.direction = 0; // 1: bottom-left to top-right, -1: top-right to bottom-left
    this.angleRadians = (this.config.angleDegrees * Math.PI) / 180;
    this.x = 0;
    this.y = 0;
  }

  loadInitialImage() {
    this.element.src = this.config.images[0]; // Set initial image to get dimensions
    return new Promise((resolve) => {
      if (this.element.complete && this.element.naturalWidth > 0) {
        resolve();
      } else {
        this.element.onload = resolve;
        this.element.onerror = () => {
          console.error("Failed to load Astronaut initial image.");
          resolve(); // Resolve anyway to avoid blocking other animations
        };
      }
    });
  }

  /**
   * Sets the astronaut's position and direction for a new cycle (initial or ping-pong).
   * @param {boolean} [isInitialSetup=false] - True if this is the very first setup.
   */
  resetPosition(isInitialSetup = false) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const minEdgeOffset = this.config.minEdgeOffset;

    if (!isInitialSetup) {
      this.direction *= -1; // Toggle direction for ping-pong
    } else {
      this.direction = Math.random() < 0.5 ? 1 : -1; // Randomly decide initial direction
    }

    // Cycle through astronaut images
    this.currentImageIndex = (this.currentImageIndex + 1) % this.config.images.length;
    this.element.src = this.config.images[this.currentImageIndex];

    this.element.style.display = "block"; // Make visible temporarily to get accurate dimensions if it was hidden

    const astronautWidth = this.element.offsetWidth;
    const astronautHeight = this.element.offsetHeight;

    if (this.direction === 1) {
      // Moving BL-TR, so start from bottom or left
      if (Math.random() < 0.5) {
        // Start from bottom edge
        this.x =
          Math.random() * (windowWidth - astronautWidth - minEdgeOffset * 2) +
          minEdgeOffset;
        this.y = windowHeight; // Fully off-screen below
      } else {
        // Start from left edge
        this.x = -astronautWidth; // Fully off-screen left
        this.y =
          Math.random() * (windowHeight - astronautHeight - minEdgeOffset * 2) +
          minEdgeOffset;
      }
    } else {
      // Moving TR-BL, so start from top or right
      if (Math.random() < 0.5) {
        // Start from top edge
        this.x =
          Math.random() * (windowWidth - astronautWidth - minEdgeOffset * 2) +
          minEdgeOffset;
        this.y = -astronautHeight; // Fully off-screen above
      } else {
        // Start from right edge
        this.x = windowWidth; // Fully off-screen right
        this.y =
          Math.random() * (windowHeight - astronautHeight - minEdgeOffset * 2) +
          minEdgeOffset;
      }
    }
  }

  updatePosition() {
    let dx;
    let dy;

    if (this.direction === 1) {
      // Moving bottom-left to top-right
      dx = this.config.speed * Math.cos(this.angleRadians);
      dy = -this.config.speed * Math.sin(this.angleRadians); // Negative for moving up
    } else {
      // Moving top-right to bottom-left
      dx = -this.config.speed * Math.cos(this.angleRadians);
      dy = this.config.speed * Math.sin(this.angleRadians); // Positive for moving down
    }

    this.x += dx;
    this.y += dy;
  }

  render() {
    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;
  }

  checkOffScreen() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const astronautWidth = this.element.offsetWidth;
    const astronautHeight = this.element.offsetHeight;

    if (this.direction === 1) {
      // Moving bottom-left to top-right, off-screen when top or right edge goes past viewport
      return this.x > windowWidth || this.y < -astronautHeight;
    } else {
      // Moving top-right to bottom-left, off-screen when bottom or left edge goes past viewport
      return this.x < -astronautWidth || this.y > windowHeight;
    }
  }
}

export default Astronaut;
