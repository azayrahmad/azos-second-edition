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
