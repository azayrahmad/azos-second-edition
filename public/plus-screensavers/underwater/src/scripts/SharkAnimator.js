import ANIMATION_CONFIGS from "./configs.js";

/**
 * Manages the animation of shark fins (left and right) in a cycle.
 */
class SharkAnimator {
  /**
   * @param {HTMLElement} sharkFinRightElement The DOM element for the right-facing shark fin.
   * @param {HTMLElement} sharkFinLeftElement The DOM element for the left-facing shark fin.
   * @param {object} configs Configuration object for shark animations.
   */
  constructor(
    sharkFinRightElement,
    sharkFinLeftElement,
    configs = ANIMATION_CONFIGS.shark,
  ) {
    this.sharkFinRightElement = sharkFinRightElement;
    this.sharkFinLeftElement = sharkFinLeftElement;
    this.configs = configs;
    this.nextFinDirection = "right"; // Initialize the first direction
    this.animationTimeout = null;
  }

  /**
   * Generates a random delay between a specified minimum and maximum.
   * @param {number} min The minimum delay in seconds.
   * @param {number} max The maximum delay in seconds.\
   * @returns {number} A random delay in milliseconds.
   */
  static getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  }

  /**
   * Animates a single shark fin across the screen.
   * @param {HTMLElement} finElement The fin element to animate.
   * @param {"right" | "left"} direction The direction of the animation.
   * @returns {Promise<void>} A promise that resolves when the animation is complete.
   */
  animateFin(finElement, direction) {
    return new Promise((resolve) => {
      finElement.style.opacity = 1; // Make it visible
      let animationName = direction === "right" ? "swim-right" : "swim-left";
      finElement.style.animation = `${animationName} ${this.configs.swimDurationSeconds}s linear forwards`; // Use configured duration

      const onAnimationEnd = () => {
        finElement.style.opacity = 0; // Hide it after animation
        finElement.style.animation = ""; // Clear animation
        finElement.removeEventListener("animationend", onAnimationEnd);
        resolve();
      };
      finElement.addEventListener("animationend", onAnimationEnd);
    });
  }

  /**
   * Starts the continuous cycle of shark fin animations.
   * A random delay is introduced between each animation.
   */
  startCycle() {
    const delay = SharkAnimator.getRandomDelay(
      this.configs.minDelaySeconds,
      this.configs.maxDelaySeconds,
    );

    this.animationTimeout = setTimeout(async () => {
      if (this.nextFinDirection === "right") {
        await this.animateFin(this.sharkFinRightElement, "right");
      } else {
        await this.animateFin(this.sharkFinLeftElement, "left");
      }
      // Toggle the next direction
      this.nextFinDirection =
        this.nextFinDirection === "right" ? "left" : "right";
      this.startCycle(); // Start the next cycle after this animation ends
    }, delay);
  }

  /**
   * Stops the current shark fin animation cycle.
   */
  stopCycle() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    // Optionally hide fins immediately if they are visible
    this.sharkFinRightElement.style.opacity = 0;
    this.sharkFinRightElement.style.animation = "";
    this.sharkFinLeftElement.style.opacity = 0;
    this.sharkFinLeftElement.style.animation = "";
  }
}

export default SharkAnimator;
