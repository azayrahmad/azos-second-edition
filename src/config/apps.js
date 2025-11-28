import { ShowDialogWindow } from "../components/DialogWindow.js";
import { getClippyMenuItems } from "../apps/clippy/clippy.js";
import { getWebampMenuItems } from "../apps/webamp/webamp.js";
import { ICONS } from "./icons.js";
import { getIcon } from "../utils/iconManager.js";
import { playSound } from "../utils/soundManager.js";
import {
  getRecycleBinItems,
  emptyRecycleBin,
} from "../utils/recycleBinManager.js";
import { SPECIAL_FOLDER_PATHS } from "./special-folders.js";

export const appClasses = {
  get about() {
    return import("../apps/about/AboutApp.js").then((m) => m.AboutApp);
  },
  get appmaker() {
    return import("../apps/appmaker/AppMakerApp.js").then((m) => m.AppMakerApp);
  },
  get notepad() {
    return import("../apps/notepad/NotepadApp.js").then((m) => m.NotepadApp);
  },
  get pdfviewer() {
    return import("../apps/pdfviewer/PdfViewerApp.js").then(
      (m) => m.PdfViewerApp
    );
  },
  get tipOfTheDay() {
    return import("../apps/tipOfTheDay/TipOfTheDayApp.js").then(
      (m) => m.TipOfTheDayApp
    );
  },
  get clippy() {
    return import("../apps/clippy/ClippyApp.js").then((m) => m.ClippyApp);
  },
  get webamp() {
    return import("../apps/webamp/WebampApp.js").then((m) => m.WebampApp);
  },
  get "image-resizer"() {
    return import("../apps/image-resizer/ImageResizerApp.js").then(
      (m) => m.ImageResizerApp
    );
  },
  get "image-viewer"() {
    return import("../apps/imageviewer/ImageViewerApp.js").then(
      (m) => m.ImageViewerApp
    );
  },
  get themetocss() {
    return import("../apps/themetocss/ThemeToCssApp.js").then(
      (m) => m.ThemeToCssApp
    );
  },
  get desktopthemes() {
    return import("../apps/desktopthemes/DesktopThemesApp.js").then(
      (m) => m.DesktopThemesApp
    );
  },
  get taskmanager() {
    return import("../apps/taskmanager/TaskManagerApp.js").then(
      (m) => m.TaskManagerApp
    );
  },
  get soundschemeexplorer() {
    return import("../apps/soundschemeexplorer/SoundSchemeExplorerApp.js").then(
      (m) => m.SoundSchemeExplorerApp
    );
  },
  get explorer() {
    return import("../apps/explorer/ExplorerApp.js").then((m) => m.ExplorerApp);
  },
  get "internet-explorer"() {
    return import("../apps/internet-explorer/InternetExplorerApp.js").then(
      (m) => m.InternetExplorerApp
    );
  },
  get pinball() {
    return import("../apps/pinball/PinballApp.js").then((m) => m.PinballApp);
  },
  get paint() {
    return import("../apps/paint/PaintApp.js").then((m) => m.PaintApp);
  },
  get "display-properties"() {
    return import("../apps/displayproperties/DisplayPropertiesApp.js").then(
      (m) => m.default
    );
  },
  get "cursor-explorer"() {
    return import("../apps/cursorexplorer/CursorExplorerApp.js").then(
      (m) => m.CursorExplorerApp
    );
  },
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
        window.System.launchApp("explorer", "/");
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
        window.System.launchApp("explorer", "//recycle-bin");
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
        window.System.launchApp("explorer", "//network-neighborhood");
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
        window.System.launchApp("explorer", SPECIAL_FOLDER_PATHS["my-documents"]);
      },
    },
  },
  {
    id: "about",
    title: "About",
    description: "Displays information about this application.",
    icon: ICONS.about,
    appClass: AboutApp,
    width: 500,
    height: 300,
    resizable: false,
    minimizeButton: false,
    maximizeButton: false,
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
    id: "display-properties",
    title: "Display Properties",
    description: "Customize your display settings.",
    icon: ICONS.displayProperties,
    appClass: DisplayPropertiesApp,
    width: 404,
    height: 448,
    resizable: false,
    isSingleton: true,
  },
  {
    id: "cursor-explorer",
    title: "Cursor Explorer",
    description: "Explore and preview cursor schemes.",
    icon: ICONS["cursor-explorer"],
    appClass: CursorExplorerApp,
    width: 400,
    height: 500,
    resizable: true,
    isSingleton: true,
  },
];
