import { CONFIG } from './config.js';

class Starfield {
  constructor(containerElement) {
    this.container = containerElement;
    this.config = CONFIG.stars;
  }

  /**
   * Creates a single sparkling star element and adds it to the container.
   * Handles positioning and animation cleanup.
   */
  createSparklingStar() {
    const star = document.createElement("div");
    star.classList.add("sparkling-star");
    this.container.appendChild(star);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const randomX = Math.floor(Math.random() * (windowWidth - this.config.starWidth));
    const randomY = Math.floor(Math.random() * (windowHeight - this.config.starHeight));

    star.style.left = randomX + "px";
    star.style.top = randomY + "px";

    // Force reflow to ensure animation starts correctly from initial state.
    void star.offsetWidth;

    star.classList.add("animating");

    star.addEventListener(
      "animationend",
      function () {
        this.remove();
      },
      { once: true },
    );
  }

  /**
   * Starts the star spawning process, including an initial burst and continuous spawning.
   */
  start() {
    // Schedule an initial burst of stars
    setTimeout(() => {
      for (let i = 0; i < this.config.numberOfStarsToSpawn; i++) {
        setTimeout(() => {
          this.createSparklingStar();
        }, i * this.config.spawnInterval);
      }
    }, this.config.initialDelay);

    // Schedule continuous spawning of single stars
    setInterval(() => {
      this.createSparklingStar();
    }, this.config.repeatingInterval);
  }
}

export default Starfield;
