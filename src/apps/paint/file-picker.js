// src/apps/paint/file-picker.js
import directory from '../../config/directory.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import { findItemByPath } from '../../utils/directory.js';
import { ICONS } from '../../config/icons.js';
import { getAssociation } from '../../utils/directory.js';
import { getItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';

// Inject CSS
if (!document.getElementById('file-picker-styles')) {
    const link = document.createElement('link');
    link.id = 'file-picker-styles';
    link.rel = 'stylesheet';
    link.href = new URL('./file-picker.css', import.meta.url).href;
    document.head.appendChild(link);
}

function getIconForItem(item) {
    if (item.type === 'drive') return ICONS.drive[16];
    if (item.type === 'folder') return ICONS.folderClosed[16];
    if (item.type === 'file') {
        return getAssociation(item.name).icon[16];
    }
    return ICONS.file[16]; // Default
}

export function showOpenFilePicker() {
    return new Promise((resolve) => {
        let currentPath = '/';
        let selectedFile = null;

        const container = document.createElement('div');
        container.className = 'file-picker';

        const list = document.createElement('div');
        list.className = 'file-picker-list';

        const footer = document.createElement('div');
        footer.className = 'file-picker-footer';
        footer.innerHTML = `
            <label for="file-picker-filename">File name:</label>
            <input type="text" id="file-picker-filename" class="sunken-panel" />
        `;

        const filenameInput = footer.querySelector('#file-picker-filename');
        container.append(list, footer);

        const renderItems = (path) => {
            currentPath = path;
            list.innerHTML = '';
            selectedFile = null;
            filenameInput.value = '';

            const folder = findItemByPath(path);
            let children = folder.children || [];

            // Add user-dropped files if they exist in this path
            const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
            const droppedFilesInThisFolder = allDroppedFiles.filter(file => file.path === path);
            children = [...children, ...droppedFilesInThisFolder];

            // Add "Up" navigation
            if (path !== '/') {
                const upItem = document.createElement('div');
                upItem.className = 'file-picker-item';
                upItem.innerHTML = `<img src="${ICONS.folderUp[16]}" /> ..`;
                upItem.addEventListener('dblclick', () => {
                    const parts = path.split('/').filter(Boolean);
                    parts.pop();
                    renderItems('/' + parts.join('/'));
                });
                list.appendChild(upItem);
            }

            children.forEach(item => {
                if (item.type !== 'file' && item.type !== 'folder' && item.type !== 'drive') return;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'file-picker-item';
                itemDiv.innerHTML = `<img src="${getIconForItem(item)}" /> ${item.name}`;
                itemDiv.dataset.id = item.id;
                itemDiv.dataset.path = path;

                if (item.type === 'folder' || item.type === 'drive') {
                    itemDiv.addEventListener('dblclick', () => {
                        const newPath = path === '/' ? `/${item.id}` : `${path}/${item.id}`;
                        renderItems(newPath);
                    });
                } else { // It's a file
                    itemDiv.addEventListener('click', () => {
                        if (selectedFile) {
                            selectedFile.classList.remove('selected');
                        }
                        itemDiv.classList.add('selected');
                        selectedFile = itemDiv;
                        filenameInput.value = item.name;
                    });
                     itemDiv.addEventListener('dblclick', () => {
                        filenameInput.value = item.name;
                        handleOpen();
                    });
                }
                list.appendChild(itemDiv);
            });
        };

        const handleOpen = async () => {
            if (!selectedFile) return;
            const fileId = selectedFile.dataset.id;
            const filePath = selectedFile.dataset.path;

            dialog.close();
            resolve({
                handle: {
                    path: filePath,
                    name: filenameInput.value,
                    id: fileId,
                }
            });
        };

        const dialog = ShowDialogWindow({
            title: 'Open',
            content: container,
            width: 400,
            height: 350,
            buttons: [
                { label: 'Open', isDefault: true, action: handleOpen },
                { label: 'Cancel', action: () => resolve(null) }
            ]
        });

        renderItems('/');
    });
}

export function showSaveFilePicker({ getBlob, defaultFileName }) {
     return new Promise((resolve) => {
        let currentPath = '/';
        let selectedFile = null;

        const container = document.createElement('div');
        container.className = 'file-picker';

        const list = document.createElement('div');
        list.className = 'file-picker-list';

        const footer = document.createElement('div');
        footer.className = 'file-picker-footer';
        footer.innerHTML = `
            <label for="file-picker-filename">File name:</label>
            <input type="text" id="file-picker-filename" class="sunken-panel" value="${defaultFileName || 'Untitled.png'}"/>
        `;

        const filenameInput = footer.querySelector('#file-picker-filename');
        container.append(list, footer);

        const renderItems = (path) => {
            currentPath = path;
            list.innerHTML = '';

            const folder = findItemByPath(path);
            let children = folder.children || [];

            // Add user-dropped files if they exist in this path
            const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
            const droppedFilesInThisFolder = allDroppedFiles.filter(file => file.path === path);
            children = [...children, ...droppedFilesInThisFolder];

            if (path !== '/') {
                const upItem = document.createElement('div');
                upItem.className = 'file-picker-item';
                upItem.innerHTML = `<img src="${ICONS.folderUp[16]}" /> ..`;
                upItem.addEventListener('dblclick', () => {
                    const parts = path.split('/').filter(Boolean);
                    parts.pop();
                    renderItems('/' + parts.join('/'));
                });
                list.appendChild(upItem);
            }

            children.forEach(item => {
                if (item.type !== 'file' && item.type !== 'folder' && item.type !== 'drive') return;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'file-picker-item';
                itemDiv.innerHTML = `<img src="${getIconForItem(item)}" /> ${item.name}`;
                itemDiv.dataset.id = item.id;

                if (item.type === 'folder' || item.type === 'drive') {
                    itemDiv.addEventListener('dblclick', () => {
                        const newPath = path === '/' ? `/${item.id}` : `${path}/${item.id}`;
                        renderItems(newPath);
                    });
                } else {
                     itemDiv.addEventListener('click', () => {
                        filenameInput.value = item.name;
                    });
                }
                list.appendChild(itemDiv);
            });
        };

        const handleSave = async () => {
            const fileName = filenameInput.value;
            if (!fileName) {
                alert('Please enter a file name.');
                return;
            }

            const formatID = fileName.endsWith('.png') ? 'image/png' : 'image/bmp';

            try {
                const blob = await getBlob(formatID);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Content = reader.result.split(',')[1];
                    const newFile = {
                        id: `file-${Date.now()}`,
                        name: fileName,
                        type: 'file',
                        content: base64Content,
                        path: currentPath,
                    };

                    const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
                    allDroppedFiles.push(newFile);
                    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, allDroppedFiles);

                    document.dispatchEvent(new CustomEvent('explorer-refresh'));

                    dialog.close();
                    resolve({
                        newFileHandle: { path: currentPath, name: fileName, id: newFile.id },
                        newBlob: blob,
                    });
                };
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error('Error saving file:', error);
                alert('Could not save the file.');
                resolve(null);
            }
        };

        const dialog = ShowDialogWindow({
            title: 'Save As',
            content: container,
            width: 400,
            height: 350,
            buttons: [
                { label: 'Save', isDefault: true, action: handleSave },
                { label: 'Cancel', action: () => resolve(null) }
            ]
        });

        renderItems('/drive-c/user/Documents'); // Default to a reasonable save location
    });
}
