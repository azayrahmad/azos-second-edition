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
    <div class="clippy-input" style="padding: 10px; display: flex; flex-direction: column; align-items: center;">
      <input type="text" placeholder="Ask me anything..." style="width: 200px; margin-bottom: 5px;">
      <button class="default" style="width: 80px;">Ask</button>
    </div>
  `;

  agent._balloon.showHtml(balloonContent, true);

  const balloon = agent._balloon._balloon;
  const input = balloon.find("input");
  const askButton = balloon.find("button");

  input.focus();

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

export function getClippyMenuItems() {
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
          radioItems: [
            { label: "Clippy", value: "Clippy" },
            { label: "Genius", value: "Genius" },
          ],
          getValue: () => currentAgentName,
          setValue: (value) => {
            if (currentAgentName !== value) {
              setCurrentAgentName(value);
              launchClippyApp(value);
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
                agent.hide();
                $(".clippy, .clippy-balloon").remove();
                $(".os-menu").remove();
                const trayIcon = document.querySelector("#tray-icon-clippy");
                if (trayIcon) {
                  trayIcon.remove();
                }
                window.clippyAgent = null;
              });
            }
          }
        );
      },
    },
  ];
}

export function showClippyContextMenu(event) {
  // Remove any existing menus first (only one context menu at a time)
  const existingMenus = document.querySelectorAll(".menu-popup");
  existingMenus.forEach((menu) => menu.remove());

  const menuItems = getClippyMenuItems();
  const menu = new OS.MenuList(menuItems, { defaultLabel: 'Ask Clippy' });
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

export function launchClippyApp(agentName = currentAgentName) {
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

    agent.speak("Hey, there. Want quick answers to your questions? Just click me.", false, ttsEnabled);

    agent._el.on("click", () => showClippyInputBalloon());

    agent._el.on("contextmenu", function (e) {
      e.preventDefault();
      showClippyContextMenu(e);
    });
  });
}

