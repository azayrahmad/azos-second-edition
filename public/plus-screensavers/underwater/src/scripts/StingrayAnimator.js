import { getRandomDelay, waitForAnimationEnd } from "./animationUtils.js";

/**
 * Manages the animation cycle of the stingray element.
 */
class StingrayAnimator {
  /**
   * @param {HTMLElement} element The DOM element representing the stingray.
   * @param {object} configs Configuration object for stingray animations.
   */
  constructor(element, configs) {
    this.element = element;
    this.configs = configs;
    this.isStopped = false;
  }

  /**
   * Starts the continuous animation cycle for the stingray.
   * The stingray moves from right to left, with random delays.
   */
  async startCycle() {
    this.isStopped = false;
    this.element.style.display = "none";
    this.element.style.animation = "";

    while (!this.isStopped) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          getRandomDelay(
            this.configs.minDelaySeconds,
            this.configs.maxDelaySeconds,
          ),
        ),
      );

      if (this.isStopped) return;

      this.element.style.display = "block";
      this.element.style.animation = `stingray-swim ${this.configs.swimSpriteDurationSeconds}s steps(${this.configs.swimSpriteSteps}) infinite, move-left-stingray ${this.configs.swimPathDurationSeconds}s linear forwards`;

      await waitForAnimationEnd(this.element, "move-left-stingray");

      this.element.style.animation = "";
      this.element.style.display = "none";
    }
  }

  /**
   * Stops the current stingray animation cycle.
   */
  stopCycle() {
    this.isStopped = true;
    this.element.style.display = "none";
    this.element.style.animation = "";
  }
}

export default StingrayAnimator;
