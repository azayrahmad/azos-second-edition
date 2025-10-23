import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';

window.clippyAppInstance = null;
let currentAgentName = getItem(LOCAL_STORAGE_KEYS.CLIPPY_AGENT_NAME) || "Clippy";
let inputBalloonTimeout = null;

function setCurrentAgentName(name) {
  currentAgentName = name;
  setItem(LOCAL_STORAGE_KEYS.CLIPPY_AGENT_NAME, name);
}

function showClippyInputBalloon() {
  const agent = window.clippyAgent;
  if (!agent) return;

  agent.stop();

  const balloonContent = `
    <div class="clippy-input" style="display: flex; flex-direction: column; align-items: center; padding: 5px;">
      <b style="align-self: flex-start; margin-bottom: 5px;">What would you like to do?</b>
      <textarea rows="2" placeholder="Ask me anything..." style="width: 100%; margin-bottom: 10px; background-color: white; border: 1px solid grey; box-shadow: none; resize: none; font-family: inherit; font-size: inherit;"></textarea>
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <button class="ask-button default" style="margin-right: 5px; background-color: transparent; border: 1px solid grey; border-radius: 4px; width: 70px">Ask</button>
        <button class="cancel-button" style="background-color: transparent; border: 1px solid grey; border-radius: 4px; width: 70px">Cancel</button>
      </div>
    </div>
  `;

  agent._balloon.showHtml(balloonContent, true);

  const balloon = agent._balloon._balloon;
  const input = balloon.find("textarea");
  const askButton = balloon.find(".ask-button");
  const cancelButton = balloon.find(".cancel-button");

  input.focus();

  // Reposition balloon after a delay to allow for rendering
  setTimeout(() => {
    agent._balloon.reposition();
  }, 0);

  const resetBalloonTimeout = () => {
    if (inputBalloonTimeout) {
      clearTimeout(inputBalloonTimeout);
    }
    inputBalloonTimeout = setTimeout(() => {
      agent.closeBalloon();
    }, 60000); // 1 minute
  };

  const clearBalloonTimeout = () => {
    if (inputBalloonTimeout) {
      clearTimeout(inputBalloonTimeout);
    }
  };

  const askClippyHandler = () => {
    clearBalloonTimeout();
    const question = input.val();
    askClippy(agent, question);
    agent.closeBalloon();
  };

  input.on("keypress", (e) => {
    resetBalloonTimeout();
    if (e.which === 13) {
      e.preventDefault();
      askClippyHandler();
    }
  });

  askButton.on("click", askClippyHandler);

  cancelButton.on("click", () => {
    clearBalloonTimeout();
    agent.closeBalloon();
  });

  resetBalloonTimeout(); // Start the timer when the balloon is shown
}

async function askClippy(agent, question) {
  if (!question || question.trim().length === 0) return;

  const ttsEnabled = agent.isTTSEnabled();
  agent.speakAndAnimate("Let me think about it...", "Thinking", { useTTS: ttsEnabled });

  try {
    const encodedQuestion = encodeURIComponent(question.trim());
    const response = await fetch(`https://resume-chat-api-nine.vercel.app/api/clippy-helper?query=${encodedQuestion}`);
    const data = await response.json();

    for (const fragment of data) {
      const cleanAnswer = fragment.answer.replace(/\*\*/g, "");
      await agent.speakAndAnimate(cleanAnswer, fragment.animation, { useTTS: ttsEnabled });
    }
  } catch (error) {
    agent.speakAndAnimate("Sorry, I couldn't get an answer for that at this time!", "Wave", { useTTS: ttsEnabled });
    console.error("API Error:", error);
  }
}

import { AGENT_NAMES } from "../../config/agents.js";

