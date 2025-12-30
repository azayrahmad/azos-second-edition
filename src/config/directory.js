import { generateProgramFiles } from "./generateProgramFiles.js";
import { generatePlusFiles } from "./generatePlusFiles.js";
import { ICONS } from "./icons.js";

const anosciSongNames = [
  "anosci - Blank VHS Tape Jingle Collection - 01 spun telecom tape.ogg",
  "anosci - Blank VHS Tape Jingle Collection - 02 golden springs tape.ogg",
  "anosci - Blank VHS Tape Jingle Collection - 03 gentle envelopment.ogg",
  "anosci - Blank VHS Tape Jingle Collection - 04 waiting room disco tape (loop).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 05 checker field tape (stinger).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 06 gridsquare tape (fade).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 07 augs and 6ths study (15).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 08 augs and 6th study (30).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 09 beach tape (cut).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 10 synth tape (loop).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 11 kinda western tape (15).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 12 kinda western tape (15 + intro).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 13 three hit tape (loop).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 14 2 bright tape (15).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 15 2 bright tape (30).ogg",
  "anosci - Blank VHS Tape Jingle Collection - 16 water basin tape (loop).ogg",
];

const anosciSongFiles = anosciSongNames.map((songName) => ({
  id: `file-anosci-${songName.replace(/[^a-zA-Z0-9]/g, "-")}`,
  name: songName,
  type: "file",
  icon: ICONS.winampFile,
  action: async () => {
    const { appManager } = await import("../utils/appManager.js");
    const url = `songs/anosci - Blank VHS Tape Jingle Collection/${encodeURIComponent(
      songName,
    )}`;
    appManager.launchApp("media-player", { url });
  },
}));

const anosciPlaylist = {
  id: "playlist-anosci",
  name: "anosci - Blank VHS Tape Jingle Collection.m3u",
  type: "file",
  icon: ICONS.winampFile,
  action: async () => {
    const { appManager } = await import("../utils/appManager.js");
    if (appManager.getApp("webamp")) {
      await appManager.closeApp("webamp");
    }
    const initialTracks = anosciSongNames.map((songName) => ({
      metaData: {
        title: songName.replace(
          "anosci - Blank VHS Tape Jingle Collection - ",
          "",
        ),
      },
      url: `songs/anosci - Blank VHS Tape Jingle Collection/${encodeURIComponent(
        songName,
      )}`,
    }));
    appManager.launchApp("webamp", { initialTracks });
  },
};

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
          { id: "app-quake", type: "app", appId: "quake" },
          { id: "app-esheep", type: "app", appId: "esheep" },
          { id: "app-simcity2000", type: "app", appId: "simcity2000" },
          { id: "app-minesweeper", type: "app", appId: "minesweeper" },
          { id: "app-wordpad", type: "app", appId: "wordpad" },
          { id: "app-calculator", type: "app", appId: "calculator" },
          { id: "app-help", type: "app", appId: "help" },
          { id: "app-princeofpersia", type: "app", appId: "princeofpersia" },
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
              {
                id: "shortcut-to-esheep",
                type: "shortcut",
                targetId: "app-esheep",
                name: "eSheep",
              },
              {
                id: "shortcut-to-diablo",
                type: "shortcut",
                targetId: "app-diablo",
                name: "Diablo",
              },
              {
                id: "shortcut-to-quake",
                type: "shortcut",
                targetId: "app-quake",
                name: "Quake",
              },
              {
                id: "shortcut-to-command-prompt",
                type: "shortcut",
                targetId: "command-prompt",
                name: "MS-DOS Prompt",
              },
              {
                id: "shortcut-to-minesweeper",
                type: "shortcut",
                targetId: "app-minesweeper",
                name: "Minesweeper",
              },
              {
                id: "shortcut-to-calculator",
                type: "shortcut",
                targetId: "app-calculator",
                name: "Calculator",
              },
              {
                id: "shortcut-to-defrag",
                type: "shortcut",
                targetId: "app-defrag",
                name: "Disk Defragmenter",
              },
              {
                id: "shortcut-to-wordpad",
                type: "shortcut",
                targetId: "app-wordpad",
                name: "WordPad",
              },
              {
                id: "shortcut-to-help",
                type: "shortcut",
                targetId: "app-help",
                name: "Help",
              },
              {
                id: "shortcut-to-princeofpersia",
                type: "shortcut",
                targetId: "app-princeofpersia",
                name: "Prince of Persia",
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
    children: [
      {
        id: "folder-songs",
        name: "Songs",
        type: "folder",
        children: [
          {
            id: "folder-anosci",
            name: "anosci - Blank VHS Tape Jingle Collection",
            type: "folder",
            children: [...anosciSongFiles, anosciPlaylist],
          },
        ],
      },
    ],
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
