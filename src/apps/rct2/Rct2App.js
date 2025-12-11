
import { Application } from "../Application.js";

export class Rct2App extends Application {
  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: "RollerCoaster Tycoon 2",
      id: this.id,
      width: 800,
      height: 600,
      resizable: true,
      icons: this.icon,
    });

    this.win = win;
    return win;
  }

  async _onLaunch() {
    this._showGuide();
  }

  _showGuide() {
    const content = `
      <div style="padding: 20px;">
        <h2>RollerCoaster Tycoon 2 Setup</h2>
        <p>This application requires the original game files for RollerCoaster Tycoon 2 to run.</p>

        <h3>Step 1: Download Game Data</h3>
        <p>If you don't have the game files, you can download them from the Internet Archive.</p>
        <p>
          <a href="https://archive.org/download/rollercoaster-tycoon-2-2/RCT2.zip" target="_blank" rel="noopener noreferrer">Download RCT2.zip</a>
        </p>

        <h3>Step 2: Select Game Directory</h3>
        <p>After downloading and unzipping the files, click the button below and select the main game directory (the one containing 'Data', 'Landscapes', etc.).</p>
        <button id="select-rct2-dir" style="margin-top: 10px;">Select Game Directory</button>
      </div>
    `;
    this.win.$content.html(content);
    this.win.$content.find("#select-rct2-dir").on("click", () => {
      this._selectGameDirectory();
    });
  }

  _selectGameDirectory() {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.addEventListener("change", (event) => {
      this._handleFilesSelected(event.target.files);
    });
    input.click();
  }

  _handleFilesSelected(files) {
    this.win.$content.html("<div>Loading...</div>");
    const assets = {};
    const promises = [];

    for (const file of files) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const path = file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1);
          assets[path] = new Uint8Array(event.target.result);
          resolve();
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsArrayBuffer(file);
      });
      promises.push(promise);
    }

    Promise.all(promises).then(() => {
      this._launchGame(assets);
    }).catch(error => {
        console.error("Error processing files:", error);
        this.win.$content.html("<div>Error processing files. Please try again.</div>");
    });
  }

  _launchGame(assets) {
    const iframe = document.createElement("iframe");
    iframe.src = "https://orct2.csh.rit.edu/";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    iframe.onload = () => {
      const gameAssets = {};
      for (const path in assets) {
          gameAssets[`/rct2-data-path/app/${path}`] = assets[path];
      }
      iframe.contentWindow.assets = gameAssets;
    };

    this.win.$content.html(iframe.outerHTML);
  }
}
