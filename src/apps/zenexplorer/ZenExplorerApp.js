import { Application } from "../Application.js";
import { fs } from "@zenfs/core";
import { initFileSystem } from "../../utils/zenfs-init.js";
import { ICONS } from "../../config/icons.js";
import { IconManager } from "../../components/IconManager.js";
import { AddressBar } from "../../components/AddressBar.js";
import { StatusBar } from "../../components/StatusBar.js";
import "../explorer/explorer.css"; // Reuse explorer styles

// Extracted modules
import { ZenSidebar } from "./components/ZenSidebar.js";
import { renderFileIcon } from "./components/FileIconRenderer.js";
import { NavigationHistory } from "./NavigationHistory.js";
import { FileOperations } from "./FileOperations.js";
import { MenuBarBuilder } from "./MenuBarBuilder.js";
import { joinPath, getParentPath, getPathName } from "./utils/PathUtils.js";

// MenuBar is expected to be global from public/os-gui/MenuBar.js

export class ZenExplorerApp extends Application {
    static config = {
        id: "zenexplorer",
        title: "File Manager (ZenFS)",
        description: "Browse files using ZenFS.",
        icon: ICONS.computer,
        width: 640,
        height: 480,
        resizable: true,
    };

    constructor(config) {
        super(config);
        this.currentPath = "/";
        this.navHistory = new NavigationHistory();
        this.fileOps = new FileOperations(this);
    }

    async _createWindow() {
        // 1. Initialize File System
        await initFileSystem();

        // 2. Setup Window
        const win = new window.$Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            minimizeButton: this.minimizeButton,
            maximizeButton: this.maximizeButton,
            id: this.id,
        });
        this.win = win;

        // 2a. Setup MenuBar
        this._updateMenuBar();

        // 3. Toolbar / Address Bar
        this.addressBar = new AddressBar({
            onEnter: (path) => this.navigateTo(path),
        });
        win.$content.append(this.addressBar.element);

        // 4. Main Content Area (Split View)
        const content = document.createElement("div");
        content.className = "explorer-content sunken-panel";
        content.style.height = "calc(100% - 60px)"; // Adjust for bars
        this.content = content;

        // 4a. Sidebar
        this.sidebar = new ZenSidebar();
        content.appendChild(this.sidebar.element);

        // 4b. Icon View
        this.iconContainer = document.createElement("div");
        this.iconContainer.className = "explorer-icon-view";
        content.appendChild(this.iconContainer);

        win.$content.append(content);

        // 4c. Resize Observer for responsive layout
        this._setupResizeObserver();

        // 5. Status Bar
        this.statusBar = new StatusBar();
        win.$content.append(this.statusBar.element);

        // 6. Icon Manager
        this._setupIconManager();

        // 7. Event Delegation for Navigation
        this._setupEventListeners();

        // 8. Initial Navigation
        this.navigateTo(this.currentPath);

        return win;
    }

    /**
     * Setup resize observer for responsive layout
     * @private
     */
    _setupResizeObserver() {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width <= 400) {
                    this.content.classList.add("small-width");
                    this.content.classList.remove("with-sidebar");
                } else {
                    this.content.classList.remove("small-width");
                    this.content.classList.add("with-sidebar");
                }
            }
        });
        this.resizeObserver.observe(this.content);
    }

    /**
     * Setup icon manager with event handlers
     * @private
     */
    _setupIconManager() {
        this.iconManager = new IconManager(this.iconContainer, {
            iconSelector: ".explorer-icon",
            onItemContext: (e, icon) => {
                const path = icon.getAttribute("data-path");
                const menuItems = [
                    {
                        label: "Rename",
                        action: () => this.fileOps.renameItem(path),
                    },
                    {
                        label: "Delete",
                        action: () => this.fileOps.deleteItems([path]),
                    },
                ];
                new window.ContextMenu(menuItems, e);
            },
            onBackgroundContext: (e) => {
                const menuItems = [
                    {
                        label: "New",
                        submenu: [
                            {
                                label: "Folder",
                                action: () => this.fileOps.createNewFolder(),
                            },
                        ],
                    },
                ];
                new window.ContextMenu(menuItems, e);
            },
            onSelectionChange: () => {
                const count = this.iconManager.selectedIcons.size;
                this.statusBar.setText(`${count} object(s) selected`);
                if (this.menuBar) {
                    this.menuBar.element.dispatchEvent(new Event("update"));
                }
            }
        });
    }

    /**
     * Setup event listeners for navigation
     * @private
     */
    _setupEventListeners() {
        this.iconContainer.addEventListener("dblclick", (e) => {
            const icon = e.target.closest(".explorer-icon");
            if (icon) {
                const type = icon.getAttribute("data-type");
                const name = icon.getAttribute("data-name");
                if (type === "directory") {
                    const newPath = joinPath(this.currentPath, name);
                    this.navigateTo(newPath);
                } else {
                    // Open file (placeholder)
                    alert(`Cannot open file: ${name} (Not implemented)`);
                }
            }
        });
    }

    async navigateTo(path, isHistoryNav = false, skipMRU = false) {
        if (!path) return;

        try {
            if (path === "My Computer") {
                path = "/";
            }
            const stats = await fs.promises.stat(path);

            if (!stats.isDirectory()) {
                throw new Error("Not a directory");
            }

            // Update navigation history
            if (!isHistoryNav) {
                this.navHistory.push(path);
            }

            this.currentPath = path;

            // Only add to MRU if not skipping (i.e., not from manual radio selection)
            if (!skipMRU) {
                this.navHistory.addToMRU(path);
            }

            // Refresh menu bar
            this._updateMenuBar();

            // Update UI elements
            this._updateUIForPath(path);

            // Read and render directory contents
            await this._renderDirectoryContents(path);

        } catch (err) {
            console.error("Navigation failed", err);
        }
    }

    /**
     * Update UI elements for current path
     * @private
     */
    _updateUIForPath(path) {
        const name = getPathName(path);
        const icon = path === "/" ? ICONS.computer : ICONS.folderOpen;

        this.addressBar.setValue(path === "/" ? "My Computer" : path);
        this.win.title(name);
        this.sidebar.update(name, icon[32]);
        this.win.setIcons(icon);
    }

    /**
     * Render directory contents
     * @private
     */
    async _renderDirectoryContents(path) {
        const files = await fs.promises.readdir(path);

        // Clear view
        this.iconContainer.innerHTML = "";
        this.iconManager.clearSelection();

        // Render each file/folder
        for (const file of files) {
            const fullPath = joinPath(path, file);
            let fileStat;

            try {
                fileStat = await fs.promises.stat(fullPath);
            } catch (e) {
                console.warn("Could not stat", fullPath);
                continue;
            }

            const isDir = fileStat.isDirectory();
            const iconDiv = renderFileIcon(file, fullPath, isDir);

            this.iconManager.configureIcon(iconDiv);
            this.iconContainer.appendChild(iconDiv);
        }

        this.statusBar.setText(`${files.length} object(s)`);
    }

    goUp() {
        if (this.currentPath === "/") return;
        const newPath = getParentPath(this.currentPath);
        this.navigateTo(newPath);
    }

    goBack() {
        const path = this.navHistory.goBack();
        if (path) {
            this.navigateTo(path, true);
        }
    }

    goForward() {
        const path = this.navHistory.goForward();
        if (path) {
            this.navigateTo(path, true);
        }
    }

    _updateMenuBar() {
        if (!this.win) return;
        const menuBuilder = new MenuBarBuilder(this);
        this.menuBar = menuBuilder.build();
        this.win.setMenuBar(this.menuBar);
    }

    _onClose() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
