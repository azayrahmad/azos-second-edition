import { ICONS } from "../../../config/icons.js";
import { getAssociation } from "../../../utils/directory.js";
import { getDisplayName } from "../utils/PathUtils.js";

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
 * @returns {HTMLElement} Icon element
 */
export function renderFileIcon(fileName, fullPath, isDir) {
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
    iconImg.src = getIconForFile(fileName, isDir);
    iconImg.draggable = false;
    iconWrapper.appendChild(iconImg);

    iconInner.appendChild(iconWrapper);

    const label = document.createElement("div");
    label.className = "icon-label";
    label.textContent = getDisplayName(fileName);

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(label);

    return iconDiv;
}
