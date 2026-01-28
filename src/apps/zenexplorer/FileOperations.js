import { fs } from "@zenfs/core";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { showInputDialog } from "./components/InputDialog.js";
import { handleFileSystemError } from "./utils/ErrorHandler.js";
import { joinPath, getParentPath } from "./utils/PathUtils.js";
import { RecycleBinManager } from "./utils/RecycleBinManager.js";

/**
 * FileOperations - Handles file system operations with user interaction
 */

export class FileOperations {
    constructor(app) {
        this.app = app;
    }

    /**
     * Delete items with confirmation dialog
     * @param {Array<string>} paths - Paths to delete
     * @param {boolean} permanent - Whether to delete permanently
     */
    async deleteItems(paths, permanent = false) {
        if (paths.length === 0) return;

        const isRecycleBin = this.app.currentPath === "/C:/Recycled";
        const forcePermanent = permanent || isRecycleBin;

        let message;
        if (forcePermanent) {
            message = paths.length === 1
                ? `Are you sure you want to permanently delete '${paths[0].split("/").pop()}'?`
                : `Are you sure you want to permanently delete these ${paths.length} items?`;
        } else {
            message = paths.length === 1
                ? `Are you sure you want to send '${paths[0].split("/").pop()}' to the Recycle Bin?`
                : `Are you sure you want to send these ${paths.length} items to the Recycle Bin?`;
        }

        ShowDialogWindow({
            title: forcePermanent ? "Confirm File Delete" : "Confirm Send to Recycle Bin",
            text: message,
            parentWindow: this.app.win,
            modal: true,
            buttons: [
                {
                    label: "Yes",
                    isDefault: true,
                    action: async () => {
                        try {
                            for (const path of paths) {
                                if (forcePermanent) {
                                    if (isRecycleBin) {
                                        const id = path.split("/").pop();
                                        await RecycleBinManager.deletePermanently(id);
                                    } else {
                                        await fs.promises.rm(path, { recursive: true });
                                    }
                                } else {
                                    await RecycleBinManager.moveToRecycleBin(path);
                                }
                            }
                            this.app.navigateTo(this.app.currentPath);
                        } catch (e) {
                            handleFileSystemError(forcePermanent ? "delete" : "recycle", e, "items");
                        }
                    }
                },
                { label: "No" }
            ]
        });
    }

    /**
     * Restore items from Recycle Bin
     * @param {Array<string>} paths - Paths to restore
     */
    async restoreItems(paths) {
        try {
            for (const path of paths) {
                const id = path.split("/").pop();
                await RecycleBinManager.restoreItem(id);
            }
            this.app.navigateTo(this.app.currentPath);
        } catch (e) {
            handleFileSystemError("restore", e, "items");
        }
    }

    /**
     * Empty Recycle Bin
     */
    async emptyRecycleBin() {
        ShowDialogWindow({
            title: "Confirm Empty Recycle Bin",
            text: "Are you sure you want to permanently delete all items in the Recycle Bin?",
            parentWindow: this.app.win,
            modal: true,
            buttons: [
                {
                    label: "Yes",
                    isDefault: true,
                    action: async () => {
                        try {
                            await RecycleBinManager.emptyRecycleBin();
                            this.app.navigateTo(this.app.currentPath);
                        } catch (e) {
                            handleFileSystemError("empty", e, "Recycle Bin");
                        }
                    }
                },
                { label: "No" }
            ]
        });
    }

    /**
     * Rename item with input dialog
     * @param {string} fullPath - Full path to item
     */
    async renameItem(fullPath) {
        const oldName = fullPath.split("/").pop();

        showInputDialog({
            title: "Rename",
            label: "New name:",
            defaultValue: oldName,
            parentWindow: this.app.win,
            onSubmit: async (newName) => {
                if (newName === oldName) return;

                try {
                    const parentPath = getParentPath(fullPath);
                    const newPath = joinPath(parentPath, newName);
                    await fs.promises.rename(fullPath, newPath);
                    this.app.navigateTo(this.app.currentPath);
                } catch (e) {
                    handleFileSystemError("rename", e, oldName);
                }
            }
        });
    }

    /**
     * Create new folder with input dialog
     */
    async createNewFolder() {
        showInputDialog({
            title: "Create New Folder",
            label: "Folder name:",
            defaultValue: "New Folder",
            parentWindow: this.app.win,
            onSubmit: async (name) => {
                try {
                    const newPath = joinPath(this.app.currentPath, name);
                    await fs.promises.mkdir(newPath);
                    this.app.navigateTo(this.app.currentPath); // Refresh
                } catch (e) {
                    handleFileSystemError("create", e, "folder");
                }
            }
        });
    }
}
