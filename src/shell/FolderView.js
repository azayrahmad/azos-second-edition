import { IconManager } from "../components/IconManager.js";
import { apps } from "../config/apps.js";
import { ICONS, SHORTCUT_OVERLAY } from "../config/icons.js";
import { getAssociation, getDesktopContents, findItemByPath } from "../utils/directory.js";
import { launchApp } from "../utils/appManager.js";
import { getItemFromIcon as getItemFromIconUtil } from "../utils/iconUtils.js";
import { createDragGhost } from "../utils/dragDropManager.js";
import { truncateName } from "../utils/stringUtils.js";
import { getItem, setItem, LOCAL_STORAGE_KEYS } from "../utils/localStorage.js";
import { SPECIAL_FOLDER_PATHS } from "../config/special-folders.js";
import { ShowDialogWindow } from "../components/DialogWindow.js";
import clipboardManager from "../utils/clipboardManager.js";
import { pasteItems } from "../utils/fileOperations.js";
import { downloadFile } from "../utils/fileDownloader.js";
import {
    getRecycleBinItems,
    removeFromRecycleBin,
    addToRecycleBin,
} from "../utils/recycleBinManager.js";

function getIconPositions(isDesktop) {
    const key = isDesktop ? LOCAL_STORAGE_KEYS.ICON_POSITIONS : LOCAL_STORAGE_KEYS.EXPLORER_ICON_POSITIONS;
    return getItem(key) || {};
}

function setIconPositions(positions, isDesktop) {
    const key = isDesktop ? LOCAL_STORAGE_KEYS.ICON_POSITIONS : LOCAL_STORAGE_KEYS.EXPLORER_ICON_POSITIONS;
    setItem(key, positions);
}

export class FolderView {
    constructor(container, options = {}) {
        this.container = container;
        this.path = options.path || "/";
        this.isDesktop = options.isDesktop || false;
        this.onItemLaunch = options.onItemLaunch || this._defaultItemLaunch;
        this.onPathChange = options.onPathChange || (() => {});
        this.onSelectionChange = options.onSelectionChange || (() => {});

        this.container.className = this.isDesktop ? "desktop" : "explorer-icon-view";
        this.currentFolderItems = [];

        this.iconManager = new IconManager(this.container, {
            iconSelector: ".icon-item",
            onItemContext: (e, icon) => this.showItemContextMenu(e, icon),
            onBackgroundContext: (e) => this.showBackgroundContextMenu(e),
            onSelectionChange: () => this.onSelectionChange(this.iconManager.selectedIcons),
        });

        this._setupEventListeners();
    }

    render(path, isNewNavigation = true) {
        this.path = path || this.path;
        const item = findItemByPath(this.path);
        if (!item) {
            this.container.innerHTML = "Folder not found.";
            return;
        }

        this.container.innerHTML = "";
        this.iconManager.clearSelection();

        // Determine icon layout mode
        if (this.isAutoArrangeEnabled()) {
            this.container.classList.remove("has-absolute-icons");
        } else {
            this.container.classList.add("has-absolute-icons");
        }

        // Fetch items
        if (isNewNavigation) {
            this.currentFolderItems = this._getItemsForPath(this.path);
        }

        const allPositions = getIconPositions(this.isDesktop);
        const pathPositions = allPositions[this.path] || {};

        // Render each item
        this.currentFolderItems.forEach(child => {
            const icon = this._createIcon(child);
            const uniqueId = this._getUniqueItemId(child);

            if (pathPositions[uniqueId]) {
                icon.style.position = "absolute";
                icon.style.left = pathPositions[uniqueId].x;
                icon.style.top = pathPositions[uniqueId].y;
            }

            this.container.appendChild(icon);
            this.iconManager.configureIcon(icon);
            this._configureDraggableIcon(icon, child);
        });
    }

