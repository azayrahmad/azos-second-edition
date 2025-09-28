// src/apps/clippy/clippy.js

export function launchClippyApp() {
  // Clean up any existing instance completely
  if (window.clippyAgent) {
    window.clippyAgent.hide();
    window.clippyAgent = null;
  }

  // Remove any existing elements
  $(".clippy, .clippy-balloon, .os-menu").remove();

  // Clear the window reference if it exists
  if (window.clippyToolWindow) {
    window.clippyToolWindow = null;
  }

  // Load Clippy agent
  clippy.load("Clippy", function (agent) {
    agent.show();

    // Configure TTS if available
    const ttsEnabled = agent.isTTSEnabled();
    if (ttsEnabled) {
      // Wait for voices to load, then set default male voice
      const setDefaultVoice = () => {
        const voices = agent.getTTSVoices();
        if (voices.length > 0) {
          // Find a male voice (prefer English voices)
          let defaultVoice = null;

          // Try to find a male English voice first
          defaultVoice = voices.find(voice =>
            voice.lang.startsWith('en') &&
            (voice.name.toLowerCase().includes('male') ||
             voice.name.toLowerCase().includes('david') ||
             voice.name.toLowerCase().includes('mark') ||
             voice.name.toLowerCase().includes('paul'))
          );

          // If no specifically male voice, try any English male-sounding voice
          if (!defaultVoice) {
            defaultVoice = voices.find(voice =>
              voice.lang.startsWith('en') &&
              !voice.name.toLowerCase().includes('female') &&
              !voice.name.toLowerCase().includes('karen') &&
              !voice.name.toLowerCase().includes('samantha') &&
              !voice.name.toLowerCase().includes('susan')
            );
          }

          // If still no voice, just use the first English voice
          if (!defaultVoice) {
            defaultVoice = voices.find(voice => voice.lang.startsWith('en'));
          }

          // Set default TTS options for natural male speech
          const defaultOptions = {
            rate: 0.9,    // Slightly slower for clarity
            pitch: 0.9,   // Lower pitch for masculine voice
            volume: 0.8   // Comfortable volume
          };

          if (defaultVoice) {
            defaultOptions.voice = defaultVoice;
          }

          agent.setTTSOptions(defaultOptions);
        }
      };

      // Set initial options (might get overridden when voices load)
      agent.setTTSOptions({
        rate: 0.9,
        pitch: 0.9,
        volume: 0.8
      });

      // Wait for voices to load
      if (window.speechSynthesis.getVoices().length > 0) {
        setDefaultVoice();
      } else {
        // Wait for voices to load
        window.speechSynthesis.addEventListener('voiceschanged', setDefaultVoice, { once: true });
        // Fallback timeout in case voiceschanged doesn't fire
        setTimeout(setDefaultVoice, 1000);
      }
    }

    // Speak greeting with TTS if available
    agent.speak("Hi there! Click me to ask anything about Aziz's resume.", false, ttsEnabled);
    window.clippyAgent = agent;

    // Define askClippy function
    const askClippy = async () => {
      const input = window.clippyToolWindow.$content.find("input");
      const askButton = window.clippyToolWindow.$content.find("button");
      const question = input.val().trim();
      if (!question) return;

      // Disable button and input during processing
      askButton.prop('disabled', true);
      input.prop('disabled', true);

      agent.speakAndAnimate(
        "Let me think about it...",
        "Thinking",
        { useTTS: ttsEnabled }
      );
      input.val("");

      try {
        // Encode the question for URL parameters
        const encodedQuestion = encodeURIComponent(question);
        const response = await fetch(
          `https://resume-chat-api-nine.vercel.app/api/clippy-helper?query=${encodedQuestion}`,
        );

        const data = await response.json();

        // Process each response fragment with its animation
        for (const fragment of data) {
          // Remove markdown formatting from the response
          const cleanAnswer = fragment.answer.replace(/\*\*/g, "");

          // Speak the response fragment with TTS
          await agent.speakAndAnimate(cleanAnswer, fragment.animation, {
            useTTS: ttsEnabled
          });
        }
      } catch (error) {
        agent.speakAndAnimate(
          "Sorry, I couldn't get an answer for that at this time!",
          "Wave",
          { useTTS: ttsEnabled }
        );
        console.error("API Error:", error);
      } finally {
        // Re-enable button and input if the window still exists
        if (window.clippyToolWindow) {
          askButton.prop('disabled', false);
          input.prop('disabled', false);
          input.focus();
        }
      }
    };

    // Add click handler to show tool window
    agent._el.on("click", function () {
      // Check if we already have an open window
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
          <input type="text"
            placeholder="Ask me anything...">
          <button class="default">Ask</button>
        </div>
      `);

      window.clippyToolWindow = toolWindow;
      toolWindow.focus();

      // Set up input handlers for the new window
      const input = toolWindow.$content.find("input");
      const askButton = toolWindow.$content.find("button");

      // Focus the input field immediately
      input.focus();

      input.on("keypress", (e) => {
        if (e.which === 13) askClippy();
      });

      askButton.on("click", askClippy);

      // Clean up when window is closed
      toolWindow.onClosed(() => {
        input.off();
        askButton.off();
        window.clippyToolWindow = null;
      });
    });

    // Add context menu
    const clippyEl = agent._el;
    clippyEl.on("contextmenu", function (e) {
      e.preventDefault();

      const menuItems = [
        {
          label: "Animate",
          click: () => agent.animate(),
        },
        {
          label: "Ask Clippy",
          enabled: !window.clippyToolWindow ||
            !window.clippyToolWindow.$element ||
            !window.clippyToolWindow.$element.closest('body'),
          click: () => launchClippyApp(),
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
        {
          label: "TTS Settings",
          enabled: ttsEnabled,
          click: () => {
            // Show TTS settings window
            showTTSSettingsWindow(agent);
          },
        },
        "MENU_DIVIDER",
        {
          label: "Close",
          click: () => {
            agent.speakAndAnimate(
              "Goodbye! Just open me again if you need any help!",
              "GoodBye",
              {
                useTTS: ttsEnabled,
                callback: () => {
                  agent.hide();
                  $(".clippy, .clippy-balloon").remove();
                  // Remove any context menus that might be left over
                  $(".os-menu").remove();
                  // Close the tool window if it exists
                  if (window.clippyToolWindow) {
                    window.clippyToolWindow.close();
                  }
                }
              }
            );
          },
        },
      ];

      // Remove any existing menus
      const existingMenus = document.querySelectorAll('.menu-popup');
      existingMenus.forEach(menu => menu.remove());

      const menu = new OS.MenuList(menuItems);
      document.body.appendChild(menu.element);

      // Set positioning and z-index
      menu.element.style.position = "absolute";
      menu.element.style.zIndex = 10000; // Ensure menu is on top of clippy

      // Use smart positioning with click coordinates
      menu.show(e.pageX, e.pageY);

      // Close menu when clicking outside
      const closeMenu = (e) => {
        if (!menu.element.contains(e.target)) {
          menu.hide();
          if (menu.element.parentNode) {
            document.body.removeChild(menu.element);
          }
          document.removeEventListener("click", closeMenu);
        }
      };

      document.addEventListener("click", closeMenu);
    });
  });
}

// TTS Settings Window Function
function showTTSSettingsWindow(agent) {
  // Check if TTS settings window already exists
  if (window.ttsSettingsWindow) {
    window.ttsSettingsWindow.focus();
    return;
  }

  const ttsWindow = new $Window({
    title: "TTS Settings",
    width: 350,
    height: 280,
    resizable: false,
    maximizeButton: false,
    minimizeButton: false,
  });

  // Get current TTS settings
  const currentOptions = agent._balloon._ttsOptions;

  ttsWindow.$content.append(`
    <div style="padding: 15px; font-family: 'MS Sans Serif', sans-serif;">
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Voice:</label>
        <select id="tts-voice-select" style="width: 100%; padding: 3px;">
          <option value="">Loading voices...</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          Rate: <span id="rate-value">${currentOptions.rate}</span>
        </label>
        <input type="range" id="tts-rate" min="0.1" max="2" step="0.1" value="${currentOptions.rate}"
               style="width: 100%;">
        <div style="font-size: 11px; color: #666;">0.1 (slow) - 2.0 (fast)</div>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          Pitch: <span id="pitch-value">${currentOptions.pitch}</span>
        </label>
        <input type="range" id="tts-pitch" min="0" max="2" step="0.1" value="${currentOptions.pitch}"
               style="width: 100%;">
        <div style="font-size: 11px; color: #666;">0 (low) - 2 (high)</div>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          Volume: <span id="volume-value">${Math.round(currentOptions.volume * 100)}%</span>
        </label>
        <input type="range" id="tts-volume" min="0" max="1" step="0.1" value="${currentOptions.volume}"
               style="width: 100%;">
        <div style="font-size: 11px; color: #666;">0% - 100%</div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <button id="test-tts-btn" style="margin-right: 10px;">Test Voice</button>
        <button id="save-tts-btn">Save Settings</button>
      </div>
    </div>
  `);

  window.ttsSettingsWindow = ttsWindow;
  ttsWindow.focus();

  // Function to populate voices dropdown
  const populateVoices = () => {
    const voices = agent.getTTSVoices();
    const voiceSelect = ttsWindow.$content.find('#tts-voice-select');

    if (voices.length > 0) {
      voiceSelect.html(`
        <option value="">Default Voice</option>
        ${voices.map(voice =>
          `<option value="${voice.name}" ${currentOptions.voice && currentOptions.voice.name === voice.name ? 'selected' : ''}>
            ${voice.name} (${voice.lang})
          </option>`
        ).join('')}
      `);
    } else {
      voiceSelect.html('<option value="">No voices available</option>');
    }
  };

  // Populate voices immediately if available, or wait for them to load
  if (window.speechSynthesis.getVoices().length > 0) {
    populateVoices();
  } else {
    // Wait for voices to load
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices, { once: true });
    // Fallback timeout
    setTimeout(populateVoices, 2000);
  }

  // Set up event listeners
  const rateSlider = ttsWindow.$content.find('#tts-rate');
  const pitchSlider = ttsWindow.$content.find('#tts-pitch');
  const volumeSlider = ttsWindow.$content.find('#tts-volume');
  const testBtn = ttsWindow.$content.find('#test-tts-btn');
  const saveBtn = ttsWindow.$content.find('#save-tts-btn');

  // Update value displays
  rateSlider.on('input', function() {
    ttsWindow.$content.find('#rate-value').text(this.value);
  });

  pitchSlider.on('input', function() {
    ttsWindow.$content.find('#pitch-value').text(this.value);
  });

  volumeSlider.on('input', function() {
    ttsWindow.$content.find('#volume-value').text(Math.round(this.value * 100) + '%');
  });

  // Test TTS button
  testBtn.on('click', function() {
    const voiceSelect = ttsWindow.$content.find('#tts-voice-select');
    const selectedVoiceName = voiceSelect.val();
    const selectedVoice = selectedVoiceName ? voices.find(v => v.name === selectedVoiceName) : null;

    const testOptions = {
      voice: selectedVoice,
      rate: parseFloat(rateSlider.val()),
      pitch: parseFloat(pitchSlider.val()),
      volume: parseFloat(volumeSlider.val())
    };

    agent.setTTSOptions(testOptions);
    agent.speak("This is a test of my voice settings.", false, true);
  });

  // Save settings button
  saveBtn.on('click', function() {
    const voiceSelect = ttsWindow.$content.find('#tts-voice-select');
    const selectedVoiceName = voiceSelect.val();
    const selectedVoice = selectedVoiceName ? voices.find(v => v.name === selectedVoiceName) : null;

    const newOptions = {
      voice: selectedVoice,
      rate: parseFloat(rateSlider.val()),
      pitch: parseFloat(pitchSlider.val()),
      volume: parseFloat(volumeSlider.val())
    };

    agent.setTTSOptions(newOptions);
    agent.speak("Voice settings saved successfully!", false, true);
    ttsWindow.close();
  });

  // Clean up when window is closed
  ttsWindow.onClosed(() => {
    window.ttsSettingsWindow = null;
  });
}
