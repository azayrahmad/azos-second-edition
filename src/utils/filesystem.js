
import BrowserFS from 'browserfs';

function configureFS(directory) {
  return new Promise((resolve, reject) => {
    BrowserFS.configure({
      fs: "MountableFileSystem",
      options: {
        '/': {
          fs: "InMemory"
        },
        '/drive-c/folder-user': {
          fs: "LocalStorage"
        },
        '/drive-d': {
          fs: "LocalStorage"
        }
      }
    }, function(e) {
      if (e) {
        return reject(e);
      }
      const fs = BrowserFS.BFSRequire('fs');
      const Buffer = BrowserFS.BFSRequire('buffer').Buffer;
      window.fs = fs;
      window.Buffer = Buffer;

      function createDirectoryStructure(parentPath, items) {
        items.forEach(item => {
          const currentPath = `${parentPath}/${item.id}`;
          if (item.type === 'folder' || item.type === 'drive' || item.type === 'floppy') {
            if (!fs.existsSync(currentPath)) {
              fs.mkdirSync(currentPath);
            }
            if (item.children) {
              createDirectoryStructure(currentPath, item.children);
            }
          } else {
            fs.writeFileSync(currentPath, JSON.stringify(item));
          }
        });
      }

      createDirectoryStructure('', directory);

      resolve({ fs, Buffer });
    });
  });
}

export default configureFS;
