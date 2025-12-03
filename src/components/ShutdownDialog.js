import { ICONS } from '../config/icons.js';

function createShutdownDialogContent() {
    const container = document.createElement('div');
    container.className = 'shutdown-dialog-content';

    const icon = document.createElement('img');
    icon.src = ICONS.shutdown[32]; // Placeholder icon
    icon.className = 'shutdown-dialog-icon';
    icon.width = 32;
    icon.height = 32;
    container.appendChild(icon);

    const textAndOptions = document.createElement('div');
    textAndOptions.className = 'shutdown-dialog-main';

    const text = document.createElement('p');
    text.textContent = 'What do you want the computer to do?';
    textAndOptions.appendChild(text);

    const options = [
        { id: 'standby', label: 'Stand by', checked: true },
        { id: 'shutdown', label: 'Shut down', checked: false },
        { id: 'restart', label: 'Restart', checked: false },
        { id: 'restart-msdos', label: 'Restart in MS-DOS mode', checked: false }
    ];

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'shutdown-dialog-options';

    options.forEach(opt => {
        const fieldRow = document.createElement('div');
        fieldRow.className = 'field-row';

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = opt.id;
        input.name = 'shutdown-option';
        input.value = opt.id;
        input.checked = opt.checked;

        const label = document.createElement('label');
        label.htmlFor = opt.id;
        label.innerHTML = `<u>${opt.label.charAt(0)}</u>${opt.label.substring(1)}`;

        fieldRow.appendChild(input);
        fieldRow.appendChild(label);
        optionsContainer.appendChild(fieldRow);
    });

    textAndOptions.appendChild(optionsContainer);
    container.appendChild(textAndOptions);

    return container;
}

export { createShutdownDialogContent };
