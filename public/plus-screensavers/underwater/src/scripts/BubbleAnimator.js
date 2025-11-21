/**
 * Manages the animation of a single bubble element.
import ANIMATION_CONFIGS from "./configs.js"; // Import the configs

/**
 * Manages the animation of a single bubble element.
 */
class BubbleAnimator {
  /**
   * @param {HTMLElement} bubbleElement The DOM element representing the bubble.
   * @param {object} configs Configuration object for bubble animations.
   */
  constructor(bubbleElement, configs = ANIMATION_CONFIGS.bubble) {
    this.bubbleElement = bubbleElement;
    this.configs = configs;
    this.animationTimeout = null;
  }

  /**
   * Generates a random delay between a specified minimum and maximum.
   * @param {number} min The minimum delay in seconds.
   * @param {number} max The maximum delay in seconds.
   * @returns {number} A random delay in milliseconds.
   */
  static getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  }

  /**
   * Starts the CSS animation for the bubble element.
   * Triggers a reflow to restart the animation if it was already running.
   */
  animate() {
    this.bubbleElement.classList.remove("animate"); // Reset animation
    void this.bubbleElement.offsetWidth; // Trigger reflow to restart animation
    this.bubbleElement.classList.add("animate"); // Start animation
  }

  /**
   * Starts the animation cycle for the bubble, scheduling its animation
   * with a random delay and then rescheduling itself.
   */
  startCycle() {
    const delay = BubbleAnimator.getRandomDelay(
      this.configs.minDelaySeconds,
      this.configs.maxDelaySeconds,
    );
    this.animationTimeout = setTimeout(() => {
      this.animate();
      this.startCycle(); // Reschedule itself immediately after animation
    }, delay);
  }

  /**
   * Stops the current animation cycle for the bubble.
   */
  stopCycle() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    this.bubbleElement.classList.remove("animate"); // Ensure animation class is removed
  }
}

export default BubbleAnimator;
