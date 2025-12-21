import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./wordpad.css";

export class WordPadApp extends Application {
  constructor(config) {
    super(config);
    this.win = null;
    this.editor = null;
    this.colorPalette = null;
    this.fileHandle = null;
    this.isDirty = false;
    this.fileName = "Untitled";
    this.findState = {
      term: "",
      caseSensitive: false,
      direction: "down",
    };
  }

  _createWindow() {
    this.win = new $Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
    });

    const menuBar = this._createMenuBar();
    this.win.setMenuBar(menuBar);

    this.win.$content.append(`
            <div class="wordpad-container">
                <div class="wordpad-toolbar">
                    <div class="toolbar-group">
                        <button id="wordpad-new"><div class="toolbar-icon-1 icon-new"></div></button>
                        <button id="wordpad-open"><div class="toolbar-icon-1 icon-open"></div></button>
                        <button id="wordpad-save"><div class="toolbar-icon-1 icon-save"></div></button>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-print"><div class="toolbar-icon-1 icon-print"></div></button>
                        <button id="wordpad-print-preview" disabled><div class="toolbar-icon-1 icon-print-preview"></div></button>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-find"><div class="toolbar-icon-1 icon-find"></div></button>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-cut"><div class="toolbar-icon-1 icon-cut"></div></button>
                        <button id="wordpad-copy"><div class="toolbar-icon-1 icon-copy"></div></button>
                        <button id="wordpad-paste"><div class="toolbar-icon-1 icon-paste"></div></button>
                        <button id="wordpad-undo"><div class="toolbar-icon-1 icon-undo"></div></button>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-insert-date" disabled><div class="toolbar-icon-1 icon-insert-date"></div></button>
                    </div>
                </div>
                <div class="wordpad-toolbar">
                    <div class="toolbar-group">
                        <select id="wordpad-font-family">
                            <option selected>Times New Roman</option>
                            <option>Calisto MT</option>
                            <option>Fixedsys Excelsior</option>
                            <option>MSW98UI</option>
                            <option>OCR A Extended</option>
                            <option>Westminster</option>
                        </select>
                        <select id="wordpad-font-size">
                            <option>8</option>
                            <option>9</option>
                            <option>10</option>
                            <option>11</option>
                            <option>12</option>
                            <option>14</option>
                            <option>16</option>
                            <option>18</option>
                            <option>20</option>
                            <option>24</option>
                            <option>36</option>
                            <option>48</option>
                            <option>72</option>
                        </select>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-bold"><div class="toolbar-icon-2 icon-bold"></div></button>
                        <button id="wordpad-italic"><div class="toolbar-icon-2 icon-italic"></div></button>
                        <button id="wordpad-underline"><div class="toolbar-icon-2 icon-underline"></div></button>
                    </div>
                    <div class="toolbar-group">
                        <div class="wordpad-color-picker">
                            <button id="wordpad-color"><div class="toolbar-icon-2 icon-color"></div></button>
                        </div>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-align-left" class="toggle selected"><div class="toolbar-icon-2 icon-align-left"></div></button>
                        <button id="wordpad-align-center" class="toggle"><div class="toolbar-icon-2 icon-align-center"></div></button>
                        <button id="wordpad-align-right" class="toggle"><div class="toolbar-icon-2 icon-align-right"></div></button>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-bullets"><div class="toolbar-icon-2 icon-bullets"></div></button>
                    </div>
                </div>
                <div class="wordpad-editor inset-deep" contenteditable="true"></div>
                <div class="wordpad-statusbar status-bar">
                    <div class="wordpad-statusbar-panel status-bar-field">For Help, press F1</div>
                </div>
            </div>
        `);
    return this.win;
  }

  _createMenuBar() {
    return new MenuBar({
      "&File": [
        {
          label: "&New",
          shortcutLabel: "Ctrl+N",
          action: () => this.clearContent(),
        },
        {
          label: "&Open",
          shortcutLabel: "Ctrl+O",
          action: () => this.openFile(),
        },
        {
          label: "&Save",
          shortcutLabel: "Ctrl+S",
          action: () => this.saveFile(),
        },
        {
          label: "Save &As...",
          action: () => this.saveAs(),
        },
        "MENU_DIVIDER",
        {
          label: "E&xit",
          action: () => this.win.close(),
        },
      ],
      "&Edit": [],
      "&Search": [
        {
          label: "&Find...",
          shortcutLabel: "Ctrl+F",
          action: () => this.showFindDialog(),
        },
        {
          label: "Find &Next",
          shortcutLabel: "F3",
          action: () => this.findNext(),
          enabled: () => this.findState?.term,
        },
      ],
      "&View": [],
      "&Insert": [],
      "&Format": [],
      "&Help": [
        {
          label: "&About WordPad",
          action: () => alert("A simple rich text editor."),
        },
      ],
    });
  }

  _createColorPalette() {
    this.colorPalette = document.createElement("div");
    this.colorPalette.className = "wordpad-color-palette";
    this.colorPalette.style.display = "none";
    document.querySelector('.desktop').appendChild(this.colorPalette);
  }

  async _onLaunch(data) {
    this.win.on("close", () => {
      if (this.colorPalette && this.colorPalette.parentNode) {
        this.colorPalette.parentNode.removeChild(this.colorPalette);
      }
    });

    this.editor = this.win.$content.find(".wordpad-editor")[0];
    this._createColorPalette();
    this._setupToolbarListeners();
    this._populateColorPalette();
    this.updateTitle();

    this.editor.addEventListener("input", () => {
      this.isDirty = true;
      this.updateTitle();
    });

    const closeButton = this.win.element.querySelector(".window-close-button");
    if (closeButton) {
      const newCloseButton = closeButton.cloneNode(true);
      closeButton.parentNode.replaceChild(newCloseButton, closeButton);
      newCloseButton.addEventListener("click", () => {
        if (this.isDirty) {
          this.showUnsavedChangesDialogOnClose();
        } else {
          this.win.close(true); // Force close
        }
      });
    }

    this.editor.focus();
    document.execCommand("fontName", false, "Times New Roman");
    document.execCommand("fontSize", false, "2"); // Corresponds to 10pt
  }

  _setupToolbarListeners() {
    const editor = this.editor;
    const newButton = this.win.$content.find("#wordpad-new")[0];
    const openButton = this.win.$content.find("#wordpad-open")[0];
    const saveButton = this.win.$content.find("#wordpad-save")[0];
    const printButton = this.win.$content.find("#wordpad-print")[0];
    const findButton = this.win.$content.find("#wordpad-find")[0];
    const cutButton = this.win.$content.find("#wordpad-cut")[0];
    const copyButton = this.win.$content.find("#wordpad-copy")[0];
    const pasteButton = this.win.$content.find("#wordpad-paste")[0];
    const undoButton = this.win.$content.find("#wordpad-undo")[0];
    const fontFamily = this.win.$content.find("#wordpad-font-family")[0];
    const fontSize = this.win.$content.find("#wordpad-font-size")[0];
    const boldButton = this.win.$content.find("#wordpad-bold")[0];
    const italicButton = this.win.$content.find("#wordpad-italic")[0];
    const underlineButton = this.win.$content.find("#wordpad-underline")[0];
    const colorButton = this.win.$content.find("#wordpad-color")[0];
    const alignLeftButton = this.win.$content.find("#wordpad-align-left")[0];
    const alignCenterButton = this.win.$content.find(
      "#wordpad-align-center",
    )[0];
    const alignRightButton = this.win.$content.find("#wordpad-align-right")[0];
    const bulletsButton = this.win.$content.find("#wordpad-bullets")[0];

    newButton.addEventListener("click", () => this.clearContent());
    openButton.addEventListener("click", () => this.openFile());
    saveButton.addEventListener("click", () => this.saveFile());

    findButton.addEventListener("click", () => this.showFindDialog());

    printButton.addEventListener("click", () => {
      this._printDocument();
    });

    cutButton.addEventListener("click", () => {
      document.execCommand("cut");
      editor.focus();
    });

    copyButton.addEventListener("click", () => {
      document.execCommand("copy");
      editor.focus();
    });

    pasteButton.addEventListener("click", () => {
      document.execCommand("paste");
      editor.focus();
    });

    undoButton.addEventListener("click", () => {
      document.execCommand("undo");
      editor.focus();
    });

    fontFamily.addEventListener("change", () => {
      document.execCommand("fontName", false, fontFamily.value);
      editor.focus();
    });

    fontSize.addEventListener("change", () => {
      const sizeMap = {
        8: 1,
        9: 2,
        10: 2,
        11: 3,
        12: 3,
        14: 4,
        16: 5,
        18: 5,
        20: 6,
        24: 6,
        36: 7,
        48: 7,
        72: 7,
      };
      const size = sizeMap[fontSize.value] || 2; // Default to 10pt
      document.execCommand("fontSize", false, size);
      editor.focus();
    });

    boldButton.addEventListener("click", () => {
      document.execCommand("bold");
      editor.focus();
    });

    italicButton.addEventListener("click", () => {
      document.execCommand("italic");
      editor.focus();
    });

    underlineButton.addEventListener("click", () => {
      document.execCommand("underline");
      editor.focus();
    });

    colorButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = this.colorPalette.style.display === "none";
      if (isHidden) {
        // Temporarily display the palette to measure its dimensions
        this.colorPalette.style.visibility = "hidden";
        this.colorPalette.style.display = "grid";

        const paletteWidth = this.colorPalette.offsetWidth;
        const buttonRect = colorButton.getBoundingClientRect();
        const desktopRect = document.querySelector('.desktop').getBoundingClientRect();

        let top = buttonRect.bottom - desktopRect.top;
        let left = buttonRect.left - desktopRect.left;

        // Adjust position if it overflows the right edge of the desktop
        if (left + paletteWidth > desktopRect.width) {
          left = desktopRect.width - paletteWidth - 5; // Add a 5px buffer
        }

        // Set the final position and make it visible
        this.colorPalette.style.top = `${top}px`;
        this.colorPalette.style.left = `${left}px`;
        this.colorPalette.style.visibility = "visible";
      } else {
        this.colorPalette.style.display = "none";
      }
    });

    document.addEventListener("click", (e) => {
      if (!this.colorPalette.contains(e.target) && e.target !== colorButton) {
        this.colorPalette.style.display = "none";
      }
    });

    alignLeftButton.addEventListener("click", () => {
      document.execCommand("justifyLeft");
      alignLeftButton.classList.add("selected");
      alignCenterButton.classList.remove("selected");
      alignRightButton.classList.remove("selected");
      editor.focus();
      updateToolbar();
    });

    alignCenterButton.addEventListener("click", () => {
      document.execCommand("justifyCenter");
      alignCenterButton.classList.add("selected");
      alignLeftButton.classList.remove("selected");
      alignRightButton.classList.remove("selected");
      editor.focus();
      updateToolbar();
    });

    alignRightButton.addEventListener("click", () => {
      document.execCommand("justifyRight");
      alignRightButton.classList.add("selected");
      alignCenterButton.classList.remove("selected");
      alignLeftButton.classList.remove("selected");
      editor.focus();
      updateToolbar();
    });

    bulletsButton.addEventListener("click", () => {
      document.execCommand("insertUnorderedList");
      editor.focus();
      updateToolbar();
    });

    const updateToolbar = () => {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const currentFont = document
        .queryCommandValue("fontName")
        .replace(/['"]/g, "");

      boldButton.classList.toggle("active", isBold);
      italicButton.classList.toggle("active", isItalic);
      underlineButton.classList.toggle("active", isUnderline);

      alignLeftButton.classList.toggle(
        "active",
        document.queryCommandState("justifyLeft"),
      );
      alignCenterButton.classList.toggle(
        "active",
        document.queryCommandState("justifyCenter"),
      );
      alignRightButton.classList.toggle(
        "active",
        document.queryCommandState("justifyRight"),
      );
      bulletsButton.classList.toggle(
        "active",
        document.queryCommandState("insertUnorderedList"),
      );

      if (currentFont) {
        fontFamily.value = currentFont;
      }
    };

    editor.addEventListener("keyup", updateToolbar);
    editor.addEventListener("mouseup", updateToolbar);
    editor.addEventListener("focus", updateToolbar);
  }

  _populateColorPalette() {
    const colors = [
      { name: "Black", value: "#000000" },
      { name: "Maroon", value: "#800000" },
      { name: "Green", value: "#008000" },
      { name: "Olive", value: "#808000" },
      { name: "Navy", value: "#000080" },
      { name: "Purple", value: "#800080" },
      { name: "Teal", value: "#008080" },
      { name: "Gray", value: "#808080" },
      { name: "Silver", value: "#C0C0C0" },
      { name: "Red", value: "#FF0000" },
      { name: "Lime", value: "#00FF00" },
      { name: "Yellow", value: "#FFFF00" },
      { name: "Blue", value: "#0000FF" },
      { name: "Fuchsia", value: "#FF00FF" },
      { name: "Aqua", value: "#00FFFF" },
      { name: "White", value: "#FFFFFF" },
    ];

    let paletteHTML = "";
    colors.forEach((color) => {
      paletteHTML += `
                <div class="color-swatch" data-color="${color.value}" style="background-color: ${color.value};"></div>
                <div class="color-label" data-color="${color.value}">${color.name}</div>
            `;
    });
    paletteHTML += `
            <div class="color-swatch" data-color="#000000" style="background-color: #000000; border: 1px solid white;"></div>
            <div class="color-label" data-color="#000000">Automatic</div>
        `;
    this.colorPalette.innerHTML = paletteHTML;

    this.colorPalette.addEventListener("click", (e) => {
      if (e.target.dataset.color) {
        document.execCommand("foreColor", false, e.target.dataset.color);
        this.colorPalette.style.display = "none";
        this.editor.focus();
      }
    });
  }

  updateTitle() {
    const dirtyIndicator = this.isDirty ? "*" : "";
    this.win.title(`${dirtyIndicator}${this.fileName} - WordPad`);
  }

  async clearContent() {
    if ((await this.checkForUnsavedChanges()) === "cancel") return;
    this.editor.innerHTML = "";
    this.fileName = "Untitled";
    this.fileHandle = null;
    this.isDirty = false;
    this.updateTitle();
    this.findState = {
      term: "",
      caseSensitive: false,
      direction: "down",
    };
  }

  async openFile() {
    if ((await this.checkForUnsavedChanges()) === "cancel") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.fileName = file.name;
      this.fileHandle = null;
      this.isDirty = false;
      this.updateTitle();

      const reader = new FileReader();
      reader.onload = (event) => {
        this.editor.innerHTML = event.target.result;
        this.isDirty = false;
        this.updateTitle();
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async saveFile() {
    if (this.fileHandle) {
      try {
        await this.writeFile(this.fileHandle);
        this.isDirty = false;
        this.updateTitle();
      } catch (err) {
        console.error("Error saving file:", err);
      }
    } else {
      await this.saveAs();
    }
  }

  async saveAs() {
    const fileTypes = [
      { description: "HTML Document", accept: { "text/html": [".html"] } },
    ];

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          types: fileTypes,
          suggestedName: "Untitled.html",
        });
        this.fileHandle = handle;
        this.fileName = handle.name;
        await this.writeFile(handle);
        this.isDirty = false;
        this.updateTitle();
      } catch (err) {
        if (err.name !== "AbortError") console.error("Error saving file:", err);
      }
    } else {
      // Fallback for older browsers
      const content = this.editor.innerHTML;
      const blob = new Blob([content], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = this.fileName.endsWith(".html")
        ? this.fileName
        : "Untitled.html";
      a.click();
      URL.revokeObjectURL(a.href);
      this.isDirty = false;
      this.fileName = a.download;
      this.updateTitle();
    }
  }

  async writeFile(fileHandle) {
    const writable = await fileHandle.createWritable();
    const content = this.editor.innerHTML;
    await writable.write(content);
    await writable.close();
  }

  showUnsavedChangesDialog(options = {}) {
    return ShowDialogWindow({
      title: "WordPad",
      text: `<div style="white-space: pre-wrap">The text in the ${this.fileName} file has changed.\n\nDo you want to save the changes?</div>`,
      contentIconUrl: new URL(
        "../../assets/icons/msg_warning-0.png",
        import.meta.url,
      ).href,
      modal: true,
      soundEvent: "SystemQuestion",
      buttons: options.buttons || [],
    });
  }

  showUnsavedChangesDialogOnClose() {
    this.showUnsavedChangesDialog({
      buttons: [
        {
          label: "Yes",
          action: async () => {
            await this.saveFile();
            if (!this.isDirty) this.win.close(true);
            else return false;
          },
          isDefault: true,
        },
        { label: "No", action: () => this.win.close(true) },
        { label: "Cancel" },
      ],
    });
  }

  async checkForUnsavedChanges() {
    if (!this.isDirty) return "continue";
    return new Promise((resolve) => {
      this.showUnsavedChangesDialog({
        buttons: [
          {
            label: "Yes",
            action: async () => {
              await this.saveFile();
              resolve(!this.isDirty ? "continue" : "cancel");
            },
            isDefault: true,
          },
          { label: "No", action: () => resolve("continue") },
          { label: "Cancel", action: () => resolve("cancel") },
        ],
      });
    });
  }

  _printDocument() {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(
      "<!DOCTYPE html><html><head><title>Print</title></head><body>" +
        this.editor.innerHTML +
        "</body></html>",
    );
    frameDoc.close();

    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    // Clean up the iframe after printing
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  }

  showFindDialog() {
    const dialogContent = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label for="find-text" style="margin-right: 5px;">Find what:</label>
                <input type="text" id="find-text" value="${this.findState.term}" style="flex-grow: 1;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="checkbox-container">
                    <input type="checkbox" id="match-case" ${this.findState.caseSensitive ? "checked" : ""}>
                    <label for="match-case">Match case</label>
                </div>
                <fieldset class="group-box" style="padding: 5px 10px;">
                    <legend>Direction</legend>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-up" value="up" ${this.findState.direction === "up" ? "checked" : ""}>
                        <label for="dir-up">Up</label>
                    </div>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-down" value="down" ${this.findState.direction === "down" ? "checked" : ""}>
                        <label for="dir-down">Down</label>
                    </div>
                </fieldset>
            </div>
        `;

    const dialog = ShowDialogWindow({
      title: "Find",
      width: 380,
      height: "auto",
      text: dialogContent,
      buttons: [
        {
          label: "Find Next",
          action: (win) => {
            const findInput = win.element.querySelector("#find-text");
            const term = findInput.value;
            if (!term) return false;

            this.findState.term = term;
            this.findState.caseSensitive =
              win.element.querySelector("#match-case").checked;
            this.findState.direction = win.element.querySelector(
              'input[name="direction"]:checked',
            ).value;

            this.findNext();
            return true;
          },
          isDefault: true,
        },
        { label: "Cancel" },
      ],
      onclose: (win) => {
        const findInput = win.element.querySelector("#find-text");
        this.findState.term = findInput.value;
        this.findState.caseSensitive =
          win.element.querySelector("#match-case").checked;
        this.findState.direction = win.element.querySelector(
          'input[name="direction"]:checked',
        ).value;
      },
    });
    setTimeout(
      () => dialog.element.querySelector("#find-text").focus().select(),
      0,
    );
  }

  findNext() {
    const { term, caseSensitive, direction } = this.findState;
    if (!term) {
      this.showFindDialog();
      return;
    }

    this.editor.focus();

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (direction === "down") {
        range.collapse(false);
      } else {
        range.collapse(true);
      }
    }

    const found = window.find(
      term,
      caseSensitive,
      direction === "up",
      false,
      false,
      false,
      false,
    );

    if (!found) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(this.editor);
      range.collapse(direction !== "up");
      selection.addRange(range);

      const wrappedFound = window.find(
        term,
        caseSensitive,
        direction === "up",
        false,
        false,
        false,
        false,
      );

      if (!wrappedFound) {
        ShowDialogWindow({
          title: "WordPad",
          text: `Cannot find "${term}"`,
          soundEvent: "SystemHand",
          buttons: [{ label: "OK", isDefault: true }],
        });
      }
    }
  }
}
