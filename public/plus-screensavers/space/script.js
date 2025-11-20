// Function to create and animate a single sparkling star
function createSparklingStar() {
  // Create a new div element for the star
  const star = document.createElement("div");
  star.classList.add("sparkling-star"); // Add the CSS class for styling and animation
  document.body.appendChild(star); // Append it to the body of the document

  // Get the current window dimensions to calculate random positions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // The star sprite is 21x21px (single frame)
  const starWidth = 21;
  const starHeight = 21;

  // Generate random X and Y coordinates within the visible window area
  const randomX = Math.floor(Math.random() * (windowWidth - starWidth));
  const randomY = Math.floor(Math.random() * (windowHeight - starHeight));

  // Set the position of the star using CSS
  star.style.left = randomX + "px";
  star.style.top = randomY + "px";

  // Force a reflow (re-render) of the element. This is a common trick
  // to ensure the browser applies the initial CSS properties (like position)
  // before the animation class is added, which ensures the animation
  // starts correctly from its initial state.
  void star.offsetWidth;

  // Add the 'animating' class to trigger the CSS animation
  star.classList.add("animating");

  // Set up an event listener to remove the star element once its animation completes.
  // The `once: true` option ensures this handler is executed only once.
  star.addEventListener(
    "animationend",
    function () {
      this.remove(); // `this` refers to the star element
    },
    { once: true },
  );
}

