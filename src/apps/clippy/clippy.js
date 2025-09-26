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

  // Create tool window
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

  // Focus the window
  toolWindow.focus();

  // Load Clippy agent
  clippy.load("Clippy", function (agent) {
    agent.show();
    agent.speak("Hi there! Type your question and press Enter or click Ask!");
    window.clippyAgent = agent;

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

    // Handle input events
    const input = toolWindow.$content.find("input");
    const askButton = toolWindow.$content.find("button");

    // Focus the input field immediately
    input.focus();

    const askClippy = async () => {
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

    // Handle Enter key
    input.on("keypress", (e) => {
      if (e.which === 13) askClippy();
    });

    // Handle button click
    askButton.on("click", askClippy);

    // Clean up when window is closed
    toolWindow.onClosed = () => {
      // Hide and cleanup the agent
      if (window.clippyAgent) {
        window.clippyAgent.hide();
        window.clippyAgent = null;
      }

      // Remove all clippy-related DOM elements
      $(".clippy, .clippy-balloon, .os-menu").remove();

      // Clear global references
      window.clippyAgent = null;
      window.clippyToolWindow = null;

      // Force cleanup of event listeners
      toolWindow.$content.find("input").off();
      toolWindow.$content.find("button").off();
    };
  });
}
