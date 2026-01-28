import { fs } from "@zenfs/core";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { showInputDialog } from "./components/InputDialog.js";
import { handleFileSystemError } from "./utils/ErrorHandler.js";
import { joinPath, normalizePath, getPathName } from "./utils/PathUtils.js";
import ZenClipboardManager from "./utils/ZenClipboardManager.js";
import { RecycleBinManager } from "./utils/RecycleBinManager.js";

/**
 * FileOperations - Handles file system operations with user interaction
 */

export class FileOperations {
    constructor(app) {
        this.app = app;
    }

    /**
     * Cut items to clipboard
     * @param {Array<string>} paths - Paths to cut
     */
    cutItems(paths) {
        if (paths.length === 0) return;
        ZenClipboardManager.set(paths, "cut");
    }

    /**
     * Copy items to clipboard
     * @param {Array<string>} paths - Paths to copy
     */
    copyItems(paths) {
        if (paths.length === 0) return;
        ZenClipboardManager.set(paths, "copy");
    }

    /**
     * Paste items from clipboard
     * @param {string} destinationPath - Path to paste into
     */
    async pasteItems(destinationPath) {
        const { items, operation } = ZenClipboardManager.get();
        if (items.length === 0) return;

        try {
            for (const itemPath of items) {
                const itemName = getPathName(itemPath);
                const targetPath = await this.getUniquePastePath(destinationPath, itemName, operation);

                if (operation === "cut") {
                    await fs.promises.rename(itemPath, targetPath);
                } else if (operation === "copy") {
                    await this.copyRecursive(itemPath, targetPath);
                }
            }

            if (operation === "cut") {
                ZenClipboardManager.clear();
            }

            this.app.navigateTo(this.app.currentPath);
        } catch (e) {
            handleFileSystemError(operation === "cut" ? "move" : "copy", e, "items");
        }
    }

    /**
     * Get a unique path for pasting to avoid collisions
     * @private
     */
    async getUniquePastePath(destPath, originalName, operation) {
        let checkPath = normalizePath(joinPath(destPath, originalName));
        try {
            await fs.promises.stat(checkPath);
            // If it doesn't throw, it exists. We need a new name.
        } catch (e) {
            // Doesn't exist, we can use it.
            return checkPath;
        }

        if (operation === "cut") {
            let name = originalName;
            let counter = 1;
            const extensionIndex = originalName.lastIndexOf('.');
            const hasExtension = extensionIndex > 0;
            const baseName = hasExtension ? originalName.substring(0, extensionIndex) : originalName;
            const ext = hasExtension ? originalName.substring(extensionIndex) : '';

            while (true) {
                name = hasExtension ? `${baseName} (${counter})${ext}` : `${originalName} (${counter})`;
                checkPath = normalizePath(joinPath(destPath, name));
                try {
                    await fs.promises.stat(checkPath);
                    counter++;
                } catch (e) {
                    return checkPath;
                }
            }
        } else {
            // Windows-style copy naming: "Copy of X", "Copy (2) of X", etc.
            const copyNOfRegex = /^Copy \((\d+)\) of (.*)$/;
            const copyOfRegex = /^Copy of (.*)$/;

            let baseName = originalName;
            let match;
            if ((match = originalName.match(copyNOfRegex))) {
                baseName = match[2];
            } else if ((match = originalName.match(copyOfRegex))) {
                baseName = match[1];
            }

            let candidateName = `Copy of ${baseName}`;
            checkPath = normalizePath(joinPath(destPath, candidateName));
            try {
                await fs.promises.stat(checkPath);
                // "Copy of X" exists, try "Copy (2) of X", "Copy (3) of X", etc.
                let counter = 2;
                while (true) {
                    candidateName = `Copy (${counter}) of ${baseName}`;
                    checkPath = normalizePath(joinPath(destPath, candidateName));
                    try {
                        await fs.promises.stat(checkPath);
                        counter++;
                    } catch (e) {
                        return checkPath;
                    }
                }
            } catch (e) {
                return checkPath;
            }
        }
    }

    /**
     * Recursively copy a file or directory
     * @private
     */
    async copyRecursive(src, dest) {
        const stats = await fs.promises.stat(src);
        if (stats.isDirectory()) {
            await fs.promises.mkdir(dest, { recursive: true });
            const files = await fs.promises.readdir(src);
            for (const file of files) {
                await this.copyRecursive(joinPath(src, file), joinPath(dest, file));
            }
        } else {
            const data = await fs.promises.readFile(src);
            await fs.promises.writeFile(dest, data);
        }
    }

    /**
     * Delete items with confirmation dialog
     * @param {Array<string>} paths - Paths to delete
     * @param {boolean} permanent - Whether to bypass Recycle Bin
     */
    async deleteItems(paths, permanent = false) {
        if (paths.length === 0) return;

        // If items are already in Recycle Bin, deletion is always permanent
        const alreadyInRecycle = paths.some(path => RecycleBinManager.isRecycledItemPath(path));
        const isPermanent = permanent || alreadyInRecycle;

        const message = isPermanent
            ? (paths.length === 1
                ? `Are you sure you want to permanently delete '${getPathName(paths[0])}'?`
                : `Are you sure you want to permanently delete these ${paths.length} items?`)
            : (paths.length === 1
                ? `Are you sure you want to send '${getPathName(paths[0])}' to the Recycle Bin?`
                : `Are you sure you want to send these ${paths.length} items to the Recycle Bin?`);

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
                            if (isPermanent) {
                                for (const path of paths) {
                                    await fs.promises.rm(path, { recursive: true });
                                }
                                // If it was in recycle bin, we should also clean up metadata
                                if (alreadyInRecycle) {
                                    const metadata = await RecycleBinManager.getMetadata();
                                    let changed = false;
                                    for (const path of paths) {
                                        const id = getPathName(path);
                                        if (metadata[id]) {
                                            delete metadata[id];
                                            changed = true;
                                        }
                                    }
                                    if (changed) {
                                        await RecycleBinManager.saveMetadata(metadata);
                                        document.dispatchEvent(new CustomEvent("zen-recycle-bin-change"));
                                    }
                                }
                            } else {
                                await RecycleBinManager.moveItemsToRecycleBin(paths);
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

    /**
     * Create new text document with input dialog
     */
    async createNewTextFile() {
        showInputDialog({
            title: "Create New Text Document",
            label: "File name:",
            defaultValue: "New Text Document.txt",
            parentWindow: this.app.win,
            onSubmit: async (name) => {
                try {
                    const newPath = joinPath(this.app.currentPath, name);
                    await fs.promises.writeFile(newPath, "");
                    this.app.navigateTo(this.app.currentPath); // Refresh
                } catch (e) {
                    handleFileSystemError("create", e, "file");
                }
            }
        });
    }
}
