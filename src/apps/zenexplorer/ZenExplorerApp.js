import { Application } from "../Application.js";
import { fs } from "@zenfs/core";
import { initFileSystem } from "../../utils/zenfs-init.js";
import { ICONS } from "../../config/icons.js";
import { IconManager } from "../../components/IconManager.js";
import { AddressBar } from "../../components/AddressBar.js";
import { StatusBar } from "../../components/StatusBar.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "../explorer/explorer.css"; // Reuse explorer styles

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
        this.history = [];
        this.historyIndex = -1;
        this.mruFolders = [];
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

        // Sidebar
        const sidebar = document.createElement("div");
        sidebar.className = "explorer-sidebar";
        // Reuse the bitmap from explorer
        sidebar.style.backgroundImage = `url(${new URL("../../assets/img/wvleft.bmp", import.meta.url).href})`;
        sidebar.style.backgroundRepeat = "no-repeat";

        content.appendChild(sidebar);
        this.sidebarElement = sidebar;

        const sidebarIcon = document.createElement("img");
        sidebarIcon.className = "sidebar-icon";
        sidebar.appendChild(sidebarIcon);
        this.sidebarIcon = sidebarIcon;

        const sidebarTitle = document.createElement("h1");
        sidebarTitle.className = "sidebar-title";
        sidebar.appendChild(sidebarTitle);
        this.sidebarTitle = sidebarTitle;

        const sidebarLine = document.createElement("img");
        sidebarLine.src = new URL("../../assets/img/wvline.gif", import.meta.url).href;
        sidebarLine.style.width = "100%";
        sidebarLine.style.height = "auto";
        sidebar.appendChild(sidebarLine);

        // Icon View
        this.iconContainer = document.createElement("div");
        this.iconContainer.className = "explorer-icon-view";
        content.appendChild(this.iconContainer);

        win.$content.append(content);

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

        // 5. Status Bar
        this.statusBar = new StatusBar();
        win.$content.append(this.statusBar.element);

        // 6. Icon Manager
        this.iconManager = new IconManager(this.iconContainer, {
            iconSelector: ".explorer-icon",
            onItemContext: (e, icon) => {
                const path = icon.getAttribute("data-path");
                const menuItems = [
                    {
                        label: "Rename",
                        action: () => this.renameItem(path),
                    },
                    {
                        label: "Delete",
                        action: () => this.deleteItems([path]),
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
                                action: () => this.createNewFolder(),
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

        // 7. Event Delegation for Navigation
        this.iconContainer.addEventListener("dblclick", (e) => {
            const icon = e.target.closest(".explorer-icon");
            if (icon) {
                const type = icon.getAttribute("data-type");
                const name = icon.getAttribute("data-name");
                if (type === "directory") {
                    const newPath = this.currentPath === "/"
                        ? `/${name}`
                        : `${this.currentPath}/${name}`;
                    this.navigateTo(newPath);
                } else {
                    // Open file (placeholder)
                    alert(`Cannot open file: ${name} (Not implemented)`);
                }
            }
        });

        // 8. Initial Navigation
        this.navigateTo(this.currentPath);

        return win;
    }

    async navigateTo(path, isHistoryNav = false) {
        if (!path) return;

        try {
            // Resolve path (very basic)
            // Note: fs.promises.readdir requires string path
            const stats = await fs.promises.stat(path);

            if (!stats.isDirectory()) {
                throw new Error("Not a directory");
            }

            if (!isHistoryNav) {
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

            this.currentPath = path;

            // Update MRU (Log of last 10 visits, oldest to latest)
            this.mruFolders = [...this.mruFolders, path].slice(-10);

            // Refresh menu bar
            this._updateMenuBar();

            this.addressBar.setValue(path);

            const name = path === "/" ? "ZenFS" : path.split("/").pop() || path;
            this.win.title(`ZenFS - ${name}`);

            this.sidebarTitle.textContent = name;

            // Icon logic
            const icon = path === "/" ? ICONS.computer : ICONS.folderOpen;
            this.sidebarIcon.src = icon[32];
            this.win.setIcons(icon);

            // Read contents
            const files = await fs.promises.readdir(path);

            // Clear view
            this.iconContainer.innerHTML = "";
            this.iconManager.clearSelection();

            // Render Go Up if not root
            if (path !== "/") {
                // We could add a ".." icon or just rely on the toolbar (which I haven't fully built yet)
            }

            for (const file of files) {
                const fullPath = path === "/" ? `/${file}` : `${path}/${file}`;
                let fileStat;
                try {
                    fileStat = await fs.promises.stat(fullPath);
                } catch (e) {
                    console.warn("Could not stat", fullPath);
                    continue;
                }

                const isDir = fileStat.isDirectory();

                // Element Creation
                const iconDiv = document.createElement("div");
                iconDiv.className = "explorer-icon";
                iconDiv.setAttribute("data-path", fullPath);
                iconDiv.setAttribute("data-type", isDir ? "directory" : "file");
                iconDiv.setAttribute("data-name", file);

                const iconInner = document.createElement("div");
                iconInner.className = "icon";

                const iconWrapper = document.createElement("div");
                iconWrapper.className = "icon-wrapper";

                const iconImg = document.createElement("img");
                iconImg.src = isDir ? ICONS.folderClosed[32] : ICONS.fileGeneric[32]; // Basic icons
                iconImg.draggable = false;
                iconWrapper.appendChild(iconImg);

                iconInner.appendChild(iconWrapper);

                const label = document.createElement("div");
                label.className = "icon-label";
                label.textContent = file;

                iconDiv.appendChild(iconInner);
                iconDiv.appendChild(label);

                this.iconManager.configureIcon(iconDiv);
                this.iconContainer.appendChild(iconDiv);
            }

            this.statusBar.setText(`${files.length} object(s)`);

        } catch (err) {
            console.error("Navigation failed", err);
        }
    }

    async deleteItems(paths) {
        if (paths.length === 0) return;

        const message = paths.length === 1
            ? `Are you sure you want to permanently delete '${paths[0].split("/").pop()}'?`
            : `Are you sure you want to permanently delete these ${paths.length} items?`;

        ShowDialogWindow({
            title: "Confirm File Delete",
            text: message,
            parentWindow: this.win,
            modal: true,
            buttons: [
                {
                    label: "Yes",
                    isDefault: true,
                    action: async () => {
                        try {
                            for (const path of paths) {
                                await fs.promises.rm(path, { recursive: true });
                            }
                            this.navigateTo(this.currentPath);
                        } catch (e) {
                            ShowDialogWindow({
                                title: "Error Deleting File",
                                text: `Could not delete items: ${e.message}`,
                                buttons: [{ label: "OK" }]
                            });
                        }
                    }
                },
                { label: "No" }
            ]
        });
    }

    async renameItem(fullPath) {
        const oldName = fullPath.split("/").pop();
        const input = document.createElement("input");
        input.type = "text";
        input.value = oldName;
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        input.style.marginBottom = "10px";

        // Select text on focus
        setTimeout(() => input.select(), 100);

        const content = document.createElement("div");
        content.textContent = "New name:";
        content.appendChild(input);

        ShowDialogWindow({
            title: "Rename",
            content: content,
            parentWindow: this.win,
            modal: true,
            buttons: [
                {
                    label: "OK",
                    isDefault: true,
                    action: async () => {
                        const newName = input.value.trim();
                        if (!newName || newName === oldName) return;

                        try {
                            const parentPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
                            const newPath = parentPath === "" ? `/${newName}` : `${parentPath}/${newName}`;
                            await fs.promises.rename(fullPath, newPath);
                            this.navigateTo(this.currentPath);
                        } catch (e) {
                            ShowDialogWindow({
                                title: "Error Renaming File",
                                text: `Cannot rename ${oldName}: ${e.message}`,
                                buttons: [{ label: "OK" }]
                            });
                        }
                    }
                },
                { label: "Cancel" }
            ]
        });
    }

    async createNewFolder() {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "New Folder";
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        input.style.marginBottom = "10px";

        // Select text on focus
        setTimeout(() => input.select(), 100);

        const content = document.createElement("div");
        content.textContent = "Folder name:";
        content.appendChild(input);

        ShowDialogWindow({
            title: "Create New Folder",
            content: content,
            parentWindow: this.win,
            modal: true,
            buttons: [
                {
                    label: "OK",
                    isDefault: true,
                    action: async () => {
                        const name = input.value.trim();
                        if (!name) return false; // Prevent closing if empty

                        try {
                            const newPath = this.currentPath === "/"
                                ? `/${name}`
                                : `${this.currentPath}/${name}`;
                            await fs.promises.mkdir(newPath);
                            this.navigateTo(this.currentPath); // Refresh
                        } catch (e) {
                            // Show error
                            ShowDialogWindow({
                                title: "Error",
                                text: `Could not create folder: ${e.message}`,
                                buttons: [{ label: "OK" }]
                            });
                        }
                    }
                },
                { label: "Cancel" }
            ]
        });
    }


    goUp() {
        if (this.currentPath === "/") return;
        const parts = this.currentPath.split("/").filter(Boolean);
        parts.pop();
        const newPath = "/" + parts.join("/");
        this.navigateTo(newPath);
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.navigateTo(this.history[this.historyIndex], true);
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.navigateTo(this.history[this.historyIndex], true);
        }
    }

    _updateMenuBar() {
        if (!this.win) return;
        this.menuBar = this._createMenuBar();
        this.win.setMenuBar(this.menuBar);
    }

    _createMenuBar() {
        return new window.MenuBar({
            "&File": [
                {
                    label: "&New",
                    submenu: [
                        {
                            label: "&Folder",
                            action: () => this.createNewFolder(),
                        },
                    ],
                },
                "MENU_DIVIDER",
                {
                    label: "&Delete",
                    action: () => {
                        const selectedPaths = [...this.iconManager.selectedIcons].map(icon => icon.getAttribute("data-path"));
                        this.deleteItems(selectedPaths);
                    },
                    enabled: () => this.iconManager.selectedIcons.size > 0,
                },
                {
                    label: "&Rename",
                    action: () => {
                        const firstSelected = [...this.iconManager.selectedIcons][0];
                        if (firstSelected) {
                            this.renameItem(firstSelected.getAttribute("data-path"));
                        }
                    },
                    enabled: () => this.iconManager.selectedIcons.size > 0,
                },
                "MENU_DIVIDER",
                {
                    radioItems: this.mruFolders.map(path => ({
                        label: path === "/" ? "ZenFS" : path.split("/").pop() || path,
                        value: path
                    })),
                    getValue: () => this.currentPath,
                    setValue: (path) => this.navigateTo(path)
                },
                "MENU_DIVIDER",
                {
                    label: "&Close",
                    action: () => this.win.close(),
                },
            ],
            "&View": [
                {
                    label: "&Refresh",
                    shortcutLabel: "F5",
                    action: () => this.navigateTo(this.currentPath),
                },
            ],
            "&Go": [
                {
                    label: "&Back",
                    action: () => this.goBack(),
                    enabled: () => this.historyIndex > 0,
                },
                {
                    label: "&Forward",
                    action: () => this.goForward(),
                    enabled: () => this.historyIndex < this.history.length - 1,
                },
                {
                    label: "&Up One Level",
                    action: () => this.goUp(),
                    enabled: () => this.currentPath !== "/",
                },
            ],
            "&Help": [
                {
                    label: "&About",
                    action: () => {
                        ShowDialogWindow({
                            title: "About ZenFS",
                            text: "ZenExplorer v0.1<br>Powered by ZenFS",
                            modal: true,
                            buttons: [{ label: "OK" }],
                        });
                    },
                },
            ],
        });
    }

    _onClose() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