export function getClippyMenuItems(app) {
  const appInstance = app || window.clippyAppInstance;
  const agent = window.clippyAgent;
  if (!agent) {
    return [{ label: "Clippy not available", enabled: false }];
  }

  const ttsEnabled = agent.isTTSEnabled();

  return [
    {
      label: "&Animate",
      click: () => agent.animate(),
    },
    {
      label: "&Ask Clippy",
      click: () => showClippyInputBalloon(),
    },
    {
      label: "&Tutorial",
      click: () => {
        startTutorial(agent);
      },
    },
    {
      label: "Enable &TTS",
      checkbox: {
        check: () => getItem(LOCAL_STORAGE_KEYS.CLIPPY_TTS_ENABLED) ?? true,
        toggle: () => {
          const currentState = getItem(LOCAL_STORAGE_KEYS.CLIPPY_TTS_ENABLED) ?? true;
          const newState = !currentState;
          setItem(LOCAL_STORAGE_KEYS.CLIPPY_TTS_ENABLED, newState);
          if (agent) agent.setTTSEnabled(newState);
        },
      },
    },
    "MENU_DIVIDER",
    {
      label: "A&gent",
      submenu: [
        {
          radioItems: AGENT_NAMES.map(name => ({ label: name, value: name })),
          getValue: () => currentAgentName,
          setValue: (value) => {
            if (currentAgentName !== value) {
              setCurrentAgentName(value);
              launchClippyApp(appInstance, value);
            }
          },
        },
      ],
    },
    "MENU_DIVIDER",
    {
      label: "&Close",
      click: () => {
        agent.speakAndAnimate(
          "Goodbye! Just open me again if you need any help!",
          "Wave",
          {
            useTTS: ttsEnabled,
            callback: () => {
              agent.play(agent.getGoodbyeAnimation(), 5000, () => {
                if (appInstance) {
                  appInstance.close();
                }
              });
            }
          }
        );
      },
    },
  ];
}

export function showClippyContextMenu(event, app) {
  // Remove any existing menus first (only one context menu at a time)
  const existingMenus = document.querySelectorAll(".menu-popup");
  existingMenus.forEach((menu) => menu.remove());

  const menuItems = getClippyMenuItems(app);
  const menu = new MenuList(menuItems, { defaultLabel: 'Ask Clippy' });
  document.body.appendChild(menu.element);

  // Set z-index if Win98System is available
  if (window.Win98System) {
    menu.element.style.zIndex = window.Win98System.incrementZIndex();
  }

  // Position and show the menu
  const menuHeight = menu.element.offsetHeight;
  menu.show(event.pageX, event.pageY - menuHeight);

  // Handle click outside to close
  const closeMenu = (e) => {
    if (!menu.element.contains(e.target)) {
      menu.hide();
      if (menu.element.parentNode) {
        document.body.removeChild(menu.element);
      }
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("contextmenu", closeMenu);
    }
  };

  // Use setTimeout to prevent immediate closing
  setTimeout(() => {
    document.addEventListener("click", closeMenu);
    document.addEventListener("contextmenu", closeMenu);
  }, 0);
}

