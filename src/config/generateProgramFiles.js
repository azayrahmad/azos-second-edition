// src/config/generateProgramFiles.js

/**
 * Dynamically generates the "Program Files" directory structure
 * by scanning the src/apps folder using Vite's import.meta.glob.
 *
 * @returns {Array} An array of objects representing the folders and files.
 */
export function generateProgramFiles() {
  const modules = import.meta.glob('/src/apps/**/*');
  const programFiles = [];
  const root = {};

  for (const path in modules) {
    const parts = path.replace('/src/apps/', '').split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      if (!currentLevel[part]) {
        if (index === parts.length - 1) {
          // It's a file
          currentLevel[part] = {
            id: `file-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
            name: part,
            type: 'file',
            contentUrl: path,
          };
        } else {
          // It's a directory
          currentLevel[part] = {};
        }
      }
      currentLevel = currentLevel[part];
    });
  }

  const buildDirectory = (directory, pathPrefix = '') => {
    return Object.keys(directory).map(name => {
      const item = directory[name];
      const currentPath = pathPrefix ? `${pathPrefix}/${name}` : name;

      if (item.type === 'file') {
        return item;
      } else {
        return {
          id: `folder-${currentPath.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: name,
          type: 'folder',
          children: buildDirectory(item, currentPath),
        };
      }
    });
  };

  return buildDirectory(root);
}
