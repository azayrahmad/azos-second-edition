import { generateProgramFiles } from "./generateProgramFiles.js";
import { coreApps } from "./core-apps.js";

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
          ...coreApps,
          { id: "app-doom", type: "app", appId: "doom" },
          { id: "app-simcity2000", type: "app", appId: "simcity2000" },
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
            enableFileDrop: true,
            children: [
              {
                id: "shortcut-to-my-computer",
                type: "shortcut",
                targetId: "app-my-computer",
                name: "My Computer",
              },
              {
                id: "shortcut-to-my-documents",
                type: "shortcut",
                targetId: "app-my-documents",
                name: "My Documents",
              },
              {
                id: "shortcut-to-recycle-bin",
                type: "shortcut",
                targetId: "app-recycle-bin",
                name: "Recycle Bin",
              },
              {
                id: "shortcut-to-network-neighborhood",
                type: "shortcut",
                targetId: "app-network-neighborhood",
                name: "Network Neighborhood",
              },
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
                id: "shortcut-to-cursor-explorer",
                type: "shortcut",
                targetId: "app-cursor-explorer",
                name: "Cursor Explorer",
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
            ],
          },
          {
            id: "folder-documents",
            name: "Documents",
            type: "folder",
            enableFileDrop: true,
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
];

export default directory;
