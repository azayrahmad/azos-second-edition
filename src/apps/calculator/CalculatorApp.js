// CalculatorApp.js - Main logic for the calculator application
import { Application } from "../Application.js";
import { CalculatorLogic } from "./calculator-logic.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import buttonDefinitions from "./buttons.js"; // Import the centralized button definitions
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
    buttonsContainer.innerHTML = ""; // Clear existing buttons

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

    if (this.mode === "standard") {
      const standardContainer = document.createElement("div");
      standardContainer.className = "standard-layout-container";

      // Column 1: Memory section
      const memorySection = document.createElement("div");
      memorySection.className = "memory-section";
      memorySection.innerHTML =
        '<div id="memory-indicator" class="inset-deep"></div>';
      const memoryButtons = document.createElement("div");
      memoryButtons.className = "memory-buttons";
      layout.memory.forEach((key) => {
        const button = buttonDefinitions[key];
        if (button) {
          memoryButtons.appendChild(button.render(this));
        }
      });
      memorySection.appendChild(memoryButtons);
      standardContainer.appendChild(memorySection);

      // Column 2: Main area
      const mainArea = document.createElement("div");
      mainArea.className = "main-area";

      const controlButtons = document.createElement("div");
      controlButtons.className = "control-buttons";
      layout.controls.forEach((key) => {
        const button = buttonDefinitions[key];
        if (button) {
          controlButtons.appendChild(button.render(this));
        }
      });
      mainArea.appendChild(controlButtons);

      const mainButtons = document.createElement("div");
      mainButtons.className = "main-buttons";
      layout.main.forEach((row) => {
        row.forEach((key) => {
          const button = buttonDefinitions[key];
          if (button) {
            mainButtons.appendChild(button.render(this));
          }
        });
      });
      mainArea.appendChild(mainButtons);
      standardContainer.appendChild(mainArea);
      buttonsContainer.appendChild(standardContainer);
    } else {
      // Scientific mode
      layout.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "button-row";
        row.forEach((key) => {
          const button = buttonDefinitions[key];
          if (button) {
            rowDiv.appendChild(button.render(this));
          }
        });
        buttonsContainer.appendChild(rowDiv);
      });
    }

    this._updateMemoryIndicator();
    if (this.mode === "scientific") {
      this._updateHexButtonState();
    }
  }

  _getStandardLayout() {
    return {
      memory: ["MC", "MR", "MS", "M+"],
      controls: ["Backspace", "CE", "C"],
      main: [
        ["7", "8", "9", "/", "sqrt"],
        ["4", "5", "6", "*", "%"],
        ["1", "2", "3", "-", "1/x"],
        ["0", "+/-", ".", "+", "="],
      ],
    };
  }

  _getScientificLayout() {
    return [
      ["Sta", "F-E", "(", ")", "MC", "7", "8", "9", "/", "Mod", "And"],
      ["Ave", "dms", "Exp", "ln", "MR", "4", "5", "6", "*", "Or", "Xor"],
      ["Sum", "sin", "x^y", "log", "MS", "1", "2", "3", "-", "Lsh", "Not"],
      ["s", "cos", "x^3", "n!", "M+", "0", "+/-", ".", "+", "=", "Int"],
      ["Dat", "tan", "x^2", "1/x", "pi", "A", "B", "C", "D", "E", "F"],
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
    this.win.element.addEventListener("keydown", (e) => {
      e.preventDefault();
      this._handleKeyPress(e.key);
    });

    this.win.element.addEventListener("button-action-complete", () =>
      this._updateDisplay(),
    );
  }

  _triggerButtonAction(key) {
    const button = buttonDefinitions[key];
    if (button && button.action) {
      this.win.element.dispatchEvent(new CustomEvent("button-action-start"));
      button.action(this);
      this.win.element.dispatchEvent(new CustomEvent("button-action-complete"));
    }
  }

  _handleKeyPress(key) {
    // Normalize key for certain inputs
    if (key === "Enter") key = "=";
    if (key === "Escape") key = "C";

    this._triggerButtonAction(key);
  }
}
