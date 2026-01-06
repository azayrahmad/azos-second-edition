// A simplified sound manager for the standalone Minesweeper game

/**
 * Plays a sound effect.
 * In this version, it always plays the default dialog sound.
 * @param {string} soundEvent - The name of the sound event to play (ignored).
 */
function playSound(soundEvent) {
  const audio = new Audio('assets/DING.WAV');
  audio.play().catch(error => {
    // Autoplay was prevented, which is common in browsers.
    // We can ignore this error in this context.
    console.warn("Sound playback was prevented by the browser:", error);
  });
}
