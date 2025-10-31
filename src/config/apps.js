import { AboutApp } from "../apps/about/AboutApp.js";
import { AppMakerApp } from "../apps/appmaker/AppMakerApp.js";
import { NotepadApp } from "../apps/notepad/NotepadApp.js";
import { PdfViewerApp } from "../apps/pdfviewer/PdfViewerApp.js";
import { TipOfTheDayApp } from "../apps/tipOfTheDay/TipOfTheDayApp.js";
import { ClippyApp } from "../apps/clippy/ClippyApp.js";
import { WebampApp } from "../apps/webamp/WebampApp.js";
import { ImageResizerApp } from "../apps/image-resizer/ImageResizerApp.js";
import { ImageViewerApp } from "../apps/imageviewer/ImageViewerApp.js";
import { ThemeToCssApp } from "../apps/themetocss/ThemeToCssApp.js";
import { ThemeSwitcherApp } from "../apps/themeswitcher/ThemeSwitcherApp.js";
import { ShowDialogWindow } from "../components/DialogWindow.js";
import { getClippyMenuItems } from "../apps/clippy/clippy.js";
import { getWebampMenuItems } from "../apps/webamp/webamp.js";
import { ICONS } from "./icons.js";

export const appClasses = {
  about: AboutApp,
  appmaker: AppMakerApp,
  notepad: NotepadApp,
  pdfviewer: PdfViewerApp,
  tipOfTheDay: TipOfTheDayApp,
  clippy: ClippyApp,
  webamp: WebampApp,
  "image-resizer": ImageResizerApp,
  "image-viewer": ImageViewerApp,
  themetocss: ThemeToCssApp,
  themeswitcher: ThemeSwitcherApp,
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
    id: "pdfviewer",
    title: "PDF Viewer",
    icon: ICONS.pdf,
    appClass: PdfViewerApp,
    width: 800,
    height: 600,
    resizable: true,
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
    id: "image-resizer",
    title: "Image Resizer",
    icon: ICONS.image,
    appClass: ImageResizerApp,
    width: 920,
    height: 720,
    resizable: true,
  },
  {
    id: "image-viewer",
    title: "Image Viewer",
    icon: ICONS.imageViewer,
    appClass: ImageViewerApp,
    width: 400,
    height: 300,
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
    },
  },
  {
    id: "webamp",
    title: "Winamp",
    icon: ICONS.webamp,
    appClass: WebampApp,
    hasTaskbarButton: true,
    tray: {
      contextMenu: getWebampMenuItems,
    },
  },
  {
    id: "appmaker",
    title: "App Maker",
    icon: ICONS.appmaker,
    appClass: AppMakerApp,
    width: 600,
    height: 500,
    resizable: true,
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
          buttons: [{ label: "OK", isDefault: true }],
        });
      },
    },
  },
  {
    id: "themetocss",
    title: "Theme to CSS",
    icon: ICONS.themetocss,
    appClass: ThemeToCssApp,
    width: 700,
    height: 350,
    resizable: true,
  },
  {
    id: "themeswitcher",
    title: "Theme Switcher",
    icon: ICONS.themeSwitcher,
    appClass: ThemeSwitcherApp,
    width: 250,
    height: 150,
    resizable: false,
  },
];
