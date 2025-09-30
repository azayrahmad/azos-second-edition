function showClippyToolWindow() {
  const agent = window.clippyAgent;
  if (!agent) return;

  if (window.clippyToolWindow) {
    window.clippyToolWindow.focus();
    return;
  }

  const toolWindow = new $Window({
    title: "Ask Clippy",
    width: 300,
    height: 120,
    resizable: false,
    maximizeButton: false,
    minimizeButton: false,
  });

  toolWindow.$content.append(`
    <div class="clippy-input" style="padding: 10px;">
      <input type="text" placeholder="Ask me anything...">
      <button class="default">Ask</button>
    </div>
  `);

  window.clippyToolWindow = toolWindow;
  toolWindow.focus();

  const input = toolWindow.$content.find("input");
  const askButton = toolWindow.$content.find("button");
  input.focus();

  const askClippyHandler = () => askClippy(agent, toolWindow);
  input.on("keypress", (e) => {
    if (e.which === 13) askClippyHandler();
  });
  askButton.on("click", askClippyHandler);

  toolWindow.onClosed(() => {
    input.off();
    askButton.off();
    window.clippyToolWindow = null;
  });
}

async function askClippy(agent, toolWindow) {
  const input = toolWindow.$content.find("input");
  const askButton = toolWindow.$content.find("button");
  const question = input.val().trim();
  if (!question) return;

  askButton.prop('disabled', true);
  input.prop('disabled', true);

  const ttsEnabled = agent.isTTSEnabled();
  agent.speakAndAnimate("Let me think about it...", "Thinking", { useTTS: ttsEnabled });
  input.val("");

  try {
    const encodedQuestion = encodeURIComponent(question);
    const response = await fetch(`https://resume-chat-api-nine.vercel.app/api/clippy-helper?query=${encodedQuestion}`);
    const data = await response.json();

    for (const fragment of data) {
      const cleanAnswer = fragment.answer.replace(/\*\*/g, "");
      await agent.speakAndAnimate(cleanAnswer, fragment.animation, { useTTS: ttsEnabled });
    }
  } catch (error) {
    agent.speakAndAnimate("Sorry, I couldn't get an answer for that at this time!", "Wave", { useTTS: ttsEnabled });
    console.error("API Error:", error);
  } finally {
    if (window.clippyToolWindow) {
      askButton.prop('disabled', false);
      input.prop('disabled', false);
      input.focus();
    }
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
      label: "Animate",
      click: () => agent.animate(),
    },
    {
      label: "Ask Clippy",
      click: () => showClippyToolWindow(),
    },
    {
      label: "Help",
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
      label: "Close",
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
                if (window.clippyToolWindow) {
                  window.clippyToolWindow.close();
                }
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

export function launchClippyApp() {
  if (window.clippyAgent) {
    window.clippyAgent.hide();
  }
  $(".clippy, .clippy-balloon, .os-menu").remove();
  if (window.clippyToolWindow) {
    window.clippyToolWindow.close();
    window.clippyToolWindow = null;
  }

  clippy.load("Clippy", function (agent) {
    window.clippyAgent = agent;
    agent.show();

    const ttsEnabled = agent.isTTSEnabled();
    if (ttsEnabled) {
      const setDefaultVoice = () => {
        const voices = agent.getTTSVoices();
        if (voices.length > 0) {
          let defaultVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
          if (!defaultVoice) defaultVoice = voices.find(v => v.lang.startsWith('en'));

          agent.setTTSOptions({ voice: defaultVoice, rate: 0.9, pitch: 0.9, volume: 0.8 });
        }
      };
      if (window.speechSynthesis.getVoices().length) {
        setDefaultVoice();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', setDefaultVoice, { once: true });
      }
    }

    agent.speak("Hi there! Click me to ask anything about Aziz's resume.", false, ttsEnabled);

    agent._el.on("click", () => showClippyToolWindow());

    agent._el.on("contextmenu", function (e) {
      e.preventDefault();
      const menuItems = getClippyMenuItems();
      const menu = new OS.MenuList(menuItems);
      document.body.appendChild(menu.element);
      menu.show(e.pageX, e.pageY);
    });
  });
}

