// src/components/NotepadEditor.js
import { languages } from '../config/languages.js';

export class NotepadEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.container.innerHTML = this._getHTML();
        this._initEditor();
    }

    _getHTML() {
        return `
            <div class="editor-wrapper">
                <div class="line-numbers" aria-hidden="true"></div>
                <pre><code class="highlighted"></code></pre>
                <textarea class="codeInput" spellcheck="false"></textarea>
            </div>
            <div class="status-bar">
                <p class="status-bar-field statusText">Ready</p>
                <p class="status-bar-field lineCount">Lines: 1</p>
            </div>
        `;
    }

    _initEditor() {
        this.isDirty = false;
        this.wordWrap = false;
        this.lineNumbersVisible = false;

        this.codeInput = this.container.querySelector('.codeInput');
        this.highlighted = this.container.querySelector('.highlighted');
        this.lineNumbers = this.container.querySelector('.line-numbers');
        this.statusText = this.container.querySelector('.statusText');
        this.lineCount = this.container.querySelector('.lineCount');
        this.currentLanguage = this.options.language || 'text';

        this.codeInput.addEventListener('input', () => {
            this.isDirty = true;
            this.updateHighlight();
            if (this.options.onInput) {
                this.options.onInput();
            }
        });

        this.codeInput.addEventListener('scroll', this.syncScroll.bind(this));

        this.updateHighlight();
        this.syncPadding();

        if (this.options.win) {
            this.options.win.on('resize', this.syncPadding.bind(this));
        }
    }

    getValue() {
        return this.codeInput.value;
    }

    setValue(value) {
        this.codeInput.value = value;
        this.updateHighlight();
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateHighlight();
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        this.applyWordWrap();
        this.syncPadding();
    }

    applyWordWrap() {
        const styleValue = this.wordWrap ? 'pre-wrap' : 'pre';
        const overflowValue = this.wordWrap ? 'break-word' : 'normal';
        this.codeInput.style.whiteSpace = styleValue;
        this.codeInput.style.overflowWrap = overflowValue;
        this.highlighted.style.whiteSpace = styleValue;
        this.highlighted.style.overflowWrap = overflowValue;
        this.updateHighlight();
    }

    syncPadding() {
        const scrollbarWidth = this.codeInput.offsetWidth - this.codeInput.clientWidth;
        const scrollbarHeight = this.codeInput.offsetHeight - this.codeInput.clientHeight;
        const preElement = this.highlighted.parentElement;
        preElement.style.paddingRight = `${scrollbarWidth + 8}px`;
        preElement.style.paddingBottom = `${scrollbarHeight + 8}px`;
    }

    syncScroll() {
        const preElement = this.highlighted.parentElement;
        preElement.scrollTop = this.codeInput.scrollTop;
        preElement.scrollLeft = this.codeInput.scrollLeft;
        this.highlighted.scrollTop = this.codeInput.scrollTop;
        this.highlighted.scrollLeft = this.codeInput.scrollLeft;
        if (this.lineNumbersVisible) {
            this.lineNumbers.scrollTop = this.codeInput.scrollTop;
        }
    }

    toggleLineNumbers(isVisible) {
        this.lineNumbersVisible = isVisible;
        this.container.querySelector('.editor-wrapper').classList.toggle('show-line-numbers', isVisible);
        this.updateLineNumbers();
        this.syncPadding();
    }

    updateLineNumbers() {
        if (!this.lineNumbersVisible) {
            this.lineNumbers.innerHTML = '';
            return;
        }

        const lineCount = this.codeInput.value.split('\n').length;
        this.lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join('');
    }

    updateHighlight() {
        const code = this.codeInput.value;
        const language = languages.find(lang => lang.id === this.currentLanguage);
        this.highlighted.textContent = code + '\n';
        this.highlighted.className = `highlighted language-${language ? language.hljs : 'text'}`;
        this.highlighted.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(this.highlighted);
        }
        this.lineCount.textContent = `Lines: ${code.split('\n').length}`;
        this.updateLineNumbers();
        this.syncScroll();
    }

    focus() {
        this.codeInput.focus();
    }
}
