import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage.js";
import { findItemByPath } from "./directory.js";

function getUniqueName(destinationPath, originalName) {
    const destinationFolder = findItemByPath(destinationPath);
    if (!destinationFolder) return originalName;

    const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
    const itemsInDestination = [
        ...(destinationFolder.children || []),
        ...allDroppedFiles.filter(f => f.path === destinationPath)
    ];

    let newName = originalName;
    let counter = 1;
    let nameExists = itemsInDestination.some(item => (item.name || item.filename) === newName);

    while (nameExists) {
        const extensionIndex = originalName.lastIndexOf('.');
        if (extensionIndex > 0) {
            const name = originalName.substring(0, extensionIndex);
            const ext = originalName.substring(extensionIndex);
            newName = `${name} (${counter})${ext}`;
        } else {
            newName = `${originalName} (${counter})`;
        }
        counter++;
        nameExists = itemsInDestination.some(item => (item.name || item.filename) === newName);
    }

    return newName;
}

export function pasteItems(destinationPath, items, operation) {
  const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  let updatedFiles = [...allDroppedFiles];

  const destinationItem = findItemByPath(destinationPath);
  const isDirectory = destinationItem && (destinationItem.type === "folder" || destinationItem.type === "drive");

  if (!isDirectory && items.length > 1) {
    // Cannot copy multiple items to a single file destination
    return;
  }

    // Handle case where destination is a file path (overwrite/rename)
    if (!isDirectory && destinationItem) {
        // Prevent data loss on self-move
        if (items.some(item => item.id === destinationItem.id)) {
            return;
        }
        // Remove the existing file to simulate an overwrite
        updatedFiles = updatedFiles.filter(f => f.id !== destinationItem.id);
    }

  items.forEach((item) => {
    let finalDestinationPath = destinationPath;
    let finalName = item.name || item.filename;

    if (!isDirectory) {
      const pathParts = destinationPath.split("/");
      finalName = pathParts.pop();
      finalDestinationPath = pathParts.join("/");
    }

    if (operation === "copy") {
      const newItem = {
        ...item,
        id: `dropped-${Date.now()}-${Math.random()}`,
        path: finalDestinationPath,
        name: isDirectory ? getUniqueName(finalDestinationPath, finalName) : finalName,
      };
      delete newItem.source;
      updatedFiles.push(newItem);
    } else if (operation === "cut") {
      const itemIndex = updatedFiles.findIndex((f) => f.id === item.id);
      if (itemIndex !== -1) {
        updatedFiles[itemIndex].path = finalDestinationPath;
        updatedFiles[itemIndex].name = isDirectory
          ? getUniqueName(finalDestinationPath, updatedFiles[itemIndex].name || updatedFiles[itemIndex].filename)
          : finalName;
      }
    }
  });

  setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, updatedFiles);
  document.dispatchEvent(new CustomEvent("desktop-refresh"));
  document.dispatchEvent(new CustomEvent("explorer-refresh"));
}
