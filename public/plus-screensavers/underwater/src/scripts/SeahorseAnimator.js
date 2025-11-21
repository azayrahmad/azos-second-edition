import ANIMATION_CONFIGS from "./configs.js";

/**
 * Manages the animation of a seahorse, including its movement path and sprite animation.
 */
class SeahorseAnimator {
  /**
   * @param {HTMLElement} seahorseElement The DOM element representing the seahorse.
   * @param {object} configs Configuration object for seahorse animations.
   */
  constructor(seahorseElement, configs = ANIMATION_CONFIGS.seahorse) {
    this.seahorseElement = seahorseElement;
    this.configs = configs;
    this.seahorseFrameWidth = configs.frameWidth;
    this.seahorseTotalFrames = configs.totalFrames;
    this.seahorseSpriteInterval = null;
    this.currentSeahorseFrame = 0;
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
   * Easing function for smoother animations (approximates jQuery's 'swing' for rise/descend).
   * @param {number} t The normalized time (0 to 1).
   * @returns {number} The eased progress.
   */
  static easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * Animates a CSS property of an element over a given duration.
   * @param {HTMLElement} element The DOM element to animate.
   * @param {string} property The CSS property name (e.g., 'bottom', 'right').
   * @param {number} startValue The starting value of the property (numeric).
   * @param {number} endValue The ending value of the property (numeric).
   * @param {string} unit The CSS unit for the property (e.g., 'px').
   * @param {number} duration The duration of the animation in milliseconds.
   * @param {function(number): number} easing The easing function to use.
   * @returns {Promise<void>} A promise that resolves when the animation is complete.
   */
  static animateCssProperty(
    element,
    property,
    startValue,
    endValue,
    unit,
    duration,
    easing = (t) => t, // default linear easing
  ) {
    return new Promise((resolve) => {
      const startTime = performance.now();

      function frame(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easing(progress);

        const currentValue =
          startValue + (endValue - startValue) * easedProgress;
        element.style[property] = currentValue + unit;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  /**
   * Animates an element along a circular path.
   * @param {HTMLElement} element The DOM element to animate.
   * @param {number} startRight The 'right' CSS value at the start of the circle.
   * @param {number} startBottom The 'bottom' CSS value at the start of the circle (which is also the center's bottom for this animation).
   * @param {number} orbitRadius The radius of the circular path in pixels.
   * @param {number} duration The duration of the circular animation in milliseconds.
   * @returns {Promise<void>} A promise that resolves when the animation is complete.
   */
  static animateCirclePath(
    element,
    startRight,
    startBottom,
    orbitRadius,
    duration,
  ) {
    return new Promise((resolve) => {
      const startTime = performance.now();

      function frame(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const angle = progress * 2 * Math.PI; // Angle for the current step in radians

        const targetRight = startRight - orbitRadius * Math.cos(angle);
        const targetBottom = startBottom - orbitRadius * Math.sin(angle);

        element.style.right = targetRight + "px";
        element.style.bottom = targetBottom + "px";

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  /**
   * Starts the sprite animation for the seahorse fins.
   */
  startSpriteAnimation() {
    this.seahorseSpriteInterval = setInterval(() => {
      this.currentSeahorseFrame =
        (this.currentSeahorseFrame + 1) % this.seahorseTotalFrames;
      this.seahorseElement.style.backgroundPositionX =
        -this.currentSeahorseFrame * this.seahorseFrameWidth + "px";
    }, this.configs.spriteAnimationRateMs); // Use configured frame rate
  }

  /**
   * Stops the sprite animation and resets the seahorse to its first frame.
   */
  stopSpriteAnimation() {
    if (this.seahorseSpriteInterval) {
      clearInterval(this.seahorseSpriteInterval);
      this.seahorseSpriteInterval = null;
    }
    this.seahorseElement.style.backgroundPositionX = "0px";
    this.currentSeahorseFrame = 0;
  }

  /**
   * Animates the seahorse's movement through rising, orbiting, and descending phases.
   */
  async animateMovement() {
    this.startSpriteAnimation(); // Start the fin animation when movement begins

    const computedStyle = getComputedStyle(this.seahorseElement);
    const initialRight = parseFloat(computedStyle.right);
    const currentBottom = parseFloat(computedStyle.bottom);

    // Phase 1: Rise to 80px from the bottom
    await SeahorseAnimator.animateCssProperty(
      this.seahorseElement,
      "bottom",
      currentBottom,
      this.configs.riseTargetBottomPx,
      "px",
      this.configs.riseDescendDurationMs,
      SeahorseAnimator.easeInOutQuad,
    );

    // Phase 2: Circular Orbit
    const orbitRadius = this.configs.orbitRadiusPx; // Radius of the circular path in pixels
    const spinDuration = this.configs.orbitDurationMs; // Total duration for the circular movement in milliseconds

    await SeahorseAnimator.animateCirclePath(
      this.seahorseElement,
      initialRight,
      this.configs.riseTargetBottomPx, // The circle starts at the position it reached after rising.
      orbitRadius,
      spinDuration,
    );

    // Phase 3: Descend to -100px from the bottom
    const currentBottomAfterCircle = parseFloat(
      getComputedStyle(this.seahorseElement).bottom,
    );
    await SeahorseAnimator.animateCssProperty(
      this.seahorseElement,
      "bottom",
      currentBottomAfterCircle,
      this.configs.descendTargetBottomPx,
      "px",
      this.configs.riseDescendDurationMs,
      SeahorseAnimator.easeInOutQuad,
    );

    this.stopSpriteAnimation(); // Stop the fin animation
    this.startCycle(); // Schedule the next seahorse animation cycle
  }

  /**
   * Starts the animation cycle for the seahorse, scheduling its movement
   * with a random delay and then rescheduling itself.\n   */
  startCycle() {
    const delay = SeahorseAnimator.getRandomDelay(
      this.configs.minDelaySeconds,
      this.configs.maxDelaySeconds,
    );
    this.animationTimeout = setTimeout(() => {
      this.animateMovement();
    }, delay);
  }

  /**
   * Stops the current seahorse animation cycle.
   */
  stopCycle() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    this.stopSpriteAnimation();
    // Reset position if desired, e.g., to initial setup
    // this.seahorseElement.style.right = 'initial';
    // this.seahorseElement.style.bottom = 'initial';
  }
}

export default SeahorseAnimator;
