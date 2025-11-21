class SpaceObject {
  constructor(element, config) {
    if (!element) {
      console.warn("SpaceObject: Element not provided.");
    }
    this.element = element;
    this.config = config;
    this.isAnimating = false;
    this.animationFrameId = null;
  }

  /**
   * Abstract method to load the initial image for the object.
   * Should return a Promise that resolves when the image is loaded.
   */
  loadInitialImage() {
    return Promise.resolve(); // Default no-op
  }

  /**
   * Abstract method to set the object's initial position or reset it for a new cycle.
   * @param {boolean} [isInitialSetup=false] - True if this is the very first setup.
   */
  resetPosition(isInitialSetup = false) {
    throw new Error("resetPosition() must be implemented by subclass");
  }

  /**
   * Abstract method to update the object's position based on its speed and direction.
   */
  updatePosition() {
    throw new Error("updatePosition() must be implemented by subclass");
  }

  /**
   * Abstract method to apply the current position to the element's style.
   */
  render() {
    throw new Error("render() must be implemented by subclass");
  }

  /**
   * Abstract method to check if the object has moved completely off-screen.
   * @returns {boolean} - True if off-screen, false otherwise.
   */
  checkOffScreen() {
    throw new Error("checkOffScreen() must be implemented by subclass");
  }

  /**
   * Starts the animation loop for the object.
   */
  startAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this._animate();
  }

  /**
   * Stops the animation loop for the object.
   */
  stopAnimation() {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * The core animation loop using requestAnimationFrame.
   * Handles position updates, rendering, and off-screen checks.
   */
  _animate() {
    if (!this.isAnimating) {
      return;
    }

    this.updatePosition();
    this.render();

    if (this.checkOffScreen()) {
      this.stopAnimation(); // Pause animation
      // After a delay, reset position and restart animation for a new cycle
      setTimeout(() => {
        this.resetPosition();
        this.startAnimation();
      }, this.config.delayAfterOffscreen);
    } else {
      this.animationFrameId = requestAnimationFrame(() => this._animate());
    }
  }
}

export default SpaceObject;
