/**
 * NavigationHistory - Manages navigation history and MRU folders
 */

export class NavigationHistory {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.mruFolders = [];
        this.mruMaxSize = 10;
    }

    /**
     * Push a new path to history
     * @param {string} path - Path to add
     */
    push(path) {
        // If we are at some point in history and not at the end, nuke forward history
        if (this.historyIndex < this.history.length - 1) {
            this.history.splice(this.historyIndex + 1);
        }

        // Avoid pushing duplicate consecutive paths
        if (this.history[this.historyIndex] !== path) {
            this.history.push(path);
            this.historyIndex = this.history.length - 1;
        }
    }

    /**
     * Add path to MRU (Most Recently Used) list
     * @param {string} path - Path to add
     */
    addToMRU(path) {
        this.mruFolders = [...this.mruFolders, path].slice(-this.mruMaxSize);
    }

    /**
     * Check if can go back in history
     * @returns {boolean}
     */
    canGoBack() {
        return this.historyIndex > 0;
    }

    /**
     * Check if can go forward in history
     * @returns {boolean}
     */
    canGoForward() {
        return this.historyIndex < this.history.length - 1;
    }

    /**
     * Go back in history
     * @returns {string|null} Previous path or null if can't go back
     */
    goBack() {
        if (this.canGoBack()) {
            this.historyIndex--;
            return this.history[this.historyIndex];
        }
        return null;
    }

    /**
     * Go forward in history
     * @returns {string|null} Next path or null if can't go forward
     */
    goForward() {
        if (this.canGoForward()) {
            this.historyIndex++;
            return this.history[this.historyIndex];
        }
        return null;
    }

    /**
     * Get MRU folders list
     * @returns {Array<string>}
     */
    getMRUFolders() {
        return [...this.mruFolders];
    }
}
