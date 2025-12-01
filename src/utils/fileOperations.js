import {
  getItem,
  setItem,
  LOCAL_STORAGE_KEYS,
} from "./localStorage.js";
import { getDesktopContents, findItemByPath } from "./directory.js";

function getNextAvailableName(destinationFolder, itemName) {
  const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  const destinationFiles = allDroppedFiles.filter(
    (file) => file.path === destinationFolder,
  );

  const staticItems = findItemByPath(destinationFolder)?.children || [];

  const allDestinationItems = [...destinationFiles, ...staticItems];

  const baseName = itemName.includes(".")
    ? itemName.slice(0, itemName.lastIndexOf("."))
    : itemName;
  const extension = itemName.includes(".")
    ? itemName.slice(itemName.lastIndexOf("."))
    : "";

  let newName = itemName;
  let counter = 1;

  while (
    allDestinationItems.some(
      (item) => (item.name || item.filename) === newName,
    )
  ) {
    newName = `${baseName} (${counter})${extension}`;
    counter++;
  }

  return newName;
}

export function pasteItems(destinationPath, items, operation) {
  if (!items || items.length === 0) {
    return;
  }

  const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];

  if (operation === "copy") {
    const newFiles = items.map((item) => {
      const newName = getNextAvailableName(
        destinationPath,
        item.name || item.filename || item.title,
      );
      return {
        ...item,
        id: `file-${Date.now()}-${Math.random()}`,
        name: newName,
        filename: newName,
        path: destinationPath,
      };
    });
    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, [
      ...allDroppedFiles,
      ...newFiles,
    ]);
  } else if (operation === "cut") {
    const itemIdsToMove = new Set(items.map((item) => item.id));
    const updatedFiles = allDroppedFiles.map((file) => {
      if (itemIdsToMove.has(file.id)) {
        const newName = getNextAvailableName(
          destinationPath,
          file.name || file.filename,
        );
        return {
          ...file,
          path: destinationPath,
          name: newName,
          filename: newName,
        };
      }
      return file;
    });
    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, updatedFiles);
  }

  document.dispatchEvent(new CustomEvent("desktop-refresh"));
  document.dispatchEvent(new CustomEvent("explorer-refresh"));
}

export function moveFiles(fileIds, destinationPath) {
  const allFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  const updatedFiles = allFiles.map((file) => {
    if (fileIds.includes(file.id)) {
      return { ...file, path: destinationPath };
    }
    return file;
  });

  setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, updatedFiles);

  // Dispatch events to notify UI components
  document.dispatchEvent(new CustomEvent("desktop-refresh"));
  document.dispatchEvent(new CustomEvent("explorer-refresh"));
}
