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
});
