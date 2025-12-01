
import { LOCAL_STORAGE_KEYS, getItem, setItem } from "./localStorage.js";
import { ExplorerApp } from "../apps/explorer/ExplorerApp.js";
import { pasteItems } from "./fileOperations.js";
import { ShowDialogWindow } from "../components/DialogWindow.js";
import { ICONS } from "../config/icons.js";
import { SPECIAL_FOLDER_PATHS } from "../config/special-folders.js";

export function findExplorerInstanceByWindow(windowElement) {
    if (!windowElement || !window.System || !window.System.getRunningApps) {
        return null;
    }
    return window.System
        .getRunningApps()
        .find(
            (app) => app instanceof ExplorerApp && app.win.element === windowElement,
        );
}

export function configureDraggableIcon(icon, item, iconManager, getItemFromIcon, deleteFile) {
    let isDragging = false;
    let wasDragged = false;
    let dragStartX, dragStartY;
    let dragOffsets = new Map();
    let ghostIcons = new Map();
    let handleDragEndWrapper;

    const handleDragStart = (e) => {
        if (e.type === "mousedown" && e.button !== 0) return;
        if (e.type === "touchstart" && e.touches.length > 1) return;

        iconManager.handleIconMouseDown(e, icon);

        isDragging = true;
        wasDragged = false;
        dragOffsets.clear();

        const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

        dragStartX = clientX;
        dragStartY = clientY;

        ghostIcons.forEach((ghost) => ghost.remove());
        ghostIcons.clear();

        handleDragEndWrapper = (evt) => handleDragEnd(evt);

        if (e.type === "mousedown") {
            document.addEventListener("mousemove", handleDragMove);
            document.addEventListener("mouseup", handleDragEndWrapper);
        } else if (e.type === "touchstart") {
            document.addEventListener("touchmove", handleDragMove, { passive: false });
            document.addEventListener("touchend", handleDragEndWrapper);
        }
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

        if (Math.abs(clientX - dragStartX) > 5 || Math.abs(clientY - dragStartY) > 5) {
            if (!wasDragged) {
                wasDragged = true;
                window.getSelection().removeAllRanges();

                const screen = document.querySelector("#screen");
                const screenRect = screen.getBoundingClientRect();

                iconManager.selectedIcons.forEach((selectedIcon) => {
                    const iconRect = selectedIcon.getBoundingClientRect();
                    const ghost = selectedIcon.cloneNode(true);
                    ghost.classList.add("desktop-icon-ghost");
                    ghost.style.position = "absolute";
                    ghost.style.left = `${iconRect.left - screenRect.left}px`;
                    ghost.style.top = `${iconRect.top - screenRect.top}px`;
                    ghost.style.width = `${iconRect.width}px`;
                    ghost.style.height = `${iconRect.height}px`;
                    ghost.style.opacity = "0.5";
                    ghost.style.zIndex = "10000";
                    ghost.style.pointerEvents = "none";
                    screen.appendChild(ghost);
                    ghostIcons.set(selectedIcon, ghost);

                    const offsetX = dragStartX - iconRect.left;
                    const offsetY = dragStartY - iconRect.top;
                    dragOffsets.set(ghost, { offsetX, offsetY });
                });
            }
        }

        if (!wasDragged) return;
        if (e.type === "touchmove") e.preventDefault();

        const screen = document.querySelector("#screen");
        const screenRect = screen.getBoundingClientRect();

        ghostIcons.forEach((ghostIcon) => {
            const { offsetX, offsetY } = dragOffsets.get(ghostIcon);
            const ghostRect = ghostIcon.getBoundingClientRect();

            let newX = clientX - screenRect.left - offsetX;
            let newY = clientY - screenRect.top - offsetY;

            newX = Math.max(0, Math.min(newX, screenRect.width - ghostRect.width));
            newY = Math.max(0, Math.min(newY, screenRect.height - ghostRect.height));

            ghostIcon.style.left = `${newX}px`;
            ghostIcon.style.top = `${newY}px`;
        });
    };

    const handleDragEnd = (e) => {
        isDragging = false;
        if (wasDragged) {
            const dropX = e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
            const dropY = e.type === "touchend" ? e.changedTouches[0].clientY : e.clientY;

            ghostIcons.forEach((ghost) => (ghost.style.display = "none"));
            const dropTarget = document.elementFromPoint(dropX, dropY);
            ghostIcons.forEach((ghost) => (ghost.style.display = ""));

            let dropHandled = false;
            let destinationPath = null;

            const targetWindow = dropTarget ? dropTarget.closest(".window") : null;
            const targetIcon = dropTarget ? dropTarget.closest(".desktop-icon, .explorer-icon") : null;
            const targetDesktop = dropTarget ? dropTarget.closest(".desktop") : null;

            if (targetIcon && !iconManager.selectedIcons.has(targetIcon)) {
                const targetAppId = targetIcon.getAttribute("data-app-id");
                if (targetAppId === "recycle-bin") {
                    const fileIds = [...iconManager.selectedIcons].map((icon) => icon.getAttribute("data-file-id"));
                    if (deleteFile) {
                        deleteFile(fileIds);
                    }
                    dropHandled = true;
                } else {
                    const targetExplorerInstance = findExplorerInstanceByWindow(targetWindow);
                    if (targetExplorerInstance) {
                        const iconId = targetIcon.getAttribute("data-id");
                        const targetItem = targetExplorerInstance.currentFolderItems.find((item) => item.id === iconId);
                        if (targetItem && (targetItem.type === "folder" || targetItem.type === "drive")) {
                            if (targetItem.type === "drive") {
                                destinationPath = `/${iconId}`;
                            } else {
                                destinationPath = targetExplorerInstance.currentPath === "/" ? `/${targetItem.id}` : `${targetExplorerInstance.currentPath}/${targetItem.id}`;
                            }
                        }
                    }
                }
            } else if (targetWindow) {
                const explorerInstance = findExplorerInstanceByWindow(targetWindow);
                if (explorerInstance) {
                    destinationPath = explorerInstance.currentPath;
                }
            } else if (targetDesktop) {
                destinationPath = SPECIAL_FOLDER_PATHS.desktop;
            }

            if (destinationPath && !dropHandled) {
                const draggedItems = [...iconManager.selectedIcons]
                    .map((icon) => getItemFromIcon(icon))
                    .filter(Boolean);

                let isInvalidMove = false;
                const draggedFoldersData = draggedItems
                    .filter(item => item.type === 'folder')
                    .map(item => ({
                        ...item,
                        fullPath: item.path === '/' ? `/${item.id}` : `${item.path}/${item.id}`
                    }));

                for (const folder of draggedFoldersData) {
                    if (destinationPath === folder.fullPath || destinationPath.startsWith(`${folder.fullPath}/`)) {
                        isInvalidMove = true;
                        break;
                    }
                }

                if (isInvalidMove) {
                    ShowDialogWindow({
                        title: "Invalid Folder Move",
                        text: "Cannot move a folder into itself or a subdirectory.",
                        contentIconUrl: ICONS.error[32],
                    });
                } else {
                    const areAllFilesDraggable = draggedItems.every(item => !item.isStatic);
                    if (areAllFilesDraggable) {
                        pasteItems(destinationPath, draggedItems, "cut");
                        dropHandled = true;
                    }
                }
            }

            if (!dropHandled && icon.classList.contains('desktop-icon')) {
                const iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};
                ghostIcons.forEach((ghostIcon, originalSelectedIcon) => {
                    const id = originalSelectedIcon.getAttribute("data-icon-id");
                    const finalX = ghostIcon.style.left;
                    const finalY = ghostIcon.style.top;
                    iconPositions[id] = { x: finalX, y: finalY };
                    originalSelectedIcon.style.left = finalX;
                    originalSelectedIcon.style.top = finalY;
                });
                setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
            }
        }

        ghostIcons.forEach((ghost) => ghost.remove());
        ghostIcons.clear();
        dragOffsets.clear();

        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEndWrapper);
        document.removeEventListener("touchmove", handleDragMove);
        document.removeEventListener("touchend", handleDragEndWrapper);

        setTimeout(() => {
            wasDragged = false;
        }, 0);
    };

    icon.addEventListener("mousedown", handleDragStart);
    icon.addEventListener("touchstart", handleDragStart);
}