export function launchClippyApp(app, agentName = currentAgentName) {
  if (app) {
    window.clippyAppInstance = app;
  }
  const appInstance = app || window.clippyAppInstance;

  if (window.clippyAgent) {
    // Gracefully hide and remove the current agent before loading a new one
    window.clippyAgent.hide(() => {
      $(".clippy, .clippy-balloon").remove();
    });
  } else {
    $(".clippy, .clippy-balloon").remove();
  }

  // Ensure the menu is removed if it exists
  const existingMenus = document.querySelectorAll(".menu-popup");
  existingMenus.forEach((menu) => menu.remove());

  clippy.load(agentName, function (agent) {
    window.clippyAgent = agent;

    const ttsUserPref = getItem(LOCAL_STORAGE_KEYS.CLIPPY_TTS_ENABLED) ?? true;
    agent.setTTSEnabled(ttsUserPref);

    agent.show();

    let contextMenuOpened = false;

    const ttsEnabled = agent.isTTSEnabled();
    if (ttsEnabled) {
      const setDefaultVoice = () => {
        const voices = agent.getTTSVoices();
        if (voices.length > 0) {
          // Improved voice selection logic
          const englishVoices = voices.filter(v => v.lang.startsWith('en'));

          // Prioritize male-sounding voices by name patterns
          let defaultVoice = englishVoices.find(v =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('alex') ||
            v.name.toLowerCase().includes('fred') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('paul') ||
            v.name.toLowerCase().includes('tom') ||
            v.name.toLowerCase().includes('mark') ||
            v.name.toLowerCase().includes('james') ||
            v.name.toLowerCase().includes('michael')
          );

          // If no male voice found, prefer voices that are NOT obviously female
          if (!defaultVoice) {
            const femaleNames = ['zira', 'hazel', 'samantha', 'susan', 'karen', 'sara', 'emma', 'lucy', 'anna'];
            const nonFemaleVoices = englishVoices.filter(v =>
              !femaleNames.some(name => v.name.toLowerCase().includes(name)) &&
              !v.name.toLowerCase().includes('female')
            );

            if (nonFemaleVoices.length > 0) {
              defaultVoice = nonFemaleVoices[0]; // Take first non-female voice
            } else {
              defaultVoice = englishVoices[0]; // Fallback to any English voice
            }
          }

          agent.setTTSOptions({ voice: defaultVoice, rate: 0.9, pitch: 0.9, volume: 0.8 });
        }
      };
      if (window.speechSynthesis.getVoices().length) {
        setDefaultVoice();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', setDefaultVoice, { once: true });
      }
    }

    agent.isSpeaking = false; // Initial state

    // Wrap the original speakAndAnimate function
    const originalSpeakAndAnimate = agent.speakAndAnimate;
    agent.speakAndAnimate = function (text, animation, options) {
      agent.isSpeaking = true;
      const originalCallback = options?.callback;
      const newOptions = {
        ...options,
        callback: () => {
          if (originalCallback) {
            originalCallback();
          }
          agent.isSpeaking = false;
        },
      };
      return originalSpeakAndAnimate.call(this, text, animation, newOptions);
    };

    agent.speakAndAnimate(
      "Hey, there. Want quick answers to your questions? Just click me.",
      "Explain",
      { useTTS: ttsEnabled }
    );

    let isDragging = false;
    let wasDragged = false;
    let offsetX, offsetY;

    const handleDragStart = (e) => {
      if (e.type === 'mousedown' && e.button !== 0) return;
      if (agent.isSpeaking) return;

      isDragging = true;
      wasDragged = false;
      agent.stop();

      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

      const agentRect = agent._el[0].getBoundingClientRect();
      offsetX = clientX - agentRect.left;
      offsetY = clientY - agentRect.top;

      if (e.type === 'mousedown') {
        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);
      } else if (e.type === 'touchstart') {
        document.addEventListener("touchmove", handleDragMove, { passive: false });
        document.addEventListener("touchend", handleDragEnd);
      }
    };

    const handleDragMove = (e) => {
      if (!isDragging) return;
      wasDragged = true;
      if (e.type === 'touchmove') {
        e.preventDefault();
      }

      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      let newX = clientX - offsetX;
      let newY = clientY - offsetY;

      const agentRect = agent._el[0].getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Constrain the agent within the viewport
      newX = Math.max(0, Math.min(newX, viewportWidth - agentRect.width));
      newY = Math.max(0, Math.min(newY, viewportHeight - agentRect.height));

      agent.moveTo(newX, newY);
    };

    const handleDragEnd = () => {
      isDragging = false;

      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);

      setTimeout(() => {
        wasDragged = false;
      }, 0);
    };

    agent._el.on("click", (e) => {
      if (wasDragged || contextMenuOpened) {
        contextMenuOpened = false;
        return;
      }
      if (agent.isSpeaking) return;
      // Also check if a context menu is open
      if (document.querySelector('.menu-popup')) return;
      showClippyInputBalloon();
    });

    agent._el.on("contextmenu", function (e) {
      if (agent.isSpeaking) return;
      e.preventDefault();
      contextMenuOpened = true;
      showClippyContextMenu(e, appInstance);
    });

    agent._el.on("mousedown", handleDragStart);
    agent._el.on("touchstart", handleDragStart, { passive: true });
  });
}

