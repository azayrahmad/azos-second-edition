import { IsoParser } from './iso-parser.js';

let cdromContent = null;
let fileName = null;

function buildFileTree(isoFile) {
  const root = isoFile.primaryVolumeDescriptor.directoryRecordRoot;
  return buildTree(root, isoFile);
}

function buildTree(directoryRecord, isoFile) {
  const children = directoryRecord.children(isoFile);
  return children
    .map(child => {
      const isDirectory = child.isDirectory;
      const childName = child.name;

      if (childName === '.' || childName === '..') {
        return null;
      }

      if (isDirectory) {
        return {
          id: `cdrom-${childName}`,
          name: childName,
          type: 'folder',
          children: buildTree(child, isoFile),
        };
      } else {
        return {
          id: `cdrom-${childName}`,
          name: childName,
          type: 'file',
          getHandle: () => {
            const sector = isoFile.sectors.read(child.extentOffsetInSectors, Math.ceil(child.extentLengthInBytes / isoFile.sectorSizeInBytes));
            return new Blob([sector.bytes], { type: 'application/octet-stream' });
          },
        };
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });
}

export const cdromManager = {
  async insert({ onBeforeInsert, onAfterInsert } = {}) {
    onBeforeInsert?.();
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'ISO Files',
          accept: { 'application/octet-stream': ['.iso'] },
        }],
      });
      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const isoFile = IsoParser.parse(bytes);
      fileName = file.name;
      cdromContent = buildFileTree(isoFile);

      document.dispatchEvent(new CustomEvent('cdrom-inserted'));
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert('Failed to mount ISO. The file may be invalid or corrupt.');
        console.error('Error inserting CD-ROM:', error);
      }
      return false;
    } finally {
      onAfterInsert?.();
    }
  },

  eject() {
    cdromContent = null;
    fileName = null;
    document.dispatchEvent(new CustomEvent('cdrom-ejected'));
  },

  isInserted() {
    return cdromContent !== null;
  },

  getContents() {
    return cdromContent;
  },

  getFileName() {
    return fileName;
  },
};
