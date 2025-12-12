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
import { InternetExplorerApp } from "../apps/internet-explorer/InternetExplorerApp.js";
import { PinballApp } from "../apps/pinball/PinballApp.js";
import { KeenApp } from "../apps/keen/KeenApp.js";
import { DosGameApp } from "../apps/dosgame/DosGameApp.js";
import { PaintApp } from "../apps/paint/PaintApp.js";
import DisplayPropertiesApp from "../apps/displayproperties/DisplayPropertiesApp.js";
import { DesktopThemesApp } from "../apps/desktopthemes/DesktopThemesApp.js";
import { ThemeToCssApp } from "../apps/themetocss/ThemeToCssApp.js";
import { SoundSchemeExplorerApp } from "../apps/soundschemeexplorer/SoundSchemeExplorerApp.js";
import { CursorExplorerApp } from "../apps/cursorexplorer/CursorExplorerApp.js";
import { ShowDialogWindow } from "../components/DialogWindow.js";
import { getClippyMenuItems } from "../apps/clippy/clippy.js";
import { getWebampMenuItems } from "../apps/webamp/webamp.js";
import { DiabloApp } from "../apps/diablo/DiabloApp.js";
import { MediaPlayerApp } from "../apps/media-player/MediaPlayerApp.js";
import { BuyMeACoffeeApp } from "../apps/buy-me-a-coffee/BuyMeACoffeeApp.js";
import { HelpApp } from "../apps/help/HelpApp.js";
import { ICONS } from "./icons.js";
import { getIcon } from "../utils/iconManager.js";
import { playSound } from "../utils/soundManager.js";
import {
  getRecycleBinItems,
  emptyRecycleBin,
} from "../utils/recycleBinManager.js";
import { SPECIAL_FOLDER_PATHS } from "./special-folders.js";

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
  desktopthemes: DesktopThemesApp,
  taskmanager: TaskManagerApp,
  soundschemeexplorer: SoundSchemeExplorerApp,
  explorer: ExplorerApp,
  "internet-explorer": InternetExplorerApp,
  pinball: PinballApp,
  keen: KeenApp,
  dosgame: DosGameApp,
  paint: PaintApp,
  displayproperties: DisplayPropertiesApp,
  "buy-me-a-coffee": BuyMeACoffeeApp,
  cursorexplorer: CursorExplorerApp,
  "media-player": MediaPlayerApp,
  diablo: DiabloApp,
  help: HelpApp,
};

