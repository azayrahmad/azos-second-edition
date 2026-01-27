import { fs } from "@zenfs/core";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { showInputDialog } from "./components/InputDialog.js";
import { handleFileSystemError } from "./utils/ErrorHandler.js";
import { joinPath } from "./utils/PathUtils.js";

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
     */
    async deleteItems(paths) {
        if (paths.length === 0) return;

        const message = paths.length === 1
            ? `Are you sure you want to permanently delete '${paths[0].split("/").pop()}'?`
            : `Are you sure you want to permanently delete these ${paths.length} items?`;

        ShowDialogWindow({
            title: "Confirm File Delete",
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
                                await fs.promises.rm(path, { recursive: true });
                            }
                            this.app.navigateTo(this.app.currentPath);
                        } catch (e) {
                            handleFileSystemError("delete", e, "items");
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
                    const parentPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
                    const newPath = parentPath === "" ? `/${newName}` : `${parentPath}/${newName}`;
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
