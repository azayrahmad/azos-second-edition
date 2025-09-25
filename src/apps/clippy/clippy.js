// src/apps/clippy/clippy.js

export function launchClippyApp() {
  // Ensure only one instance of the window is created
  if (window.clippyToolWindow && !window.clippyToolWindow.isClosed) {
    window.clippyToolWindow.focus();
    return;
  }

  $(".clippy").remove(); // remove any existing instance

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
          enabled: !window.clippyToolWindow || window.clippyToolWindow.isClosed,
          click: () => launchClippyApp(),
        },
        "MENU_DIVIDER",
        {
          label: "Close",
          click: () => 
            {agent.hide();
              $(".clippy").remove();
            },
        },
      ];

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
          document.body.removeChild(menu.element);
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
      agent.hide();
      window.clippyAgent = null;
      window.clippyToolWindow = null;
    };
  });
}
