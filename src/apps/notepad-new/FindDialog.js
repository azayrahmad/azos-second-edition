export class FindDialog {
  constructor(app) {
    this.app = app;
    this.win = null;
  }

  _createWindow() {
    this.win = new $Window({
      title: "Find",
      width: 380,
      height: "auto",
      resizable: false,
      minimizeButton: false,
      maximizeButton: false,
      onClose: () => {
        this.win.hide();
        return false;
      },
    });

    const dialogContent = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label for="find-text" style="margin-right: 5px;">Find what:</label>
                <input type="text" id="find-text" value="" style="flex-grow: 1;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="checkbox-container">
                    <input type="checkbox" id="match-case">
                    <label for="match-case">Match case</label>
                </div>
                <fieldset class="group-box" style="padding: 5px 10px;">
                    <legend>Direction</legend>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-up" value="up">
                        <label for="dir-up">Up</label>
                    </div>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-down" value="down" checked>
                        <label for="dir-down">Down</label>
                    </div>
                </fieldset>
            </div>
        `;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "dialog-buttons";
    buttonContainer.innerHTML = `
            <button id="find-next-btn">Find Next</button>
            <button id="cancel-btn">Cancel</button>
        `;

    this.win.$content.append(dialogContent, buttonContainer);

    this.findInput = this.win.element.querySelector("#find-text");
    this.matchCaseCheckbox = this.win.element.querySelector("#match-case");
    this.directionUpRadio = this.win.element.querySelector("#dir-up");
    this.directionDownRadio = this.win.element.querySelector("#dir-down");
    this.findNextButton = this.win.element.querySelector("#find-next-btn");
    this.cancelButton = this.win.element.querySelector("#cancel-btn");

    this.findNextButton.addEventListener("click", () => this._onFindNext());
    this.cancelButton.addEventListener("click", () => this.win.hide());
    this.findInput.addEventListener("input", () => this._updateFindNextButtonState());

    this._updateFindNextButtonState();

    return this.win;
  }

  _onFindNext() {
    const term = this.findInput.value;
    const caseSensitive = this.matchCaseCheckbox.checked;
    const direction = this.directionUpRadio.checked ? "up" : "down";

    this.app.performSearchAndUpdateState({ term, caseSensitive, direction });
  }

  _updateFindNextButtonState() {
    this.findNextButton.disabled = !this.findInput.value;
  }

  show() {
    if (!this.win) {
      this._createWindow();
    }

    this.findInput.value = this.app.findState.term;
    this.matchCaseCheckbox.checked = this.app.findState.caseSensitive;
    if (this.app.findState.direction === 'up') {
        this.directionUpRadio.checked = true;
    } else {
        this.directionDownRadio.checked = true;
    }

    this._updateFindNextButtonState();

    this.win.show();
    this.win.center();
  }

  focus() {
    if (!this.win) return;
    this.win.focus();
    this.findInput.focus();
    this.findInput.select();
  }
}
