import { languages } from '../../../config/languages.js';
import { HIGHLIGHT_JS_THEMES } from '../../../config/highlight-js-themes.js';

export const notepadMenuConfig = (app) => ({
    "&File": [
        {
            label: "&New",
            shortcutLabel: "Ctrl+N",
            action: () => app.clearContent(),
        },
        {
            label: "&Open",
            shortcutLabel: "Ctrl+O",
            action: () => app.openFile(),
        },
        {
            label: "&Save",
            shortcutLabel: "Ctrl+S",
            action: () => app.saveFile(),
        },
        {
            label: "Save &As...",
            action: () => app.saveAs(),
        },
        "MENU_DIVIDER",
        {
            label: "E&xit",
            action: () => app.win.close(),
        },
    ],
    "&Edit": [
        {
            label: "&Undo",
            shortcutLabel: "Ctrl+Z",
            action: () => document.execCommand("undo"),
        },
        "MENU_DIVIDER",
        {
            label: "Cu&t",
            shortcutLabel: "Ctrl+X",
            action: () => document.execCommand("cut"),
        },
        {
            label: "&Copy",
            shortcutLabel: "Ctrl+C",
            action: () => app.copyFormattedCode(),
        },
        {
            label: "&Paste",
            shortcutLabel: "Ctrl+V",
            action: () => app.pasteText(),
        },
        {
            label: "De&lete",
            shortcutLabel: "Del",
            action: () => document.execCommand("delete"),
        },
        "MENU_DIVIDER",
        {
            label: "Select &All",
            shortcutLabel: "Ctrl+A",
            action: () => app.editor.codeInput.select(),
        },
        "MENU_DIVIDER",
        {
            label: "&Word Wrap",
            checkbox: {
                check: () => app.editor.wordWrap,
                toggle: () => app.toggleWordWrap(),
            },
        },
    ],
    "&Search": [
        {
            label: "&Find...",
            shortcutLabel: "Ctrl+F",
            action: () => app.showFindDialog(),
        },
        {
            label: "Find &Next",
            shortcutLabel: "F3",
            action: () => app.findNext(),
            enabled: () => app.findState?.term,
        },
    ],
    "&Code": [
        {
            label: "&Language",
            submenu: [
                {
                    radioItems: languages.map(lang => ({ label: lang.name, value: lang.id })),
                    getValue: () => app.editor.currentLanguage,
                    setValue: (value) => app.setLanguage(value),
                },
            ]
        },
        {
            label: "&Theme",
            submenu: [
                {
                    radioItems: HIGHLIGHT_JS_THEMES.map(theme => ({ label: theme, value: theme })),
                    getValue: () => app.currentTheme,
                    setValue: (value) => app.setTheme(value),
                },
            ]
        },
        {
            label: "HTML/Markdown Preview",
            action: () => app.previewMarkdown(),
        },
        "MENU_DIVIDER",
        {
            label: "&Format",
            shortcutLabel: "Ctrl+Shift+F",
            action: () => app.formatCode(),
        },
    ],
    "&Help": [
        {
            label: "&About Notepad",
            action: () => alert("A simple text editor."),
        },
    ],
});
