window.clippyAppInstance = null;
let currentAgentName = localStorage.getItem("clippyAgentName") || "Clippy";
let inputBalloonTimeout = null;

function setCurrentAgentName(name) {
  currentAgentName = name;
  localStorage.setItem("clippyAgentName", name);
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
      label: "&Help",
      click: () => {
        agent.speakAndAnimate(
          "Hi! I'm here to help you learn about Aziz Rahmad's resume. You can ask me questions about his skills, experience, education, or projects. For example, try asking: 'What are Aziz's technical skills?', 'Tell me about his work experience', or 'What projects has he worked on?' Just click on me and type your question in the input box that appears!",
          "Explain",
          { useTTS: ttsEnabled }
        );
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
              agent.play("GoodBye", 5000, () => {
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

    agent._el.on("click", (e) => {
      if (contextMenuOpened) {
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
  });
}