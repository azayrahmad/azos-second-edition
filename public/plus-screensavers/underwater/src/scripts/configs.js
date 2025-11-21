const ANIMATION_CONFIGS = {
  // General
  defaultMinDelaySeconds: 5,
  defaultMaxDelaySeconds: 10,

  // Bubble Animator
  bubble: {
    minDelaySeconds: 5, // Time before a bubble starts animating again
    maxDelaySeconds: 10,
  },

  // Shark Animator
  shark: {
    minDelaySeconds: 5, // Time before a shark fin appears
    maxDelaySeconds: 10,
    swimDurationSeconds: 15, // Time it takes for the shark fin to cross the screen
  },

  // Seahorse Animator
  seahorse: {
    frameWidth: 79, // Width of a single frame in the seahorse sprite sheet (px)
    totalFrames: 3, // Total number of frames in the seahorse sprite
    spriteAnimationRateMs: 200, // Interval for changing seahorse sprite frames (ms)
    riseDescendDurationMs: 3000, // Duration for the seahorse to rise or descend (ms)
    orbitRadiusPx: 10, // Radius of the seahorse's circular orbit (px)
    orbitDurationMs: 2000, // Duration for the seahorse's circular orbit (ms)
    minDelaySeconds: 5, // Time before the next seahorse movement cycle starts
    maxDelaySeconds: 10,
    riseTargetBottomPx: 80, // Target 'bottom' CSS value after rising
    descendTargetBottomPx: -100, // Target 'bottom' CSS value after descending (off-screen)
  },

  // Threadfin Animator
  threadfin: {
    minDelaySeconds: 5, // Initial random wait before threadfin appears and between movements
    maxDelaySeconds: 10,
    swimSpriteDurationSeconds: 1, // Duration of the threadfin's swimming sprite animation (CSS property)
    swimPathDurationSeconds: 25, // Duration for the threadfin to cross the screen (CSS animation)
    swimSpriteSteps: 10, // Number of steps in the threadfin's swimming sprite
    startPositions: {
      // Viewport-based start positions for threadfin
      right: { startX: 0, startY: 25, endX: 100, endY: 75 }, // From top-left to bottom-right
      left: { startX: 100, startY: 25, endX: 0, endY: 75 }, // From top-right to bottom-left
    },
  },

  // Triggerfish Animator
  triggerfish: {
    minDelaySeconds: 15, // Initial random wait before triggerfish appears and between movements
    maxDelaySeconds: 20,
    swimSpriteDurationSeconds: 1, // Duration of the triggerfish's swimming sprite animation (CSS property)
    swimPathDurationSeconds: 15, // Duration for the triggerfish to cross the screen (CSS animation)
    swimSpriteSteps: 6, // Number of steps in the triggerfish's swimming sprite
    startPositions: {
      // Viewport-based start positions for triggerfish
      right: { startX: 0, startY: 15, endX: 100, endY: 65 }, // From top-left to bottom-right
      left: { startX: 100, startY: 15, endX: 0, endY: 65 }, // From top-right to bottom-left
    },
  },

  // Raccoon Animator
  raccoon: {
    minDelaySeconds: 5,
    maxDelaySeconds: 10,
    swimSpriteDurationSeconds: 1,
    swimPathDurationSeconds: 25,
    swimSpriteSteps: 6,
    startPositions: {
      right: { startX: 0, startY: 65, endX: 100, endY: 15 }, // From bottom-left to top-right
      left: { startX: 100, startY: 65, endX: 0, endY: 15 }, // From bottom-right to top-left
    },
    swimAnimationName: "raccoon-swim",
  },
};

export default ANIMATION_CONFIGS;
