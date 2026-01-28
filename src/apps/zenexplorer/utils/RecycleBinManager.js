import { fs } from "@zenfs/core";
import { joinPath } from "./PathUtils.js";

const RECYCLE_PATH = "/C:/Recycled";
const METADATA_FILE = joinPath(RECYCLE_PATH, ".metadata.json");

/**
 * RecycleBinManager - Handles Recycle Bin operations for ZenFS
 */
export class RecycleBinManager {
    /**
     * Initialize Recycle Bin directory and metadata
     */
    static async init() {
        try {
            // Check if Recycled directory exists
            try {
                await fs.promises.stat(RECYCLE_PATH);
            } catch (e) {
                await fs.promises.mkdir(RECYCLE_PATH, { recursive: true });
            }

            // Check if metadata file exists
            try {
                await fs.promises.stat(METADATA_FILE);
            } catch (e) {
                await fs.promises.writeFile(METADATA_FILE, JSON.stringify({ items: [] }));
            }
        } catch (e) {
            console.error("RecycleBin init failed", e);
        }
    }

    /**
     * Get recycle bin metadata
     * @returns {Promise<Object>} Metadata object
     */
    static async getMetadata() {
        try {
            const data = await fs.promises.readFile(METADATA_FILE, "utf8");
            return JSON.parse(data);
        } catch (e) {
            return { items: [] };
        }
    }

    /**
     * Save recycle bin metadata
     * @param {Object} metadata - Metadata object
     */
    static async saveMetadata(metadata) {
        await fs.promises.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    }

    /**
     * Helper to move file or folder across devices (EXDEV fallback)
     * @private
     */
    static async _safeMove(src, dest) {
        try {
            await fs.promises.rename(src, dest);
        } catch (e) {
            if (e.code === 'EXDEV' || e.message?.includes('EXDEV')) {
                // Fallback: Copy and Delete
                const stats = await fs.promises.stat(src);
                if (stats.isDirectory()) {
                    await fs.promises.mkdir(dest, { recursive: true });
                    const files = await fs.promises.readdir(src);
                    for (const file of files) {
                        await this._safeMove(joinPath(src, file), joinPath(dest, file));
                    }
                    await fs.promises.rmdir(src);
                } else {
                    const content = await fs.promises.readFile(src);
                    await fs.promises.writeFile(dest, content);
                    await fs.promises.unlink(src);
                }
            } else {
                throw e;
            }
        }
    }

    /**
     * Move an item to the Recycle Bin
     * @param {string} path - Path to the item
     */
    static async moveToRecycleBin(path) {
        await this.init(); // Ensure it exists
        const metadata = await this.getMetadata();

        // Use unique ID to avoid collisions
        const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const name = path.split("/").pop();
        const destPath = joinPath(RECYCLE_PATH, id);

        try {
            await this._safeMove(path, destPath);

            metadata.items.push({
                id,
                originalPath: path,
                name,
                deletedAt: Date.now()
            });

            await this.saveMetadata(metadata);
        } catch (e) {
            console.error(`Failed to move ${path} to Recycle Bin`, e);
            throw e;
        }
    }

    /**
     * Restore an item from the Recycle Bin
     * @param {string} id - Unique ID of the item
     */
    static async restoreItem(id) {
        const metadata = await this.getMetadata();
        const index = metadata.items.findIndex(item => item.id === id);
        if (index === -1) return;

        const item = metadata.items[index];
        const currentPath = joinPath(RECYCLE_PATH, item.id);

        try {
            // Ensure parent directory of original path exists
            const lastSlashIndex = item.originalPath.lastIndexOf("/");
            if (lastSlashIndex > 0) {
                const parentPath = item.originalPath.substring(0, lastSlashIndex);
                try {
                    await fs.promises.stat(parentPath);
                } catch (e) {
                    await fs.promises.mkdir(parentPath, { recursive: true });
                }
            }

            await this._safeMove(currentPath, item.originalPath);

            metadata.items.splice(index, 1);
            await this.saveMetadata(metadata);
        } catch (e) {
            console.error(`Failed to restore item ${id}`, e);
            throw e;
        }
    }

    /**
     * Delete an item permanently from the Recycle Bin (removes metadata)
     * @param {string} id - Unique ID of the item
     */
    static async deletePermanently(id) {
        const metadata = await this.getMetadata();
        const index = metadata.items.findIndex(item => item.id === id);

        const currentPath = joinPath(RECYCLE_PATH, id);
        try {
            await fs.promises.rm(currentPath, { recursive: true });

            if (index !== -1) {
                metadata.items.splice(index, 1);
                await this.saveMetadata(metadata);
            }
        } catch (e) {
            console.error(`Failed to permanently delete item ${id}`, e);
            throw e;
        }
    }

    /**
     * Empty the entire Recycle Bin
     */
    static async emptyRecycleBin() {
        const metadata = await this.getMetadata();
        for (const item of metadata.items) {
            const currentPath = joinPath(RECYCLE_PATH, item.id);
            try {
                await fs.promises.rm(currentPath, { recursive: true });
            } catch (e) {
                console.error(`Failed to delete ${currentPath} during empty`, e);
            }
        }
        await this.saveMetadata({ items: [] });
    }
}
