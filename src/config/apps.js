import { launchClippyApp, getClippyMenuItems } from "../apps/clippy/clippy.js";
import { launchWebampApp, getWebampMenuItems } from "../apps/webamp/webamp.js";
import { aboutContent } from "../apps/about/about.js";
import { resumeContent } from "../apps/resume/resume.js";
import { tipOfTheDayContent, setup as tipOfTheDaySetup } from "../apps/tipOfTheDay/tipOfTheDay.js";
import { notepadContent } from "../apps/notepad/notepad.js";

export const apps = [
  {
    id: "about",
    title: "About",
    icon: new URL("../assets/icons/COMCTL32_20481.ico", import.meta.url).href,
    path: "/about/",
    hasTaskbarButton: true,
    action: {
      type: "window",
      window: {
        width: 500,
        height: 300,
        resizable: false,
        minimizeButton: false,
        maximizeButton: false,
        content: aboutContent,
      },
    },
    contextMenu: [
      {
        label: "&Open",
        action: "open",
      },
      "MENU_DIVIDER",
      {
        label: "Cu&t",
        enabled: false,
      },
      {
        label: "&Copy",
        enabled: false,
      },
      {
        label: "&Create Shortcut",
        enabled: false,
      },
      {
        label: "&Delete",
        enabled: false,
      },
      "MENU_DIVIDER",
      {
        label: "Rena&me",
        enabled: false,
      },
      {
        label: "Proper&ties",
        action: "properties",
      },
    ],
  },
  {
    id: "resume",
    title: "Resume",
    icon: new URL("../assets/icons/word_001.ico", import.meta.url).href,
    path: "/resume/",
    hasTaskbarButton: true,
    action: {
      type: "window",
      window: {
        width: 800,
        height: 600,
        resizable: true,
        menuBar: {
          File: [
            {
              label: "&Download",
              action: () => {
                const link = document.createElement('a');
                link.href = './apps/resume/Aziz Rahmad - Project Resume.pdf';
                link.download = 'Aziz Rahmad - Project Resume.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },
              shortcutLabel: "Ctrl+D",
            },
            {
              label: "&Close",
              action: (win) => win.close(),
              shortcutLabel: "Alt+F4",
            },
          ],
          Help: [
            {
              label: "&About Resume",
              action: () => alert("View project resume"),
            },
          ],
        },
        content: resumeContent,
      },
    },
    contextMenu: [
      {
        label: "&Open",
        action: "open",
      },
      "MENU_DIVIDER",
      {
        label: "Cu&t",
        enabled: false,
      },
      {
        label: "&Copy",
        enabled: false,
      },
      {
        label: "&Create Shortcut",
        enabled: false,
      },
      {
        label: "&Delete",
        enabled: false,
      },
      "MENU_DIVIDER",
      {
        label: "Rena&me",
        enabled: false,
      },
      {
        label: "Proper&ties",
        action: "properties",
      },
    ],
  },
  {
    id: "tipOfTheDay",
    title: "Tip of the Day",
    icon: new URL("../assets/icons/help_book_cool-0.png", import.meta.url).href,
    path: "/tip-of-the-day/",
    hasTaskbarButton: true,
    action: {
      type: "window",
      window: {
        width: 400,
        height: 300,
        resizable: false,
        minimizeButton: false,
        maximizeButton: false,
        content: tipOfTheDayContent,
        setup: tipOfTheDaySetup,
      },
    },
    contextMenu: [
      {
        label: "&Open",
        action: "open",
      },
      "MENU_DIVIDER",
      {
        label: "Cu&t",
        enabled: false,
      },
      {
        label: "&Copy",
        enabled: false,
      },
      {
        label: "&Create Shortcut",
        enabled: false,
      },
      {
        label: "&Delete",
        enabled: false,
      },
      "MENU_DIVIDER",
      {
        label: "Rena&me",
        enabled: false,
      },
      {
        label: "Proper&ties",
        action: "properties",
      },
    ],
  },
  {
    id: "notepad",
    title: "Notepad",
    icon: new URL("../assets/icons/word_001.ico", import.meta.url).href,
    path: "/notepad/",
    hasTaskbarButton: true,
    action: {
      type: "window",
      window: {
        width: 600,
        height: 400,
        resizable: true,
        menuBar: {
          File: [
            {
              label: "&New",
              shortcutLabel: "Ctrl+N",
              action: (win) => {
                const textarea = win.element.querySelector('.notepad-textarea');
                if (textarea) textarea.value = '';
              },
            },
            {
              label: "&Open",
              shortcutLabel: "Ctrl+O",
              enabled: false,
            },
            {
              label: "&Save",
              shortcutLabel: "Ctrl+S",
              enabled: false,
            },
            {
              label: "Save &As...",
              enabled: false,
            },
            "MENU_DIVIDER",
            {
              label: "E&xit",
              action: (win) => win.close(),
            },
          ],
          Edit: [
            {
              label: "&Undo",
              shortcutLabel: "Ctrl+Z",
              action: () => document.execCommand("undo"),
            },
            "MENU_DIVIDER",
            {
              label: "Cu&t",
              shortcutLabel: "Ctrl+X",
               action: () => document.execCommand("cut"),
            },
            {
              label: "&Copy",
              shortcutLabel: "Ctrl+C",
              action: () => document.execCommand("copy"),
            },
            {
              label: "&Paste",
              shortcutLabel: "Ctrl+V",
              action: () => document.execCommand("paste"),
            },
            {
              label: "De&lete",
              shortcutLabel: "Del",
              action: () => document.execCommand("delete"),
            },
          ],
          Help: [
            {
              label: "&About Notepad",
              action: () => alert("A simple text editor."),
            },
          ],
        },
        content: notepadContent,
      },
    },
  },
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

  // ... (other apps)

  {
    id: "clippy",
    title: "Office Assistant",
    icon: new URL("..\\assets\\icons\\msagent_file-1.png", import.meta.url).href,
    action: {
      type: "function",
      handler: launchClippyApp,
    },
    hasTray: true,
    tray: {
      contextMenu: getClippyMenuItems,
    }
  },
  {
    id: "webamp",
    title: "Winamp",
    icon: new URL("../assets/icons/winamp.png", import.meta.url).href,
    action: {
      type: "function",
      handler: launchWebampApp,
    },
    hasTaskbarButton: true,
    tray: {
      contextMenu: getWebampMenuItems,
    }
  },
];
