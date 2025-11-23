import AudioPlayer from "./AudioPlayer.js";
import BubbleAnimator from "./BubbleAnimator.js";
import SharkAnimator from "./SharkAnimator.js";
import SeahorseAnimator from "./SeahorseAnimator.js";
import FishAnimator from "./FishAnimator.js";
import StingrayAnimator from "./StingrayAnimator.js";
import ANIMATION_CONFIGS from "./configs.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Audio Player
  const audioElement = document.getElementById("background-audio");
  const audioPlayer = new AudioPlayer(audioElement);
  audioPlayer.start();

  // Initialize Bubble Animators
  const bubble1 = document.getElementById("bubble1");
  const bubble2 = document.getElementById("bubble2");
  const bubble3 = document.getElementById("bubble3");
  const bubble4 = document.getElementById("bubble4");
  const bubbles = [bubble1, bubble2, bubble3, bubble4];

  const bubbleAnimators = bubbles.map(
    (bubble) => new BubbleAnimator(bubble, ANIMATION_CONFIGS.bubble),
  );
  bubbleAnimators.forEach((animator) => animator.startCycle());

  // Initialize Shark Animator
  const sharkFinRight = document.querySelector(".shark-fin-right");
  const sharkFinLeft = document.querySelector(".shark-fin-left");
  const sharkAnimator = new SharkAnimator(
    sharkFinRight,
    sharkFinLeft,
    ANIMATION_CONFIGS.shark,
  );
  sharkAnimator.startCycle();

  // Initialize Seahorse Animator
  const seahorse = document.querySelector(".seahorse");
  const seahorseAnimator = new SeahorseAnimator(
    seahorse,
    ANIMATION_CONFIGS.seahorse,
  );
  seahorseAnimator.startCycle();

  // Initialize Threadfin Animator
  const threadfin = document.querySelector(".threadfin");
  const threadfinAnimator = new FishAnimator(
    threadfin,
    ANIMATION_CONFIGS.threadfin,
    "threadfin",
  );
  threadfinAnimator.startCycle();

  // Initialize Triggerfish Animator
  const triggerfish = document.querySelector(".triggerfish");
  const triggerfishAnimator = new FishAnimator(
    triggerfish,
    ANIMATION_CONFIGS.triggerfish,
    "triggerfish",
  );
  triggerfishAnimator.startCycle();

  // Initialize Raccoon Animator
  const raccoon = document.querySelector(".raccoon");
  const raccoonAnimator = new FishAnimator(
    raccoon,
    ANIMATION_CONFIGS.raccoon,
    "raccoon",
  );
  raccoonAnimator.startCycle();

  // Initialize Stingray Animator
  const stingray = document.querySelector(".stingray");
  const stingrayAnimator = new StingrayAnimator(
    stingray,
    ANIMATION_CONFIGS.stingray,
  );
  stingrayAnimator.startCycle();
});
