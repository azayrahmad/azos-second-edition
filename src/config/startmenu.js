import { apps } from "./apps.js";
import { launchApp } from "../utils/appManager.js";
import { ShowComingSoonDialog } from "../components/DialogWindow.js";
import { ICONS } from "./icons.js";

const startMenuAppIds = [
  "webamp",
  "image-viewer",
  "tipOfTheDay",
  "about",
  "internet-explorer",
  "pinball",
];
const accessoriesAppIds = ["notepad", "clippy", "paint"];
const settingsAppIds = ["desktopthemes", "soundschemeexplorer", "themetocss"];

function getAppList(appListIds) {
  return appListIds
    .map((id) => apps.find((app) => app.id === id))
    .filter((app) => app)
    .map((app) => ({
      label: app.title,
      icon: app.icon[16],
      action: () => launchApp(app.id),
    }));
}

const startMenuConfig = [
  {
    label: "Programs",
    icon: ICONS.programs[16],
    submenu: [
      {
        label: "Accessories",
        icon: ICONS.programs[16],
        submenu: getAppList(accessoriesAppIds),
      },
      ...getAppList(startMenuAppIds),
    ],
  },
  {
    label: "Favorites",
    icon: ICONS.favorites[16],
    submenu: [
      {
        label: "Google",
        icon: ICONS.documents[16],
        action: () => launchApp("internet-explorer", "google.com"),
      },
      {
        label: "Yahoo",
        icon: ICONS.documents[16],
        action: () => launchApp("internet-explorer", "yahoo.com"),
      },
    ],
  },
  {
    label: "Documents",
    icon: ICONS.documents[16],
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
    icon: ICONS.settings[16],
    submenu: getAppList(settingsAppIds),
  },
  {
    label: "Find",
    icon: ICONS.find[16],
    submenu: [
      {
        label: "(Empty)",
        disabled: true,
      },
    ],
  },
  {
    label: "Help",
    icon: ICONS.help[16],
    action: () => ShowComingSoonDialog("Help"),
  },
  {
    label: "Run",
    icon: ICONS.run[16],
    action: () => ShowComingSoonDialog("Run"),
  },
];

export default startMenuConfig;
