import directory from "../config/directory.js";

export function convertInternalPathToWindows(internalPath) {
  if (!internalPath || internalPath === "/") {
    return "My Computer";
  }

  const parts = internalPath.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "My Computer";
  }

  const pathNodes = [];
  let currentLevel = directory;

  for (const part of parts) {
    const found = currentLevel.find((item) => item.id === part);
    if (found) {
      pathNodes.push(found);
      currentLevel = found.children || [];
    } else {
      return "My Computer"; // Path not found, return root
    }
  }

  if (pathNodes.length > 0 && pathNodes[0].type === "drive") {
    const driveLetter = pathNodes[0].name.split(" ")[1].replace("(", "").replace(")", "");
    const restOfPath = pathNodes.slice(1).map((node) => node.name).join("\\");
    return `${driveLetter}\\${restOfPath}`;
  }

  return pathNodes.map((node) => node.name).join("\\");
}

export function convertWindowsPathToInternal(windowsPath) {
  if (windowsPath.toLowerCase() === "my computer") {
    return "/";
  }

  const parts = windowsPath.split("\\").filter(Boolean);
  if (parts.length === 0) {
    return "/";
  }

  const driveLetter = parts[0];
  const driveNode = directory.find(
    (drive) => drive.name.startsWith("(") && drive.name.includes(driveLetter),
  );

  if (!driveNode) {
    return null; // Invalid drive
  }

  let internalPath = `/${driveNode.id}`;
  let currentLevel = driveNode.children || [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const found = currentLevel.find(
      (item) => item.name.toLowerCase() === part.toLowerCase(),
    );
    if (found) {
      internalPath += `/${found.id}`;
      currentLevel = found.children || [];
    } else {
      return null; // Path not found
    }
  }

  return internalPath;
}
