import { Application } from "../Application.js";
import { themes } from "../../config/themes.js";
import {
  setItem,
  getItem,
  LOCAL_STORAGE_KEYS,
} from "../../utils/localStorage.js";

import "./displayproperties.css";
import contentHtml from "./displayproperties.html?raw";

class DisplayPropertiesApp extends Application {
  constructor(data) {
    super({
      id: "display-properties",
      title: "Display Properties",
      width: 480,
      height: 420,
      resizable: false,
      ...data,
    });
  }

  _createWindow() {
    return new window.$Window({
      title: this.title,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      icons: this.icon,
      id: this.id, // Pass the id here
    });
  }

  async _onLaunch() {
    this.selectedWallpaper = null;
    this.selectedWallpaperMode =
      getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || "stretch";

    const { win } = this;
    win.$content.html(contentHtml);

    this._setupTabs(win);
    this._populateWallpaperList(win);
    this._setupButtons(win);

    // Set initial state
    const currentWallpaper = getItem(LOCAL_STORAGE_KEYS.WALLPAPER);
    const currentMode = getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || "stretch";
    this.selectedWallpaper = currentWallpaper;
    this.selectedWallpaperMode = currentMode;

    this._updatePreview(win);
    win.$content.find("#display-mode").value = currentMode;
  }

  _setupTabs(win) {
    const $tabs = win.$content.find('[role="tab"]');
    $tabs.on("click", (e) => {
      const $clickedTab = $(e.currentTarget);
      $tabs.attr("aria-selected", "false");
      $clickedTab.attr("aria-selected", "true");

      win.$content.find(".tab-content").hide();
      const activePanelId = $clickedTab.find("a").attr("href");
      win.$content.find(activePanelId).show();
    });
  }

  _populateWallpaperList(win) {
    const $wallpaperList = win.$content.find(".wallpaper-list");
    const wallpapers = Object.values(themes)
      .filter((theme) => theme.wallpaper)
      .map((theme) => ({ name: theme.name, path: theme.wallpaper }));

    const tableBody = $("<tbody></tbody>");

    // Add a "None" option
    const noneRow = $('<tr data-path="none"><td>(None)</td></tr>');
    tableBody.append(noneRow);

    wallpapers.forEach(({ name, path }) => {
      const tableRow = $(`<tr data-path="${path}"><td>${name}</td></tr>`);
      tableBody.append(tableRow);
    });

    $wallpaperList.empty().append(tableBody);

    $wallpaperList.on("click", "tr", (e) => {
      const $selectedRow = $(e.currentTarget);
      this.selectedWallpaper = $selectedRow.data("path");
      this._updatePreview(win);
      this._enableApplyButton(win);

      $wallpaperList.find(".highlighted").removeClass("highlighted");
      $selectedRow.addClass("highlighted");
    });
  }

  _updatePreview(win) {
    const $preview = win.$content.find(".display-wallpaper-preview");
    if (this.selectedWallpaper && this.selectedWallpaper !== "none") {
      $preview.css({
        "background-image": `url(${this.selectedWallpaper})`,
        "background-size": "cover",
      });
    } else {
      $preview.css("background-image", "none");
    }
  }

  _setupButtons(win) {
    const $okButton = win.$content.find(".ok-button");
    const $cancelButton = win.$content.find(".cancel-button");
    const $applyButton = win.$content.find(".apply-button");
    const $browseButton = win.$content.find(".browse-button");
    const $displayMode = win.$content.find("#display-mode");

    $applyButton.prop("disabled", true);

    $okButton.on("click", () => {
      this._applyChanges();
      this.win.close();
    });

    $cancelButton.on("click", () => {
      this.win.close();
    });

    $applyButton.on("click", () => {
      this._applyChanges();
      $applyButton.prop("disabled", true);
    });

    $browseButton.on("click", () => this._browseForWallpaper(win));

    $displayMode.on("change", (e) => {
      this.selectedWallpaperMode = $(e.target).val();
      this._enableApplyButton(win);
    });
  }

  _browseForWallpaper(win) {
    const $input = $('<input type="file" accept="image/*" />');
    $input.on("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          this.selectedWallpaper = readerEvent.target.result;
          this._updatePreview(win);
          this._enableApplyButton(win);
        };
        reader.readAsDataURL(file);
      }
    });
    $input.trigger("click");
  }

  _enableApplyButton(win) {
    win.$content.find(".apply-button").prop("disabled", false);
  }

  _applyChanges() {
    if (this.selectedWallpaper === "none") {
      setItem(LOCAL_STORAGE_KEYS.WALLPAPER, null);
    } else {
      setItem(LOCAL_STORAGE_KEYS.WALLPAPER, this.selectedWallpaper);
    }
    setItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE, this.selectedWallpaperMode);
    document.dispatchEvent(new CustomEvent("wallpaper-changed"));
  }
}

export default DisplayPropertiesApp;
