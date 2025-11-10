const { E } = window.os_gui_utils;

export class Select {
    constructor(options = []) {
        this.options = options;
        this.value = null;
        this.isOpen = false;
        this.focusedIndex = -1;

        this.element = E('div', { className: 'select-container', tabIndex: 0 });
        this.display = E('div', { className: 'select-display' });
        this.button = E('button', { className: 'select-button' });
        this.optionsContainer = E('div', { className: 'select-options' });

        this.element.append(this.display, this.button, this.optionsContainer);

        this._populateOptions();
        this._bindEvents();

        if (this.options.length > 0) {
            this.setValue(this.options.find(o => !o.disabled)?.value);
        }
    }

    _populateOptions() {
        this.optionsContainer.innerHTML = ''; // Clear previous options
        this.options.forEach((option, index) => {
            if (option.separator) {
                const separatorEl = E('div', { className: 'select-separator' });
                this.optionsContainer.append(separatorEl);
                return;
            }

            const optionEl = E('div', {
                className: 'select-option',
                dataset: { value: option.value },
                textContent: option.label
            });

            if (option.disabled) {
                optionEl.classList.add('disabled');
            } else {
                optionEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setValue(option.value);
                    this.close();
                    this.element.focus(); // Return focus to the main element
                });
            }
            this.optionsContainer.append(optionEl);
        });
    }

    _bindEvents() {
        this.element.addEventListener('click', (e) => {
             e.stopPropagation();
            this.toggle()
        });

        this.element.addEventListener('keydown', this._handleKeyDown.bind(this));

        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.close();
            }
        });
    }

    _handleKeyDown(event) {
        if ((event.key === ' ' || event.key === 'Enter') && !this.isOpen) {
            event.preventDefault();
            this.toggle();
            return; // Prevent further processing
        }

        if (!this.isOpen) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.focusedIndex = this._getNextFocusableIndex(this.focusedIndex, 1);
                this._updateFocusedOption();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.focusedIndex = this._getNextFocusableIndex(this.focusedIndex, -1);
                this._updateFocusedOption();
                break;
            case 'Enter':
                event.preventDefault();
                if (this.focusedIndex > -1) {
                    const focusedOption = this.options[this.focusedIndex];
                    if (!focusedOption.disabled) {
                        this.setValue(focusedOption.value);
                    }
                }
                this.close();
                break;
            case 'Escape':
                this.close();
                break;
            case 'Tab':
                this.close();
                break;
        }
    }

    _getNextFocusableIndex(currentIndex, direction) {
        const numOptions = this.options.length;
        let nextIndex = (currentIndex + direction + numOptions) % numOptions;

        // Skip over separators and disabled items
        while (this.options[nextIndex].separator || this.options[nextIndex].disabled) {
            nextIndex = (nextIndex + direction + numOptions) % numOptions;
            // If we've looped all the way around, break to avoid an infinite loop
            if (nextIndex === currentIndex) return currentIndex;
        }
        return nextIndex;
    }

    _updateFocusedOption() {
        const options = this.optionsContainer.querySelectorAll('.select-option');
        let optionElIndex = 0;
        for (let i = 0; i < this.options.length; i++) {
            const option = this.options[i];
            if (option.separator || option.disabled) continue;

            const opt = options[optionElIndex];
            if (i === this.focusedIndex) {
                opt.classList.add('focused');
                if (this.optionsContainer.scrollHeight > this.optionsContainer.clientHeight) {
                    opt.scrollIntoView({ block: 'nearest' });
                }
            } else {
                opt.classList.remove('focused');
            }
            optionElIndex++;
        }
    }

    setValue(value) {
        const oldValue = this.value;
        this.value = value;
        const selectedOption = this.options.find(o => o.value === value);
        if (selectedOption) {
            this.display.textContent = selectedOption.label;
        }

        if (oldValue !== this.value) {
            this.element.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.button.classList.add('active');
        this.optionsContainer.style.display = 'block';
        this.element.focus();

        const selectedOptionIndex = this.options.findIndex(o => o.value === this.value);
        this.focusedIndex = selectedOptionIndex !== -1 ? this._getNextFocusableIndex(selectedOptionIndex - 1, 1) : this._getNextFocusableIndex(-1, 1);
        this._updateFocusedOption();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.button.classList.remove('active');
        this.optionsContainer.style.display = 'none';
        this.focusedIndex = -1;
        const options = this.optionsContainer.querySelectorAll('.select-option');
        options.forEach(opt => opt.classList.remove('focused'));
    }
}
