import { Application } from "../Application.js";
import { wallpapers } from "../../config/wallpapers.js";
import {
  setItem,
  getItem,
  LOCAL_STORAGE_KEYS,
} from "../../utils/localStorage.js";
import { applyBusyCursor, clearBusyCursor } from "../../utils/cursorManager.js";
import { SCREENSAVERS } from "../../components/screensaver.js";
import screensaverManager from "../../components/screensaver.js";
import {
  getColorModes,
  getCurrentColorMode,
  setColorMode,
} from "../../utils/colorModeManager.js";
import {
  getAvailableResolutions,
  setResolution,
  getCurrentResolutionId,
} from "../../utils/screenManager.js";

import "./displayproperties.css";
import contentHtml from "./displayproperties.html?raw";
import energystar from "../../assets/img/EnergyStarDisplay.png";

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
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
      id: this.id, // Pass the id here
    });
  }

  async _onLaunch() {
    this.selectedWallpaper = null;
    this.selectedWallpaperMode =
      getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || "stretch";
    this.selectedScreensaver =
      getItem(LOCAL_STORAGE_KEYS.SCREENSAVER) || "none";
    this.screensaverTimeout =
      getItem(LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT) / 60000 || 1;

    const { win } = this;
    win.$content.html(contentHtml);

    // Set the Energy Star logo src
    win.$content.find(".energy-star-logo").attr("src", energystar);

    this._setupTabs(win);
    this._populateWallpaperList(win);
    this._setupButtons(win);
    this._setupScreenSaverTab(win);
    this._setupSettingsTab(win);

    // Set initial state
    const currentWallpaper = getItem(LOCAL_STORAGE_KEYS.WALLPAPER);
    const currentMode = getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || "stretch";
    this.selectedWallpaper = currentWallpaper;
    this.selectedWallpaperMode = currentMode;

    this._updatePreview(win);
    win.$content.find("#display-mode").val(currentMode);
  }

  _setupTabs(win) {
    const $tabs = win.$content.find('[role="tab"]');
    $tabs.on("click", (e) => {
      e.preventDefault(); // Prevent default link behavior
      const $clickedTab = $(e.currentTarget);
      $tabs.attr("aria-selected", "false");
      $clickedTab.attr("aria-selected", "true");

      win.$content.find(".tab-content").hide();
      const activePanelId = $clickedTab.find("a").attr("data-target");
      win.$content.find(activePanelId).show();

      if (activePanelId === "#screensaver") {
        this._updateScreensaverPreview(win);
      }
    });
  }

  _populateWallpaperList(win) {
    const $wallpaperList = win.$content.find(".wallpaper-list");
    const wallpapersToDisplay = wallpapers.default.map((w) => {
      const formattedName = w.id
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      return { name: formattedName, path: w.src };
    });

    const tableBody = $("<tbody></tbody>");

    // Add a "None" option
    const noneRow = $('<tr data-path="none"><td>(None)</td></tr>');
    tableBody.append(noneRow);

    wallpapersToDisplay.forEach(({ name, path }) => {
      const tableRow = $(`<tr data-path=\"${path}\"><td>${name}</td></tr>`);
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
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        const scaledWidth = naturalWidth / 5;
        const scaledHeight = naturalHeight / 5;

        const cssProps = {
          "background-image": `url(${this.selectedWallpaper})`,
          "background-repeat": "no-repeat",
          "background-position": "center center", // Default for center/stretch
        };

        switch (this.selectedWallpaperMode) {
          case "stretch":
            // The 1/5th scaled image will stretch to fill the preview area
            cssProps["background-size"] = "100% 100%";
            break;
          case "center":
            // The 1/5th scaled image will be centered, taking its actual 1/5th size
            cssProps["background-size"] = `${scaledWidth}px ${scaledHeight}px`;
            break;
          case "tile":
            // The 1/5th scaled image will tile, taking its actual 1/5th size
            cssProps["background-size"] = `${scaledWidth}px ${scaledHeight}px`;
            cssProps["background-repeat"] = "repeat";
            cssProps["background-position"] = "0 0"; // Tiles from top-left
            break;
          default:
            // Default to stretch if mode is unrecognized
            cssProps["background-size"] = "100% 100%";
            break;
        }
        $preview.css(cssProps);
      };
      img.onerror = () => {
        // Handle error if image fails to load, clear the preview
        $preview.css({
          "background-image": "none",
          "background-size": "auto",
          "background-repeat": "no-repeat",
          "background-position": "center center",
        });
      };
      img.src = this.selectedWallpaper;
    } else {
      // If selectedWallpaper is "none" or null, clear the background
      $preview.css({
        "background-image": "none",
        "background-size": "auto",
        "background-repeat": "no-repeat",
        "background-position": "center center",
      });
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
      this._updatePreview(win); // Update preview immediately when display mode changes
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

    // Screensaver settings
    screensaverManager.setCurrentScreensaver(this.selectedScreensaver);
    setItem(
      LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT,
      this.screensaverTimeout * 60000,
    );

    // Settings tab
    if (this.selectedColorMode) {
      setColorMode(this.selectedColorMode);
    }
    if (this.selectedResolution) {
      setResolution(this.selectedResolution);
    }
  }

  _setupSettingsTab(win) {
    const $colorModeSelect = win.$content.find("#color-mode-select");
    const $resolutionSlider = win.$content.find("#resolution-slider");
    const $currentResolution = win.$content.find(".current-resolution");
    const $browserInfo = win.$content.find(".browser-info");

    // Populate color modes
    const colorModes = getColorModes();
    Object.entries(colorModes).forEach(([id, mode]) => {
      const $option = $(`<option value="${id}">${mode.name}</option>`);
      $colorModeSelect.append($option);
    });

    // Set initial color mode
    const currentColorMode = getCurrentColorMode();
    $colorModeSelect.val(currentColorMode);
    this.selectedColorMode = currentColorMode;

    // Populate resolutions
    const resolutions = getAvailableResolutions();
    const currentResolutionId = getCurrentResolutionId();
    const currentIndex = resolutions.indexOf(currentResolutionId);
    $resolutionSlider.val(currentIndex > -1 ? currentIndex : resolutions.length - 1);
    $currentResolution.text(
      currentResolutionId === "fit"
        ? "Fit Screen"
        : `${resolutions[currentIndex]} pixels`,
    );
    this.selectedResolution = currentResolutionId;

    // Display browser info
    $browserInfo.text(navigator.userAgent);

    // Event listeners
    $colorModeSelect.on("change", (e) => {
      this.selectedColorMode = $(e.target).val();
      this._enableApplyButton(win);
    });

    $resolutionSlider.on("input", (e) => {
      const index = parseInt($(e.target).val(), 10);
      const resolution = resolutions[index];
      this.selectedResolution = resolution;
      $currentResolution.text(
        resolution === "fit" ? "Fit Screen" : `${resolution} pixels`,
      );
      this._enableApplyButton(win);
    });
  }

  // --- Screen Saver Tab ---
  _setupScreenSaverTab(win) {
    const $dropdown = win.$content.find("#screensaver-dropdown");
    const $previewButton = win.$content.find(".preview-button");
    const $waitTimeInput = win.$content.find("#wait-time");

    // Populate dropdown
    Object.keys(SCREENSAVERS).forEach((id) => {
      const screensaver = SCREENSAVERS[id];
      const $option = $(`<option value="${id}">${screensaver.name}</option>`);
      $dropdown.append($option);
    });

    // Set initial state
    $dropdown.val(this.selectedScreensaver);
    $waitTimeInput.val(this.screensaverTimeout);

    // Event listeners
    $dropdown.on("change", (e) => {
      this.selectedScreensaver = $(e.target).val();
      this._updateScreensaverPreview(win);
      this._enableApplyButton(win);
    });

    $waitTimeInput.on("change", (e) => {
      this.screensaverTimeout = parseInt($(e.target).val(), 10);
      this._enableApplyButton(win);
    });

    $previewButton.on("click", () => {
      if (this.selectedScreensaver !== "none") {
        screensaverManager.showPreview(this.selectedScreensaver);
      }
    });
  }

  _updateScreensaverPreview(win) {
    const $preview = win.$content.find(".display-screensaver-preview");
    $preview.empty();

    const screensaver = SCREENSAVERS[this.selectedScreensaver];
    if (screensaver && screensaver.path) {
      applyBusyCursor(win.$content[0]);
      const $iframe = $("<iframe>")
        .attr("src", `${import.meta.env.BASE_URL}${screensaver.path}`)
        .css({
          width: "100%",
          height: "100%",
          border: "none",
          "pointer-events": "none", // Make it non-interactive
        })
        .on("load", () => {
          clearBusyCursor(win.$content[0]);
        });
      $preview.append($iframe);
    }
  }
}

export default DisplayPropertiesApp;
