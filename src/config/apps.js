import { AboutApp } from '../apps/about/AboutApp.js';
import { NotepadApp } from '../apps/notepad/NotepadApp.js';
import { PdfViewerApp } from '../apps/pdfviewer/PdfViewerApp.js';
import { TipOfTheDayApp } from '../apps/tipOfTheDay/TipOfTheDayApp.js';
import { ClippyApp } from '../apps/clippy/ClippyApp.js';
import { WebampApp } from '../apps/webamp/WebampApp.js';
import { ShowDialogWindow } from '../components/DialogWindow.js';
import { getClippyMenuItems } from "../apps/clippy/clippy.js";
import { getWebampMenuItems } from "../apps/webamp/webamp.js";
import { ICONS } from './icons.js';

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
    icon: ICONS.about,
    appClass: AboutApp,
    width: 500,
    height: 300,
    resizable: false,
    minimizeButton: false,
    maximizeButton: false,
  },
  {
    id: "pdfviewer",
    title: "PDF Viewer",
    icon: ICONS.pdf,
    appClass: PdfViewerApp,
    width: 800,
    height: 600,
    resizable: true,
  },
  {
    id: "tipOfTheDay",
    title: "Tip of the Day",
    icon: ICONS.tip,
    appClass: TipOfTheDayApp,
    width: 400,
    height: 300,
    resizable: false,
    minimizeButton: false,
    maximizeButton: false,
  },
  {
    id: "notepad",
    title: "Notepad",
    icon: ICONS.notepad,
    appClass: NotepadApp,
    width: 600,
    height: 400,
    resizable: true,
  },
  {
    id: "clippy",
    title: "Assistant",
    icon: ICONS.clippy,
    appClass: ClippyApp,
    hasTray: true,
    tray: {
      contextMenu: getClippyMenuItems,
    }
  },
  {
    id: "webamp",
    title: "Winamp",
    icon: ICONS.webamp,
    appClass: WebampApp,
    hasTaskbarButton: true,
    tray: {
      contextMenu: getWebampMenuItems,
    }
  },
  {
    id: "alertTest",
    title: "Alert Test",
    icon: ICONS.about,
    action: {
      type: "function",
      handler: () => {
        ShowDialogWindow({
          title: "Alert",
          text: "The alert works.",
          soundEvent: "SystemHand",
          contentIconUrl: ICONS.about[32],
          buttons: [{ label: 'OK', isDefault: true }],
        });
      },
    },
  },
];