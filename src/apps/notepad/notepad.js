import './notepad.css';
import { languages } from '../../config/languages.js';

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
        this.win.notepad = this;
        if (this.win.title() === 'Notepad') {
            this.win.title('Untitled - Notepad');
        }
        this.codeInput = this.container.querySelector('.codeInput');
        this.highlighted = this.container.querySelector('.highlighted');
        this.statusText = this.container.querySelector('.statusText');
        this.lineCount = this.container.querySelector('.lineCount');
        this.currentLanguage = 'text'; // Default language

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
        this.win.events.on('new', this.clearContent.bind(this));
        this.win.events.on('paste', this.pasteText.bind(this));
        this.win.events.on('open', this.openFile.bind(this));
        this.win.events.on('preview-markdown', this.previewMarkdown.bind(this));

        this.updateHighlight();
    }

    previewMarkdown() {
        const text = this.codeInput.value;
        const html = marked.parse(text);

        const previewWindow = new $Window({
            title: 'HTML/Markdown Preview',
            innerWidth: 600,
            innerHeight: 400,
            minWidth: 300,
            minimizeButton: false,
            maximizeButton: true,
            resizable: true
        });

        previewWindow.$content.html(`
                <div class="markdown-preview sunken-panel"></div>
                <div class="markdown-preview-footer" style="text-align: right; padding: 5px;">
                    <button class="copy-button">Copy HTML</button>
                </div>
            `);

        setTimeout(() => {
            const previewEl = previewWindow.element.querySelector('.markdown-preview');
            previewEl.innerHTML = html;
        }, 100);

        const copyButton = previewWindow.element.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(html).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy HTML';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                copyButton.textContent = 'Error!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy HTML';
                }, 2000);
            });
        });
    }

    getLanguageFromExtension(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const language = languages.find(lang => lang.extensions.includes(extension));
        return language ? language.id : 'text';
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = languages.flatMap(lang => lang.extensions.map(ext => `.${ext}`)).join(',');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.win.title(`${file.name} - Notepad`);

            const lang = this.getLanguageFromExtension(file.name);
            this.setLanguage(lang);

            const reader = new FileReader();
            reader.onload = (event) => {
                this.codeInput.value = event.target.result;
                this.updateHighlight();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    clearContent() {
        this.codeInput.value = '';
        this.win.title('Untitled - Notepad');
        this.updateHighlight();
    }

    pasteText() {
        this.codeInput.focus();
        navigator.clipboard.readText().then(text => {
            document.execCommand('insertText', false, text);
            this.updateHighlight();
        }).catch(err => {
            console.error('Failed to read clipboard contents: ', err);
            // Fallback for browsers that don't support readText or if permission is denied
            document.execCommand('paste');
            this.updateHighlight();
        });
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateHighlight();
        const menuBarEl = this.win.element.querySelector('.menus');
        if (menuBarEl) {
            menuBarEl.dispatchEvent(new CustomEvent('update'));
        }
    }

    syncScroll() {
        this.highlighted.style.top = `-${this.codeInput.scrollTop}px`;
        this.highlighted.style.left = `-${this.codeInput.scrollLeft}px`;
    }

    updateHighlight() {
        const code = this.codeInput.value;
        const language = languages.find(lang => lang.id === this.currentLanguage);
        const hljsClass = language ? language.hljs : 'text';

        this.highlighted.textContent = code + '\n';
        this.highlighted.className = `highlighted language-${hljsClass}`;
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
        const language = languages.find(lang => lang.id === this.currentLanguage);
        const parser = language ? language.prettier : null;

        if (!parser) {
            this.statusText.textContent = `Formatting not available for ${language ? language.name : this.currentLanguage}.`;
            setTimeout(() => {
                this.statusText.textContent = 'Ready';
            }, 3000);
            return;
        }

        try {
            const rawCode = this.codeInput.value;
            const formattedCode = prettier.format(rawCode, {
                parser: parser,
                plugins: prettierPlugins,
            });
            this.codeInput.value = formattedCode;
            this.statusText.textContent = 'Code formatted!';
            this.updateHighlight();
        } catch (error) {
            console.error('Prettier formatting error:', error);
            this.statusText.textContent = 'Error formatting code. Check console.';
        } finally {
            setTimeout(() => {
                this.statusText.textContent = 'Ready';
            }, 2000);
        }
    }
}

// For use in appManager
export const notepadContent = `
    <div class="notepad-container">
    </div>
`;