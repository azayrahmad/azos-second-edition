import { addToRecycleBin } from './recycleBinManager.js';
import directory from '../config/directory.js';

/**
 * Finds the desktop folder object within the virtual directory.
 * @returns {object|null} The desktop folder object or null if not found.
 */
function findDesktopFolder() {
    const driveC = directory.find(d => d.id === 'drive-c');
    if (driveC && driveC.children) {
        const userFolder = driveC.children.find(f => f.id === 'folder-user');
        if (userFolder && userFolder.children) {
            return userFolder.children.find(f => f.id === 'folder-desktop');
        }
    }
    return null;
}

/**
 * "Deletes" a file from the desktop by removing its definition
 * from the virtual directory and adding it to the recycle bin.
 * @param {string} filePath - The path of the file to delete (used as contentUrl).
 */
export function deleteDesktopFile(filePath) {
    const desktopFolder = findDesktopFolder();
    if (!desktopFolder || !desktopFolder.children) {
        console.error("Could not find desktop folder in directory configuration.");
        return;
    }

    const fileIndex = desktopFolder.children.findIndex(item => item.type === 'file' && item.contentUrl === filePath);

    if (fileIndex > -1) {
        const [fileToDelete] = desktopFolder.children.splice(fileIndex, 1);
        addToRecycleBin(fileToDelete);

        const desktop = document.querySelector('.desktop');
        if (desktop && typeof desktop.refreshIcons === 'function') {
            desktop.refreshIcons();
        }
    } else {
        console.warn(`Could not find file to delete with path: ${filePath}`);
    }
}
