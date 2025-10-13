import './notepad.css';

export class Notepad {
    constructor(container, win) {
        this.container = container;
        this.win = win;
        this.container.innerHTML = this.getHTML();
        this.init();
    }

    getHTML() {
        return `
            <div class="editor-wrapper">
                <pre><code class="highlighted"></code></pre>
                <textarea class="codeInput" spellcheck="false"></textarea>
            </div>
            <div class="status-bar">
                <p class="status-bar-field statusText">Ready</p>
                <p class="status-bar-field lineCount">Lines: 1</p>
            </div>
        `;
    }

    init() {
        this.codeInput = this.container.querySelector('.codeInput');
        this.highlighted = this.container.querySelector('.highlighted');
        this.statusText = this.container.querySelector('.statusText');
        this.lineCount = this.container.querySelector('.lineCount');
        this.currentLanguage = 'c'; // Default language

        this.updateHighlight = this.updateHighlight.bind(this);
        this.syncScroll = this.syncScroll.bind(this);
        this.formatCode = this.formatCode.bind(this);
        this.copyFormattedCode = this.copyFormattedCode.bind(this);
        this.setLanguage = this.setLanguage.bind(this);

        this.codeInput.addEventListener('input', this.updateHighlight);
        this.codeInput.addEventListener('scroll', this.syncScroll);

        // Listen for events from the menu bar
        this.win.events.on('format', this.formatCode);
        this.win.events.on('language-change', this.setLanguage);
        this.win.events.on('copy', this.copyFormattedCode);

        this.updateHighlight();
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateHighlight();
    }

    syncScroll() {
        this.highlighted.parentElement.scrollTop = this.codeInput.scrollTop;
        this.highlighted.parentElement.scrollLeft = this.codeInput.scrollLeft;
    }

    updateHighlight() {
        const code = this.codeInput.value;
        this.highlighted.textContent = code;
        this.highlighted.className = `highlighted language-${this.currentLanguage}`;
        this.highlighted.removeAttribute('data-highlighted');
        hljs.highlightElement(this.highlighted);

        const lines = code.split('\n').length;
        this.lineCount.textContent = `Lines: ${lines}`;

        this.syncScroll();
    }

    getInlineStyledHTML() {
        const tempDiv = document.createElement('div');
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.position = 'absolute';
        document.body.appendChild(tempDiv);

        const tempPre = document.createElement('pre');
        const tempCode = document.createElement('code');
        tempCode.className = this.highlighted.className;
        tempCode.textContent = this.codeInput.value;
        tempPre.appendChild(tempCode);
        tempDiv.appendChild(tempPre);

        hljs.highlightElement(tempCode);

        function applyInlineStyles(element) {
            if (element.nodeType === 1) {
                const styles = window.getComputedStyle(element);
                let styleStr = '';

                if (styles.color && styles.color !== 'rgb(0, 0, 0)') {
                    styleStr += `color: ${styles.color}; `;
                }
                if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    styleStr += `background-color: ${styles.backgroundColor}; `;
                }
                if (styles.fontWeight && styles.fontWeight !== '400' && styles.fontWeight !== 'normal') {
                    styleStr += `font-weight: ${styles.fontWeight}; `;
                }
                if (styles.fontStyle && styles.fontStyle !== 'normal') {
                    styleStr += `font-style: ${styles.fontStyle}; `;
                }

                if (styleStr) {
                    element.setAttribute('style', styleStr);
                }

                Array.from(element.children).forEach(applyInlineStyles);
            }
        }

        applyInlineStyles(tempCode);

        tempPre.style.cssText = 'background-color: #fafafa; padding: 12px; font-family: monospace; font-size: 13px; line-height: 1.5; border-radius: 4px; white-space: pre; overflow-x: auto;';

        const html = tempPre.outerHTML;
        document.body.removeChild(tempDiv);

        return html;
    }

    copyFormattedCode() {
        // We use the deprecated document.execCommand('copy') here because the modern
        // navigator.clipboard.write() API is not allowed in this context.
        // The browser's security model requires a direct, trusted user gesture
        // (like a click) for clipboard access, and that context is lost
        // through the app's event-driven menu system. This is a reliable fallback.
        try {
            const htmlContent = this.getInlineStyledHTML();

            // Create a temporary element to hold the HTML content
            const tempEl = document.createElement('div');
            tempEl.style.position = 'absolute';
            tempEl.style.left = '-9999px';
            tempEl.innerHTML = htmlContent;
            document.body.appendChild(tempEl);

            // Select the content of the temporary element
            const range = document.createRange();
            range.selectNode(tempEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            // Copy the selection to the clipboard
            const successful = document.execCommand('copy');

            // Clean up
            document.body.removeChild(tempEl);
            window.getSelection().removeAllRanges();

            if (successful) {
                this.statusText.textContent = '✓ Copied to clipboard!';
            } else {
                throw new Error('Copy command was unsuccessful');
            }

            setTimeout(() => {
                this.statusText.textContent = 'Ready';
            }, 2000);

        } catch (err) {
            console.error('Copy failed:', err);
            this.statusText.textContent = 'Copy failed!';
            setTimeout(() => {
                this.statusText.textContent = 'Ready';
            }, 2000);
        }
    }

    formatCode() {
        let code = this.codeInput.value;
        const lines = code.split('\n').map(line => line.trim());
        let indentLevel = 0;
        const indentSize = 4;
        const formattedLines = [];

        for (let line of lines) {
            if (line === '') {
                formattedLines.push('');
                continue;
            }

            if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            const indent = ' '.repeat(indentLevel * indentSize);
            formattedLines.push(indent + line);

            if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) {
                indentLevel++;
            }

            if (line.startsWith('case ') || line === 'default:') {
                indentLevel++;
            } else if (line === 'break;' && indentLevel > 0) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
        }

        this.codeInput.value = formattedLines.join('\n');
        this.statusText.textContent = 'Code formatted!';
        setTimeout(() => {
            this.statusText.textContent = 'Ready';
        }, 2000);
        this.updateHighlight();
    }
}

// For use in appManager
export const notepadContent = `
    <div class="notepad-container">
    </div>
`;