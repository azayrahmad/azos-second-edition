/**
 * Generates a random delay between a specified minimum and maximum.
 * @param {number} min The minimum delay in seconds.
 * @param {number} max The maximum delay in seconds.
 * @returns {number} A random delay in milliseconds.
 */
export function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

/**
 * Waits for a specified CSS animation to end on an element.
 * @param {HTMLElement} element The element to listen for animation end on.
 * @param {string} animationName The name of the CSS animation to wait for.
 * @returns {Promise<void>} A promise that resolves when the specified animation ends.
 */
export function waitForAnimationEnd(element, animationName) {
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
