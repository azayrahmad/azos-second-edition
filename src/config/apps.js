export const apps = [
  {
    id: "about",
    title: "About",
    icon: new URL('../assets/icons/COMCTL32_20481.ico', import.meta.url).href,
    path: "/about/",
    action: {
      type: "window",
      window: {
        width: 400,
        height: 300,
        resizable: true,
        menuBar: {
          File: [
            {
              label: "&Close",
              action: (win) => win.close(),
              shortcutLabel: "Alt+F4",
            },
          ],
          Help: [
            {
              label: "&About",
              action: () => alert("About this app"),
            },
          ],
        },
        content: `
          <div class="about-content" style="padding: 16px;">
            <h1>About azOS</h1>
            <p>azOS Second Edition is a web-based operating system interface.</p>
          </div>
        `,
      },
    },
    contextMenu: [
      { label: '&Open', action: 'open' },
      'MENU_DIVIDER',
      { label: 'Cu&t', enabled: false },
      { label: '&Copy', enabled: false },
      { label: '&Create Shortcut', enabled: false },
      { label: '&Delete', enabled: false },
      'MENU_DIVIDER',
      { label: 'Rena&me', enabled: false },
      { label: 'Proper&ties', action: 'properties' },
    ]
  },
  // {
  //   id: "notepad",
  //   title: "Notepad",
  //   icon: "./src/assets/icons/notepad.ico",
  //   path: "/notepad/",
  //   action: {
  //     type: "window",
  //     window: {
  //       width: 500,
  //       height: 400,
  //       resizable: true,
  //       menuBar: {
  //         File: [
  //           {
  //             label: "&New",
  //             shortcutLabel: "Ctrl+N",
  //             action: () => console.log("New document"),
  //           },
  //           {
  //             label: "&Save",
  //             shortcutLabel: "Ctrl+S",
  //             action: () => console.log("Save document"),
  //           },
  //           { label: "-" },
  //           {
  //             label: "E&xit",
  //             action: (win) => win.close(),
  //           },
  //         ],
  //         Edit: [
  //           {
  //             label: "&Undo",
  //             shortcutLabel: "Ctrl+Z",
  //             enabled: false,
  //           },
  //           { label: "-" },
  //           {
  //             label: "Cu&t",
  //             shortcutLabel: "Ctrl+X",
  //           },
  //           {
  //             label: "&Copy",
  //             shortcutLabel: "Ctrl+C",
  //           },
  //           {
  //             label: "&Paste",
  //             shortcutLabel: "Ctrl+V",
  //           },
  //         ],
  //       },
  //       content: `
  //         <div class="notepad-content" style="padding: 8px;">
  //           <textarea style="width: 100%; height: calc(100% - 16px); resize: none;"></textarea>
  //         </div>
  //       `,
  //     },
  //   },
  // },
  // {
  //   id: "shutdown",
  //   title: "Shut Down",
  //   icon: "./src/assets/icons/shutdown.ico",
  //   action: {
  //     type: "function",
  //     handler: () => {
  //       if (confirm("Are you sure you want to shut down the system?")) {
  //         document.body.innerHTML =
  //           '<div style="text-align: center; padding-top: 40vh;">It is now safe to turn off your computer.</div>';
  //       }
  //     },
  //   },
  // },
  {
    id: "clippy",
    title: "Office Assistant",
    icon: new URL('..\assets\icons\SETDEBUG_100.ico', import.meta.url).href,
    action: {
      type: "function",
      handler: () => {
        $(".clippy").remove(); // remove any existing instance

        // Create tool window
        const toolWindow = new $Window({
          title: "Ask Clippy",
          // toolWindow: true,
          width: 300,
          height: 120,
          resizable: false,
          maximizeButton: false,
          minimizeButton: false,
          content: `
            <div class="clippy-input" style="padding: 10px;">
              <input type="text" 
                style="width: 100%; padding: 5px; margin-bottom: 10px;"
                placeholder="Ask me anything...">
              <button class="default">Ask</button>
            </div>
          `
        });
        toolWindow.$content.append(`
            <div class="clippy-input" style="padding: 10px;">
              <input type="text" 
                placeholder="Ask me anything...">
              <button class="default">Ask</button>
            </div>
          `);


        // Focus the window
        toolWindow.focus();

        // Load Clippy agent
        clippy.load("Clippy", function (agent) {
          agent.show();
          agent.speak("Hi there! Type your question and press Enter or click Ask!");
          window.clippyAgent = agent;

          // Handle input events
          const input = toolWindow.$content.find('input');
          const askButton = toolWindow.$content.find('button');

          // Focus the input field immediately
          input.focus();

          const askClippy = async () => {
            const question = input.val().trim();
            if (!question) return;

            // agent.speak("Let me think about that...");

            agent.speakAndAnimate("Let me look at the resume...", "CheckingSomething");
            input.val('');

            try {
              // Encode the question for URL parameters
              const encodedQuestion = encodeURIComponent(question);
              const response = await fetch(
                `https://resume-chat-api-nine.vercel.app/api/resume-helper?query=${encodedQuestion}`
              );

              const data = await response.json();

              // Process each response fragment with its animation
              for (const fragment of data) {
                // Remove markdown formatting from the response
                const cleanAnswer = fragment.answer.replace(/\*\*/g, '');

                // Speak the response fragment
                await agent.speakAndAnimate(cleanAnswer, fragment.animation);
              }
            } catch (error) {
              agent.speakAndAnimate("Sorry, I couldn't get an answer for that!", "Alert");
              console.error('API Error:', error);
            }
          };

          // Handle Enter key
          input.on('keypress', (e) => {
            if (e.which === 13) askClippy();
          });

          // Handle button click
          askButton.on('click', askClippy);

          // Clean up when window is closed
          toolWindow.onClosed = () => {
            agent.hide();
            window.clippyAgent = null;
          };
        });
      }
    },
    contextMenu: [
      { label: '&Open', action: 'open' },
      'MENU_DIVIDER',
      { label: 'Cu&t', enabled: false },
      { label: '&Copy', enabled: false },
      { label: '&Create Shortcut', enabled: false },
      { label: '&Delete', enabled: false },
      'MENU_DIVIDER',
      { label: 'Rena&me', enabled: false },
      { label: 'Proper&ties', action: 'properties' },
    ]
  },
];
