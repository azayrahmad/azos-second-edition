import { Application } from "../Application.js";
import { fs, mount, umount, mounts } from "@zenfs/core";
import { WebAccess } from "@zenfs/dom";
import { initFileSystem } from "../../utils/zenfs-init.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { ICONS } from "../../config/icons.js";
import { getAssociation } from "../../utils/directory.js";
import { launchApp } from "../../utils/appManager.js";
import { IconManager } from "../../components/IconManager.js";
import { AddressBar } from "../../components/AddressBar.js";
import { StatusBar } from "../../components/StatusBar.js";
import { requestWaitState, releaseWaitState } from "../../utils/busyStateManager.js";
import "../explorer/explorer.css"; // Reuse explorer styles

// Extracted modules
import { ZenSidebar } from "./components/ZenSidebar.js";
import { renderFileIcon } from "./components/FileIconRenderer.js";
import { NavigationHistory } from "./NavigationHistory.js";
import { FileOperations } from "./FileOperations.js";
import { MenuBarBuilder } from "./MenuBarBuilder.js";
import { PropertiesManager } from "./utils/PropertiesManager.js";
import { joinPath, getParentPath, getPathName, formatPathForDisplay, getDisplayName } from "./utils/PathUtils.js";
import ZenClipboardManager from "./utils/ZenClipboardManager.js";
import { ZenFloppyManager } from "./utils/ZenFloppyManager.js";
import { RecycleBinManager } from "./utils/RecycleBinManager.js";
import { playSound } from "../../utils/soundManager.js";

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
        isSingleton: false,
    };

    constructor(config) {
        super(config);
        this.currentPath = "/";
        this.navHistory = new NavigationHistory();
        this.fileOps = new FileOperations(this);
        this.lastSelectedIcon = null;
        this.selectionTimestamp = 0;
        this._isRenaming = false;
    }

    async _createWindow(initialPath) {
        if (initialPath) {
            this.currentPath = initialPath;
        }

        // 1. Initialize File System
        await initFileSystem();
        await RecycleBinManager.init();

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

        // 7a. Clipboard listener
        this._setupClipboardListener();

        // 7b. Floppy listener
        this._setupFloppyListener();

        // 7c. Recycle Bin listener
        this._setupRecycleBinListener();

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
                const type = icon.getAttribute("data-type");
                const selectedPaths = [...this.iconManager.selectedIcons].map(i => i.getAttribute("data-path"));
                const isRootItem = selectedPaths.some(p => getParentPath(p) === "/");
                const isFloppy = path === "/A:";
                const isFloppyMounted = mounts.has("/A:");
                const isRecycledItem = RecycleBinManager.isRecycledItemPath(path);
                const isRecycleBin = RecycleBinManager.isRecycleBinPath(path);

                let menuItems = [];

                if (isRecycledItem) {
                    menuItems = [
                        {
                            label: "Restore",
                            action: () => {
                                const ids = selectedPaths.map(p => getPathName(p));
                                RecycleBinManager.restoreItems(ids);
                            },
                            default: true,
                        },
                        "MENU_DIVIDER",
                        {
                            label: "Delete",
                            action: () => this.fileOps.deleteItems(selectedPaths, true),
                        },
                        "MENU_DIVIDER",
                        {
                            label: "Properties",
                            action: () => PropertiesManager.show(selectedPaths),
                        }
                    ];
                } else {
                    menuItems = [
                        {
                            label: "Open",
                            action: () => {
                                if (type === "directory") {
                                    this.navigateTo(path);
                                } else {
                                    this.openFile(icon);
                                }
                            },
                            default: true,
                        },
                    ];

                    if (isRecycleBin) {
                        menuItems.push({
                            label: "Empty Recycle Bin",
                            action: async () => {
                                const isEmpty = await RecycleBinManager.isEmpty();
                                if (isEmpty) return;

                                ShowDialogWindow({
                                    title: "Confirm Empty Recycle Bin",
                                    text: "Are you sure you want to permanently delete all items in the Recycle Bin?",
                                    buttons: [
                                        {
                                            label: "Yes",
                                            isDefault: true,
                                            action: async () => {
                                                await RecycleBinManager.emptyRecycleBin();
                                                playSound("EmptyRecycleBin");
                                                if (this.currentPath === path) {
                                                    this.navigateTo(path, true, true);
                                                }
                                            }
                                        },
                                        { label: "No" }
                                    ]
                                });
                            }
                        });
                    }

                    if (isFloppy) {
                        if (isFloppyMounted) {
                            menuItems.push({
                                label: "Eject",
                                action: () => this.ejectFloppy(),
                            });
                        } else {
                            menuItems.push({
                                label: "Insert",
                                action: () => this.insertFloppy(),
                            });
                        }
                    }

                    menuItems.push(
                        "MENU_DIVIDER",
                        {
                            label: "Cut",
                            action: () => this.fileOps.cutItems(selectedPaths),
                            enabled: () => !isRootItem && !isRecycleBin,
                        },
                        {
                            label: "Copy",
                            action: () => this.fileOps.copyItems(selectedPaths),
                            enabled: () => !isRecycleBin,
                        },
                        {
                            label: "Paste",
                            action: () => this.fileOps.pasteItems(path),
                            enabled: () => !ZenClipboardManager.isEmpty() && type === "directory",
                        },
                        "MENU_DIVIDER",
                        {
                            label: "Delete",
                            action: () => this.fileOps.deleteItems(selectedPaths),
                            enabled: () => !isRootItem && !isRecycleBin,
                        },
                        {
                            label: "Rename",
                            action: () => this.fileOps.renameItem(path),
                            enabled: () => !isRootItem && selectedPaths.length === 1 && !isRecycleBin,
                        },
                        "MENU_DIVIDER",
                        {
                            label: "Properties",
                            action: () => PropertiesManager.show(selectedPaths),
                        }
                    );
                }
                new window.ContextMenu(menuItems, e);
            },
            onBackgroundContext: (e) => {
                const isRoot = this.currentPath === "/";
                const menuItems = [
                    {
                        label: "Paste",
                        action: () => this.fileOps.pasteItems(this.currentPath),
                        enabled: () => !ZenClipboardManager.isEmpty() && !isRoot,
                    },
                    "MENU_DIVIDER",
                    {
                        label: "New",
                        enabled: () => !isRoot,
                        submenu: [
                            {
                                label: "Folder",
                                action: () => this.fileOps.createNewFolder(),
                                enabled: () => !isRoot,
                            },
                            {
                                label: "Text Document",
                                action: () => this.fileOps.createNewTextFile(),
                            },
                        ],
                    },
                    "MENU_DIVIDER",
                    {
                        label: "Properties",
                        action: () => PropertiesManager.show([this.currentPath]),
                    },
                ];
                new window.ContextMenu(menuItems, e);
            },
            onSelectionChange: () => {
                const selectedIcons = this.iconManager.selectedIcons;
                const count = selectedIcons.size;
                this.statusBar.setText(`${count} object(s) selected`);

                if (count === 1) {
                    const icon = [...selectedIcons][0];
                    if (this.lastSelectedIcon !== icon) {
                        this.lastSelectedIcon = icon;
                        this.selectionTimestamp = Date.now();
                    }
                } else {
                    this.lastSelectedIcon = null;
                    this.selectionTimestamp = 0;
                }

                if (this.menuBar) {
                    this._updateMenuBar();
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
                const path = icon.getAttribute("data-path");
                const type = icon.getAttribute("data-type");

                if (RecycleBinManager.isRecycledItemPath(path)) {
                    PropertiesManager.show([path]);
                    return;
                }

                if (type === "directory") {
                    const name = icon.getAttribute("data-name");
                    const newPath = joinPath(this.currentPath, name);
                    this.navigateTo(newPath);
                } else {
                    this.openFile(icon);
                }
            }
        });

        // Keyboard shortcuts
        this.win.element.addEventListener("keydown", (e) => this.handleKeyDown(e));
    }

    /**
     * Open a file using its association
     * @param {HTMLElement} icon - The icon element of the file
     */
    openFile(icon) {
        const name = icon.getAttribute("data-name");
        const fullPath = icon.getAttribute("data-path");
        const association = getAssociation(name);
        if (association.appId) {
            launchApp(association.appId, fullPath);
        } else {
            alert(`Cannot open file: ${name} (No association)`);
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
            return;
        }

        const selectedIcons = [...this.iconManager.selectedIcons];
        const selectedPaths = selectedIcons.map(icon => icon.getAttribute("data-path"));

        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case "x":
                    this.fileOps.cutItems(selectedPaths);
                    e.preventDefault();
                    break;
                case "c":
                    this.fileOps.copyItems(selectedPaths);
                    e.preventDefault();
                    break;
                case "v":
                    this.fileOps.pasteItems(this.currentPath);
                    e.preventDefault();
                    break;
            }
        } else {
            if (e.key === "Enter" && selectedIcons.length > 0) {
                selectedIcons.forEach(icon => {
                    const type = icon.getAttribute("data-type");
                    const path = icon.getAttribute("data-path");

                    if (RecycleBinManager.isRecycledItemPath(path)) {
                        PropertiesManager.show([path]);
                        return;
                    }

                    if (type === "directory") {
                        if (selectedIcons.length === 1) {
                            this.navigateTo(path);
                        } else {
                            launchApp("zenexplorer", { filePath: path });
                        }
                    } else {
                        this.openFile(icon);
                    }
                });
                e.preventDefault();
            } else if (e.key === "Delete" && selectedIcons.length > 0) {
                const isRootItem = selectedPaths.some(p => getParentPath(p) === "/");
                const containsRecycleBin = selectedPaths.some(p => RecycleBinManager.isRecycleBinPath(p));
                if (!isRootItem && !containsRecycleBin) {
                    this.fileOps.deleteItems(selectedPaths, e.shiftKey);
                }
                e.preventDefault();
            }
        }
    }

    /**
     * Setup clipboard listener
     * @private
     */
    _setupClipboardListener() {
        this._clipboardHandler = () => {
            this._updateCutIcons();
            if (this.menuBar) {
                this.menuBar.element.dispatchEvent(new Event("update"));
            }
        };
        document.addEventListener("zen-clipboard-change", this._clipboardHandler);
    }

    /**
     * Setup Recycle Bin listener
     * @private
     */
    _setupRecycleBinListener() {
        this._recycleBinHandler = () => {
            // Refresh current view if we are in or near the recycle bin
            // Or if we need to update icons
            this.navigateTo(this.currentPath, true, true);
        };
        document.addEventListener("zen-recycle-bin-change", this._recycleBinHandler);
    }

    /**
     * Update icon styles based on clipboard state
     * @private
     */
    _updateCutIcons() {
        const { items, operation } = ZenClipboardManager.get();
        const cutPaths = operation === "cut" ? new Set(items) : new Set();

        const icons = this.iconContainer.querySelectorAll(".explorer-icon");
        icons.forEach(icon => {
            const path = icon.getAttribute("data-path");
            if (cutPaths.has(path)) {
                icon.classList.add("cut");
            } else {
                icon.classList.remove("cut");
            }
        });
    }

    async navigateTo(path, isHistoryNav = false, skipMRU = false) {
        if (!path) return;

        try {
            if (path === "My Computer") {
                path = "/";
            }

            // Normalize path for ZenFS
            let normalizedPath = path.replace(/\\/g, "/");
            if (!normalizedPath.startsWith("/")) {
                normalizedPath = "/" + normalizedPath;
            }

            // Check if floppy is mounted when accessing A:
            if (normalizedPath.startsWith("/A:") && !mounts.has("/A:")) {
                this.showFloppyDialog();
                return;
            }

            const stats = await fs.promises.stat(normalizedPath);

            if (!stats.isDirectory()) {
                throw new Error("Not a directory");
            }

            // Update navigation history
            if (!isHistoryNav) {
                this.navHistory.push(normalizedPath);
            }

            this.currentPath = normalizedPath;

            // Only add to MRU if not skipping (i.e., not from manual radio selection)
            if (!skipMRU) {
                this.navHistory.addToMRU(normalizedPath);
            }

            // Refresh menu bar
            this._updateMenuBar();

            // Update UI elements
            await this._updateUIForPath(normalizedPath);

            // Read and render directory contents
            await this._renderDirectoryContents(normalizedPath);

            // Update cut icons
            this._updateCutIcons();

        } catch (err) {
            console.error("Navigation failed", err);
        }
    }

    /**
     * Update UI elements for current path
     * @private
     */
    async _updateUIForPath(path) {
        const name = getDisplayName(path);
        let icon = path === "/" ? ICONS.computer : (path.match(/^\/[A-Z]:\/?$/i) ? ICONS.drive : ICONS.folderOpen);

        // Handle Floppy icon
        if (path === "/A:") {
            icon = ICONS.disketteDrive;
        }
        if (RecycleBinManager.isRecycleBinPath(path)) {
            const isEmpty = await RecycleBinManager.isEmpty();
            icon = isEmpty ? ICONS.recycleBinEmpty : ICONS.recycleBinFull;
        }

        this.addressBar.setValue(formatPathForDisplay(path));
        this.win.title(name);
        this.sidebar.update(name, icon[32]);
        this.win.setIcons(icon);
    }

    /**
     * Render directory contents
     * @private
     */
    async _renderDirectoryContents(path) {
        let files = await fs.promises.readdir(path);

        // Sort files alphabetically (so A: comes before C:)
        files.sort((a, b) => a.localeCompare(b));

        // Clear view
        this.iconContainer.innerHTML = "";
        this.iconManager.clearSelection();

        // Hide metadata file in recycle bin
        if (RecycleBinManager.isRecycleBinPath(path)) {
            files = files.filter(f => f !== ".metadata.json");
        }

        const isRecycleBin = RecycleBinManager.isRecycleBinPath(path);
        const metadata = isRecycleBin ? await RecycleBinManager.getMetadata() : null;
        const recycleBinEmpty = await RecycleBinManager.isEmpty();

        // Build icons first (async operations here)
        const icons = [];
        for (const file of files) {
            const fullPath = joinPath(path, file);
            try {
                const fileStat = await fs.promises.stat(fullPath);
                const isDir = fileStat.isDirectory();
                const iconDiv = await renderFileIcon(file, fullPath, isDir, { metadata, recycleBinEmpty });
                this.iconManager.configureIcon(iconDiv);

                // Add click listener for inline rename
                iconDiv.addEventListener("click", (e) => {
                    if (this._isRenaming) return;
                    if (this.lastSelectedIcon === iconDiv && (Date.now() - this.selectionTimestamp) > 500) {
                        this.enterRenameMode(iconDiv);
                        e.stopPropagation();
                    }
                });


                icons.push(iconDiv);
            } catch (e) {
                console.warn("Could not stat", fullPath);
            }
        }

        // Only clear and update DOM once all icons are ready to avoid duplication during concurrent renders
        this.iconContainer.innerHTML = "";
        this.iconManager.clearSelection();
        const fragment = document.createDocumentFragment();
        icons.forEach(icon => fragment.appendChild(icon));
        this.iconContainer.appendChild(fragment);

        this.statusBar.setText(`${icons.length} object(s)`);
    }

    /**
     * Enter inline rename mode for an icon
     * @param {HTMLElement} icon - The icon element
     */
    async enterRenameMode(icon) {
        if (this._isRenaming) return;

        const path = icon.getAttribute("data-path");
        const isRootItem = getParentPath(path) === "/";
        const isRecycleBin = RecycleBinManager.isRecycleBinPath(path);

        if (isRootItem || isRecycleBin) return;

        this._isRenaming = true;

        const label = icon.querySelector(".icon-label");
        const fullPath = icon.getAttribute("data-path");
        const oldName = fullPath.split("/").pop();

        const input = document.createElement("input");
        input.type = "text";
        input.className = "icon-label-input";
        input.value = oldName;

        label.innerHTML = "";
        label.appendChild(input);

        // Select filename without extension
        const dotIndex = oldName.lastIndexOf(".");
        if (dotIndex > 0 && icon.getAttribute("data-type") !== "directory") {
            input.setSelectionRange(0, dotIndex);
        } else {
            input.select();
        }
        input.focus();

        const finishRename = async (save) => {
            if (!this._isRenaming) return;
            this._isRenaming = false;

            const newName = input.value.trim();
            if (save && newName && newName !== oldName) {
                try {
                    const parentPath = getParentPath(fullPath);
                    const newPath = joinPath(parentPath, newName);
                    await fs.promises.rename(fullPath, newPath);
                    await this.navigateTo(this.currentPath, true, true);
                } catch (e) {
                    alert(`Error renaming: ${e.message}`);
                    label.textContent = getDisplayName(fullPath);
                }
            } else {
                label.textContent = getDisplayName(fullPath);
            }
        };

        input.onkeydown = (e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
                finishRename(true);
            } else if (e.key === "Escape") {
                finishRename(false);
            }
        };

        input.onblur = () => {
            finishRename(true);
        };

        // Prevent click propagation to avoid re-triggering rename
        input.onclick = (e) => e.stopPropagation();
        input.ondblclick = (e) => e.stopPropagation();
    }

    /**
     * Enter rename mode finding icon by path
     * @param {string} path
     */
    enterRenameModeByPath(path) {
        const icon = this.iconContainer.querySelector(`.explorer-icon[data-path="${path}"]`);
        if (icon) {
            this.iconManager.setSelection(new Set([icon]));
            this.enterRenameMode(icon);
        }
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

    /**
     * Show dialog for unmounted floppy
     */
    showFloppyDialog() {
        ShowDialogWindow({
            title: "3½ Floppy (A:)",
            text: "Insert floppy disk into drive A:\\",
            buttons: [
                {
                    label: "OK",
                    action: (win) => this.insertFloppy(win),
                },
                { label: "Cancel" },
            ],
        });
    }

    /**
     * Insert floppy using WebAccess
     */
    async insertFloppy(dialogWin) {
        try {
            const handle = await window.showDirectoryPicker();

            // Close dialog immediately after selection
            if (dialogWin) dialogWin.close();

            const busyRequesterId = "zen-floppy-mount";
            requestWaitState(busyRequesterId, this.win.element);

            try {
                const floppyFs = await WebAccess.create({ handle });
                mount("/A:", floppyFs);
                ZenFloppyManager.setLabel(handle.name);
                document.dispatchEvent(new CustomEvent("zen-floppy-change"));
            } finally {
                releaseWaitState(busyRequesterId, this.win.element);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Failed to mount floppy:", err);
            }
        }
    }

    /**
     * Eject floppy
     */
    ejectFloppy() {
        if (mounts.has("/A:")) {
            umount("/A:");
            ZenFloppyManager.clear();
            document.dispatchEvent(new CustomEvent("zen-floppy-change"));
        }
    }

    /**
     * Setup floppy change listener
     * @private
     */
    _setupFloppyListener() {
        this._floppyHandler = () => {
            if (this.currentPath.startsWith("/A:") && !mounts.has("/A:")) {
                this.navigateTo("/");
            } else {
                this.navigateTo(this.currentPath, true, true);
            }
        };
        document.addEventListener("zen-floppy-change", this._floppyHandler);
    }

    _onClose() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this._clipboardHandler) {
            document.removeEventListener("zen-clipboard-change", this._clipboardHandler);
        }
        if (this._floppyHandler) {
            document.removeEventListener("zen-floppy-change", this._floppyHandler);
        }
        if (this._recycleBinHandler) {
            document.removeEventListener("zen-recycle-bin-change", this._recycleBinHandler);
        }
    }
}
