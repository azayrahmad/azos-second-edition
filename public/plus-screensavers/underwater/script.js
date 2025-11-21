import AudioPlayer from "./src/scripts/AudioPlayer.js";

document.addEventListener("DOMContentLoaded", () => {
  const bubble1 = document.getElementById("bubble1");
  const bubble2 = document.getElementById("bubble2");
  const bubble3 = document.getElementById("bubble3");
  const bubble4 = document.getElementById("bubble4");

  const bubbles = [bubble1, bubble2, bubble3, bubble4];

  const audioElement = document.getElementById("background-audio");
  const audioPlayer = new AudioPlayer(audioElement);

  function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000; // Convert to milliseconds
  }

  function animateBubble(bubbleElement) {
    bubbleElement.classList.remove("animate"); // Reset animation
    void bubbleElement.offsetWidth; // Trigger reflow to restart animation
    bubbleElement.classList.add("animate"); // Start animation
  }

  // Function to start and reschedule animation for a single bubble
  function startIndividualBubbleSchedule(bubble) {
    const delay = getRandomDelay(5, 10); // Initial delay between 5 and 10 seconds, then subsequent delays
    setTimeout(() => {
      animateBubble(bubble);
      startIndividualBubbleSchedule(bubble); // Reschedule itself immediately after animation
    }, delay);
  }

  audioPlayer.start();
  // Start the animation cycle for each bubble individually
  bubbles.forEach((bubble) => {
    startIndividualBubbleSchedule(bubble);
  });

  const sharkFinRight = document.querySelector(".shark-fin-right");
  const sharkFinLeft = document.querySelector(".shark-fin-left");
  let nextFinDirection = "right"; // Initialize the first direction

  function animateSharkFin(finElement, direction) {
    finElement.style.opacity = 1; // Make it visible
    let animationName = direction === "right" ? "swim-right" : "swim-left";
    finElement.style.animation = `${animationName} 15s linear forwards`; // 15 seconds for crossing the screen

    finElement.onanimationend = () => {
      finElement.style.opacity = 0; // Hide it after animation
      finElement.style.animation = ""; // Clear animation

      // Toggle the next direction
      nextFinDirection = direction === "right" ? "left" : "right";
      startSharkFinCycle(); // Start the next cycle after this animation ends
    };
  }

  function startSharkFinCycle() {
    const delay = getRandomDelay(5, 10); // Random delay between 5-10 seconds

    setTimeout(() => {
      if (nextFinDirection === "right") {
        animateSharkFin(sharkFinRight, "right");
      } else {
        animateSharkFin(sharkFinLeft, "left");
      }
    }, delay);
  }

  // Initial call to start the shark fin animation cycle
  startSharkFinCycle();

  // Seahorse animation logic - Refactored to remove jQuery
  const seahorse = document.querySelector(".seahorse");
  let seahorseSpriteInterval;
  let currentSeahorseFrame = 0;
  const seahorseFrameWidth = 79; // From CSS for a single frame
  const seahorseTotalFrames = 3; // Total frames in the sprite

  // Easing function for smoother animations (approximates jQuery's 'swing' for rise/descend)
  function easeInOutQuad(t) {
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
  function animateCssProperty(
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
  function animateCirclePath(
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

        // The center of the orbit is assumed to be (startRight, startBottom)
        // The original jQuery used `initialRight - orbitRadius * Math.cos(angle)`
        // This makes the center of the circle at `initialRight` for the x-axis, and `initialBottom` for the y-axis.
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

  function startSeahorseSpriteAnimation() {
    // Start animation of seahorse fins by changing background-position
    seahorseSpriteInterval = setInterval(() => {
      currentSeahorseFrame = (currentSeahorseFrame + 1) % seahorseTotalFrames;
      seahorse.style.backgroundPositionX =
        -currentSeahorseFrame * seahorseFrameWidth + "px";
    }, 200); // Adjust frame rate as needed (e.g., 200ms per frame)
  }

  function stopSeahorseSpriteAnimation() {
    // Stop the fin animation and reset to the first frame
    clearInterval(seahorseSpriteInterval);
    seahorse.style.backgroundPositionX = "0px";
    currentSeahorseFrame = 0;
  }

  async function animateSeahorseMovement() {
    startSeahorseSpriteAnimation(); // Start the fin animation when movement begins

    // Ensure initial 'right' and 'bottom' are set for precise calculations
    const computedStyle = getComputedStyle(seahorse);
    const initialRight = parseFloat(computedStyle.right);
    const currentBottom = parseFloat(computedStyle.bottom);

    // Phase 1: Rise to 80px from the bottom
    await animateCssProperty(
      seahorse,
      "bottom",
      currentBottom,
      80,
      "px",
      3000,
      easeInOutQuad,
    );

    // Phase 2: Circular Orbit
    const orbitRadius = 10; // Radius of the circular path in pixels
    const spinDuration = 2000; // Total duration for the circular movement in milliseconds

    // The circle starts at the position it reached after rising.
    // So, current `right` is `initialRight`, and current `bottom` is `80px`.
    await animateCirclePath(
      seahorse,
      initialRight,
      80,
      orbitRadius,
      spinDuration,
    );

    // Phase 3: Descend to -100px from the bottom
    const currentBottomAfterCircle = parseFloat(
      getComputedStyle(seahorse).bottom,
    );
    await animateCssProperty(
      seahorse,
      "bottom",
      currentBottomAfterCircle,
      -100,
      "px",
      3000,
      easeInOutQuad,
    );

    stopSeahorseSpriteAnimation(); // Stop the fin animation
    startSeahorseCycle(); // Schedule the next seahorse animation cycle
  }

  function startSeahorseCycle() {
    // Get a random delay between 5 and 10 seconds before the next animation starts
    const delay = getRandomDelay(5, 10);
    setTimeout(() => {
      animateSeahorseMovement(); // Start the seahorse movement animation after the delay
    }, delay);
  }

  // Initial call to start the seahorse animation cycle
  startSeahorseCycle();

  // Threadfin animation logic
  const threadfin = document.querySelector(".threadfin");

  async function animateThreadfin() {
    // Hide initially
    threadfin.style.display = "none";
    threadfin.style.animation = ""; // Clear any previous animations
    threadfin.style.transform = ""; // Clear any previous transforms

    // Random initial wait (5-10 seconds)
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay(5, 10)));

    // Move from top-left to bottom-right (right-facing)
    threadfin.style.display = "block"; // Show the fish
    threadfin.style.transform = ``; // Remove rotation for right movement

    // Randomize start/end positions slightly for variety
    const startXRight = 0; // Always start from 0vw
    const startYRight = 25; // Always start from 25vh (shallow)
    const endXRight = 100; // Always end at 100vw
    const endYRight = 75; // Always end at 75vh (shallow)

    threadfin.style.setProperty("--start-x", `${startXRight}vw`);
    threadfin.style.setProperty("--start-y", `${startYRight}vh`);
    threadfin.style.setProperty("--end-x", `${endXRight}vw`);
    threadfin.style.setProperty("--end-y", `${endYRight}vh`);

    threadfin.style.animation = `threadfin-swim 1s steps(10) infinite, move-right-30deg 25s linear forwards`;

    await new Promise((resolve) => {
      const handler = (event) => {
        if (event.animationName === "move-right-30deg") {
          threadfin.removeEventListener("animationend", handler);
          resolve();
        }
      };
      threadfin.addEventListener("animationend", handler);
    });

    threadfin.style.animation = ""; // Clear animation after movement
    threadfin.style.display = "none"; // Hide after exiting

    // Random wait before next movement (5-10 seconds)
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay(5, 10)));

    // Move from top-right to bottom-left (left-facing, flipped)
    threadfin.style.display = "block"; // Show the fish
    threadfin.style.transform = `scaleX(-1)`; // Flip for left movement, remove rotation

    // Randomize start/end positions slightly for variety
    const startXLeft = 100; // Always start from 100vw
    const startYLeft = 25; // Always start from 25vh (shallow)
    const endXLeft = 0; // Always end at 0vw
    const endYLeft = 75; // Always end at 75vh (shallow)

    threadfin.style.setProperty("--start-x", `${startXLeft}vw`);
    threadfin.style.setProperty("--start-y", `${startYLeft}vh`);
    threadfin.style.setProperty("--end-x", `${endXLeft}vw`);
    threadfin.style.setProperty("--end-y", `${endYLeft}vh`);

    threadfin.style.animation = `threadfin-swim 1s steps(10) infinite, move-left-30deg 25s linear forwards`;

    await new Promise((resolve) => {
      const handler = (event) => {
        if (event.animationName === "move-left-30deg") {
          threadfin.removeEventListener("animationend", handler);
          resolve();
        }
      };
      threadfin.addEventListener("animationend", handler);
    });

    threadfin.style.animation = ""; // Clear animation after movement
    threadfin.style.display = "none"; // Hide after exiting
    threadfin.style.transform = ""; // Reset transform including flip

    // Repeat the cycle
    animateThreadfin();
  }

  // Initial call to start the threadfin animation cycle
  animateThreadfin();
});
