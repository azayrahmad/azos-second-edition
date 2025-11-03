import { AboutApp } from "../apps/about/AboutApp.js";
import { AppMakerApp } from "../apps/appmaker/AppMakerApp.js";
import { NotepadApp } from "../apps/notepad/NotepadApp.js";
import { PdfViewerApp } from "../apps/pdfviewer/PdfViewerApp.js";
import { TipOfTheDayApp } from "../apps/tipOfTheDay/TipOfTheDayApp.js";
import { ClippyApp } from "../apps/clippy/ClippyApp.js";
import { WebampApp } from "../apps/webamp/WebampApp.js";
import { ImageResizerApp } from "../apps/image-resizer/ImageResizerApp.js";
import { ImageViewerApp } from "../apps/imageviewer/ImageViewerApp.js";
import { TaskManagerApp } from "../apps/taskmanager/TaskManagerApp.js";
import { ExplorerApp } from "../apps/explorer/ExplorerApp.js";
import { ThemeToCssApp } from "../apps/themetocss/ThemeToCssApp.js";
import { SoundSchemeExplorerApp } from "../apps/soundschemeexplorer/SoundSchemeExplorerApp.js";
import { ShowDialogWindow } from "../components/DialogWindow.js";
import { getClippyMenuItems } from "../apps/clippy/clippy.js";
import { getWebampMenuItems } from "../apps/webamp/webamp.js";
import { ICONS } from "./icons.js";
import { getIcon } from "../utils/iconManager.js";

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
  taskmanager: TaskManagerApp,
  soundschemeexplorer: SoundSchemeExplorerApp,
  explorer: ExplorerApp,
};

export const apps = [
  {
    id: "my-computer",
    title: "My Computer",
    get icon() {
      return getIcon("myComputer");
    },
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", "/");
      },
    },
  },
  {
    id: "my-documents",
    title: "My Documents",
    icon: ICONS.folder,
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp(
          "explorer",
          "/drive-c/folder-user/folder-documents",
        );
      },
    },
  },
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
    tips: [
      "To open a file or an application from desktop, double-click the icon.",
      "To close a window, click the X in the top-right corner.",
    ],
  },
  {
    id: "pdfviewer",
    title: "PDF Viewer",
    icon: ICONS.pdf,
    appClass: PdfViewerApp,
    width: 800,
    height: 600,
    resizable: true,
    tips: [
      "You can open PDF files by double-clicking them on the desktop or in the file explorer.",
    ],
  },
  {
    id: "notepad",
    title: "Notepad",
    icon: ICONS.notepad,
    appClass: NotepadApp,
    width: 600,
    height: 400,
    resizable: true,
    tips: [
      "Notepad can be used for more than just text. It also supports syntax highlighting for various programming languages.",
      "In Notepad, you can format your code using the 'Format' option in the 'File' menu.",
      "You can preview Markdown files in Notepad by selecting 'Preview Markdown' from the 'View' menu.",
      "Notepad can copy text with syntax highlighting. Use 'Copy with Formatting' from the 'Edit' menu.",
    ],
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
    tips: [
      "Need help? Try the <a href='#' class='tip-link' data-app='clippy'>Assistant</a> for assistance with azOS features.",
      "You can ask Clippy about Aziz's resume by clicking on it.",
      "Right-click on Clippy to see more options, like changing the agent or making it animate.",
    ],
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
    tips: [
      "Webamp is a music player that looks and feels like the classic Winamp.",
      "You can minimize and restore Webamp using its button in the taskbar.",
    ],
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
    id: "taskmanager",
    title: "Task Manager",
    icon: ICONS.taskmanager,
    appClass: TaskManagerApp,
    width: 300,
    height: 400,
    resizable: false,
  },
  {
    id: "soundschemeexplorer",
    title: "Sound Scheme Explorer",
    icon: ICONS.soundschemeexplorer,
    appClass: SoundSchemeExplorerApp,
    width: 400,
    height: 300,
    resizable: true,
  },
  {
    id: "explorer",
    title: "Explorer",
    icon: ICONS.computer,
    appClass: ExplorerApp,
    width: 640,
    height: 480,
    resizable: true,
  },
];
