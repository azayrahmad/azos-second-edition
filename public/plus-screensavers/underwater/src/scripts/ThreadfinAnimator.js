import ANIMATION_CONFIGS from "./configs.js";

/**
 * Manages the animation cycle of the threadfin element.
 */
class ThreadfinAnimator {
  /**
   * @param {HTMLElement} threadfinElement The DOM element representing the threadfin.
   * @param {object} configs Configuration object for threadfin animations.
   */
  constructor(threadfinElement, configs = ANIMATION_CONFIGS.threadfin) {
    this.threadfinElement = threadfinElement;
    this.configs = configs;
    this.animationCycleTimeout = null;
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
   * Waits for a specified CSS animation to end on an element.
   * @param {HTMLElement} element The element to listen for animation end on.
   * @param {string} animationName The name of the CSS animation to wait for.
   * @returns {Promise<void>} A promise that resolves when the specified animation ends.
   */
  waitForAnimationEnd(element, animationName) {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.animationName === animationName) {
          element.removeEventListener("animationend", handler);
          resolve();
        }
      };
      element.addEventListener("animationend", handler);
    });
  }

  /**
   * Starts the continuous animation cycle for the threadfin.
   * The threadfin moves from right to left, then left to right, with random delays.
   */
  async startCycle() {
    // Hide initially and clear any previous styles
    this.threadfinElement.style.display = "none";
    this.threadfinElement.style.animation = "";
    this.threadfinElement.style.transform = "";

    // Random initial wait before the first movement
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        ThreadfinAnimator.getRandomDelay(
          this.configs.minDelaySeconds,
          this.configs.maxDelaySeconds,
        ),
      ),
    );

    // Phase 1: Move from top-left to bottom-right (right-facing)
    this.threadfinElement.style.display = "block"; // Show the fish
    this.threadfinElement.style.transform = ""; // Ensure no flip for right movement

    // Set CSS custom properties for animation path
    this.threadfinElement.style.setProperty(
      "--start-x",
      `${this.configs.startPositions.right.startX}vw`,
    );
    this.threadfinElement.style.setProperty(
      "--start-y",
      `${this.configs.startPositions.right.startY}vh`,
    );
    this.threadfinElement.style.setProperty(
      "--end-x",
      `${this.configs.startPositions.right.endX}vw`,
    );
    this.threadfinElement.style.setProperty(
      "--end-y",
      `${this.configs.startPositions.right.endY}vh`,
    );

    this.threadfinElement.style.animation = `threadfin-swim ${this.configs.swimSpriteDurationSeconds}s steps(${this.configs.swimSpriteSteps}) infinite, move-right-30deg ${this.configs.swimPathDurationSeconds}s linear forwards`;

    await this.waitForAnimationEnd(this.threadfinElement, "move-right-30deg");

    this.threadfinElement.style.animation = ""; // Clear animation after movement
    this.threadfinElement.style.display = "none"; // Hide after exiting

    // Random wait before next movement
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        ThreadfinAnimator.getRandomDelay(
          this.configs.minDelaySeconds,
          this.configs.maxDelaySeconds,
        ),
      ),
    );

    // Phase 2: Move from top-right to bottom-left (left-facing, flipped)
    this.threadfinElement.style.display = "block"; // Show the fish
    this.threadfinElement.style.transform = `scaleX(-1)`; // Flip for left movement

    // Set CSS custom properties for animation path
    this.threadfinElement.style.setProperty(
      "--start-x",
      `${this.configs.startPositions.left.startX}vw`,
    );
    this.threadfinElement.style.setProperty(
      "--start-y",
      `${this.configs.startPositions.left.startY}vh`,
    );
    this.threadfinElement.style.setProperty(
      "--end-x",
      `${this.configs.startPositions.left.endX}vw`,
    );
    this.threadfinElement.style.setProperty(
      "--end-y",
      `${this.configs.startPositions.left.endY}vh`,
    );

    this.threadfinElement.style.animation = `threadfin-swim ${this.configs.swimSpriteDurationSeconds}s steps(${this.configs.swimSpriteSteps}) infinite, move-left-30deg ${this.configs.swimPathDurationSeconds}s linear forwards`;

    await this.waitForAnimationEnd(this.threadfinElement, "move-left-30deg");

    this.threadfinElement.style.animation = ""; // Clear animation after movement
    this.threadfinElement.style.display = "none"; // Hide after exiting
    this.threadfinElement.style.transform = ""; // Reset transform including flip

    // Repeat the cycle
    this.startCycle();
  }

  /**
   * Stops the current threadfin animation cycle.
   * Clears any scheduled timeouts and hides the threadfin.
   */
  stopCycle() {
    if (this.animationCycleTimeout) {
      clearTimeout(this.animationCycleTimeout);
      this.animationCycleTimeout = null;
    }
    this.threadfinElement.style.display = "none";
    this.threadfinElement.style.animation = "";
    this.threadfinElement.style.transform = "";
  }
}

export default ThreadfinAnimator;
