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
    agent.speak("Hi there! Click me to ask anything about Aziz's resume.");
    window.clippyAgent = agent;

    // Define askClippy function
    const askClippy = async () => {
      const input = window.clippyToolWindow.$content.find("input");
      const question = input.val().trim();
      if (!question) return;

      agent.speakAndAnimate(
        "Let me look at the resume...",
        "CheckingSomething",
      );
      input.val("");

      try {
        // Encode the question for URL parameters
        const encodedQuestion = encodeURIComponent(question);
        const response = await fetch(
          `https://resume-chat-api-nine.vercel.app/api/resume-helper?query=${encodedQuestion}`,
        );

        const data = await response.json();

        // Process each response fragment with its animation
        for (const fragment of data) {
          // Remove markdown formatting from the response
          const cleanAnswer = fragment.answer.replace(/\*\*/g, "");

          // Speak the response fragment
          await agent.speakAndAnimate(cleanAnswer, fragment.animation);
        }
      } catch (error) {
        agent.speakAndAnimate(
          "Sorry, I couldn't get an answer for that!",
          "Alert",
        );
        console.error("API Error:", error);
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
      toolWindow.onClosed = () => {
        input.off();
        askButton.off();
        window.clippyToolWindow = null;
      };
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
              "Explain"
            );
          },
        },
        "MENU_DIVIDER",
        {
          label: "Close",
          click: () => {
            agent.hide();
            $(".clippy, .clippy-balloon").remove();
            // Remove any context menus that might be left over
            $(".os-menu").remove();
            toolWindow.close();
          },
        },
      ];

      // Remove any existing menus
      const existingMenus = document.querySelectorAll('.menu-popup');
      existingMenus.forEach(menu => menu.remove());

      const menu = new OS.MenuList(menuItems);
      document.body.appendChild(menu.element);

      // Position the menu at click coordinates
      menu.element.style.position = "absolute";
      menu.element.style.left = `${e.pageX}px`;
      menu.element.style.top = `${e.pageY}px`;
      menu.element.style.zIndex = 10000; // Ensure menu is on top of clippy
      menu.show();

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