// Use `DOMContentLoaded` to ensure the HTML structure is fully loaded before
// the script tries to interact with it.
document.addEventListener("DOMContentLoaded", function () {
  // Configuration for spawning stars
  const numberOfStarsToSpawn = 5; // How many stars to spawn in this burst
  const spawnInterval = 150; // Milliseconds between each star appearing
  const initialDelay = 1000; // Initial delay before the first star appears (e.g., 3 seconds after page load)

  // Schedule a burst of stars to appear after the initial delay
  setTimeout(() => {
    for (let i = 0; i < numberOfStarsToSpawn; i++) {
      // Schedule each star to appear with a slight delay from the previous one
      setTimeout(() => {
        createSparklingStar();
      }, i * spawnInterval);
    }
  }, initialDelay);

  // You could also set up a repeating interval to spawn stars periodically
  setInterval(() => {
    createSparklingStar();
  }, 1000); // Spawn a new star every 1 second

  // Hubble Space Telescope animation logic
  const hubble = document.querySelector(".hubble-telescope");

  // Initial position: start it fully off-screen at the bottom right
  let hubbleBottom;
  let hubbleRight;

  const hubbleSpeed = 0.4; // Pixels per frame (increased speed)

  let isHubbleAnimating = true; // Flag to control animation state

  // Astronaut animation logic
  const astronaut = document.querySelector(".astronaut");
  const astronautImages = [
    "src/images/astronaut-l.png",
    "src/images/astronaut-m.png",
    "src/images/astronaut-s.png",
    "src/images/astronaut-m.png",
    "src/images/astronaut-l.png",
  ];
  let currentAstronautImageIndex = 0;
  const astronautSpeed = 0.6; // Pixels per frame
  const angleRadians = (30 * Math.PI) / 180; // 30 degrees to radians
  let astronautDx; // x movement per frame
  let astronautDy; // y movement per frame
  let astronautX; // Current x position (left)
  let astronautY; // Current y position (top)
  let astronautDirection; // 1 for bottom-left to top-right, -1 for top-right to bottom-left
  let isAstronautAnimating = false; // Flag to control animation state
  let astronautWidth;
  let astronautHeight;
  // let astronautFrameCounter = 0; // Not needed as image updates only on new cycle
  // const framesPerImageChange = 30; // Not needed as image updates only on new cycle

  // Function to set Hubble's starting position randomly on the bottom or right edge
  function setRandomHubbleStartPosition() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const minEdgeOffset = 50; // Minimum distance from the top/left edge for the image's leading edge

    // Randomly choose to start from the bottom edge or the right edge
    if (Math.random() < 0.5) {
      // Start from bottom edge (hubbleBottom = -hubbleHeight means it's fully off-screen below)
      hubbleBottom = -hubble.offsetHeight;

      // Calculate the maximum 'right' position such that the image's left edge
      // is at least 'minEdgeOffset' pixels from the left side of the screen.
      // Image's left edge is at (windowWidth - hubbleRight - hubbleWidth).
      // We want (windowWidth - hubbleRight - hubbleWidth) >= minEdgeOffset.
      // So, hubbleRight <= (windowWidth - hubbleWidth - minEdgeOffset).
      const maxAllowedHubbleRight =
        windowWidth - hubble.offsetWidth - minEdgeOffset;

      // The minimum 'right' position is when the image is fully off-screen to the right.
      const minPossibleHubbleRight = -hubble.offsetWidth;

      // Ensure the max allowed position is not less than the min possible (e.g., if window is too small)
      const actualMaxHubbleRight = Math.max(
        minPossibleHubbleRight,
        maxAllowedHubbleRight,
      );

      // Generate a random position for hubbleRight within the determined valid range
      hubbleRight =
        Math.floor(
          Math.random() * (actualMaxHubbleRight - minPossibleHubbleRight + 1),
        ) + minPossibleHubbleRight;
    } else {
      // Start from right edge (hubbleRight = -hubbleWidth means it's fully off-screen to the right)
      hubbleRight = -hubble.offsetWidth;

      // Calculate the maximum 'bottom' position such that the image's top edge
      // is at least 'minEdgeOffset' pixels from the top side of the screen.
      // Image's top edge is at (windowHeight - hubbleBottom - hubbleHeight).
      // We want (windowHeight - hubbleBottom - hubbleHeight) >= minEdgeOffset.
      // So, hubbleBottom <= (windowHeight - hubbleHeight - minEdgeOffset).
      const maxAllowedHubbleBottom =
        windowHeight - hubble.offsetHeight - minEdgeOffset;

      // The minimum 'bottom' position is when the image is fully off-screen below.
      const minPossibleHubbleBottom = -hubble.offsetHeight;

      // Ensure the max allowed position is not less than the min possible
      const actualMaxHubbleBottom = Math.max(
        minPossibleHubbleBottom,
        maxAllowedHubbleBottom,
      );

      // Generate a random position for hubbleBottom within the determined valid range
      hubbleBottom =
        Math.floor(
          Math.random() * (actualMaxHubbleBottom - minPossibleHubbleBottom + 1),
        ) + minPossibleHubbleBottom;
    }
  }

  function animateHubble() {
    if (!isHubbleAnimating) {
      return;
    }

    hubbleBottom += hubbleSpeed;
    hubbleRight += hubbleSpeed;

    hubble.style.bottom = `${hubbleBottom}px`;
    hubble.style.right = `${hubbleRight}px`;

    // Get the dimensions of the window (re-read in case of resize)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Check if the hubble has moved completely off-screen (top-left)
    // It's off-screen when its bottom is above the viewport (hubbleBottom > windowHeight)
    // or its right is to the left of the viewport (hubbleRight > windowWidth)
    if (hubbleBottom > windowHeight || hubbleRight > windowWidth) {
      isHubbleAnimating = false; // Pause the animation
      setTimeout(() => {
        setRandomHubbleStartPosition(); // Reset position after delay
        hubble.style.bottom = `${hubbleBottom}px`; // Apply new position immediately
        hubble.style.right = `${hubbleRight}px`;
        isHubbleAnimating = true; // Resume animation
        requestAnimationFrame(animateHubble); // Restart the loop
      }, 1000); // 1-second delay
      return; // Stop further execution for this frame
    }

    if (isHubbleAnimating) {
      requestAnimationFrame(animateHubble);
    }
  }

  // Function to set Astronaut\'s position and direction for a new cycle (initial or ping-pong)
  function setupAstronautCycle(isInitialSetup = false) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (isInitialSetup) {
      currentAstronautImageIndex = 0;
    } else {
      currentAstronautImageIndex =
        (currentAstronautImageIndex + 1) % astronautImages.length;
    }
    astronaut.src = astronautImages[currentAstronautImageIndex];

    // Make visible temporarily to get accurate dimensions if it was hidden
    astronaut.style.display = "block";

    // Ensure astronaut dimensions are up-to-date AFTER setting src and making it visible
    astronautWidth = astronaut.offsetWidth;
    astronautHeight = astronaut.offsetHeight;

    const minEdgeOffset = 50;

    if (!isInitialSetup) {
      astronautDirection *= -1; // Toggle direction for ping-pong
    } else {
      // For initial setup, randomly decide initial direction
      astronautDirection = Math.random() < 0.5 ? 1 : -1; // 1: BL-TR, -1: TR-BL
    }

    if (astronautDirection === 1) {
      // Moving BL-TR, so start from bottom or left
      if (Math.random() < 0.5) {
        // Start from bottom edge
        astronautX =
          Math.random() * (windowWidth - astronautWidth - minEdgeOffset * 2) +
          minEdgeOffset;
        astronautY = windowHeight; // Fully off-screen below
      } else {
        // Start from left edge
        astronautX = -astronautWidth; // Fully off-screen left
        astronautY =
          Math.random() * (windowHeight - astronautHeight - minEdgeOffset * 2) +
          minEdgeOffset;
      }
    } else {
      // Moving TR-BL, so start from top or right
      if (Math.random() < 0.5) {
        // Start from top edge
        astronautX =
          Math.random() * (windowWidth - astronautWidth - minEdgeOffset * 2) +
          minEdgeOffset;
        astronautY = -astronautHeight; // Fully off-screen above
      } else {
        // Start from right edge
        astronautX = windowWidth; // Fully off-screen right
        astronautY =
          Math.random() * (windowHeight - astronautHeight - minEdgeOffset * 2) +
          minEdgeOffset;
      }
    }
  }

  function animateAstronaut() {
    if (!isAstronautAnimating) {
      return;
    }

    // Calculate movement components based on direction
    if (astronautDirection === 1) {
      // Moving bottom-left to top-right
      astronautDx = astronautSpeed * Math.cos(angleRadians);
      astronautDy = -astronautSpeed * Math.sin(angleRadians); // Negative for moving up
    } else {
      // Moving top-right to bottom-left
      astronautDx = -astronautSpeed * Math.cos(angleRadians);
      astronautDy = astronautSpeed * Math.sin(angleRadians); // Positive for moving down
    }

    astronautX += astronautDx;
    astronautY += astronautDy;

    astronaut.style.left = `${astronautX}px`;
    astronaut.style.top = `${astronautY}px`;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Check if astronaut is off-screen
    let offScreen = false;
    if (astronautDirection === 1) {
      // Moving bottom-left to top-right, off-screen when top or right edge goes past viewport
      if (astronautX > windowWidth || astronautY < -astronautHeight) {
        offScreen = true;
      }
    } else {
      // Moving top-right to bottom-left, off-screen when bottom or left edge goes past viewport
      if (astronautX < -astronautWidth || astronautY > windowHeight) {
        offScreen = true;
      }
    }

    if (offScreen) {
      isAstronautAnimating = false; // Pause the animation
      astronaut.style.display = "none"; // Hide astronaut immediately

      setTimeout(() => {
        setupAstronautCycle(); // Reset position and toggle direction for next cycle
        astronaut.style.left = `${astronautX}px`; // Apply new position
        astronaut.style.top = `${astronautY}px`;
        // Image and display are already set by setAstronautNextStartPosition
        astronautFrameCounter = 0; // Reset frame counter for image changes
        isAstronautAnimating = true; // Resume animation
        requestAnimationFrame(animateAstronaut);
      }, 1000); // 1-second delay
      return;
    }

    requestAnimationFrame(animateAstronaut);
  }

  // Create promises for image loading to ensure dimensions are accurate
  const imageLoadPromises = [];

  // Hubble image loading
  imageLoadPromises.push(
    new Promise((resolve) => {
      if (hubble.complete && hubble.naturalWidth > 0) {
        // Check if already loaded and has dimensions
        resolve();
      } else {
        hubble.onload = resolve;
        hubble.onerror = () => {
          console.error("Failed to load Hubble image.");
          resolve(); // Resolve anyway to avoid blocking other animations
        };
      }
    }),
  );

  // Astronaut initial image loading (set the src before waiting)
  astronaut.src = astronautImages[0]; // Set initial image to get dimensions
  imageLoadPromises.push(
    new Promise((resolve) => {
      if (astronaut.complete && astronaut.naturalWidth > 0) {
        // Check if already loaded and has dimensions
        resolve();
      } else {
        astronaut.onload = resolve;
        astronaut.onerror = () => {
          console.error("Failed to load Astronaut initial image.");
          resolve(); // Resolve anyway to avoid blocking other animations
        };
      }
    }),
  );

  // Wait for all critical images to load before starting animations
  Promise.all(imageLoadPromises)
    .then(() => {
      // Now it's safe to get dimensions and start animations
      setRandomHubbleStartPosition(); // Now hubble.offsetWidth/Height will be correct
      animateHubble();

      setupAstronautCycle(true); // Now astronaut.offsetWidth/Height will be correct
      isAstronautAnimating = true;
      animateAstronaut();
    })
    .catch((error) => {
      console.error("An error occurred during image loading:", error);
      // Even if an error occurs, try to start animations with available data
      setRandomHubbleStartPosition();
      animateHubble();
      setupAstronautCycle(true);
      isAstronautAnimating = true;
      animateAstronaut();
    });

  // Audio playback logic
  const audio = document.getElementById("background-audio");
  const audioFiles = [
    "src/audio/Space exit windows.wav",
    "src/audio/Space menu popup.wav",
    "src/audio/Space open program.wav",
    "src/audio/Space program error.wav",
    "src/audio/Space startup.wav",
  ];

  let shuffledAudioFiles = [];
  let currentAudioIndex = 0;

  // Function to shuffle an array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Function to play the next audio file in the shuffled list
  function playNextAudio() {
    // If all songs in the current shuffled list have been played,
    // re-shuffle the original list and reset the index.
    if (currentAudioIndex >= shuffledAudioFiles.length) {
      shuffledAudioFiles = shuffleArray([...audioFiles]); // Create a shallow copy before shuffling
      currentAudioIndex = 0;
    }

    audio.src = shuffledAudioFiles[currentAudioIndex];
    audio.play().catch((e) => console.error("Error playing audio:", e)); // Catch and log potential errors (e.g., user gesture requirement)
    currentAudioIndex++;
  }

  // Initial shuffle and play the first audio file
  shuffledAudioFiles = shuffleArray([...audioFiles]);
  playNextAudio();

  // Set an interval to play a new audio file every 5 seconds
  setInterval(playNextAudio, 5000);
});
