// src/apps/calculator/CalculatorButton.js

import { Tooltip } from "../../components/Tooltip.js";

export class CalculatorButton {
  /**
   * @param {object} options
   * @param {string} options.id The unique identifier for the button.
   * @param {string} options.label The text displayed on the button.
   * @param {object} [options.style] CSS styles to apply to the button.
   * @param {string} [options.className] Additional CSS class names.
   * @param {string} [options.tooltip] Help text for the button's context menu.
   * @param {function(CalculatorApp): void} [options.action] The function to execute when the button is clicked.
   */
  constructor({ id, label, style, className, tooltip, action }) {
    this.id = id;
    this.label = label;
    this.style = style || {};
    this.className = className || "";
    this.tooltip = tooltip;
    this.action = action;
  }

  /**
   * Creates and returns the button's HTML element.
   * @param {CalculatorApp} app The calculator application instance.
   * @returns {HTMLButtonElement}
   */
  render(app) {
    const button = document.createElement("button");
    button.dataset.key = this.label;
    button.dataset.id = this.id;
    button.className = `calc-button ${this.className}`;
    Object.assign(button.style, this.style);
    button.innerHTML = this.label;

    if (this.action) {
      button.addEventListener("click", () => {
        this.action(app);
        app.win.element.dispatchEvent(
          new CustomEvent("button-action-complete"),
        );
      });
    }

    // Add hover-based tooltips
    if (this.tooltip) {
      let tooltipInstance = null;
      button.addEventListener("mouseenter", () => {
        tooltipInstance = new Tooltip(this.tooltip, button);
      });
      button.addEventListener("mouseleave", () => {
        if (tooltipInstance) {
          tooltipInstance._close();
          tooltipInstance = null;
        }
      });
    }

    return button;
  }
}
