import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";

export class DoomApp extends Application {
  static config = {
    id: "doom",
    title: "Doom",
    description: "Play the classic game Doom.",
    icon: ICONS.doom,
    width: 800,
    height: 500,
    resizable: true,
    maximizable: true,
  };

  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      id: this.id,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      maximizable: this.maximizable,
      icons: this.icon,
    });

    win.$content.css({
      display: "flex",
      "justify-content": "center",
      "align-items": "center",
      "background-color": "black",
      overflow: "hidden",
      height: "100%",
    });

    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.className = "frame";
    canvas.oncontextmenu = (event) => event.preventDefault();
    canvas.tabIndex = -1;
    canvas.style.backgroundColor = "black";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    win.$content.append(canvas);
    this.canvas = canvas;

    return win;
  }

  _ensureDirectoryExistence(filePath) {
    const Module = this.Module;
    if (!Module || !Module.FS) return;

    let dirname = filePath.substring(0, filePath.lastIndexOf("/"));
    if (dirname === "" || dirname === "/") return; // No directory or root

    let parts = dirname.split("/").filter((p) => p !== "");
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      currentPath += "/" + parts[i];
      try {
        Module.FS.stat(currentPath);
      } catch (e) {
        // Directory does not exist, create it
        Module.FS.mkdir(currentPath);
      }
    }
  }

  _readAllFiles(path) {
    const Module = this.Module;
    if (!Module || !Module.FS) return [];

    let allFiles = [];
    let filesInDir;
    try {
      filesInDir = Module.FS.readdir(path);
    } catch (e) {
      console.warn(`Could not read directory ${path}: ${e}`);
      return [];
    }

    filesInDir = filesInDir.filter(
      (entry) => entry !== "." && entry !== "..",
    );

    filesInDir.forEach((entry) => {
      const fullPath =
        path === "/" ? `/${entry}` : `${path}/${entry}`;
      try {
        const stat = Module.FS.stat(fullPath);
        if (Module.FS.isDir(stat.mode)) {
          allFiles = allFiles.concat(this._readAllFiles(fullPath));
        } else if (Module.FS.isFile(stat.mode)) {
          allFiles.push(fullPath);
        }
      } catch (e) {
        console.warn(`Could not stat ${fullPath}: ${e}`);
      }
    });
    return allFiles;
  }

  _saveDoomProgress() {
    const Module = this.Module;
    if (!Module || !Module.FS) return;

    try {
      const files = this._readAllFiles("/");
      files.forEach((file) => {
        const filenameOnly = file.substring(
          file.lastIndexOf("/") + 1,
        );
        if (
          filenameOnly.startsWith("doomsav") &&
          filenameOnly.endsWith(".dsg")
        ) {
          const fileData = Module.FS.readFile(file, {
            encoding: "binary",
          });
          if (fileData) {
            let binary = "";
            const bytes = new Uint8Array(fileData);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Data = btoa(binary);
            localStorage.setItem(`doom_save_${file}`, base64Data);
            console.log(`Saved ${file} to localStorage.`);
          }
        }
      });
    } catch (e) {
      console.error("Failed to save game to localStorage:", e);
    }
  }

  async _onLaunch() {
    this.win.focus();

    const commonArgs = [
      "-iwad",
      "doom1.wad",
      "-window",
      "-nogui",
      "-nomusic",
      "-config",
      "default.cfg",
      "-servername",
      "doomflare",
    ];

    this.Module = {
      canvas: this.canvas,
      noInitialRun: true,
      onRuntimeInitialized: () => {
        Promise.all([
          fetch("games/doom/doom1.wad").then((response) =>
            response.arrayBuffer(),
          ),
          fetch("games/doom/default.cfg").then((response) =>
            response.arrayBuffer(),
          ),
        ]).then(([wad, cfg]) => {
          window.Module.FS_createDataFile(
            "/",
            "doom1.wad",
            new Uint8Array(wad),
            true,
            true,
          );
          window.Module.FS_createDataFile(
            "/",
            "default.cfg",
            new Uint8Array(cfg),
            true,
            true,
          );

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("doom_save_")) {
              const filename = key.substring("doom_save_".length);
              const savedGame = localStorage.getItem(key);
              if (savedGame) {
                try {
                  const binaryString = atob(savedGame);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let j = 0; j < len; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                  }
                  this._ensureDirectoryExistence(filename);
                  const parentDir =
                    filename.substring(0, filename.lastIndexOf("/")) || "/";
                  const baseFilename = filename.substring(
                    filename.lastIndexOf("/") + 1,
                  );

                  window.Module.FS_createDataFile(
                    parentDir,
                    baseFilename,
                    bytes,
                    true,
                    true,
                    true,
                  );
                } catch (e) {
                  console.error(
                    `Failed to load ${filename} from localStorage:`,
                    e,
                  );
                }
              }
            }
          }
          window.Module.callMain(commonArgs);
        });
      },
      print: (text) => console.log(text),
      printErr: (text) => console.error(text),
      setStatus: (text) => console.log(text),
    };

    window.Module = this.Module; // Expose for the script

    const script = document.createElement("script");
    script.src = "games/doom/websockets-doom.js";
    script.async = true;
    document.head.appendChild(script);
    this.script = script;

    this.win.on("close", () => {
      this._saveDoomProgress();
      if (this.script) {
        this.script.remove();
        this.script = null;
      }
      if (window.Module === this.Module) {
        delete window.Module;
      }
      this.Module = null;
    });
  }
}
