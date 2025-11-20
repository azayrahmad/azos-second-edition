export const CONFIG = {
  stars: {
    numberOfStarsToSpawn: 5,
    spawnInterval: 150, // Milliseconds between each star appearing
    initialDelay: 1000, // Initial delay before the first star appears
    repeatingInterval: 1000, // Spawn a new star every 1 second
    starWidth: 21,
    starHeight: 21,
  },
  hubble: {
    speed: 0.4, // Pixels per frame
    delayAfterOffscreen: 1000, // Milliseconds
    minEdgeOffset: 50, // Minimum distance from the top/left edge for the image's leading edge
  },
  astronaut: {
    images: [
      "src/images/astronaut-l.png",
      "src/images/astronaut-m.png",
      "src/images/astronaut-s.png",
      "src/images/astronaut-m.png",
      "src/images/astronaut-l.png",
    ],
    speed: 0.6, // Pixels per frame
    angleDegrees: 30, // Angle for diagonal movement
    delayAfterOffscreen: 1000, // Milliseconds
    minEdgeOffset: 50,
  },
  audio: {
    files: [
      "src/audio/Space exit windows.wav",
      "src/audio/Space menu popup.wav",
      "src/audio/Space open program.wav",
      "src/audio/Space program error.wav",
      "src/audio/Space startup.wav",
    ],
    playInterval: 5000, // Milliseconds between playing new audio files
  },
};
