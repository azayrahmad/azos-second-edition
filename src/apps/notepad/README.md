# Notepad App

## Summary

Notepad is a versatile text editor designed for azOS Second Edition. It goes beyond simple text editing, offering a range of developer-centric features including syntax highlighting, code formatting, and Markdown preview. It serves as a powerful tool for both casual note-taking and serious coding tasks.

## Features

- **Advanced Text Editing**: A core text area for input, synchronized with a live-rendering pane for a what-you-see-is-what-you-get experience.
- **File System Integration**: Full support for file operations:
    - **New**: Clears the editor to start a new file, prompting to save any unsaved changes.
    - **Open**: Opens files from the local system using a file picker.
    - **Save & Save As**: Saves the current file. It uses the modern File System Access API (`showSaveFilePicker`) for a native OS experience when available, with a fallback to traditional downloads for broader compatibility.
- **Unsaved Changes Protection**: Automatically detects unsaved changes and prompts the user to save before closing the application or opening a new file.
- **Syntax Highlighting**: Powered by `highlight.js`, the editor automatically applies syntax highlighting based on the file's extension. The supported languages are configured in `src/config/languages.js`.
- **Code Formatting**: Integrates the `Prettier` code formatter. Users can format their code with a single click, supporting various languages like JavaScript, HTML, and CSS.
- **Markdown Preview**: Includes a built-in Markdown renderer. Users can write in Markdown and preview the formatted HTML output in a separate window.
- **Copy with Formatting**: Allows users to copy the text along with its syntax highlighting (as rich HTML), perfect for pasting into documents or presentations.
- **Dynamic Window Title**: The window title updates to show the current file name and an asterisk (`*`) to indicate unsaved changes.
- **Status Bar**: Provides at-a-glance information, including the current editor status (e.g., "Ready", "File Saved") and the total line count of the document.
- **Language-Aware**: Automatically detects the language from the file extension and applies the correct syntax highlighting. The language can also be changed manually through the menu.

## Technical Details

- **Architecture**: The editor is built as a class (`Notepad`) that encapsulates all its logic. It is instantiated by the `appManager` when a new Notepad window is created.
- **UI Components**:
    - The editor uses a `<textarea>` for raw text input and a `<pre><code>` block to display the `highlight.js`-powered highlighted version. The scroll positions of these two elements are kept in sync.
    - The UI is styled with a dedicated `notepad.css` file.
    - Dialog windows are created using the `ShowDialogWindow` utility for a consistent look and feel.
- **Event-Driven**: The editor listens for events emitted from the window's menu bar (e.g., 'save', 'open', 'format') to trigger its core functionalities.
- **Dependencies**:
    - `highlight.js`: For syntax highlighting.
    - `Prettier`: For code formatting.
    - `marked.js`: For Markdown to HTML conversion.
    - `os-gui`: For the main window component.
    - `DialogWindow`: For modal dialogs.