import "./address-bar.css";

export class AddressBar {
  constructor(options = {}) {
    this.options = options;
    this.element = document.createElement("div");
    this.element.className = "address-bar";

    const label = document.createElement("label");
    label.className = "address-bar-label";
    label.textContent = "Address";
    this.element.appendChild(label);

    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.className = "address-bar-input";
    if (this.options.placeholder) {
      this.input.placeholder = this.options.placeholder;
    }
    this.element.appendChild(this.input);

    if (this.options.onEnter) {
      this.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.options.onEnter(this.input.value);
        }
      });
    }
  }

  setValue(value) {
    this.input.value = value;
  }

  getValue() {
    return this.input.value;
  }
}