    _getItemsForPath(path) {
        let children = [];
        if (path === SPECIAL_FOLDER_PATHS.desktop || this.isDesktop) {
            const desktopContents = getDesktopContents();
            const desktopApps = desktopContents.apps.map(appId => {
                const app = apps.find(a => a.id === appId);
                return { ...app, appId: app.id, isStatic: true };
            });
            const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
            const desktopFiles = allDroppedFiles.filter(file => file.path === SPECIAL_FOLDER_PATHS.desktop);
            const staticFiles = desktopContents.files.map(file => ({ ...file, isStatic: true }));
            children = [...desktopApps, ...staticFiles, ...desktopFiles];
        } else {
            const item = findItemByPath(path);
            const staticChildren = (item.children || []).map(child => ({ ...child, isStatic: true }));
            const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
            const droppedFilesInThisFolder = allDroppedFiles.filter(file => file.path === path);
            children = [...staticChildren, ...droppedFilesInThisFolder];
        }

        // Sort children alphabetically, except for root drives
        if (path !== "/") {
            children.sort((a, b) => {
                const nameA = a.name || a.title || a.filename || "";
                const nameB = b.name || b.title || b.filename || "";
                return nameA.localeCompare(nameB);
            });
        }
        return children;
    }

    _createIcon(item) {
        const app = apps.find(a => a.id === item.appId) || {};
        const originalName = item.name || item.filename || item.title || app.title;
        const displayName = item.type === "drive" ? `(${originalName})` : originalName;

        const iconDiv = document.createElement("div");
        iconDiv.className = "icon-item"; // Generic class for icon manager
        // Add specific class for styling desktop vs explorer icons
        iconDiv.classList.add(this.isDesktop ? "desktop-icon" : "explorer-icon");

        iconDiv.setAttribute("title", displayName);
        iconDiv.setAttribute("data-id", this._getUniqueItemId(item));

        const iconInner = document.createElement("div");
        iconInner.className = "icon";
        const iconWrapper = document.createElement("div");
        iconWrapper.className = "icon-wrapper";
        const iconImg = document.createElement("img");

        iconImg.src = this._getIconUrl(item, displayName);
        iconImg.draggable = false;
        iconWrapper.appendChild(iconImg);

        if (item.type === "shortcut") {
            const overlayImg = document.createElement("img");
            overlayImg.className = "shortcut-overlay shortcut-overlay-32";
            overlayImg.src = SHORTCUT_OVERLAY[32];
            iconWrapper.appendChild(overlayImg);
        }
        iconInner.appendChild(iconWrapper);

        const iconLabel = document.createElement("div");
        iconLabel.className = "icon-label";
        iconLabel.textContent = truncateName(displayName);

        iconDiv.appendChild(iconInner);
        iconDiv.appendChild(iconLabel);

        iconDiv.addEventListener("dblclick", () => this.onItemLaunch(item, this.path));

        return iconDiv;
    }

    _getIconUrl(item, displayName) {
        const size = 32;
        if (item.icon) return item.icon[size];
        if (item.id === "folder-control-panel") return ICONS.controlPanel[size];
        if (item.type === "drive") return ICONS.drive[size];
        if (item.type === "folder") return ICONS.folderClosed[size];
        if (item.type === "network") return ICONS.networkComputer[size];
        if (item.type === "briefcase") return ICONS.briefcase[size];

        const association = getAssociation(displayName);
        return association.icon[size];
    }

