export const apps = [
  {
    id: "about",
    title: "About",
    icon: "./src/assets/icons/SHELL32_3.ico",
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
  },
  {
    id: "notepad",
    title: "Notepad",
    icon: "./src/assets/icons/notepad.ico",
    path: "/notepad/",
    action: {
      type: "window",
      window: {
        width: 500,
        height: 400,
        resizable: true,
        menuBar: {
          File: [
            {
              label: "&New",
              shortcutLabel: "Ctrl+N",
              action: () => console.log("New document"),
            },
            {
              label: "&Save",
              shortcutLabel: "Ctrl+S",
              action: () => console.log("Save document"),
            },
            { label: "-" },
            {
              label: "E&xit",
              action: (win) => win.close(),
            },
          ],
          Edit: [
            {
              label: "&Undo",
              shortcutLabel: "Ctrl+Z",
              enabled: false,
            },
            { label: "-" },
            {
              label: "Cu&t",
              shortcutLabel: "Ctrl+X",
            },
            {
              label: "&Copy",
              shortcutLabel: "Ctrl+C",
            },
            {
              label: "&Paste",
              shortcutLabel: "Ctrl+V",
            },
          ],
        },
        content: `
          <div class="notepad-content" style="padding: 8px;">
            <textarea style="width: 100%; height: calc(100% - 16px); resize: none;"></textarea>
          </div>
        `,
      },
    },
  },
  {
    id: "shutdown",
    title: "Shut Down",
    icon: "./src/assets/icons/shutdown.ico",
    action: {
      type: "function",
      handler: () => {
        if (confirm("Are you sure you want to shut down the system?")) {
          document.body.innerHTML =
            '<div style="text-align: center; padding-top: 40vh;">It is now safe to turn off your computer.</div>';
        }
      },
    },
  },
];
