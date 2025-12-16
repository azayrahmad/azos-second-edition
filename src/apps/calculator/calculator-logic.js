export class CalculatorLogic {
    constructor() {
        this.clearAll();
        this.memory = 0;
    }

    // Clears all calculator state
    clearAll() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.isNewNumber = true;
        this.base = 10; // 10, 16, 8, 2
        this.angleUnit = 'degrees'; // 'degrees', 'radians', 'gradients'
    }

    // Clears the current entry
    clearEntry() {
        this.currentValue = '0';
        this.isNewNumber = true;
    }

    // Handles digit and decimal inputs
    inputDigit(digit) {
        if (this.isNewNumber) {
            this.currentValue = digit;
            this.isNewNumber = false;
        } else {
            if (this.currentValue === '0' && digit !== '.') {
                this.currentValue = digit;
            } else {
                this.currentValue += digit;
            }
        }
    }

    inputDecimal() {
        if (this.isNewNumber) {
            this.currentValue = '0.';
            this.isNewNumber = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
    }

    // Handles binary operations
    performOperation(nextOperation) {
        if (this.operation) {
            this.calculate();
        }

        this.previousValue = this.currentValue;
        this.operation = nextOperation;
        this.isNewNumber = true;
    }

    // Performs the calculation
    calculate() {
        if (!this.operation || this.previousValue === null) return;

        const isBitwise = ['And', 'Or', 'Xor', 'Lsh', 'Mod'].includes(this.operation);
        let result;

        if (isBitwise) {
            const prev = parseInt(this.previousValue, this.base);
            const curr = parseInt(this.currentValue, this.base);

            switch (this.operation) {
                case 'And': result = prev & curr; break;
                case 'Or': result = prev | curr; break;
                case 'Xor': result = prev ^ curr; break;
                case 'Lsh': result = prev << curr; break;
                case 'Mod': result = prev % curr; break;
            }
            this.currentValue = result.toString(this.base).toUpperCase();
        } else {
            const prev = parseFloat(this.previousValue);
            const curr = parseFloat(this.currentValue);

            switch (this.operation) {
                case '+': result = prev + curr; break;
                case '-': result = prev - curr; break;
                case '*': result = prev * curr; break;
                case '/': result = prev / curr; break;
                case 'x^y': result = Math.pow(prev, curr); break;
            }
            this.currentValue = String(result);
        }

        this.operation = null;
    }

    // Handles unary operations
    toggleSign() {
        if (this.base === 10) {
            this.currentValue = String(parseFloat(this.currentValue) * -1);
        }
    }

    squareRoot() {
        this.currentValue = String(Math.sqrt(parseFloat(this.currentValue)));
    }

    percentage() {
        if (this.previousValue !== null) {
            this.currentValue = String(parseFloat(this.previousValue) * (parseFloat(this.currentValue) / 100));
        } else {
            this.currentValue = '0';
        }
    }

    reciprocal() {
        const value = parseFloat(this.currentValue);
        this.currentValue = value === 0 ? 'Cannot divide by zero' : String(1 / value);
    }

    factorial() {
        let n = parseInt(this.currentValue);
        if (n < 0) {
            this.currentValue = "Invalid input";
            return;
        }
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        this.currentValue = String(result);
    }

    // Scientific functions
    pi() {
        this.currentValue = String(Math.PI);
        this.isNewNumber = true;
    }

    _toRadians(value) {
        if (this.angleUnit === 'degrees') {
            return value * (Math.PI / 180);
        } else if (this.angleUnit === 'gradients') {
            return value * (Math.PI / 200);
        }
        return value;
    }

    sin() {
        const radians = this._toRadians(parseFloat(this.currentValue));
        this.currentValue = String(Math.sin(radians));
    }

    cos() {
        const radians = this._toRadians(parseFloat(this.currentValue));
        this.currentValue = String(Math.cos(radians));
    }

    tan() {
        const radians = this._toRadians(parseFloat(this.currentValue));
        this.currentValue = String(Math.tan(radians));
    }

    log() {
        this.currentValue = String(Math.log10(parseFloat(this.currentValue)));
    }

    ln() {
        this.currentValue = String(Math.log(parseFloat(this.currentValue)));
    }

    x_squared() {
        this.currentValue = String(Math.pow(parseFloat(this.currentValue), 2));
    }

    x_cubed() {
        this.currentValue = String(Math.pow(parseFloat(this.currentVlaue), 3));
    }

    not() {
        const result = ~parseInt(this.currentValue, this.base);
        this.currentValue = result.toString(this.base).toUpperCase();
    }

    int() {
        if (this.base === 10) {
            this.currentValue = String(Math.trunc(parseFloat(this.currentValue)));
        }
    }

    // Memory functions
    memoryClear() { this.memory = 0; }
    memoryRecall() {
        this.currentValue = String(this.memory);
        this.isNewNumber = true;
    }
    memoryStore() { this.memory = parseFloat(this.currentValue); }
    memoryAdd() { this.memory += parseFloat(this.currentValue); }

    // Equals operation
    equals() {
        if (this.operation) {
            this.calculate();
            this.isNewNumber = true;
            this.previousValue = null;
        }
    }

    // Backspace
    backspace() {
        if (this.isNewNumber) return;
        this.currentValue = this.currentValue.slice(0, -1);
        if (this.currentValue === '') {
            this.currentValue = '0';
            this.isNewNumber = true;
        }
    }

    // Base conversion
    setBase(newBase) {
        if (this.base === newBase) return;
        const numberValue = parseInt(this.currentValue, this.base);
        this.base = newBase;
        this.currentValue = numberValue.toString(this.base).toUpperCase();
        this.isNewNumber = true;
    }

    // Angle unit
    setAngleUnit(unit) {
        this.angleUnit = unit;
    }
}
