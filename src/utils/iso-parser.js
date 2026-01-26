/*
  This code is adapted from the blog post:
  https://thiscouldbebetter.wordpress.com/2018/01/12/exploring-the-iso-file-format-in-javascript/
*/

export class IsoParser {
  static parse(bytes) {
    const file = new IsoFile(bytes);
    return file;
  }
}

class IsoFile {
  constructor(bytes) {
    this.bytes = bytes;
    this.sectors = new IsoFileSector(this, 0, this.bytes.length);
  }

  sectorSizeInBytes = 2048;

  findFile(name) {
    return this.primaryVolumeDescriptor.directoryRecordRoot.findFile(this, name);
  }

  static sectorSizeInBytes() {
    return 2048;
  }

  get primaryVolumeDescriptor() {
    if (this._primaryVolumeDescriptor == null) {
      const sectorSize = this.sectorSizeInBytes;
      let i = 16;
      while (true) {
        const sector = this.sectors.read(i, 1);
        const volumeDescriptor = new IsoFileVolumeDescriptor(this, sector.bytes);
        if (volumeDescriptor.typeCode == 1) { // Primary
          this._primaryVolumeDescriptor = volumeDescriptor;
          break;
        }
        i++;
      }
    }
    return this._primaryVolumeDescriptor;
  }
}

class IsoFileSector {
  constructor(file, offsetInBytes, lengthInBytes) {
    this.file = file;
    this.offsetInBytes = offsetInBytes;
    this.lengthInBytes = lengthInBytes;
  }

  read(sectorIndex, sectorCount) {
    const sectorSize = this.file.sectorSizeInBytes;
    const offsetInBytes = sectorIndex * sectorSize;
    const lengthInBytes = sectorCount * sectorSize;
    const bytes = this.file.bytes.slice(offsetInBytes, offsetInBytes + lengthInBytes);
    const returnValue = new IsoFileSector(this.file, offsetInBytes, lengthInBytes);
    returnValue.bytes = bytes;
    return returnValue;
  }
}

class IsoFileVolumeDescriptor {
  constructor(file, bytes) {
    this.file = file;
    this.bytes = bytes;
    this.typeCode = this.bytes[0];
    this.identifier = new TextDecoder().decode(this.bytes.slice(1, 6));
    this.version = this.bytes[6];
  }

  get directoryRecordRoot() {
    if (this._directoryRecordRoot == null) {
      const sectorSize = this.file.sectorSizeInBytes;
      const directoryRecordRootAsBytes = this.bytes.slice(156, 190);
      this._directoryRecordRoot = new IsoFileDirectoryRecord(directoryRecordRootAsBytes);
    }
    return this._directoryRecordRoot;
  }
}

class IsoFileDirectoryRecord {
  constructor(bytes) {
    this.bytes = bytes;
  }

  get extentOffsetInSectors() {
    const value = (
      this.bytes[9] << 24
      | this.bytes[8] << 16
      | this.bytes[7] << 8
      | this.bytes[6]
    );
    return value;
  }

  get extentLengthInBytes() {
    const value = (
      this.bytes[17] << 24
      | this.bytes[16] << 16
      | this.bytes[15] << 8
      | this.bytes[14]
    );
    return value;
  }

  get flags() {
    return this.bytes[25];
  }

  get isDirectory() {
    return ((this.flags >> 1) & 1) == 1;
  }

  get name() {
    const nameLength = this.bytes[32];
    const nameBytes = this.bytes.slice(33, 33 + nameLength);
    const returnValue = new TextDecoder().decode(nameBytes);
    return returnValue;
  }

  children(file) {
    const returnValues = [];
    const sectorSize = file.sectorSizeInBytes;
    const sectorsForExtent = file.sectors.read(
      this.extentOffsetInSectors,
      Math.ceil(this.extentLengthInBytes / sectorSize)
    );
    const bytesForExtent = sectorsForExtent.bytes;
    let offsetInBytes = 0;
    while (offsetInBytes < bytesForExtent.length) {
      const recordLength = bytesForExtent[offsetInBytes];
      if (recordLength == 0) {
        break;
      }
      const recordBytes = bytesForExtent.slice(offsetInBytes, offsetInBytes + recordLength);
      const record = new IsoFileDirectoryRecord(recordBytes);
      returnValues.push(record);
      offsetInBytes += recordLength;
    }
    return returnValues;
  }

  findFile(file, name) {
    const children = this.children(file);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.name == name) {
        return child;
      }
    }
    return null;
  }
}
