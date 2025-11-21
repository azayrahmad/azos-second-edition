import { CONFIG } from './config.js';

class AudioPlayer {
  constructor(audioElement) {
    this.audio = audioElement;
    this.config = CONFIG.audio;
    this.shuffledFiles = [];
    this.currentAudioIndex = 0;
  }

  /**
   * Shuffles an array using the Fisher-Yates algorithm.
   * @param {Array} array - The array to shuffle.
   * @returns {Array} - The shuffled array.
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Plays the next audio file in the shuffled list. Reshuffles if all files have been played.
   */
  playNext() {
    if (this.currentAudioIndex >= this.shuffledFiles.length) {
      this.shuffledFiles = this.shuffleArray([...this.config.files]); // Create a shallow copy before shuffling
      this.currentAudioIndex = 0;
    }

    this.audio.src = this.shuffledFiles[this.currentAudioIndex];
    this.audio.play().catch((e) => console.error("Error playing audio:", e)); // Catch and log potential errors
    this.currentAudioIndex++;
  }

  /**
   * Starts the audio playback cycle, including initial play and repeated playback.
   */
  start() {
    this.shuffledFiles = this.shuffleArray([...this.config.files]);
    this.playNext();
    setInterval(() => this.playNext(), this.config.playInterval);
  }
}

export default AudioPlayer;
