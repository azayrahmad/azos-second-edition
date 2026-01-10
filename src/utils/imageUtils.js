const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];

export function isImageFile(filename) {
  if (!filename) {
    return false;
  }
  const lowercasedFilename = filename.toLowerCase();
  return imageExtensions.some(ext => lowercasedFilename.endsWith(ext));
}
