import { generateProgramFiles } from "./generateProgramFiles.js";
import { generatePlusFiles } from "./generatePlusFiles.js";

const directory = [
  {
    id: "drive-c",
    name: "C:",
    type: "drive",
    children: [
      {
        id: "folder-program-files",
        name: "Program Files",
        type: "folder",
        children: [
          ...generateProgramFiles(),
          { id: "app-doom", type: "app", appId: "doom" },
          { id: "app-simcity2000", type: "app", appId: "simcity2000" },
          {
            id: "folder-plus",
            name: "Plus!",
            type: "folder",
            children: generatePlusFiles(),
          },
        ],
      },
      {
        id: "folder-user",
        name: "user",
        type: "folder",
        children: [
          {
            id: "folder-desktop",
            name: "desktop",
            type: "folder",
            children: [
              { id: "app-my-computer", type: "app", appId: "my-computer" },
              { id: "app-my-documents", type: "app", appId: "my-documents" },
              { id: "app-recycle-bin", type: "app", appId: "recycle-bin" },
              {
                id: "app-network-neighborhood",
                type: "app",
                appId: "network-neighborhood",
              },
              { id: "app-my-briefcase", type: "app", appId: "my-briefcase" },
              {
                id: "shortcut-to-tipOfTheDay",
                type: "shortcut",
                targetId: "app-tipOfTheDay",
                name: "Tip of the Day",
              },
              {
                id: "shortcut-to-notepad",
                type: "shortcut",
                targetId: "app-notepad",
                name: "Notepad",
              },
              {
                id: "shortcut-to-image-viewer",
                type: "shortcut",
                targetId: "app-image-viewer",
                name: "Image Viewer",
              },
              {
                id: "shortcut-to-clippy",
                type: "shortcut",
                targetId: "app-clippy",
                name: "Assistant",
              },
              {
                id: "shortcut-to-webamp",
                type: "shortcut",
                targetId: "app-webamp",
                name: "Winamp",
              },
              {
                id: "shortcut-to-appmaker",
                type: "shortcut",
                targetId: "app-appmaker",
                name: "App Maker",
              },
              {
                id: "shortcut-to-alertTest",
                type: "shortcut",
                targetId: "app-alertTest",
                name: "Alert Test",
              },
              {
                id: "shortcut-to-internet-explorer",
                type: "shortcut",
                targetId: "app-internet-explorer",
                name: "Internet Explorer",
              },
              {
                id: "shortcut-to-pinball",
                type: "shortcut",
                targetId: "app-pinball",
                name: "3D Pinball",
              },
              {
                id: "shortcut-to-paint",
                type: "shortcut",
                targetId: "app-paint",
                name: "Paint",
              },
              {
                id: "file-resume",
                type: "file",
                name: "Resume.pdf",
                contentUrl: "public/files/Resume.pdf",
              },
              {
                id: "file-readme",
                type: "file",
                name: "README.md",
                contentUrl: "files/README.md",
              },
              {
                id: "shortcut-to-doom",
                type: "shortcut",
                targetId: "app-doom",
                name: "Doom",
              },
              {
                id: "shortcut-to-media-player",
                type: "shortcut",
                targetId: "app-media-player",
                name: "Media Player",
              },
              {
                id: "shortcut-to-simcity2000",
                type: "shortcut",
                targetId: "app-simcity2000",
                name: "SimCity 2000 Demo",
              },
              {
                id: "shortcut-to-buy-me-a-coffee",
                type: "shortcut",
                targetId: "app-buy-me-a-coffee",
                name: "Buy me a coffee",
              },
              {
                id: "shortcut-to-keen",
                type: "shortcut",
                targetId: "app-keen",
                name: "Commander Keen",
              },
            ],
          },
          {
            id: "folder-documents",
            name: "Documents",
            type: "folder",
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "drive-d",
    name: "D:",
    type: "drive",
    children: [],
  },
  {
    id: "folder-briefcase",
    name: "My Briefcase",
    type: "briefcase",
    enableFileDrop: true,
    children: [],
  },
  {
    id: "folder-control-panel",
    name: "Control Panel",
    type: "folder",
    children: [
      {
        id: "shortcut-to-display-properties",
        type: "shortcut",
        targetId: "app-displayproperties",
        name: "Display",
      },
      {
        id: "shortcut-to-desktopthemes",
        type: "shortcut",
        targetId: "app-desktopthemes",
        name: "Desktop Themes",
      },
      {
        id: "shortcut-to-soundschemeexplorer",
        type: "shortcut",
        targetId: "app-soundschemeexplorer",
        name: "Sound",
      },
      {
        id: "shortcut-to-themetocss",
        type: "shortcut",
        targetId: "app-themetocss",
        name: "Theme to CSS",
      },
      {
        id: "shortcut-to-cursor-explorer",
        type: "shortcut",
        targetId: "app-cursorexplorer",
        name: "Mouse",
      },
    ],
  },
];

export default directory;
