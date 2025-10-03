import { launchClippyApp, getClippyMenuItems } from "../apps/clippy/clippy.js";
import { setupWebamp, onWindowClose } from "../apps/webamp/webamp.js";
import { aboutContent } from "../apps/about/about.js";
import { resumeContent } from "../apps/resume/resume.js";
import { tipOfTheDayContent, setup as tipOfTheDaySetup } from "../apps/tipOfTheDay/tipOfTheDay.js";

export const apps = [
  {
    id: "about",
    title: "About",
    icon: new URL("../assets/icons/COMCTL32_20481.ico", import.meta.url).href,
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
    id: "webamp",
    title: "Webamp",
    icon: new URL("../assets/icons/MMSYS_110.ico", import.meta.url).href,
    action: {
      type: "window",
      window: {
        width: 275,
        height: 116 * 3,
        hasChrome: false,
        resizable: false,
        setup: setupWebamp,
        onClose: onWindowClose,
      },
    },
  },
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
];