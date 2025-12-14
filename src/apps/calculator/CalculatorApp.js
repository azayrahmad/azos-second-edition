// CalculatorApp.js - Main logic for the calculator application
import { Application } from "../Application.js";
import { CalculatorLogic } from "./calculator-logic.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./calculator.css";

export class CalculatorApp extends Application {
  constructor(config) {
    super(config);
    this.win = null;
    this.logic = new CalculatorLogic();
    this.mode = "standard"; // 'standard' or 'scientific'
  }

  _createWindow() {
    this.win = new $Window({
      id: this.id,
      title: this.title,
      outerWidth: 260, // Initial width for standard mode
      outerHeight: 250, // Initial height for standard mode
      resizable: false, // Window is not resizable
      icons: this.icon,
      maximizable: false, // Disable maximize button based on reference image
    });

    const menuBar = this._createMenuBar();
    this.win.setMenuBar(menuBar);

    this.win.$content.html(`
            <div class="calculator-container">
                <div class="calculator-display-container">
                    <div class="calculator-display inset-deep">0.</div>
                </div>
                <div class="calculator-buttons"></div>
            </div>
        `);

    this._renderButtons();
    this._updateDisplay();

    return this.win;
  }

  _createMenuBar() {
    return new MenuBar({
      "&Edit": [
        {
          label: "&Copy",
          shortcutLabel: "Ctrl+C",
          action: () => this._copyToClipboard(),
        },
        {
          label: "&Paste",
          shortcutLabel: "Ctrl+V",
          action: () => this._pasteFromClipboard(),
        },
      ],
      "&View": [
        {
          radioItems: [
            { label: "&Standard", value: "standard" },
            { label: "Sc&ientific", value: "scientific" },
          ],
          getValue: () => this.mode,
          setValue: (value) => this._setMode(value),
        },
      ],
      "&Help": [
        {
          label: "&About Calculator",
          action: () => this._showAboutDialog(),
        },
      ],
    });
  }

