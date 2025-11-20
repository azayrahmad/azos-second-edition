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

  // Get the dimensions of the hubble image immediately
  const hubbleWidth = hubble.offsetWidth;
  const hubbleHeight = hubble.offsetHeight;

  let hubbleBottom;
  let hubbleRight;

  // Function to set Hubble's starting position randomly on the bottom or right edge
  function setRandomHubbleStartPosition() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const minEdgeOffset = 50; // Minimum distance from the top/left edge for the image's leading edge

    // Randomly choose to start from the bottom edge or the right edge
    if (Math.random() < 0.5) {
      // Start from bottom edge (hubbleBottom = -hubbleHeight means it's fully off-screen below)
      hubbleBottom = -hubbleHeight;

      // Calculate the maximum 'right' position such that the image's left edge
      // is at least 'minEdgeOffset' pixels from the left side of the screen.
      // Image's left edge is at (windowWidth - hubbleRight - hubbleWidth).
      // We want (windowWidth - hubbleRight - hubbleWidth) >= minEdgeOffset.
      // So, hubbleRight <= (windowWidth - hubbleWidth - minEdgeOffset).
      const maxAllowedHubbleRight = windowWidth - hubbleWidth - minEdgeOffset;

      // The minimum 'right' position is when the image is fully off-screen to the right.
      const minPossibleHubbleRight = -hubbleWidth;

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
      hubbleRight = -hubbleWidth;

      // Calculate the maximum 'bottom' position such that the image's top edge
      // is at least 'minEdgeOffset' pixels from the top side of the screen.
      // Image's top edge is at (windowHeight - hubbleBottom - hubbleHeight).
      // We want (windowHeight - hubbleBottom - hubbleHeight) >= minEdgeOffset.
      // So, hubbleBottom <= (windowHeight - hubbleHeight - minEdgeOffset).
      const maxAllowedHubbleBottom =
        windowHeight - hubbleHeight - minEdgeOffset;

      // The minimum 'bottom' position is when the image is fully off-screen below.
      const minPossibleHubbleBottom = -hubbleHeight;

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

  // Set initial position when the script loads
  setRandomHubbleStartPosition();

  const hubbleSpeed = 0.5; // Pixels per frame (increased speed)
  // hubbleResetOffset is no longer needed for the reset logic

  let isHubbleAnimating = true; // Flag to control animation state

  function animateHubble() {
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

  // Start the Hubble animation
  animateHubble();

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
