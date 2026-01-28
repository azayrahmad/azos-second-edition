import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { getDisplayName, getParentPath } from "./utils/PathUtils.js";
import ZenClipboardManager from "./utils/ZenClipboardManager.js";

/**
 * MenuBarBuilder - Constructs menu bar for ZenExplorer
 */

export class MenuBarBuilder {
  constructor(app) {
    this.app = app;
  }

  /**
   * Build complete menu bar
   * @returns {MenuBar} Menu bar instance
   */
  build() {
    return new window.MenuBar({
      "&File": this._getFileMenuItems(),
      "&Edit": this._getEditMenuItems(),
      "&View": this._getViewMenuItems(),
      "&Go": this._getGoMenuItems(),
      "&Help": this._getHelpMenuItems(),
    });
  }

  /**
   * Get Edit menu items
   * @private
   */
  _getEditMenuItems() {
    const selectedIcons = this.app.iconManager?.selectedIcons || new Set();
    const selectedPaths = [...selectedIcons].map((icon) =>
      icon.getAttribute("data-path"),
    );
    const containsRootItem = selectedPaths.some(
      (p) => getParentPath(p) === "/",
    );
    const isRoot = this.app.currentPath === "/";

    return [
      {
        label: "Cu&t",
        shortcutLabel: "Ctrl+X",
        action: () => {
          this.app.fileOps.cutItems(selectedPaths);
        },
        enabled: () => selectedPaths.length > 0 && !containsRootItem,
      },
      {
        label: "&Copy",
        shortcutLabel: "Ctrl+C",
        action: () => {
          this.app.fileOps.copyItems(selectedPaths);
        },
        enabled: () => selectedPaths.length > 0,
      },
      {
        label: "&Paste",
        shortcutLabel: "Ctrl+V",
        action: () => this.app.fileOps.pasteItems(this.app.currentPath),
        enabled: () => !ZenClipboardManager.isEmpty() && !isRoot,
      },
    ];
  }

  /**
   * Get File menu items
   * @private
   */
  _getFileMenuItems() {
    const selectedIcons = this.app.iconManager?.selectedIcons || new Set();
    const selectedPaths = [...selectedIcons].map((icon) =>
      icon.getAttribute("data-path"),
    );
    const containsRootItem = selectedPaths.some(
      (p) => getParentPath(p) === "/",
    );
    const isRoot = this.app.currentPath === "/";

    return [
      {
        label: "&Open",
        action: () => {
          this.app.navigateTo(selectedPaths[0]);
        },
        enabled: () => selectedPaths.length > 0,
        default: true,
      },
      "MENU_DIVIDER",
      {
        label: "&New",
        enabled: () => !isRoot,
        submenu: [
          {
            label: "&Folder",
            action: () => this.app.fileOps.createNewFolder(),
            enabled: () => !isRoot,
          },
        ],
      },
      "MENU_DIVIDER",
      {
        label: "&Delete",
        action: () => {
          this.app.fileOps.deleteItems(selectedPaths);
        },
        enabled: () => selectedPaths.length > 0 && !containsRootItem,
      },
      {
        label: "&Rename",
        action: () => {
          const firstSelected = [...this.app.iconManager.selectedIcons][0];
          if (firstSelected) {
            this.app.fileOps.renameItem(
              firstSelected.getAttribute("data-path"),
            );
          }
        },
        enabled: () => selectedPaths.length === 1 && !containsRootItem,
      },
      "MENU_DIVIDER",
      {
        radioItems: this.app.navHistory.getMRUFolders().map((entry) => ({
          label: getDisplayName(entry.path),
          value: entry.id, // Use unique ID as value instead of path
        })),
        getValue: () => {
          // Return the ID of the selected entry
          return this.app.navHistory.getSelectedMRUId();
        },
        setValue: (id) => {
          // Find the entry by ID
          const entry = this.app.navHistory
            .getMRUFolders()
            .find((e) => e.id === id);
          if (entry) {
            // Mark this specific entry as manually selected
            this.app.navHistory.markAsManuallySelectedById(id);
            // Navigate without adding to MRU (pass true for skipMRU)
            this.app.navigateTo(entry.path, false, true);
          }
        },
      },
      "MENU_DIVIDER",
      {
        label: "&Close",
        action: () => this.app.win.close(),
      },
    ];
  }

  /**
   * Get View menu items
   * @private
   */
  _getViewMenuItems() {
    return [
      {
        label: "&Refresh",
        shortcutLabel: "F5",
        action: () => this.app.navigateTo(this.app.currentPath, true, true),
      },
    ];
  }

  /**
   * Get Go menu items
   * @private
   */
  _getGoMenuItems() {
    return [
      {
        label: "&Back",
        action: () => this.app.goBack(),
        enabled: () => this.app.navHistory.canGoBack(),
      },
      {
        label: "&Forward",
        action: () => this.app.goForward(),
        enabled: () => this.app.navHistory.canGoForward(),
      },
      {
        label: "&Up One Level",
        action: () => this.app.goUp(),
        enabled: () => this.app.currentPath !== "/",
      },
    ];
  }

  /**
   * Get Help menu items
   * @private
   */
  _getHelpMenuItems() {
    return [
      {
        label: "&About",
        action: () => {
          ShowDialogWindow({
            title: "About ZenFS",
            text: "ZenExplorer v0.1<br>Powered by ZenFS",
            modal: true,
            buttons: [{ label: "OK" }],
          });
        },
      },
    ];
  }
}
