import { playSound } from '../utils/soundManager.js';

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
 * @property {string} [soundEvent] - The name of the sound event to play.
 * @property {boolean} [modal=false] - Whether the dialog should be modal.
 * @property {'right' | 'bottom'} [buttonLayout='bottom'] - The layout of the buttons.
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
        content,
        buttons = [{ label: 'OK', action: () => { }, isDefault: true }],
        soundEvent,
        modal = false,
        buttonLayout = 'bottom',
    } = options;

    const winOptions = {
        toolWindow: false,
        resizable: false,
        minimizeButton: false,
        maximizeButton: false,
        width: 400,
        height: 'auto',
        buttonLayout: buttonLayout,
    };

    if (titleIconUrl) {
        const icon = document.createElement('img');
        icon.src = titleIconUrl;
        icon.width = 16;
        icon.height = 16;
        winOptions.icons = { any: icon };
    }

    const win = new $FormWindow(title || 'Dialog', winOptions);

    // Create dialog content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'dialog-content';

    if (content) {
        contentContainer.appendChild(content);
    } else {
        if (contentIconUrl) {
            const icon = document.createElement('img');
            icon.src = contentIconUrl;
            icon.className = 'dialog-content-icon';
            icon.width = 32;
            icon.height = 32;
            contentContainer.appendChild(icon);
        }

        const textEl = document.createElement('div');
        textEl.className = 'dialog-content-text';
        textEl.innerHTML = text;
        contentContainer.appendChild(textEl);
    }

    win.$main.append(contentContainer);

    // Create buttons
    buttons.forEach(btnDef => {
        const button = win.$Button(btnDef.label, async () => {
            if (btnDef.action) {
                const result = await btnDef.action(win);
                if (result === false) {
                    return false; // Prevent closing
                }
            }
        });

        if (btnDef.isDefault) {
            button.addClass('default');
        }
        if (btnDef.disabled) {
            button.prop('disabled', true);
        }
    });

    win.center();

    // Handle modality
    let modalOverlay = null;
    if (modal) {
        const screen = document.getElementById('screen');
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        win.css('z-index', $Window.Z_INDEX + 1);
        modalOverlay.style.zIndex = $Window.Z_INDEX;
        $Window.Z_INDEX += 2;
        screen.appendChild(modalOverlay);
        win.onClosed(() => {
            screen.removeChild(modalOverlay);
        });
    }

    if (soundEvent) {
        playSound(soundEvent);
    }

    setTimeout(() => {
        const contentHeight = win.$content.get(0).scrollHeight;
        const frameHeight = win.outerHeight() - win.$content.innerHeight();
        win.outerHeight(contentHeight + frameHeight);
        win.center();
    }, 0);

    win.focus();
    return win;
}

function ShowComingSoonDialog(title) {
    ShowDialogWindow({
        title: title,
        text: 'Coming soon.',
        modal: true,
    });
}

export { ShowDialogWindow, ShowComingSoonDialog };