  _setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    if (this.mode === "scientific") {
      this.win.setDimensions({ outerWidth: 480, outerHeight: 310 });
    } else {
      this.win.setDimensions({ outerWidth: 260, outerHeight: 250 });
    }
    this._renderButtons();
    this.win.element
      .querySelector(".menus")
      .dispatchEvent(new CustomEvent("update"));
  }

  _renderButtons() {
    const buttonsContainer = this.win.$content.find(".calculator-buttons")[0];
    const existingControls = this.win.$content.find(".scientific-controls")[0];
    if (existingControls) {
      existingControls.remove();
    }

    const layout =
      this.mode === "standard"
        ? this._getStandardLayout()
        : this._getScientificLayout();

    if (this.mode === "scientific") {
      this._renderScientificControls();
    }

    let buttonsHTML = "";
    if (this.mode === "standard") {
      buttonsHTML += '<div class="standard-layout-container">';

      // Column 1: Memory section
      buttonsHTML += '<div class="memory-section">';
      buttonsHTML += '<div id="memory-indicator" class="inset-deep"></div>';
      buttonsHTML += '<div class="memory-buttons">';
      layout.memory.forEach((button) => {
        const id = button.id ? `id="${button.id}"` : "";
        const style = button.style ? `style="${button.style}"` : "";
        const className = `class="calc-button ${button.class || ""}"`;
        buttonsHTML += `<button data-key="${button.label}" ${id} ${className} ${style}>${button.label}</button>`;
      });
      buttonsHTML += "</div>";
      buttonsHTML += "</div>";

      // Column 2: Main area
      buttonsHTML += '<div class="main-area">';

      buttonsHTML += '<div class="control-buttons">';
      layout.controls.forEach((button) => {
        const id = button.id ? `id="${button.id}"` : "";
        const style = button.style ? `style="${button.style}"` : "";
        const className = `class="calc-button ${button.class || ""}"`;
        buttonsHTML += `<button data-key="${button.label}" ${id} ${className} ${style}>${button.label}</button>`;
      });
      buttonsHTML += "</div>";

      buttonsHTML += '<div class="main-buttons">';
      layout.main.forEach((row) => {
        row.forEach((button) => {
          const id = button.id ? `id="${button.id}"` : "";
          const style = button.style ? `style="${button.style}"` : "";
          const className = `class="calc-button ${button.class || ""}"`;
          buttonsHTML += `<button data-key="${button.label}" ${id} ${className} ${style}>${button.label}</button>`;
        });
      });
      buttonsHTML += "</div>";

      buttonsHTML += "</div>"; // end .main-area
      buttonsHTML += "</div>"; // end .standard-layout-container
    } else {
      layout.forEach((row) => {
        buttonsHTML += '<div class="button-row">';
        row.forEach((button) => {
          const id = button.id ? `id="${button.id}"` : "";
          const style = button.style ? `style="${button.style}"` : "";
          const className = `class="calc-button ${button.class || ""}"`;
          buttonsHTML += `<button data-key="${button.label}" ${id} ${className} ${style}>${button.label}</button>`;
        });
        buttonsHTML += "</div>";
      });
    }

    buttonsContainer.innerHTML = buttonsHTML;
    this._attachButtonListeners();
    this._updateMemoryIndicator();
  }

  _getStandardLayout() {
    return {
      memory: [
        { label: "MC", style: "color: red" },
        { label: "MR", style: "color: red" },
        { label: "MS", style: "color: red" },
        { label: "M+", style: "color: red" },
      ],
      controls: [
        { label: "Backspace", style: "color: red" },
        { label: "CE", style: "color: red" },
        { label: "C", style: "color: red" },
      ],
      main: [
        [
          { label: "7", style: "color: blue" },
          { label: "8", style: "color: blue" },
          { label: "9", style: "color: blue" },
          { label: "/", style: "color: red" },
          { label: "sqrt", style: "color: blue" },
        ],
        [
          { label: "4", style: "color: blue" },
          { label: "5", style: "color: blue" },
          { label: "6", style: "color: blue" },
          { label: "*", style: "color: red" },
          { label: "%", style: "color: blue" },
        ],
        [
          { label: "1", style: "color: blue" },
          { label: "2", style: "color: blue" },
          { label: "3", style: "color: blue" },
          { label: "-", style: "color: red" },
          { label: "1/x", style: "color: blue" },
        ],
        [
          { label: "0", style: "color: blue" },
          { label: "+/-", style: "color: blue" },
          { label: ".", style: "color: blue" },
          { label: "+", style: "color: red" },
          { label: "=", style: "color: red" },
        ],
      ],
    };
  }

  _getScientificLayout() {
    return [
      [
        { label: "Sta", style: "width: 40px; color: blue" },
        { label: "F-E" },
        { label: "(" },
        { label: ")" },
        { label: "MC" },
        { label: "7" },
        { label: "8" },
        { label: "9" },
        { label: "/", style: "color: red" },
        { label: "Mod" },
        { label: "And" },
      ],
      [
        { label: "Ave", style: "width: 40px; color: blue" },
        { label: "dms" },
        { label: "Exp" },
        { label: "ln" },
        { label: "MR" },
        { label: "4" },
        { label: "5" },
        { label: "6" },
        { label: "*", style: "color: red" },
        { label: "Or" },
        { label: "Xor" },
      ],
      [
        { label: "Sum", style: "width: 40px; color: blue" },
        { label: "sin" },
        { label: "x^y" },
        { label: "log" },
        { label: "MS" },
        { label: "1" },
        { label: "2" },
        { label: "3" },
        { label: "-", style: "color: red" },
        { label: "Lsh" },
        { label: "Not" },
      ],
      [
        { label: "s", style: "width: 40px; color: blue" },
        { label: "cos" },
        { label: "x^3" },
        { label: "n!" },
        { label: "M+" },
        { label: "0" },
        { label: "+/-" },
        { label: "." },
        { label: "+", style: "color: red" },
        { label: "=", style: "color: red" },
        { label: "Int" },
      ],
      [
        { label: "Dat", style: "width: 40px; color: blue" },
        { label: "tan" },
        { label: "x^2" },
        { label: "1/x" },
        { label: "pi" },
        { label: "A" },
        { label: "B" },
        { label: "C" },
        { label: "D" },
        { label: "E" },
        { label: "F" },
      ],
    ];
  }

  _renderScientificControls() {
    const controlsHTML = `
            <div class="scientific-controls">
                <div class="control-row">
                    <fieldset class="group-box">
                        <div class="field-row"><input type="radio" name="number-system" id="hex" value="16"><label for="hex">Hex</label></div>
                        <div class="field-row"><input type="radio" name="number-system" id="dec" value="10" checked><label for="dec">Dec</label></div>
                        <div class="field-row"><input type="radio" name="number-system" id="oct" value="8"><label for="oct">Oct</label></div>
                        <div class="field-row"><input type="radio" name="number-system" id="bin" value="2"><label for="bin">Bin</label></div>
                    </fieldset>
                    <fieldset class="group-box">
                        <div class="field-row"><input type="radio" name="angle-measure" id="degrees" value="degrees" checked><label for="degrees">Degrees</label></div>
                        <div class="field-row"><input type="radio" name="angle-measure" id="radians" value="radians"><label for="radians">Radians</label></div>
                        <div class="field-row"><input type="radio" name="angle-measure" id="gradients" value="gradients"><label for="gradients">Gradients</label></div>
                    </fieldset>
                </div>
                <div class="control-row">
                    <div class="checkbox-container"><input type="checkbox" id="inv"><label for="inv">Inv</label></div>
                    <div class="checkbox-container"><input type="checkbox" id="hyp"><label for="hyp">Hyp</label></div>
                    <div style="width: 25px;"></div>
                </div>
            </div>
        `;
    const displayContainer = this.win.$content.find(
      ".calculator-display-container",
    )[0];
    displayContainer.insertAdjacentHTML("afterend", controlsHTML);

    $.each(
      this.win.$content.find('input[name="number-system"]'),
      (index, radio) => {
        radio.addEventListener("change", (e) =>
          this._handleBaseChange(parseInt(e.target.value)),
        );
      },
    );
    $.each(
      this.win.$content.find('input[name="angle-measure"]'),
      (index, radio) => {
        radio.addEventListener("change", (e) =>
          this.logic.setAngleUnit(e.target.value),
        );
      },
    );
  }

  _handleBaseChange(newBase) {
    this.logic.setBase(newBase);
    this._updateDisplay();
    this._updateHexButtonState();
  }

  _updateHexButtonState() {
    const hexButtons = this.win.$content.find(
      '[data-key="A"], [data-key="B"], [data-key="C"], [data-key="D"], [data-key="E"], [data-key="F"]',
    );
    const disabled = this.logic.base !== 16;
    Array.from(hexButtons).forEach((button) => (button.disabled = disabled));
  }

  _attachButtonListeners() {
    const buttons = this.win.$content.find(".calc-button");
    Array.from(buttons).forEach((button) => {
      button.addEventListener("click", () =>
        this._handleButtonClick(button.dataset.key),
      );
    });
  }

  _handleButtonClick(key) {
    if (!isNaN(parseInt(key, this.logic.base))) {
      this.logic.inputDigit(key);
    } else {
      switch (key) {
        case ".":
          this.logic.inputDecimal();
          break;
        case "+":
        case "-":
        case "*":
        case "/":
        case "x^y":
        case "And":
        case "Or":
        case "Xor":
        case "Lsh":
        case "Mod":
          this.logic.performOperation(key);
          break;
        case "=":
          this.logic.equals();
          break;
        case "C":
          this.logic.clearAll();
          break;
        case "CE":
          this.logic.clearEntry();
          break;
        case "Backspace":
          this.logic.backspace();
          break;
        case "+/-":
          this.logic.toggleSign();
          break;
        case "sqrt":
          this.logic.squareRoot();
          break;
        case "%":
          this.logic.percentage();
          break;
        case "1/x":
          this.logic.reciprocal();
          break;
        case "n!":
          this.logic.factorial();
          break;
        case "sin":
          this.logic.sin();
          break;
        case "cos":
          this.logic.cos();
          break;
        case "tan":
          this.logic.tan();
          break;
        case "log":
          this.logic.log();
          break;
        case "ln":
          this.logic.ln();
          break;
        case "pi":
          this.logic.pi();
          break;
        case "x^2":
          this.logic.x_squared();
          break;
        case "x^3":
          this.logic.x_cubed();
          break;
        case "Not":
          this.logic.not();
          break;
        case "Int":
          this.logic.int();
          break;
        case "MC":
          this.logic.memoryClear();
          this._updateMemoryIndicator();
          break;
        case "MR":
          this.logic.memoryRecall();
          break;
        case "MS":
          this.logic.memoryStore();
          this._updateMemoryIndicator();
          break;
        case "M+":
          this.logic.memoryAdd();
          this._updateMemoryIndicator();
          break;
      }
    }
    this._updateDisplay();
  }

  _updateMemoryIndicator() {
    const indicator = this.win.$content.find("#memory-indicator")[0];
    if (indicator) {
      indicator.textContent = this.logic.memory !== 0 ? "M" : "";
    }
  }

  _updateDisplay() {
    const display = this.win.$content.find(".calculator-display")[0];
    display.textContent = this.logic.currentValue;
  }

  _copyToClipboard() {
    navigator.clipboard.writeText(this.logic.currentValue).catch((err) => {
      console.error("Could not copy text: ", err);
    });
  }

  _pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (!isNaN(parseFloat(text)) && isFinite(text)) {
          this.logic.currentValue = text;
          this.logic.isNewNumber = true;
          this._updateDisplay();
        }
      })
      .catch((err) => {
        console.error("Could not paste text: ", err);
      });
  }

  _showAboutDialog() {
    ShowDialogWindow({
      title: "About Calculator",
      text: "A Windows 98 style calculator.",
      buttons: [{ label: "OK", isDefault: true }],
    });
  }

  _onLaunch(data) {
    // Keyboard support
    this.win.element.addEventListener("keydown", (e) => {
      e.preventDefault();
      this._handleKeyPress(e.key);
    });
  }

  _handleKeyPress(key) {
    if (!isNaN(parseInt(key, this.logic.base))) {
      this.logic.inputDigit(key);
    } else {
      switch (key) {
        case ".":
          this.logic.inputDecimal();
          break;
        case "+":
        case "-":
        case "*":
        case "/":
          this.logic.performOperation(key);
          break;
        case "Enter":
        case "=":
          this.logic.equals();
          break;
        case "Escape":
          this.logic.clearAll();
          break;
        case "Backspace":
          this.logic.backspace();
          break;
      }
    }
    this._updateDisplay();
  }
}
