import sounds from '../config/sounds.js';

/**
 * @typedef {object} DialogButton
 * @property {string} label - The text to display on the button.
 * @property {() => void} action - The function to call when the button is clicked.
 * @property {boolean} [isDefault] - Whether this button is the default action.
 */

/**
 * @typedef {object} DialogOptions
 * @property {string} title - The title of the dialog window.
 * @property {string} [titleIconUrl] - Optional URL for an icon in the title bar.
 * @property {string} [contentIconUrl] - Optional URL for an icon in the content area.
 * @property {string} text - The main text content of the dialog.
 * @property {DialogButton[]} [buttons] - The buttons to display in the dialog.
 * @property {string} [soundId] - The ID of a sound to play from the sound config.
 * @property {boolean} [modal=false] - Whether the dialog should be modal.
 */

/**
 * Creates and shows a dialog window.
 * @param {DialogOptions} options
 */
function ShowDialogWindow(options) {
    const {
        title,
        titleIconUrl,
        contentIconUrl,
        text,
        buttons = [{ label: 'OK', action: () => { }, isDefault: true }],
        soundId,
        modal = false,
    } = options;

    const winOptions = {
        title: title || 'Dialog',
        toolWindow: false,
        resizable: false,
        minimizeButton: false,
        maximizeButton: false,
        width: 400,
        height: 'auto',
    };

    if (titleIconUrl) {
        const icon = document.createElement('img');
        icon.src = titleIconUrl;
        icon.width = 16;
        icon.height = 16;
        winOptions.icons = { any: icon };
    }

    const win = new $Window(winOptions);

    // Create dialog content
    const content = document.createElement('div');
    content.className = 'dialog-content';

    if (contentIconUrl) {
        const icon = document.createElement('img');
        icon.src = contentIconUrl;
        icon.className = 'dialog-content-icon';
        icon.width = 32;
        icon.height = 32;
        content.appendChild(icon);
    }

    const textEl = document.createElement('div');
    textEl.className = 'dialog-content-text';
    textEl.textContent = text;
    content.appendChild(textEl);

    // Create buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';

    buttons.forEach(btnDef => {
        const button = document.createElement('button');
        button.textContent = btnDef.label;
        button.onclick = () => {
            if (btnDef.action) {
                btnDef.action();
            }
            win.close();
        };
        if (btnDef.isDefault) {
            button.classList.add('default');
        }
        buttonContainer.appendChild(button);
    });

    win.$content.append(content, buttonContainer);
    win.center();

    // Handle modality
    let modalOverlay = null;
    if (modal) {
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        document.body.appendChild(modalOverlay);
        win.onClosed(() => {
            document.body.removeChild(modalOverlay);
        });
    }

    // Play sound
    if (soundId && sounds[soundId]) {
        const audio = new Audio(sounds[soundId]);
        audio.play().catch(e => console.error("Error playing sound:", e));
    }

    // Auto-height adjustment
    // The content needs to be rendered to get the correct height.
    setTimeout(() => {
        const contentHeight = content.offsetHeight + buttonContainer.offsetHeight;
        const frameHeight = win.outerHeight() - win.$content.innerHeight();
        win.outerHeight(contentHeight + frameHeight); // Add some padding
        win.center(); // Recenter after resizing
    }, 0);

    win.focus();
}

export { ShowDialogWindow };