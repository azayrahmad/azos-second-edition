/**
 * Clippy.js Extensions - Complete Implementation
 * Method 1: Prototype Extension
 * 
 * Load this file AFTER clippy.js to extend all agent instances
 * Usage: <script src="clippy.js"></script>
 *        <script src="clippy-extensions.js"></script>
 */

(function () {
    'use strict';

    // Ensure clippy exists
    if (typeof clippy === 'undefined') {
        console.error('Clippy.js Extensions: clippy.js must be loaded first!');
        return;
    }

    // =============================================================================
    // CORE ENHANCED METHODS
    // =============================================================================

    /**
     * Speak text with TTS (Text-to-Speech) and visual word streaming
     * @param {String} text - The text to speak
     * @param {Object} options - Configuration options
     * @param {Boolean} options.hold - Whether to hold the speech balloon (default: false)
     * @param {Object} options.ttsOptions - TTS configuration (voice, rate, pitch, volume)
     * @param {Function} options.callback - Called when speech completes
     */
    clippy.Agent.prototype.speakWithTTS = function (text, options) {
        options = options || {};
        var hold = options.hold || false;
        var ttsOptions = options.ttsOptions || {};
        var callback = options.callback;

        // Configure TTS if options provided
        if (Object.keys(ttsOptions).length > 0) {
            this.setTTSOptions(ttsOptions);
        }

        // Check if TTS is available
        if (!this.isTTSEnabled()) {
            console.warn('Clippy Extensions: TTS not supported in this browser. Falling back to visual-only speech.');
            this.speak(text, hold);
            if (callback) setTimeout(callback, 0);
            return false;
        }

        this._addToQueue(function (complete) {
            var self = this;

            function onSpeechComplete() {
                if (callback) callback();
                complete();
            }

            self._balloon.speak(onSpeechComplete, text, hold, true);
        }, this);

        return true;
    },

    /**
     * Speak text while simultaneously playing an animation (with optional TTS)
     * @param {String} text - The text to speak
     * @param {String} animation - The animation to play
     * @param {Object} options - Configuration options
     * @param {Number} options.animationTimeout - Timeout for animation (default: 5000ms)
     * @param {Boolean} options.hold - Whether to hold the speech balloon (default: false)
     * @param {Boolean} options.useTTS - Whether to use text-to-speech (default: false)
     * @param {Object} options.ttsOptions - TTS configuration (voice, rate, pitch, volume)
     * @param {Function} options.callback - Called when both speech and animation complete
     * @returns {Promise<Boolean>} - Promise that resolves to true if successful, false if animation doesn't exist
     */
    clippy.Agent.prototype.speakAndAnimate = function (text, animation, options) {
        options = options || {};
        var animationTimeout = options.animationTimeout !== undefined ? options.animationTimeout : 5000;
        var hold = options.hold || false;
        var useTTS = options.useTTS || false;
        var ttsOptions = options.ttsOptions || {};
        var callback = options.callback;

        // Validate animation exists
        if (!this.hasAnimation(animation)) {
            console.warn('Clippy Extensions: Animation "' + animation + '" not found. Falling back to speech only.');
            if (useTTS && this.isTTSEnabled()) {
                this.speak(text, hold, true);
            } else {
                this.speak(text, hold);
            }
            if (callback) setTimeout(callback, 0);
            return Promise.resolve(false);
        }

        // Configure TTS if requested
        if (useTTS && Object.keys(ttsOptions).length > 0) {
            this.setTTSOptions(ttsOptions);
        }

        var self = this;
        return new Promise(function (resolve) {
            self._addToQueue(function (complete) {
                var speechCompleted = false;
                var animationCompleted = false;
                var hasCalledComplete = false;
                var animationTimedOut = false;

                // Function to check if both operations are done
                var checkCompletion = function () {
                    if ((speechCompleted && animationCompleted) && !hasCalledComplete) {
                        hasCalledComplete = true;
                        if (callback) {
                            try {
                                callback();
                            } catch (e) {
                                console.error('Clippy Extensions: Callback error:', e);
                            }
                        }
                        complete();
                        resolve(true);
                    }
                };

                // Start speech
                self._balloon.speak(function () {
                    speechCompleted = true;
                    checkCompletion();
                }, text, hold, useTTS);

                // Start animation
                var animationCallback = function (name, state) {
                    if (state === clippy.Animator.States.EXITED) {
                        animationCompleted = true;
                        checkCompletion();
                    }
                };

                // Handle animation timeout
                if (animationTimeout && animationTimeout > 0) {
                    setTimeout(function () {
                        if (!animationCompleted && !animationTimedOut) {
                            animationTimedOut = true;
                            self._animator.exitAnimation();
                        }
                    }, animationTimeout);
                }

                // Play the animation
                self._playInternal(animation, animationCallback);

            }, this);
        });
    };

    /**
     * Speak with animation that repeats to match speech duration
     * @param {String} text - The text to speak
     * @param {String} animation - The animation to repeat
     * @param {Object} options - Configuration options
     * @returns {Boolean} - True if successful
     */
    clippy.Agent.prototype.speakWithRepeatingAnimation = function (text, animation, options) {
        options = options || {};
        var hold = options.hold || false;
        var useTTS = options.useTTS || false;
        var ttsOptions = options.ttsOptions || {};
        var callback = options.callback;
        var animationDelay = options.animationDelay || 200; // Delay between animation cycles

        if (!this.hasAnimation(animation)) {
            console.warn('Clippy Extensions: Animation "' + animation + '" not found. Falling back to speech only.');
            if (useTTS && this.isTTSEnabled()) {
                this.speak(text, hold, true);
            } else {
                this.speak(text, hold);
            }
            if (callback) setTimeout(callback, 0);
            return false;
        }

        // Configure TTS if requested
        if (useTTS && Object.keys(ttsOptions).length > 0) {
            this.setTTSOptions(ttsOptions);
        }

        var self = this;
        this._addToQueue(function (complete) {
            var speechCompleted = false;
            var currentAnimationActive = false;
            var hasCalledComplete = false;
            var animationCount = 0;
            var shouldStop = false; // Flag to prevent new animations

            var startNextAnimation = function () {
                // Double check - don't start if we should stop
                if (shouldStop || speechCompleted || hasCalledComplete) {
                    return;
                }

                currentAnimationActive = true;
                animationCount++;

                self._playInternal(animation, function (name, state) {
                    if (state === clippy.Animator.States.EXITED) {
                        currentAnimationActive = false;

                        // Check if we should continue or stop
                        if (!shouldStop && !speechCompleted && !hasCalledComplete) {
                            // Speech still going, start next animation after delay
                            setTimeout(function () {
                                if (!shouldStop && !speechCompleted && !hasCalledComplete) {
                                    startNextAnimation();
                                }
                            }, animationDelay);
                        } else {
                            // We're done, trigger completion
                            checkCompletion();
                        }
                    }
                });
            };

            var checkCompletion = function () {
                if (speechCompleted && !currentAnimationActive && !hasCalledComplete) {
                    hasCalledComplete = true;
                    shouldStop = true; // Make sure no more animations start

                    if (callback) {
                        try {
                            callback(animationCount); // Pass animation count to callback
                        } catch (e) {
                            console.error('Clippy Extensions: Callback error:', e);
                        }
                    }
                    complete();
                }
            };

            // Start speech
            self._balloon.speak(function () {
                speechCompleted = true;
                shouldStop = true; // Stop starting new animations

                // If no animation is currently active, complete immediately
                if (!currentAnimationActive) {
                    checkCompletion();
                }
                // Otherwise, checkCompletion will be called when current animation finishes
            }, text, hold, useTTS);

            // Start first animation
            startNextAnimation();

        }, this);

        return true;
    };

    /**
     * Speak with contextually appropriate idle animation
     * @param {String} text - The text to speak
     * @param {Object} options - Configuration options
     * @returns {Boolean} - True if successful
     */
    clippy.Agent.prototype.speakWithIdleAnimation = function (text, options) {
        options = options || {};

        // Get suitable animations for speaking
        var preferredAnimations = [
            'Idle', 'Processing', 'Thinking', 'Explain', 'LookLeft', 'LookRight',
            'IdleRopePile', 'IdleAtom', 'IdleSideToSide', 'IdleFingerTap'
        ];

        var availableAnimations = preferredAnimations.filter(function (anim) {
            return this.hasAnimation(anim);
        }, this);

        // If no preferred animations, get any idle animation
        if (availableAnimations.length === 0) {
            var allAnimations = this.animations();
            availableAnimations = allAnimations.filter(function (anim) {
                return anim.toLowerCase().indexOf('idle') !== -1;
            });
        }

        // Fallback to any animation if still none found
        if (availableAnimations.length === 0) {
            availableAnimations = [this._getIdleAnimation()];
        }

        var selectedAnimation = availableAnimations[Math.floor(Math.random() * availableAnimations.length)];

        return this.speakWithRepeatingAnimation(text, selectedAnimation, options);
    };

    // =============================================================================
    // ANIMATION ENHANCEMENTS
    // =============================================================================

    /**
     * Play a random animation from available animations
     * @param {Array} exclude - Array of animation name prefixes to exclude
     * @param {Function} callback - Called when animation completes
     * @returns {Boolean} - True if animation was played
     */
    clippy.Agent.prototype.randomAnimation = function (exclude, callback) {
        exclude = exclude || ['Idle'];
        if (typeof exclude === 'function') {
            callback = exclude;
            exclude = ['Idle'];
        }

        var animations = this.animations().filter(function (anim) {
            return !exclude.some(function (ex) {
                return anim.indexOf(ex) === 0;
            });
        });

        if (animations.length === 0) {
            console.warn('Clippy Extensions: No animations available after exclusions');
            return false;
        }

        var randomAnim = animations[Math.floor(Math.random() * animations.length)];
        return this.play(randomAnim, undefined, callback);
    };

    /**
     * Perform a gesture in a specific direction
     * @param {String} direction - 'up', 'down', 'left', 'right', or 'random'
     * @param {Function} callback - Called when gesture completes
     * @returns {Boolean} - True if gesture was performed
     */
    clippy.Agent.prototype.gestureDirection = function (direction, callback) {
        direction = direction || 'random';

        if (direction === 'random') {
            var directions = ['Up', 'Down', 'Left', 'Right'];
            direction = directions[Math.floor(Math.random() * directions.length)];
        } else {
            direction = direction.charAt(0).toUpperCase() + direction.slice(1).toLowerCase();
        }

        var gestureAnim = 'Gesture' + direction;
        var lookAnim = 'Look' + direction;

        var animation = this.hasAnimation(gestureAnim) ? gestureAnim :
            this.hasAnimation(lookAnim) ? lookAnim : null;

        if (!animation) {
            console.warn('Clippy Extensions: No gesture animation found for direction:', direction);
            return false;
        }

        return this.play(animation, undefined, callback);
    };

    /**
     * Perform a sequence of animations with delays
     * @param {Array} sequence - Array of {animation, delay} objects
     * @param {Function} callback - Called when entire sequence completes
     */
    clippy.Agent.prototype.animationSequence = function (sequence, callback) {
        if (!Array.isArray(sequence) || sequence.length === 0) {
            if (callback) setTimeout(callback, 0);
            return this;
        }

        var self = this;
        var currentIndex = 0;

        var playNext = function () {
            if (currentIndex >= sequence.length) {
                if (callback) {
                    try {
                        callback();
                    } catch (e) {
                        console.error('Clippy Extensions: Sequence callback error:', e);
                    }
                }
                return;
            }

            var current = sequence[currentIndex];
            currentIndex++;

            if (typeof current === 'string') {
                // Simple animation name
                self.play(current, undefined, function () {
                    setTimeout(playNext, 500); // Default delay
                });
            } else if (current && current.animation) {
                // Object with animation and delay
                self.play(current.animation, undefined, function () {
                    setTimeout(playNext, current.delay || 500);
                });
            } else {
                // Invalid entry, skip it
                console.warn('Clippy Extensions: Invalid sequence entry:', current);
                setTimeout(playNext, 0);
            }
        };

        playNext();
        return this;
    };

    // =============================================================================
    // SPEECH ENHANCEMENTS
    // =============================================================================

    /**
     * Speak with emotional context
     * @param {String} text - The text to speak
     * @param {String} emotion - 'happy', 'sad', 'excited', 'thinking', 'surprised', etc.
     * @param {Object} options - Additional options
     * @param {Boolean} options.useTTS - Whether to use text-to-speech (default: false)
     * @param {Object} options.ttsOptions - TTS configuration (voice, rate, pitch, volume)
     * @returns {Boolean} - True if successful
     */
    clippy.Agent.prototype.speakWithEmotion = function (text, emotion, options) {
        options = options || {};
        var useTTS = options.useTTS || false;
        var ttsOptions = options.ttsOptions || {};

        var emotionAnimations = {
            happy: ['Congratulate', 'GetTechy', 'Pleased', 'Success'],
            sad: ['Sad', 'Disappointed', 'LookDown'],
            excited: ['Excited', 'GetTechy', 'Congratulate', 'Victory'],
            thinking: ['Thinking', 'Processing', 'LookLeft', 'LookRight', 'Explain'],
            surprised: ['Surprised', 'LookUp', 'GetAttention'],
            confused: ['Confused', 'Processing', 'LookLeft', 'LookRight'],
            proud: ['Congratulate', 'Success', 'Pleased'],
            worried: ['Thinking', 'LookDown', 'Processing']
        };

        var animations = emotionAnimations[emotion.toLowerCase()] || emotionAnimations.thinking;
        var availableAnims = animations.filter(function (anim) {
            return this.hasAnimation(anim);
        }, this);

        if (availableAnims.length === 0) {
            console.warn('Clippy Extensions: No animations available for emotion:', emotion);
            if (useTTS && this.isTTSEnabled()) {
                return this.speak(text, options.hold, true);
            } else {
                return this.speak(text, options.hold);
            }
        }

        var selectedAnim = availableAnims[Math.floor(Math.random() * availableAnims.length)];
        // Add TTS options to speakAndAnimate options
        options.useTTS = useTTS;
        options.ttsOptions = ttsOptions;
        return this.speakAndAnimate(text, selectedAnim, options);
    };

    /**
     * Whisper text (shorter display time)
     * @param {String} text - The text to whisper
     * @param {Function} callback - Called when whisper completes
     */
    clippy.Agent.prototype.whisper = function (text, callback) {
        var self = this;
        this._addToQueue(function (complete) {
            // Modify word speak time for whispering effect
            var originalTime = self._balloon.WORD_SPEAK_TIME;
            self._balloon.WORD_SPEAK_TIME = originalTime * 0.7; // 30% faster

            self._balloon.speak(function () {
                // Restore original timing
                self._balloon.WORD_SPEAK_TIME = originalTime;
                if (callback) {
                    try {
                        callback();
                    } catch (e) {
                        console.error('Clippy Extensions: Whisper callback error:', e);
                    }
                }
                complete();
            }, text, false);
        }, this);

        return this;
    };

    /**
     * Announce text with emphasis
     * @param {String} text - The text to announce
     * @param {Object} options - Options for announcement
     */
    clippy.Agent.prototype.announce = function (text, options) {
        options = options || {};
        var preAnimation = options.preAnimation || 'GetAttention';
        var postDelay = options.postDelay || 1000;

        if (this.hasAnimation(preAnimation)) {
            return this.play(preAnimation)
                .speak(text, options.hold)
                .delay(postDelay);
        } else {
            return this.speak(text, options.hold).delay(postDelay);
        }
    };

    // =============================================================================
    // PERSONALITY & BEHAVIOR
    // =============================================================================

    /**
     * Set agent personality type
     * @param {String} type - 'helpful', 'playful', 'professional', 'sarcastic'
     * @returns {Object} - Returns the agent for chaining
     */
    clippy.Agent.prototype.setPersonality = function (type) {
        this._personality = type;

        var personalities = {
            helpful: {
                greetings: [
                    "How can I help you today?",
                    "What can I assist with?",
                    "I'm here to help!"
                ],
                animations: ['Congratulate', 'Pleased', 'Explain'],
                farewells: [
                    "Happy to help!",
                    "Let me know if you need anything else!",
                    "Glad I could assist!"
                ]
            },
            playful: {
                greetings: [
                    "Hey there! Let's have some fun!",
                    "What's up?",
                    "Ready for some excitement?"
                ],
                animations: ['GetTechy', 'Excited', 'Victory'],
                farewells: [
                    "That was fun!",
                    "See you later!",
                    "Time flies when you're having fun!"
                ]
            },
            professional: {
                greetings: [
                    "Good day. How may I assist you?",
                    "Welcome. How can I help?",
                    "At your service."
                ],
                animations: ['Explain', 'Processing', 'Success'],
                farewells: [
                    "Thank you for your time.",
                    "Please don't hesitate to contact me again.",
                    "It was my pleasure to assist you."
                ]
            },
            sarcastic: {
                greetings: [
                    "Oh great, another human to help...",
                    "What now?",
                    "Let me guess, you need help?"
                ],
                animations: ['LookDown', 'Confused', 'Processing'],
                farewells: [
                    "Well, that was... something.",
                    "Try not to mess this up.",
                    "You're welcome, I guess."
                ]
            }
        };

        this._personalityData = personalities[type] || personalities.helpful;
        return this;
    };

    /**
     * Greet with personality
     * @param {Object} options - Greeting options
     */
    clippy.Agent.prototype.greetWithPersonality = function (options) {
        if (!this._personalityData) {
            this.setPersonality('helpful');
        }

        options = options || {};

        var greeting = this._personalityData.greetings[
            Math.floor(Math.random() * this._personalityData.greetings.length)
        ];

        var animation = this._personalityData.animations[
            Math.floor(Math.random() * this._personalityData.animations.length)
        ];

        if (this.hasAnimation(animation)) {
            return this.speakAndAnimate(greeting, animation, options);
        } else {
            return this.speak(greeting, options.hold);
        }
    };

    /**
     * Say farewell with personality
     * @param {Object} options - Farewell options
     */
    clippy.Agent.prototype.farewellWithPersonality = function (options) {
        if (!this._personalityData) {
            this.setPersonality('helpful');
        }

        options = options || {};

        var farewell = this._personalityData.farewells[
            Math.floor(Math.random() * this._personalityData.farewells.length)
        ];

        var animation = this._personalityData.animations[
            Math.floor(Math.random() * this._personalityData.animations.length)
        ];

        if (this.hasAnimation(animation)) {
            return this.speakAndAnimate(farewell, animation, options);
        } else {
            return this.speak(farewell, options.hold);
        }
    };

    // =============================================================================
    // CONTEXTUAL RESPONSES
    // =============================================================================

    /**
     * Respond contextually based on situation
     * @param {String} context - The context ('error', 'success', 'loading', etc.)
     * @param {String} message - Custom message (optional)
     * @param {Object} options - Additional options
     */
    clippy.Agent.prototype.contextualResponse = function (context, message, options) {
        options = options || {};

        var responses = {
            error: {
                messages: [
                    "Oops! Something went wrong.",
                    "That didn't work as expected.",
                    "There seems to be an error."
                ],
                animations: ['Sad', 'Confused', 'LookDown'],
                emotion: 'worried'
            },
            success: {
                messages: [
                    "Great! That worked perfectly!",
                    "Success!",
                    "Well done!"
                ],
                animations: ['Congratulate', 'Success', 'Victory'],
                emotion: 'happy'
            },
            loading: {
                messages: [
                    "Please wait while I process this...",
                    "Working on it...",
                    "Just a moment..."
                ],
                animations: ['Processing', 'Thinking'],
                emotion: 'thinking'
            },
            warning: {
                messages: [
                    "Hold on, you might want to reconsider this.",
                    "Are you sure about that?",
                    "That might not be a good idea."
                ],
                animations: ['GetAttention', 'Surprised', 'LookUp'],
                emotion: 'surprised'
            },
            help: {
                messages: [
                    "I'm here to help!",
                    "What can I do for you?",
                    "How can I assist?"
                ],
                animations: ['Explain', 'Congratulate'],
                emotion: 'helpful'
            }
        };

        var response = responses[context.toLowerCase()];
        if (!response) {
            console.warn('Clippy Extensions: Unknown context:', context);
            return this.speak(message || "I'm not sure what to do here.", options.hold);
        }

        var text = message || response.messages[Math.floor(Math.random() * response.messages.length)];

        if (options.useEmotion && response.emotion) {
            return this.speakWithEmotion(text, response.emotion, options);
        } else if (response.animations.length > 0) {
            var animation = response.animations[Math.floor(Math.random() * response.animations.length)];
            if (this.hasAnimation(animation)) {
                return this.speakAndAnimate(text, animation, options);
            }
        }

        return this.speak(text, options.hold);
    };

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Perform a complete sequence of actions
     * @param {Array} actions - Array of action objects
     * @param {Function} callback - Called when sequence completes
     */
    clippy.Agent.prototype.performSequence = function (actions, callback) {
        if (!Array.isArray(actions) || actions.length === 0) {
            if (callback) setTimeout(callback, 0);
            return this;
        }

        var self = this;
        var sequence = this;
        var completedActions = 0;

        var onActionComplete = function () {
            completedActions++;
            if (completedActions === actions.length && callback) {
                try {
                    callback();
                } catch (e) {
                    console.error('Clippy Extensions: Sequence callback error:', e);
                }
            }
        };

        actions.forEach(function (action, index) {
            // Add delay before action (except first)
            if (action.delay && index > 0) {
                sequence = sequence.delay(action.delay);
            }

            switch (action.type) {
                case 'speak':
                    sequence = sequence.speak(action.text, action.hold);
                    break;
                case 'play':
                    sequence = sequence.play(action.animation, action.timeout, onActionComplete);
                    break;
                case 'speakAndAnimate':
                    action.options = action.options || {};
                    action.options.callback = onActionComplete;
                    sequence = sequence.speakAndAnimate(action.text, action.animation, action.options);
                    break;
                case 'moveTo':
                    sequence = sequence.moveTo(action.x, action.y, action.duration);
                    break;
                case 'gestureAt':
                    sequence = sequence.gestureAt(action.x, action.y);
                    break;
                case 'hide':
                    sequence = sequence.hide(action.fast);
                    break;
                case 'show':
                    sequence = sequence.show(action.fast);
                    break;
                default:
                    console.warn('Clippy Extensions: Unknown action type:', action.type);
            }
        });

        return sequence;
    };

    /**
     * Get information about available animations
     * @param {String} filter - Filter animations by name pattern
     * @returns {Array} - Array of animation info objects
     */
    clippy.Agent.prototype.getAnimationInfo = function (filter) {
        var animations = this.animations();

        if (filter) {
            animations = animations.filter(function (anim) {
                return anim.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
            });
        }

        return animations.map(function (anim) {
            return {
                name: anim,
                isIdle: anim.indexOf('Idle') === 0,
                isGesture: anim.indexOf('Gesture') === 0,
                isLook: anim.indexOf('Look') === 0,
                isMovement: anim.indexOf('Move') === 0
            };
        });
    };

    /**
     * Check if agent is currently performing any action
     * @returns {Boolean} - True if busy
     */
    clippy.Agent.prototype.isBusy = function () {
        return this._queue && this._queue._queue.length > 0;
    };

    /**
     * Get current queue length
     * @returns {Number} - Number of queued actions
     */
    clippy.Agent.prototype.getQueueLength = function () {
        return this._queue ? this._queue._queue.length : 0;
    };

    // =============================================================================
    // CONVENIENCE METHODS
    // =============================================================================

    /**
     * Quick error message
     * @param {String} message - Error message
     */
    clippy.Agent.prototype.showError = function (message) {
        return this.contextualResponse('error', message);
    };

    /**
     * Quick success message
     * @param {String} message - Success message
     */
    clippy.Agent.prototype.showSuccess = function (message) {
        return this.contextualResponse('success', message);
    };

    /**
     * Quick loading message
     * @param {String} message - Loading message
     */
    clippy.Agent.prototype.showLoading = function (message) {
        return this.contextualResponse('loading', message);
    };

    /**
     * Quick warning message
     * @param {String} message - Warning message
     */
    clippy.Agent.prototype.showWarning = function (message) {
        return this.contextualResponse('warning', message);
    };

    // =============================================================================
    // INITIAL POSITION OVERRIDE
    // =============================================================================

    /**
     * Override the default show method to position the agent relative to the
     * window, ensuring it is fully visible.
     */
    clippy.Agent.prototype.show = function (fast) {
        'use strict';
        this._hidden = false;
        if (fast) {
            this._el.show();
            this.resume();
            this._onQueueEmpty();
            return;
        }

        if (this._el.css('top') === 'auto' || this._el.css('left') === 'auto') {
            var left = $(window).scrollLeft() + $(window).width() - this._el.width() - 20;
            var top = $(window).scrollTop() + $(window).height() - this._el.height() - 20;
            this._el.css({
                top: top,
                left: left
            });
        }

        this.resume();
        return this.play('Greeting');
    };

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    // Add version info
    clippy.extensions = {
        version: '1.0.0',
        methods: [
            'speakAndAnimate', 'speakWithRepeatingAnimation', 'speakWithIdleAnimation',
            'randomAnimation', 'gestureDirection', 'animationSequence',
            'speakWithEmotion', 'whisper', 'announce',
            'setPersonality', 'greetWithPersonality', 'farewellWithPersonality',
            'contextualResponse', 'performSequence', 'getAnimationInfo', 'isBusy', 'getQueueLength',
            'showError', 'showSuccess', 'showLoading', 'showWarning'
        ]
    };

    // Log successful loading
    console.log('Clippy.js Extensions v' + clippy.extensions.version + ' loaded successfully!');
    console.log('Available methods:', clippy.extensions.methods);

})();