export const apps = [
  {
    id: "my-computer",
    title: "My Computer",
    description: "Browse the files and folders on your computer.",
    get icon() {
      return getIcon("myComputer");
    },
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", {
          filePath: "/",
          windowId: "my-computer",
        });
      },
    },
  },
  {
    id: "my-briefcase",
    title: "My Briefcase",
    description: "Stores your uploaded files.",
    icon: ICONS.briefcase,
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", {
          filePath: "/folder-briefcase",
          windowId: "my-briefcase",
        });
      },
    },
  },
  {
    id: "recycle-bin",
    title: "Recycle Bin",
    description:
      "Contains files and folders that you have deleted. They can be recovered or permanently removed.",
    get icon() {
      const items = getRecycleBinItems();
      return items.length > 0
        ? getIcon("recycleBinFull")
        : getIcon("recycleBinEmpty");
    },
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", {
          filePath: "//recycle-bin",
          windowId: "recycle-bin",
        });
      },
    },
    contextMenu: [
      {
        label: "Empty Recycle Bin",
        action: () => {
          ShowDialogWindow({
            title: "Confirm Empty Recycle Bin",
            text: "Are you sure you want to permanently delete all items in the Recycle Bin?",
            buttons: [
              {
                label: "Yes",
                action: () => {
                  emptyRecycleBin();
                  playSound("EmptyRecycleBin");
                  document.dispatchEvent(new CustomEvent("theme-changed")); // To refresh icon
                },
              },
              { label: "No", isDefault: true },
            ],
          });
        },
        enabled: () => getRecycleBinItems().length > 0,
      },
      "MENU_DIVIDER",
      {
        label: "&Open",
        action: "open",
        default: true,
      },
      {
        label: "&Properties",
        action: "properties",
      },
    ],
  },
  {
    id: "network-neighborhood",
    title: "Network Neighborhood",
    description: "Browse network resources.",
    get icon() {
      return getIcon("networkNeighborhood");
    },
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", {
          filePath: "//network-neighborhood",
          windowId: "network-neighborhood",
        });
      },
    },
  },
  {
    id: "my-documents",
    title: "My Documents",
    description: "A common repository for documents.",
    icon: ICONS.folder,
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", {
          filePath: SPECIAL_FOLDER_PATHS["my-documents"],
          windowId: "my-documents",
        });
      },
    },
  },
  {
    id: "about",
    title: "About",
    description: "Displays information about this application.",
    summary: "<b>azOS Second Edition</b><br>Copyright © 2024",
    icon: ICONS.windowsUpdate,
    appClass: AboutApp,
    width: 400,
    height: 216,
    resizable: false,
    minimizeButton: false,
    maximizeButton: false,
    isSingleton: true,
  },
  {
    id: "help",
    title: "Help Topics",
    description: "Find help on how to use the system.",
    icon: ICONS.help,
    appClass: HelpApp,
    width: 500,
    height: 400,
    resizable: true,
    isSingleton: true,
  },
  {
    id: "keen",
    title: "Commander Keen",
    description: "Play the classic game Commander Keen.",
    icon: ICONS.keen,
    appClass: KeenApp,
    width: 640,
    height: 480,
    resizable: false,
    isSingleton: true,
  },
  {
    id: "tipOfTheDay",
    title: "Tip of the Day",
    description: "Provides useful tips about using the system.",
    icon: ICONS.tip,
    appClass: TipOfTheDayApp,
    width: 400,
    height: 300,
    resizable: false,
    minimizeButton: false,
    maximizeButton: false,
    isSingleton: true,
    tips: [
      "To open a file or an application from desktop, double-click the icon.",
      "To close a window, click the X in the top-right corner.",
    ],
  },
  {
    id: "pdfviewer",
    title: "PDF Viewer",
    description: "View PDF documents.",
    icon: ICONS.pdf,
    appClass: PdfViewerApp,
    width: 800,
    height: 600,
    resizable: true,
    isSingleton: false,
    tips: [
      "You can open PDF files by double-clicking them on the desktop or in the file explorer.",
    ],
  },
  {
    id: "notepad",
    title: "Notepad",
    description: "A simple text editor.",
    icon: ICONS.notepad,
    appClass: NotepadApp,
    width: 600,
    height: 400,
    resizable: true,
    isSingleton: false,
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
    description: "Resize and convert images.",
    icon: ICONS.image,
    appClass: ImageResizerApp,
    width: 920,
    height: 720,
    resizable: true,
    isSingleton: false,
  },
  {
    id: "image-viewer",
    title: "Image Viewer",
    description: "View images.",
    icon: ICONS.imageViewer,
    appClass: ImageViewerApp,
    width: 400,
    height: 300,
    resizable: true,
    isSingleton: false,
  },
  {
    id: "clippy",
    title: "Assistant",
    description: "Your friendly assistant.",
    icon: ICONS.clippy,
    appClass: ClippyApp,
    hasTray: true,
    isSingleton: true,
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
    description: "A classic music player.",
    icon: ICONS.webamp,
    appClass: WebampApp,
    hasTaskbarButton: true,
    isSingleton: true,
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
    description: "Create your own applications.",
    icon: ICONS.appmaker,
    appClass: AppMakerApp,
    width: 600,
    height: 500,
    resizable: true,
    isSingleton: true,
  },
  {
    id: "alertTest",
    title: "Alert Test",
    description: "A test for the alert dialog.",
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
    description: "Convert a Windows theme file to CSS.",
    icon: ICONS.themetocss,
    appClass: ThemeToCssApp,
    width: 700,
    height: 350,
    resizable: true,
    isSingleton: true,
  },
  {
    id: "desktopthemes",
    title: "Desktop Themes",
    description: "Customize your desktop's appearance.",
    icon: ICONS.desktopthemes,
    appClass: DesktopThemesApp,
    width: 550,
    height: 500,
    resizable: false,
    isSingleton: true,
  },
  {
    id: "taskmanager",
    title: "Task Manager",
    description: "Manage running applications.",
    icon: ICONS.windows,
    appClass: TaskManagerApp,
    width: 300,
    height: 400,
    resizable: false,
    isSingleton: true,
  },
  {
    id: "soundschemeexplorer",
    title: "Sound Scheme Explorer",
    description: "Explore and listen to sound schemes.",
    icon: ICONS.soundschemeexplorer,
    appClass: SoundSchemeExplorerApp,
    width: 400,
    height: 300,
    resizable: true,
    isSingleton: true,
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Browse files and folders.",
    icon: ICONS.computer,
    appClass: ExplorerApp,
    width: 640,
    height: 480,
    resizable: true,
    isSingleton: false,
  },
  {
    id: "internet-explorer",
    title: "Internet Explorer",
    description: "Browse the web.",
    icon: ICONS["internet-explorer"],
    appClass: InternetExplorerApp,
    width: 800,
    height: 600,
    resizable: true,
    isSingleton: false,
  },
  {
    id: "pinball",
    title: "Pinball",
    description: "Play a classic game of pinball.",
    icon: ICONS.pinball,
    appClass: PinballApp,
    width: 600,
    height: 400,
    resizable: false,
    isSingleton: true,
  },
  {
    id: "paint",
    title: "Paint",
    description: "Create and edit images.",
    icon: ICONS.paint,
    appClass: PaintApp,
    width: 800,
    height: 600,
    resizable: true,
    isSingleton: false,
  },
  {
    id: "displayproperties",
    title: "Display",
    description: "Customize your display settings.",
    icon: ICONS.displayProperties,
    appClass: DisplayPropertiesApp,
    width: 404,
    height: 448,
    resizable: false,
    isSingleton: true,
  },
  {
    id: "buy-me-a-coffee",
    title: "Buy me a coffee",
    description: "Support the developer.",
    icon: ICONS["buy-me-a-coffee"],
    appClass: BuyMeACoffeeApp,
    width: 300,
    height: 650,
    resizable: false,
    maximizable: false,
    isSingleton: true,
  },
  {
    id: "cursorexplorer",
    title: "Mouse",
    description: "Explore and preview cursor schemes.",
    icon: ICONS["mouse"],
    appClass: CursorExplorerApp,
    width: 400,
    height: 500,
    resizable: true,
    isSingleton: true,
  },
  {
    id: "dosgame",
    title: "DOS Game", // Generic title, will be overridden by specific game config
    description: "A generic launcher for various DOS games.",
    icon: ICONS.doom, // Placeholder icon for the generic launcher
    appClass: DosGameApp,
    // Default window properties, can be overridden by launchApp config
    width: 640,
    height: 480,
    resizable: false,
    maximizable: false,
    isSingleton: false, // Allow multiple instances if needed
  },
  {
    id: "doom", // Unique ID for this specific game launcher
    title: "Doom",
    description: "Play the classic game Doom.",
    icon: ICONS.doom, // Specific icon for Doom
    gameUrl: "games/doom/index.html",
    width: 800,
    height: 500,
    resizable: true,
    maximizable: true,
    appClass: DosGameApp,
  },
  {
    id: "simcity2000",
    title: "SimCity 2000 Demo",
    description: "Play the SimCity 2000 demo.",
    icon: ICONS.simcity2000,
    gameUrl: "games/dos/simcity2000/index.html",
    width: 640,
    height: 480,
    resizable: true,
    maximizable: true,
    appClass: DosGameApp,
  },
  {
    id: "media-player",
    title: "Media Player",
    description: "Play audio and video files.",
    icon: ICONS.mediaPlayer,
    appClass: MediaPlayerApp,
    width: 480,
    height: 360,
    resizable: true,
    isSingleton: false,
  },
  {
    id: "diablo",
    title: "Diablo",
    description: "Play the classic game Diablo.",
    icon: ICONS.diablo,
    appClass: DiabloApp,
    width: 800,
    height: 600,
    resizable: true,
    isSingleton: true,
  },
  {
    id: "control-panel",
    title: "Control Panel",
    description: "Access system settings and utilities.",
    icon: ICONS.controlPanel,
    action: {
      type: "function",
      handler: () => {
        window.System.launchApp("explorer", {
          filePath: "/folder-control-panel",
          windowId: "control-panel",
        });
      },
    },
  },
];
