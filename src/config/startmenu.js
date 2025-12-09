import { apps } from "./apps.js";
import { launchApp } from "../utils/appManager.js";
import { ShowComingSoonDialog } from "../components/DialogWindow.js";
import { ICONS } from "./icons.js";

const startMenuAppIds = [
  "webamp",
  "tipOfTheDay",
  "internet-explorer",
  "pinball",
  "buy-me-a-coffee",
  "pdfviewer",
  "doom",
  "simcity2000",
];
const accessoriesAppIds = ["notepad", "clippy", "paint", "image-viewer"];
const settingsAppIds = [
  "display-properties",
  "desktopthemes",
  "soundschemeexplorer",
  "themetocss",
  "cursor-explorer",
];

function getAppList(appListIds) {
  return appListIds
    .map((id) => apps.find((app) => app.id === id))
    .filter((app) => app)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((app) => ({
      label: app.title,
      icon: app.icon[16],
      action: () => launchApp(app.id),
    }));
}

const startMenuConfig = [
  {
    label: "Programs",
    icon: ICONS.programs[32],
    submenu: [
      {
        label: "Accessories",
        icon: ICONS.programs[16],
        submenu: [
          {
            label: "Games",
            icon: ICONS.programs[16],
        submenu: getAppList(["pinball", "red-alert-2"]),
          },
          ...getAppList(accessoriesAppIds),
        ],
      },
      ...getAppList(startMenuAppIds),
      {
        label: "Windows Explorer",
        icon: ICONS.windowsExplorer[16],
        action: () => launchApp("my-computer"),
      },
    ],
  },
  {
    label: "Favorites",
    icon: ICONS.favorites[32],
    submenu: [
      {
        label: "Google",
        icon: ICONS.htmlFile[16],
        action: () => launchApp("internet-explorer", "google.com"),
      },
      {
        label: "Yahoo",
        icon: ICONS.htmlFile[16],
        action: () => launchApp("internet-explorer", "yahoo.com"),
      },
      {
        label: "Neocities",
        icon: ICONS.htmlFile[16],
        action: () =>
          launchApp("internet-explorer", {
            url: "https://neocities.org/",
            retroMode: false,
          }),
      },
    ],
  },
  {
    label: "Documents",
    icon: ICONS.documents[32],
    submenu: [
      {
        label: "My Documents",
        icon: ICONS.folder[16],
        action: () =>
          launchApp("explorer", "/drive-c/folder-user/folder-documents"),
      },
    ],
  },
  {
    label: "Settings",
    icon: ICONS.settings[32],
    submenu: getAppList(settingsAppIds),
  },
  {
    label: "Find",
    icon: ICONS.find[32],
    submenu: [],
  },
  {
    label: "Help",
    icon: ICONS.help[32],
    action: () => ShowComingSoonDialog("Help"),
  },
  {
    label: "Run",
    icon: ICONS.run[32],
    action: () => ShowComingSoonDialog("Run"),
  },
];

export default startMenuConfig;
