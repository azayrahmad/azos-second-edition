// src/apps/calculator/buttons.js
import { CalculatorButton } from "./CalculatorButton.js";

const red = { color: "red" };
const blue = { color: "blue" };
const scientificControlStyle = { width: "40px", color: "blue" };

const buttonDefinitions = {
  // --- Standard Buttons ---

  // Memory Functions
  MC: new CalculatorButton({
    label: "MC",
    style: red,
    tooltip: "Memory Clear: Clears any number stored in memory.",
    action: (app) => {
      app.logic.memoryClear();
      app._updateMemoryIndicator();
    },
  }),
  MR: new CalculatorButton({
    label: "MR",
    style: red,
    tooltip:
      "Memory Recall: Recalls the number stored in memory and uses it as the current entry.",
    action: (app) => app.logic.memoryRecall(),
  }),
  MS: new CalculatorButton({
    label: "MS",
    style: red,
    tooltip:
      "Memory Store: Stores the currently displayed number in memory, overwriting any previous value.",
    action: (app) => {
      app.logic.memoryStore();
      app._updateMemoryIndicator();
    },
  }),
  "M+": new CalculatorButton({
    label: "M+",
    style: red,
    tooltip:
      "Memory Add: Adds the currently displayed number to the number in memory.",
    action: (app) => {
      app.logic.memoryAdd();
      app._updateMemoryIndicator();
    },
  }),

  // Control Functions
  Backspace: new CalculatorButton({
    label: "Backspace",
    style: red,
    tooltip: "Deletes the last digit of the displayed number.",
    action: (app) => app.logic.backspace(),
  }),
  CE: new CalculatorButton({
    label: "CE",
    style: red,
    tooltip: "Clear Entry: Clears the current entry.",
    action: (app) => app.logic.clearEntry(),
  }),
  Clear: new CalculatorButton({
    label: "C",
    style: red,
    tooltip: "Clear: Clears the current calculation.",
    action: (app) => app.logic.clearAll(),
  }),

  // Digits
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      i.toString(),
      new CalculatorButton({
        label: i.toString(),
        style: blue,
        tooltip:
          "Puts this number in the calculator display.\n\nKeyboard equivalent = 0-9",
        action: (app) => app.logic.inputDigit(i.toString()),
      }),
    ]),
  ),

  // Operators
  "/": new CalculatorButton({
    label: "/",
    style: red,
    tooltip:
      "Division: Divides the previous number by the next.\n**Example:** 8 / 2 = 4.",
    action: (app) => app.logic.performOperation("/"),
  }),
  "*": new CalculatorButton({
    label: "*",
    style: red,
    tooltip: "Multiplication: Multiplies two numbers.\n**Example:** 2 * 3 = 6.",
    action: (app) => app.logic.performOperation("*"),
  }),
  "-": new CalculatorButton({
    label: "-",
    style: red,
    tooltip:
      "Subtraction: Subtracts the next number from the previous.\n**Example:** 5 - 2 = 3.",
    action: (app) => app.logic.performOperation("-"),
  }),
  "+": new CalculatorButton({
    label: "+",
    style: red,
    tooltip: "Addition: Adds two numbers.\n**Example:** 2 + 3 = 5.",
    action: (app) => app.logic.performOperation("+"),
  }),
  "=": new CalculatorButton({
    label: "=",
    style: red,
    tooltip: "Equals: Performs the calculation.",
    action: (app) => app.logic.equals(),
  }),

  // Other Standard Functions
  sqrt: new CalculatorButton({
    label: "sqrt",
    style: blue,
    tooltip:
      "Square Root: Calculates the square root of the displayed number.\n**Example:** sqrt(9) = 3.",
    action: (app) => app.logic.squareRoot(),
  }),
  "%": new CalculatorButton({
    label: "%",
    style: blue,
    tooltip:
      "Percentage: Calculates a percentage of a number.\n**Example:** 100 * 5% = 5.",
    action: (app) => app.logic.percentage(),
  }),
  "1/x": new CalculatorButton({
    label: "1/x",
    style: blue,
    tooltip:
      "Reciprocal: Calculates the reciprocal of the displayed number.\n**Example:** 1/4 = 0.25.",
    action: (app) => app.logic.reciprocal(),
  }),
  "+/-": new CalculatorButton({
    label: "+/-",
    style: blue,
    tooltip: "Toggle Sign: Changes the sign of the displayed number.",
    action: (app) => app.logic.toggleSign(),
  }),
  ".": new CalculatorButton({
    label: ".",
    style: blue,
    tooltip: "Decimal Point: Adds a decimal point to the number.",
    action: (app) => app.logic.inputDecimal(),
  }),

  // --- Scientific Buttons ---
  Sta: new CalculatorButton({ label: "Sta", style: scientificControlStyle }),
  "F-E": new CalculatorButton({ label: "F-E" }),
  "(": new CalculatorButton({ label: "(" }),
  ")": new CalculatorButton({ label: ")" }),
  Mod: new CalculatorButton({
    label: "Mod",
    action: (app) => app.logic.performOperation("Mod"),
  }),
  And: new CalculatorButton({
    label: "And",
    action: (app) => app.logic.performOperation("And"),
  }),
  Ave: new CalculatorButton({ label: "Ave", style: scientificControlStyle }),
  dms: new CalculatorButton({ label: "dms" }),
  Exp: new CalculatorButton({ label: "Exp" }),
  ln: new CalculatorButton({ label: "ln", action: (app) => app.logic.ln() }),
  Or: new CalculatorButton({
    label: "Or",
    action: (app) => app.logic.performOperation("Or"),
  }),
  Xor: new CalculatorButton({
    label: "Xor",
    action: (app) => app.logic.performOperation("Xor"),
  }),
  Sum: new CalculatorButton({ label: "Sum", style: scientificControlStyle }),
  sin: new CalculatorButton({ label: "sin", action: (app) => app.logic.sin() }),
  "x^y": new CalculatorButton({
    label: "x^y",
    action: (app) => app.logic.performOperation("x^y"),
  }),
  log: new CalculatorButton({ label: "log", action: (app) => app.logic.log() }),
  Lsh: new CalculatorButton({
    label: "Lsh",
    action: (app) => app.logic.performOperation("Lsh"),
  }),
  Not: new CalculatorButton({ label: "Not", action: (app) => app.logic.not() }),
  s: new CalculatorButton({ label: "s", style: scientificControlStyle }),
  cos: new CalculatorButton({ label: "cos", action: (app) => app.logic.cos() }),
  "x^3": new CalculatorButton({
    label: "x^3",
    action: (app) => app.logic.x_cubed(),
  }),
  "n!": new CalculatorButton({
    label: "n!",
    action: (app) => app.logic.factorial(),
  }),
  Int: new CalculatorButton({ label: "Int", action: (app) => app.logic.int() }),
  Dat: new CalculatorButton({ label: "Dat", style: scientificControlStyle }),
  tan: new CalculatorButton({ label: "tan", action: (app) => app.logic.tan() }),
  "x^2": new CalculatorButton({
    label: "x^2",
    action: (app) => app.logic.x_squared(),
  }),
  pi: new CalculatorButton({ label: "pi", action: (app) => app.logic.pi() }),
  ...Object.fromEntries(
    ["A", "B", "C", "D", "E", "F"].map((hex) => [
      hex,
      new CalculatorButton({
        label: hex,
        action: (app) => app.logic.inputDigit(hex),
      }),
    ]),
  ),
};

export default buttonDefinitions;