function startTutorial(agent) {
  if (!agent || agent.isSpeaking) return;

  agent.stop();
  const ttsEnabled = agent.isTTSEnabled();
  const initialPos = agent._el.offset();

  const getElementTopLeft = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  };

  const getElementCenter = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const playGesture = (x, y, callback) => {
    const direction = agent._getDirection(x, y);
    const gestureAnim = "Gesture" + direction;
    const lookAnim = "Look" + direction;
    const animation = agent.hasAnimation(gestureAnim) ? gestureAnim : lookAnim;
    agent.play(animation, 3000, callback);
  };

  const appMakerIcon = getElementTopLeft('.desktop-icon[for="appMaker"]');
  const notepadIcon = getElementTopLeft('.desktop-icon[for="notepad"]');
  const assistantIcon = getElementTopLeft('.desktop-icon[for="clippy"]');
  const startButton = getElementCenter('.start-button');
  const iconsArea = { x: 40, y: 100 };

  const sequence = [];

  // 1. Welcome
  sequence.push(
    (done) => agent.speakAndAnimate("Hi! I'm your assistant. Let me give you a quick tour of azOS.", "Greeting", { useTTS: ttsEnabled, callback: done })
  );

  // 2. Desktop Icons
  sequence.push(
    (done) => agent._el.animate({ top: iconsArea.y, left: iconsArea.x + 100 }, 1500, done)
  );
  sequence.push(
    (done) => playGesture(iconsArea.x, iconsArea.y, done)
  );
  sequence.push(
    (done) => agent.speakAndAnimate("On the left, you'll find desktop icons. Double-click them to launch apps.", "Explain", { useTTS: ttsEnabled, callback: done })
  );


  // 3. Start Menu
  if (startButton) {
    sequence.push(
      (done) => agent._el.animate({ top: startButton.y - 80, left: startButton.x + 80 }, 1500, done)
    );
    sequence.push(
      (done) => playGesture(startButton.x, startButton.y, done)
    );
    sequence.push(
      (done) => agent.speakAndAnimate("The Start button gives you access to all your programs.", "Explain", { useTTS: ttsEnabled, callback: done })
    );
  }

  // 4. App Maker
  if (appMakerIcon) {
    sequence.push(
      (done) => agent._el.animate({ top: appMakerIcon.y, left: appMakerIcon.x + 80 }, 1500, done)
    );
    sequence.push(
      (done) => playGesture(appMakerIcon.x, appMakerIcon.y, done)
    );
    sequence.push(
      (done) => agent.speakAndAnimate("With App Maker, you can create your own applications!", "Explain", { useTTS: ttsEnabled, callback: done })
    );
  }

  // 5. Notepad
  if (notepadIcon) {
    sequence.push(
      (done) => agent._el.animate({ top: notepadIcon.y, left: notepadIcon.x + 80 }, 1500, done)
    );
    sequence.push(
      (done) => playGesture(notepadIcon.x, notepadIcon.y, done)
    );
    sequence.push(
      (done) => agent.speakAndAnimate("Notepad is a simple text editor for notes and code.", "Explain", { useTTS: ttsEnabled, callback: done })
    );
  }

  // 6. Assistant
  if (assistantIcon) {
    sequence.push(
      (done) => agent._el.animate({ top: assistantIcon.y, left: assistantIcon.x + 80 }, 1500, done)
    );
    sequence.push(
      (done) => playGesture(assistantIcon.x, assistantIcon.y, done)
    );
    sequence.push(
      (done) => agent.speakAndAnimate("And this is me! Right-click me for options or left-click to ask a question.", "Congratulate", { useTTS: ttsEnabled, callback: done })
    );
  }

  // 7. Return home
  sequence.push(
    (done) => agent._el.animate({ top: initialPos.top, left: initialPos.left }, 2000, done)
  );
  sequence.push(
    (done) => agent.speakAndAnimate("That's the tour! Let me know if you need anything else.", "Wave", { useTTS: ttsEnabled, callback: done })
  );

  // --- Sequence Executor ---
  let currentIndex = 0;
  function runNext() {
    if (currentIndex < sequence.length) {
      const step = sequence[currentIndex];
      currentIndex++;
      step(runNext); // Pass the executor as the 'done' callback
    }
  }

  runNext();
}