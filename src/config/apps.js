import { AboutApp } from '../apps/about/AboutApp.js';
import { NotepadApp } from '../apps/notepad/NotepadApp.js';
import { PdfViewerApp } from '../apps/pdfviewer/PdfViewerApp.js';
import { TipOfTheDayApp } from '../apps/tipOfTheDay/TipOfTheDayApp.js';
import { ClippyApp } from '../apps/clippy/ClippyApp.js';
import { WebampApp } from '../apps/webamp/WebampApp.js';
import { ShowDialogWindow } from '../components/DialogWindow.js';
import { getClippyMenuItems } from "../apps/clippy/clippy.js";
import { getWebampMenuItems } from "../apps/webamp/webamp.js";

export const appClasses = {
    'about': AboutApp,
    'notepad': NotepadApp,
    'pdfviewer': PdfViewerApp,
    'tipOfTheDay': TipOfTheDayApp,
    'clippy': ClippyApp,
    'webamp': WebampApp,
};

export const apps = [
  {
    id: "about",
    title: "About",
    icon: new URL("../assets/icons/COMCTL32_20481.ico", import.meta.url).href,
    appClass: AboutApp,
  },
  {
    id: "pdfviewer",
    title: "PDF Viewer",
    icon: new URL("../assets/icons/word_001.ico", import.meta.url).href,
    appClass: PdfViewerApp,
  },
  {
    id: "tipOfTheDay",
    title: "Tip of the Day",
    icon: new URL("../assets/icons/help_book_cool-0.png", import.meta.url).href,
    appClass: TipOfTheDayApp,
  },
  {
    id: "notepad",
    title: "Notepad",
    icon: new URL("../assets/icons/NOTEPAD_1.ico", import.meta.url).href,
    appClass: NotepadApp,
  },
  {
    id: "clippy",
    title: "Assistant",
    icon: new URL("..\\assets\\icons\\msagent_file-1.png", import.meta.url).href,
    appClass: ClippyApp,
    hasTray: true,
    tray: {
      contextMenu: getClippyMenuItems,
    }
  },
  {
    id: "webamp",
    title: "Winamp",
    icon: new URL("../assets/icons/winamp.png", import.meta.url).href,
    appClass: WebampApp,
    hasTaskbarButton: true,
    tray: {
      contextMenu: getWebampMenuItems,
    }
  },
  {
    id: "alertTest",
    title: "Alert Test",
    icon: new URL("../assets/icons/COMCTL32_20481.ico", import.meta.url).href,
    action: {
      type: "function",
      handler: () => {
        ShowDialogWindow({
          title: "Alert",
          text: "The alert works.",
          soundId: "chord",
          contentIconUrl: new URL("../assets/icons/COMCTL32_20481.ico", import.meta.url).href,
          buttons: [{ label: 'OK', isDefault: true }],
        });
      },
    },
  },
];