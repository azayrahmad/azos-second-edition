import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { getPathName } from "./utils/PathUtils.js";

/**
 * MenuBarBuilder - Constructs menu bar for ZenExplorer
 */

export class MenuBarBuilder {
    constructor(app) {
        this.app = app;
    }

    /**
     * Build complete menu bar configuration object
     * @returns {Object} Menu bar configuration
     */
    build() {
        return {
            "&File": this._getFileMenuItems(),
            "&View": this._getViewMenuItems(),
            "&Go": this._getGoMenuItems(),
            "&Help": this._getHelpMenuItems()
        };
    }

    /**
     * Get File menu items
     * @private
     */
    _getFileMenuItems() {
        const isRecycleBin = this.app.currentPath === "/C:/Recycled";
        const getSelectedPaths = () => this.app.iconManager ? [...this.app.iconManager.selectedIcons].map(icon => icon.getAttribute("data-path")) : [];

        return [
            {
                label: isRecycleBin ? "&Restore" : "&Open",
                action: () => {
                    const paths = getSelectedPaths();
                    if (isRecycleBin) {
                        this.app.fileOps.restoreItems(paths);
                    } else if (paths.length > 0) {
                        this.app.navigateTo(paths[0]);
                    }
                },
                enabled: () => getSelectedPaths().length > 0,
                default: true,
            },
            "MENU_DIVIDER",
            {
                label: "&New",
                enabled: () => !isRecycleBin,
                submenu: [
                    {
                        label: "&Folder",
                        action: () => this.app.fileOps.createNewFolder(),
                    },
                ],
            },
            "MENU_DIVIDER",
            {
                label: "&Delete",
                action: () => {
                    const paths = getSelectedPaths();
                    if (paths.length > 0) {
                        this.app.fileOps.deleteItems(paths);
                    }
                },
                enabled: () => getSelectedPaths().length > 0,
            },
            {
                label: "&Rename",
                action: () => {
                    const paths = getSelectedPaths();
                    if (paths.length === 1) {
                        this.app.fileOps.renameItem(paths[0]);
                    }
                },
                enabled: () => getSelectedPaths().length === 1 && !isRecycleBin,
            },
            ...(isRecycleBin ? [
                "MENU_DIVIDER",
                {
                    label: "&Empty Recycle Bin",
                    action: () => this.app.fileOps.emptyRecycleBin(),
                }
            ] : []),
            ...(this.app.navHistory.getMRUFolders().length > 0 ? [
                "MENU_DIVIDER",
                {
                    radioItems: this.app.navHistory.getMRUFolders().map(entry => ({
                        label: getPathName(entry.path),
                        value: entry.id // Use unique ID as value instead of path
                    })),
                    getValue: () => {
                        // Return the ID of the selected entry
                        return this.app.navHistory.getSelectedMRUId();
                    },
                    setValue: (id) => {
                        // Find the entry by ID
                        const entry = this.app.navHistory.getMRUFolders().find(e => e.id === id);
                        if (entry) {
                            // Mark this specific entry as manually selected
                            this.app.navHistory.markAsManuallySelectedById(id);
                            // Navigate without adding to MRU (pass true for skipMRU)
                            this.app.navigateTo(entry.path, false, true);
                        }
                    }
                }
            ] : []),
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
                action: () => this.app.navigateTo(this.app.currentPath),
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
