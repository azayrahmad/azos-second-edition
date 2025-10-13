import { launchClippyApp, getClippyMenuItems } from "../apps/clippy/clippy.js";
import { launchWebampApp, getWebampMenuItems } from "../apps/webamp/webamp.js";
import { aboutContent } from "../apps/about/about.js";
import { createPdfViewerContent } from "../apps/pdfviewer/pdfviewer.js";
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
    id: "pdfviewer",
    title: "PDF Viewer",
    icon: new URL("../assets/icons/word_001.ico", import.meta.url).href,
    path: "/pdfviewer/",
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
              label: "&Open",
              action: (win) => {
                // This would ideally open a file picker, which is complex to implement.
                // For now, it does nothing.
                alert("File picker not implemented.");
              },
              shortcutLabel: "Ctrl+O",
            },
            {
              label: "&Close",
              action: (win) => win.close(),
              shortcutLabel: "Alt+F4",
            },
          ],
          Help: [
            {
              label: "&About PDF Viewer",
              action: () => alert("A simple PDF viewer."),
            },
          ],
        },
        content: createPdfViewerContent(null), // No file loaded initially
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
    icon: new URL("../assets/icons/NOTEPAD_1.ico", import.meta.url).href,
    path: "/notepad/",
    hasTaskbarButton: true,
    action: {
      type: "window",
      window: {
        width: 600,
        height: 400,
        resizable: true,
        menuBar: (win) => ({
          File: [
            {
              label: "&New",
              shortcutLabel: "Ctrl+N",
              action: () => {
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
              action: () => win.close(),
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
              action: () => win.events.emit('copy'),
            },
            {
              label: "&Paste",
              shortcutLabel: "Ctrl+V",
              action: (win) => win.events.emit('paste'),
            },
            {
              label: "De&lete",
              shortcutLabel: "Del",
              action: () => document.execCommand("delete"),
            },
            "MENU_DIVIDER",
            {
              label: "&Format",
              action: () => win.events.emit('format'),
            },
          ],
          Language: [
            {
              radioItems: [
                { label: 'C', value: 'c' },
                { label: 'C++', value: 'cpp' },
                { label: 'Java', value: 'java' },
                { label: 'Python', value: 'python' },
                { label: 'JavaScript', value: 'javascript' },
                { label: 'C#', value: 'csharp' },
                { label: 'HTML', value: 'html' },
                { label: 'CSS', value: 'css' },
                { label: 'SQL', value: 'sql' },
                { label: 'PHP', value: 'php' },
                { label: 'Ruby', value: 'ruby' },
                { label: 'Go', value: 'go' },
                { label: 'Rust', value: 'rust' },
                { label: 'TypeScript', value: 'typescript' },
                { label: 'Bash', value: 'bash' },
                { label: 'JSON', value: 'json' },
              ],
              getValue: () => win.notepad?.currentLanguage,
              setValue: (value) => win.events.emit('language-change', value),
            },
          ],
          Help: [
            {
              label: "&About Notepad",
              action: () => alert("A simple text editor."),
            },
          ],
        }),
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