    _configureDraggableIcon(icon, item) {
        // Desktop icons are always draggable for repositioning, even static ones.
        // Explorer icons are only draggable if they represent movable files.
        if (this.isDesktop || !item.isStatic) {
            icon.draggable = true;
        } else {
            icon.draggable = false;
            return;
        }

        let dragGhost = null;

        icon.addEventListener("dragstart", (e) => {
            e.stopPropagation();
            if (!this.iconManager.selectedIcons.has(icon)) {
                this.iconManager.clearSelection();
                this.iconManager.selectIcon(icon);
            }

            const selectedItems = [...this.iconManager.selectedIcons]
                .map(selectedIcon => this.getItemFromIcon(selectedIcon))
                .filter(Boolean);

            const primaryIconRect = icon.getBoundingClientRect();
            const cursorOffsetX = e.clientX - primaryIconRect.left;
            const cursorOffsetY = e.clientY - primaryIconRect.top;

            const dragOffsets = [...this.iconManager.selectedIcons].map(
                (selectedIcon) => {
                    const rect = selectedIcon.getBoundingClientRect();
                    return {
                        id: this._getUniqueItemId(this.getItemFromIcon(selectedIcon)),
                        offsetX: rect.left - primaryIconRect.left,
                        offsetY: rect.top - primaryIconRect.top,
                    };
                },
            );

            e.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    items: selectedItems,
                    sourcePath: this.path,
                    cursorOffsetX,
                    cursorOffsetY,
                    dragOffsets,
                }),
            );
            e.dataTransfer.effectAllowed = "move";
            dragGhost = createDragGhost(icon, e);
        });

        icon.addEventListener("dragend", () => {
            if (dragGhost && dragGhost.parentElement) {
                dragGhost.parentElement.removeChild(dragGhost);
            }
            dragGhost = null;
        });
    }

    _setupEventListeners() {
        this.container.addEventListener("dragover", e => e.preventDefault());
        this.container.addEventListener("drop", e => this._handleDrop(e));
        // Refresh listener for external changes
        document.addEventListener("desktop-refresh", () => {
            if (this.isDesktop) this.render();
        });
        document.addEventListener("explorer-refresh", () => {
            if (!this.isDesktop) this.render();
        });
    }

    _handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const jsonData = e.dataTransfer.getData("application/json");
        if (!jsonData) return; // Ignore drops from other sources for now

        const data = JSON.parse(jsonData);
        const { items, sourcePath, cursorOffsetX, cursorOffsetY, dragOffsets } = data;

        // Case 1: Rearranging icons within the same folder view
        if (sourcePath === this.path) {
            if (this.isAutoArrangeEnabled()) {
                // If auto-arrange is on, dropping just snaps back to grid.
                // We achieve this by re-rendering without saved positions.
                const allPositions = getIconPositions(this.isDesktop);
                delete allPositions[this.path];
                setIconPositions(allPositions, this.isDesktop);
            } else {
                // Manual arrange: calculate and save new positions
                const viewRect = this.container.getBoundingClientRect();
                const primaryIconX = e.clientX - viewRect.left - cursorOffsetX;
                const primaryIconY = e.clientY - viewRect.top - cursorOffsetY;

                const allPositions = getIconPositions(this.isDesktop);
                if (!allPositions[this.path]) {
                    allPositions[this.path] = {};
                }

                (dragOffsets || []).forEach((offset) => {
                    allPositions[this.path][offset.id] = {
                        x: `${primaryIconX + offset.offsetX}px`,
                        y: `${primaryIconY + offset.offsetY}px`,
                    };
                });
                setIconPositions(allPositions, this.isDesktop);
            }
            this.render(this.path, false); // Re-render without fetching items
            return;
        }

        // Case 2: Dropping items from another folder
        pasteItems(this.path, items, "cut"); // Default to move operation
    }

    _getUniqueItemId(item) {
        return item.id;
    }

    isAutoArrangeEnabled() {
        const key = this.isDesktop ? LOCAL_STORAGE_KEYS.AUTO_ARRANGE_ICONS : LOCAL_STORAGE_KEYS.EXPLORER_AUTO_ARRANGE;
        const autoArrange = getItem(key);
        // Desktop defaults to true, Explorer defaults to false
        return autoArrange === null ? this.isDesktop : !!autoArrange;
    }

    _defaultItemLaunch(item, currentPath) {
        if (item.type === "folder" || item.type === "drive") {
            const newPath = currentPath === "/" ? `/${item.id}` : `${currentPath}/${item.id}`;
            if (this.isDesktop) {
                launchApp("explorer", newPath);
            } else {
                this.onPathChange(newPath);
            }
            return;
        }
        if (item.url) {
            window.open(item.url, "_blank", "width=800,height=600");
            return;
        }
        if (item.appId) {
            launchApp(item.appId);
            return;
        }
        const fileName = item.name || item.filename;
        if (fileName) {
            const appId = item.app || getAssociation(fileName).appId;
            if (appId) {
                const launchData = item.contentUrl ? item.contentUrl : item;
                launchApp(appId, launchData);
            }
        }
    }

    updateCutIcons() {
        const { items, operation } = clipboardManager.get();
        const cutIds = operation === "cut" ? new Set(items.map((item) => this._getUniqueItemId(item))) : new Set();

        this.container.querySelectorAll(".icon-item").forEach((icon) => {
            const itemId = icon.getAttribute("data-id");
            if (cutIds.has(itemId)) {
                icon.classList.add("cut");
            } else {
                icon.classList.remove("cut");
            }
        });
    }

    getItemFromIcon(icon) {
        const itemId = icon.getAttribute("data-id");
        const item = this.currentFolderItems.find((child) => this._getUniqueItemId(child) === itemId);
        if (item) {
            return { ...item, source: this.isDesktop ? 'desktop' : 'explorer', path: this.path };
        }
        return getItemFromIconUtil(icon);
    }

    showItemContextMenu(event, icon) {
        if (icon && !this.iconManager.selectedIcons.has(icon)) {
            this.iconManager.clearSelection();
            this.iconManager.selectIcon(icon);
        }

        const clickedItem = this.getItemFromIcon(icon);
        if (!clickedItem) {
            console.warn("Clicked item not found for icon:", icon);
            return;
        }

        const itemsToOperateOn = [...this.iconManager.selectedIcons]
            .map((selectedIcon) => this.getItemFromIcon(selectedIcon))
            .filter(Boolean);

        let menuItems = [];

        if (this.path === "//recycle-bin") {
            menuItems = this._getRecycleBinContextMenu(clickedItem);
        } else if (this.isDesktop) {
            menuItems = this._getDesktopItemContextMenu(clickedItem, itemsToOperateOn);
        } else {
            menuItems = this._getExplorerItemContextMenu(clickedItem, itemsToOperateOn);
        }

        new window.ContextMenu(menuItems, event);
    }

    showBackgroundContextMenu(event) {
        const menuItems = this.isDesktop
            ? this._getDesktopBackgroundContextMenu()
            : this._getExplorerBackgroundContextMenu();
        new window.ContextMenu(menuItems, event);
    }

    _getDesktopItemContextMenu(clickedItem, itemsToOperateOn) {
        const app = apps.find(a => a.id === clickedItem.appId);
        const fileId = !clickedItem.isStatic ? clickedItem.id : null;
        let menuItems = [];

        const copyItem = { label: "C&opy", action: () => clipboardManager.set(itemsToOperateOn, "copy") };
        const cutItem = {
            label: "Cu&t",
            action: () => clipboardManager.set(itemsToOperateOn, "cut"),
            enabled: !itemsToOperateOn.some(item => item.isStatic),
        };

        if (fileId) {
            const file = this.currentFolderItems.find(f => f.id === fileId);
            menuItems.push({
                label: "&Open",
                default: true,
                action: () => this.onItemLaunch(file, this.path),
            });
            if (file) {
                const association = getAssociation(file.name);
                if (association.appId === 'media-player') {
                    menuItems.push({
                        label: 'Play in Winamp',
                        action: () => launchApp('webamp', file),
                    });
                }
            }
            menuItems.push(copyItem, cutItem);
            menuItems.push({
                label: "&Delete",
                action: () => this.deleteFile(clickedItem),
            });
        } else {
            menuItems.push({
                label: "&Open",
                default: true,
                action: () => this.onItemLaunch(clickedItem, this.path),
            });
            menuItems.push(copyItem, cutItem);
        }

        menuItems.push("MENU_DIVIDER", {
            label: "&Properties",
            action: () => this.showProperties(clickedItem),
        });

        return menuItems;
    }

    _getExplorerItemContextMenu(clickedItem, itemsToOperateOn) {
        let menuItems = [];
        menuItems.push({
            label: "Open",
            default: true,
            action: () => this.onItemLaunch(clickedItem, this.path),
        });

        const association = getAssociation(clickedItem.name || clickedItem.filename);
        if (association.appId === 'media-player') {
            menuItems.push({
                label: 'Play in Winamp',
                action: () => launchApp('webamp', clickedItem),
            });
        }

        const copyItem = { label: "Copy", action: () => clipboardManager.set(itemsToOperateOn, "copy") };
        const cutItem = {
            label: "Cut",
            action: () => clipboardManager.set(itemsToOperateOn, "cut"),
            enabled: !itemsToOperateOn.some((item) => item.isStatic),
        };
        menuItems.push(copyItem, cutItem, "MENU_DIVIDER");

        if (clickedItem.type !== "drive" && clickedItem.type !== "network") {
             menuItems.push({
                label: "Delete",
                action: () => this.deleteFile(clickedItem),
            });
            menuItems.push({ label: "Rename", enabled: false });
        }

        menuItems.push("MENU_DIVIDER", {
            label: "Properties",
            action: () => this.showProperties(clickedItem),
        });

        return menuItems;
    }

    _getRecycleBinContextMenu(clickedItem) {
        return [
            {
                label: "Restore",
                default: true,
                action: () => {
                    const itemToRestore = getRecycleBinItems().find((i) => i.id === clickedItem.id);
                    if (itemToRestore) {
                        const restoredItemWithName = { ...itemToRestore, name: itemToRestore.name || itemToRestore.title };
                        const droppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
                        droppedFiles.push(restoredItemWithName);
                        setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, droppedFiles);
                        removeFromRecycleBin(clickedItem.id);
                        this.render(this.path);
                        document.dispatchEvent(new CustomEvent("desktop-refresh"));
                    }
                },
            },
            "MENU_DIVIDER",
            {
                label: "Delete",
                action: () => {
                    ShowDialogWindow({
                        title: "Delete Item",
                        text: `Are you sure you want to permanently delete "${clickedItem.name}"?`,
                        buttons: [
                            {
                                label: "Yes",
                                action: () => {
                                    removeFromRecycleBin(clickedItem.id);
                                    this.render(this.path);
                                },
                            },
                            { label: "No", isDefault: true },
                        ],
                    });
                },
            },
        ];
    }

    _getDesktopBackgroundContextMenu() {
        // Simplified version of desktop context menu from original desktop.js
        return [
            {
                label: "Arrange Icons",
                submenu: [
                    { label: "by Name", enabled: false },
                    { label: "Auto Arrange", enabled: false },
                ],
            },
            "MENU_DIVIDER",
            {
                label: "Paste",
                action: () => {
                    const { items, operation } = clipboardManager.get();
                    pasteItems(this.path, items, operation);
                    this.render(this.path);
                    if (operation === 'cut') clipboardManager.clear();
                },
                enabled: !clipboardManager.isEmpty(),
            },
            "MENU_DIVIDER",
            {
                label: "Properties",
                action: () => launchApp("displayproperties"),
            },
        ];
    }

    _getExplorerBackgroundContextMenu() {
        const isPasteDisabled = clipboardManager.isEmpty() || this.path === "/" || this.path === "//network-neighborhood";
        return [
            {
                label: "Arrange Icons",
                submenu: [
                    { label: "by Name", action: () => this.sortIcons("name") },
                    { label: "by Type", action: () => this.sortIcons("type") },
                ],
            },
            "MENU_DIVIDER",
            {
                label: "Paste",
                action: () => {
                    const { items, operation } = clipboardManager.get();
                    pasteItems(this.path, items, operation);
                    this.render(this.path);
                    if (operation === 'cut') clipboardManager.clear();
                },
                enabled: !isPasteDisabled,
            },
            { label: "Properties", enabled: false },
        ];
    }

    deleteFile(item) {
        const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
        const updatedFiles = allDroppedFiles.filter((file) => file.id !== item.id);
        addToRecycleBin(item);
        setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, updatedFiles);
        this.render(this.path);
        document.dispatchEvent(new CustomEvent("desktop-refresh"));
        document.dispatchEvent(new CustomEvent("explorer-refresh"));
    }

    showProperties(item) {
        if (item.appId && item.isStatic) {
            const appConfig = apps.find((app) => app.id === item.appId);
            if (appConfig && appConfig.appClass) {
                const tempAppInstance = new appConfig.appClass(appConfig);
                tempAppInstance.showProperties();
                return;
            }
        }

        const displayName = item.name || item.filename || item.title;
        const itemType = item.type || "File";
        let iconUrl;

        if (item.icon) iconUrl = item.icon[32];
        else if (item.type === "drive") iconUrl = ICONS.drive[32];
        else if (item.type === "folder") iconUrl = ICONS.folderClosed[32];
        else {
            const association = getAssociation(displayName);
            iconUrl = association.icon[32];
        }

        ShowDialogWindow({
            title: `${displayName} Properties`,
            contentIconUrl: iconUrl,
            text: `<b>${displayName}</b><br>Type: ${itemType}`,
            buttons: [{ label: "OK", isDefault: true }],
        });
    }

    sortIcons(sortBy) {
        this.currentFolderItems.sort((a, b) => {
            const nameA = a.name || a.title || a.filename || "";
            const nameB = b.name || b.title || b.filename || "";
            if (sortBy === 'name') {
                return nameA.localeCompare(nameB);
            } else if (sortBy === 'type') {
                const typeA = a.type || getAssociation(nameA).appId;
                const typeB = b.type || getAssociation(nameB).appId;
                if (typeA.localeCompare(typeB) !== 0) {
                    return typeA.localeCompare(typeB);
                }
                return nameA.localeCompare(nameB); // secondary sort by name
            }
            return 0;
        });
        this.render(this.path, false);
    }
}
