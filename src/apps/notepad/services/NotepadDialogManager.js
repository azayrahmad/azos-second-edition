import { ShowDialogWindow } from '../../../components/DialogWindow.js';

export class NotepadDialogManager {
    constructor(app) {
        this.app = app;
    }

    showFindDialog() {
        const dialogContent = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label for="find-text" style="margin-right: 5px;">Find what:</label>
                <input type="text" id="find-text" value="${this.app.findState.term}" style="flex-grow: 1;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="checkbox-container">
                    <input type="checkbox" id="match-case" ${this.app.findState.caseSensitive ? 'checked' : ''}>
                    <label for="match-case">Match case</label>
                </div>
                <fieldset class="group-box" style="padding: 5px 10px;">
                    <legend>Direction</legend>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-up" value="up" ${this.app.findState.direction === 'up' ? 'checked' : ''}>
                        <label for="dir-up">Up</label>
                    </div>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-down" value="down" ${this.app.findState.direction === 'down' ? 'checked' : ''}>
                        <label for="dir-down">Down</label>
                    </div>
                </fieldset>
            </div>
        `;

        const dialog = ShowDialogWindow({
            title: 'Find',
            width: 380,
            height: 'auto',
            text: dialogContent,
            buttons: [
                {
                    label: 'Find Next',
                    action: (win) => {
                        const findInput = win.element.querySelector('#find-text');
                        const term = findInput.value;
                        if (!term) return false;

                        this.app.findState.term = term;
                        this.app.findState.caseSensitive = win.element.querySelector('#match-case').checked;
                        this.app.findState.direction = win.element.querySelector('input[name="direction"]:checked').value;

                        this.findNext();
                        return true;
                    },
                    isDefault: true,
                },
                { label: 'Cancel' }
            ],
            onclose: (win) => {
                const findInput = win.element.querySelector('#find-text');
                this.app.findState.term = findInput.value;
                this.app.findState.caseSensitive = win.element.querySelector('#match-case').checked;
                this.app.findState.direction = win.element.querySelector('input[name="direction"]:checked').value;
            }
        });
        setTimeout(() => dialog.element.querySelector('#find-text').focus().select(), 0);
    }

    findNext() {
        const { term, caseSensitive, direction } = this.app.findState;
        if (!term) {
            this.showFindDialog();
            return;
        }

        const editor = this.app.editor.codeInput;
        const text = editor.value;
        const searchTerm = caseSensitive ? term : term.toLowerCase();
        const textToSearch = caseSensitive ? text : text.toLowerCase();

        let index;
        if (direction === 'down') {
            index = textToSearch.indexOf(searchTerm, editor.selectionEnd);
            if (index === -1) index = textToSearch.indexOf(searchTerm);
        } else {
            index = textToSearch.lastIndexOf(searchTerm, editor.selectionStart - 1);
            if (index === -1) index = textToSearch.lastIndexOf(searchTerm);
        }

        if (index !== -1) {
            editor.focus();
            editor.setSelectionRange(index, index + term.length);
        } else {
            ShowDialogWindow({
                title: 'Notepad',
                text: `Cannot find "${term}"`,
                soundEvent: 'SystemHand',
                buttons: [{ label: 'OK', isDefault: true }],
            });
        }
    }
}
