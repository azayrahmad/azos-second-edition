/**
 * Utility functions for path manipulation in ZenExplorer
 */

/**
 * Safely join path segments
 * @param {string} base - Base path
 * @param {string} name - Path segment to append
 * @returns {string} Joined path
 */
export function joinPath(base, name) {
    return base === "/" ? `/${name}` : `${base}/${name}`;
}

/**
 * Get parent directory path
 * @param {string} path - Current path
 * @returns {string} Parent path
 */
export function getParentPath(path) {
    if (path === "/") return "/";
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
}

/**
 * Extract folder/file name from path
 * @param {string} path - Full path
 * @param {string} rootName - Name to use for root path (default: "ZenFS")
 * @returns {string} Path name
 */
export function getPathName(path, rootName = "ZenFS") {
    return path === "/" ? rootName : path.split("/").pop() || path;
}

/**
 * Normalize path format (remove trailing slashes, handle empty paths)
 * @param {string} path - Path to normalize
 * @returns {string} Normalized path
 */
export function normalizePath(path) {
    if (!path || path === "/") return "/";
    return "/" + path.split("/").filter(Boolean).join("/");
}
