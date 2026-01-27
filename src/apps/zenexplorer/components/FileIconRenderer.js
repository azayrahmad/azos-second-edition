import { ICONS } from "../../../config/icons.js";

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
        return ICONS.folderClosed[32];
    }

    // Future: Add extension-based icon selection
    // const ext = fileName.split('.').pop().toLowerCase();
    // switch(ext) {
    //     case 'txt': return ICONS.fileText[32];
    //     case 'jpg': case 'png': return ICONS.fileImage[32];
    //     default: return ICONS.fileGeneric[32];
    // }

    return ICONS.fileGeneric[32];
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
    label.textContent = fileName;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(label);

    return iconDiv;
}
