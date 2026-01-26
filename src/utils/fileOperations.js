import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage.js";
import { findItemByPath } from "./directory.js";

async function getUniqueName(destinationPath, originalName) {
  return new Promise((resolve) => {
    window.System.fs.readdir(destinationPath, (err, files) => {
      if (err) return resolve(originalName);

      let newName = originalName;
      let counter = 1;
      let nameExists = files.includes(newName);

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
        nameExists = files.includes(newName);
      }
      resolve(newName);
    });
  });
}

export async function pasteItems(destinationPath, items, operation) {
  for (const item of items) {
    const newName = await getUniqueName(destinationPath, item.name || item.title);
    const newPath = `${destinationPath}/${newName}`;

    if (operation === 'copy') {
      window.System.fs.readFile(item.path, (err, data) => {
        if (!err) {
          window.System.fs.writeFile(newPath, data, (err) => {
            if (!err) {
              document.dispatchEvent(new CustomEvent("explorer-refresh"));
            }
          });
        }
      });
    } else if (operation === 'cut') {
      window.System.fs.rename(item.path, newPath, (err) => {
        if (!err) {
          document.dispatchEvent(new CustomEvent("explorer-refresh"));
        }
      });
    }
  }
}
