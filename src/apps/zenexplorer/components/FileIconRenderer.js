import { ICONS } from "../../../config/icons.js";
import { getAssociation } from "../../../utils/directory.js";
import { getDisplayName } from "../utils/PathUtils.js";
import { RecycleBinManager } from "../utils/RecycleBinManager.js";

/**
 * FileIconRenderer - Handles rendering of file/folder icons in ZenExplorer
 */

/**
 * Get appropriate icon for a file based on name and type
 * @param {string} fileName - Name of the file
 * @param {boolean} isDir - Whether this is a directory
 * @returns {string} Icon URL
 */
export function getIconForFile(fileName, isDir) {
    if (isDir) {
        if (fileName.match(/^[A-Z]:$/i)) {
            return ICONS.drive[32];
        }
        return ICONS.folderClosed[32];
    }

    const association = getAssociation(fileName);
    return association.icon[32];
}

/**
 * Render a file icon element
 * @param {string} fileName - Name of the file
 * @param {string} fullPath - Full path to the file
 * @param {boolean} isDir - Whether this is a directory
 * @param {Object} [options] - Additional options (metadata, etc.)
 * @returns {Promise<HTMLElement>} Icon element
 */
export async function renderFileIcon(fileName, fullPath, isDir, options = {}) {
    const iconDiv = document.createElement("div");
    iconDiv.className = "explorer-icon";
    iconDiv.setAttribute("tabindex", "0");
    iconDiv.setAttribute("data-path", fullPath);
    iconDiv.setAttribute("data-type", isDir ? "directory" : "file");
    iconDiv.setAttribute("data-name", fileName);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-wrapper";

    const iconImg = document.createElement("img");

    let iconSrc = getIconForFile(fileName, isDir);
    let displayName = getDisplayName(fileName);

    // Special handling for Recycle Bin folder
    if (RecycleBinManager.isRecycleBinPath(fullPath)) {
        const isEmpty = options.recycleBinEmpty !== undefined
            ? options.recycleBinEmpty
            : await RecycleBinManager.isEmpty();
        iconSrc = isEmpty ? ICONS.recycleBinEmpty[32] : ICONS.recycleBinFull[32];
    }
    // Special handling for items INSIDE Recycle Bin
    else if (RecycleBinManager.isRecycledItemPath(fullPath)) {
        const metadata = options.metadata || await RecycleBinManager.getMetadata();
        const entry = metadata[fileName]; // fileName is the ID
        if (entry) {
            iconSrc = getIconForFile(entry.originalName, isDir);
            displayName = getDisplayName(entry.originalName);
        }
    }

    iconImg.src = iconSrc;
    iconImg.draggable = false;
    iconWrapper.appendChild(iconImg);

    iconInner.appendChild(iconWrapper);

    const label = document.createElement("div");
    label.className = "icon-label";
    label.textContent = displayName;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(label);

    return iconDiv;
}
