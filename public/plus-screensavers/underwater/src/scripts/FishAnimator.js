import { getRandomDelay, waitForAnimationEnd } from "./animationUtils.js";

/**
 * Manages the animation cycle of a fish element.
 */
class FishAnimator {
  /**
   * @param {HTMLElement} element The DOM element representing the fish.
   * @param {object} configs Configuration object for fish animations.
   * @param {string} fishName The name of the fish (e.g., 'threadfin', 'triggerfish').
   */
  constructor(element, configs, fishName) {
    this.element = element;
    this.configs = configs;
    this.fishName = fishName;
    this.isStopped = false;

    // Use specific animation names from config if provided, otherwise generate them.
    this.moveRightAnimationName =
      configs.moveRightAnimationName || `move-right-30deg-${this.fishName}`;
    this.moveLeftAnimationName =
      configs.moveLeftAnimationName || `move-left-30deg-${this.fishName}`;
    this.swimAnimationName =
      configs.swimAnimationName || `${this.fishName}-swim`;
  }

  /**
   * Starts the continuous animation cycle for the fish.
   * The fish moves from right to left, then left to right, with random delays.
   */
  async startCycle() {
    this.isStopped = false;
    this.element.style.display = "none";
    this.element.style.animation = "";
    this.element.style.transform = "";

    while (!this.isStopped) {
      // Random initial wait before the first movement
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

      // Phase 1: Move from top-left to bottom-right (right-facing)
      this.element.style.display = "block";
      this.element.style.transform = "";

      this.element.style.setProperty(
        "--start-x",
        `${this.configs.startPositions.right.startX}vw`,
      );
      this.element.style.setProperty(
        "--start-y",
        `${this.configs.startPositions.right.startY}vh`,
      );
      this.element.style.setProperty(
        "--end-x",
        `${this.configs.startPositions.right.endX}vw`,
      );
      this.element.style.setProperty(
        "--end-y",
        `${this.configs.startPositions.right.endY}vh`,
      );

      this.element.style.animation = `${this.swimAnimationName} ${this.configs.swimSpriteDurationSeconds}s steps(${this.configs.swimSpriteSteps}) infinite, ${this.moveRightAnimationName} ${this.configs.swimPathDurationSeconds}s linear forwards`;

      await waitForAnimationEnd(this.element, this.moveRightAnimationName);

      this.element.style.animation = "";
      this.element.style.display = "none";

      if (this.isStopped) return;

      // Random wait before next movement
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

      // Phase 2: Move from top-right to bottom-left (left-facing)
      this.element.style.display = "block";

      this.element.style.setProperty(
        "--start-x",
        `${this.configs.startPositions.left.startX}vw`,
      );
      this.element.style.setProperty(
        "--start-y",
        `${this.configs.startPositions.left.startY}vh`,
      );
      this.element.style.setProperty(
        "--end-x",
        `${this.configs.startPositions.left.endX}vw`,
      );
      this.element.style.setProperty(
        "--end-y",
        `${this.configs.startPositions.left.endY}vh`,
      );

      this.element.style.animation = `${this.swimAnimationName} ${this.configs.swimSpriteDurationSeconds}s steps(${this.configs.swimSpriteSteps}) infinite, ${this.moveLeftAnimationName} ${this.configs.swimPathDurationSeconds}s linear forwards`;

      await waitForAnimationEnd(this.element, this.moveLeftAnimationName);

      this.element.style.animation = "";
      this.element.style.display = "none";
      this.element.style.transform = "";
    }
  }

  /**
   * Stops the current fish animation cycle.
   * Clears any scheduled timeouts and hides the fish.
   */
  stopCycle() {
    this.isStopped = true;
    this.element.style.display = "none";
    this.element.style.animation = "";
    this.element.style.transform = "";
  }
}

export default FishAnimator;
