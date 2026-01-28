import { fs } from "@zenfs/core";
import { renderFileIcon } from "./FileIconRenderer.js";
import { ICONS } from "../../../config/icons.js";
import { RecycleBinManager } from "../utils/RecycleBinManager.js";
import ZenUndoManager from "../utils/ZenUndoManager.js";
import ZenClipboardManager from "../utils/ZenClipboardManager.js";
import {
  getDisplayName,
  formatPathForDisplay,
  joinPath,
  getParentPath,
} from "../utils/PathUtils.js";

export class ZenDirectoryView {
  constructor(app) {
    this.app = app;
    this._isRenaming = false;
    this.lastSelectedIcon = null;
    this.selectionTimestamp = 0;
  }

  /**
   * Update UI elements for current path
   */
  async updateUIForPath(path) {
    const name = getDisplayName(path);
    let icon =
      path === "/"
        ? ICONS.computer
        : path.match(/^\/[A-Z]:\/?$/i)
          ? ICONS.drive
          : ICONS.folderOpen;

    // Handle Floppy icon
    if (path === "/A:") {
      icon = ICONS.disketteDrive;
    }
    // Handle CD icon
    if (path === "/E:") {
      icon = ICONS.disketteDrive;
    }
    if (RecycleBinManager.isRecycleBinPath(path)) {
      const isEmpty = await RecycleBinManager.isEmpty();
      icon = isEmpty ? ICONS.recycleBinEmpty : ICONS.recycleBinFull;
    }

    this.app.addressBar.setValue(formatPathForDisplay(path));
    this.app.win.title(name);
    this.app.sidebar.update(name, icon[32]);
    this.app.win.setIcons(icon);
  }

  /**
   * Render directory contents
   */
  async renderDirectoryContents(path) {
    let files = await fs.promises.readdir(path);

    // Sort files alphabetically (so A: comes before C:)
    files.sort((a, b) => a.localeCompare(b));

    // Clear view
    this.app.iconContainer.innerHTML = "";
    this.app.iconManager.clearSelection();

    // Hide metadata file in recycle bin
    if (RecycleBinManager.isRecycleBinPath(path)) {
      files = files.filter((f) => f !== ".metadata.json");
    }

    const isRecycleBin = RecycleBinManager.isRecycleBinPath(path);
    const metadata = isRecycleBin
      ? await RecycleBinManager.getMetadata()
      : null;
    const recycleBinEmpty = await RecycleBinManager.isEmpty();

    // Build icons first (async operations here)
    const icons = [];
    for (const file of files) {
      const fullPath = joinPath(path, file);
      try {
        const fileStat = await fs.promises.stat(fullPath);
        const isDir = fileStat.isDirectory();
        const iconDiv = await renderFileIcon(file, fullPath, isDir, {
          metadata,
          recycleBinEmpty,
        });
        this.app.iconManager.configureIcon(iconDiv);

        // Add click listener for inline rename
        iconDiv.addEventListener("click", (e) => {
          if (this._isRenaming) return;
          if (
            this.lastSelectedIcon === iconDiv &&
            Date.now() - this.selectionTimestamp > 500
          ) {
            this.enterRenameMode(iconDiv);
            e.stopPropagation();
          }
        });

        icons.push(iconDiv);
      } catch (e) {
        console.warn("Could not stat", fullPath);
      }
    }

    // Only clear and update DOM once all icons are ready to avoid duplication during concurrent renders
    this.app.iconContainer.innerHTML = "";
    this.app.iconManager.clearSelection();
    const fragment = document.createDocumentFragment();
    icons.forEach((icon) => fragment.appendChild(icon));
    this.app.iconContainer.appendChild(fragment);

    this.app.statusBar.setText(`${icons.length} object(s)`);
  }

  /**
   * Update icon styles based on clipboard state
   */
  updateCutIcons() {
    const { items, operation } = ZenClipboardManager.get();
    const cutPaths = operation === "cut" ? new Set(items) : new Set();

    const icons = this.app.iconContainer.querySelectorAll(".explorer-icon");
    icons.forEach((icon) => {
      const path = icon.getAttribute("data-path");
      if (cutPaths.has(path)) {
        icon.classList.add("cut");
      } else {
        icon.classList.remove("cut");
      }
    });
  }

  /**
   * Enter inline rename mode for an icon
   * @param {HTMLElement} icon - The icon element
   */
  async enterRenameMode(icon) {
    if (this._isRenaming) return;

    const path = icon.getAttribute("data-path");
    const isRootItem = getParentPath(path) === "/";
    const isRecycleBin = RecycleBinManager.isRecycleBinPath(path);

    if (isRootItem || isRecycleBin) return;

    this._isRenaming = true;

    const label = icon.querySelector(".icon-label");
    const fullPath = icon.getAttribute("data-path");
    const oldName = fullPath.split("/").pop();

    const input = document.createElement("input");
    input.type = "text";
    input.className = "icon-label-input";
    input.value = oldName;

    label.innerHTML = "";
    label.appendChild(input);

    // Select filename without extension
    const dotIndex = oldName.lastIndexOf(".");
    if (dotIndex > 0 && icon.getAttribute("data-type") !== "directory") {
      input.setSelectionRange(0, dotIndex);
    } else {
      input.select();
    }
    input.focus();

    const finishRename = async (save) => {
      if (!this._isRenaming) return;
      this._isRenaming = false;

      const newName = input.value.trim();
      if (save && newName && newName !== oldName) {
        try {
          const parentPath = getParentPath(fullPath);
          const newPath = joinPath(parentPath, newName);
          await fs.promises.rename(fullPath, newPath);
          ZenUndoManager.push({
            type: "rename",
            data: { from: fullPath, to: newPath },
          });
          await this.app.navController.navigateTo(this.app.currentPath, true, true);
        } catch (e) {
          alert(`Error renaming: ${e.message}`);
          label.textContent = getDisplayName(fullPath);
        }
      } else {
        label.textContent = getDisplayName(fullPath);
      }
    };

    input.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        finishRename(true);
      } else if (e.key === "Escape") {
        finishRename(false);
      }
    };

    input.onblur = () => {
      finishRename(true);
    };

    // Prevent click propagation to avoid re-triggering rename
    input.onclick = (e) => e.stopPropagation();
    input.ondblclick = (e) => e.stopPropagation();
  }

  /**
   * Enter rename mode finding icon by path
   * @param {string} path
   */
  enterRenameModeByPath(path) {
    const icon = this.app.iconContainer.querySelector(
      `.explorer-icon[data-path="${path}"]`,
    );
    if (icon) {
      this.app.iconManager.setSelection(new Set([icon]));
      this.enterRenameMode(icon);
    }
  }

  /**
   * Handle selection change to track last selected icon for rename
   */
  handleSelectionChange() {
    const selectedIcons = this.app.iconManager.selectedIcons;
    const count = selectedIcons.size;

    if (count === 1) {
      const icon = [...selectedIcons][0];
      if (this.lastSelectedIcon !== icon) {
        this.lastSelectedIcon = icon;
        this.selectionTimestamp = Date.now();
      }
    } else {
      this.lastSelectedIcon = null;
      this.selectionTimestamp = 0;
    }
  }
}
