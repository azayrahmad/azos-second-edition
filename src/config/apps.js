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
              action: (win) => win.events.emit('copy'),
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
            "MENU_DIVIDER",
            {
              label: "&Format",
              action: (win) => win.events.emit('format'),
            },
          ],
          Language: [
              { label: 'C', type: 'radio', name: 'language', value: 'c', checked: true, action: (win) => win.events.emit('language-change', 'c') },
              { label: 'C++', type: 'radio', name: 'language', value: 'cpp', action: (win) => win.events.emit('language-change', 'cpp') },
              { label: 'Java', type: 'radio', name: 'language', value: 'java', action: (win) => win.events.emit('language-change', 'java') },
              { label: 'Python', type: 'radio', name: 'language', value: 'python', action: (win) => win.events.emit('language-change', 'python') },
              { label: 'JavaScript', type: 'radio', name: 'language', value: 'javascript', action: (win) => win.events.emit('language-change', 'javascript') },
              { label: 'C#', type: 'radio', name: 'language', value: 'csharp', action: (win) => win.events.emit('language-change', 'csharp') },
              { label: 'HTML', type: 'radio', name: 'language', value: 'html', action: (win) => win.events.emit('language-change', 'html') },
              { label: 'CSS', type: 'radio', name: 'language', value: 'css', action: (win) => win.events.emit('language-change', 'css') },
              { label: 'SQL', type: 'radio', name: 'language', value: 'sql', action: (win) => win.events.emit('language-change', 'sql') },
              { label: 'PHP', type: 'radio', name: 'language', value: 'php', action: (win) => win.events.emit('language-change', 'php') },
              { label: 'Ruby', type: 'radio', name: 'language', value: 'ruby', action: (win) => win.events.emit('language-change', 'ruby') },
              { label: 'Go', type: 'radio', name: 'language', value: 'go', action: (win) => win.events.emit('language-change', 'go') },
              { label: 'Rust', type: 'radio', name: 'language', value: 'rust', action: (win) => win.events.emit('language-change', 'rust') },
              { label: 'TypeScript', type: 'radio', name: 'language', value: 'typescript', action: (win) => win.events.emit('language-change', 'typescript') },
              { label: 'Bash', type: 'radio', name: 'language', value: 'bash', action: (win) => win.events.emit('language-change', 'bash') },
              { label: 'JSON', type: 'radio', name: 'language', value: 'json', action: (win) => win.events.emit('language-change', 'json') },
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
