import { languages } from '../../../config/languages.js';

export function getLanguageFromExtension(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const language = languages.find(lang => lang.extensions.includes(extension));
    return language ? language.id : 'text';
}

export function getInlineStyledHTML(editor) {
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position: absolute; visibility: hidden;';
    const tempPre = document.createElement('pre');
    const tempCode = document.createElement('code');
    tempCode.className = editor.highlighted.className;
    tempCode.textContent = editor.getValue();
    tempPre.appendChild(tempCode);
    tempDiv.appendChild(tempPre);
    document.body.appendChild(tempDiv);
    hljs.highlightElement(tempCode);

    function applyInlineStyles(element) {
        const styles = window.getComputedStyle(element);
        let styleStr = '';
        if (styles.color) styleStr += `color: ${styles.color}; `;
        if (styles.backgroundColor) styleStr += `background-color: ${styles.backgroundColor}; `;
        if (styles.fontWeight) styleStr += `font-weight: ${styles.fontWeight}; `;
        if (styles.fontStyle) styleStr += `font-style: ${styles.fontStyle}; `;
        if (styleStr) element.setAttribute('style', styleStr);
        Array.from(element.children).forEach(applyInlineStyles);
    }
    applyInlineStyles(tempCode);

    tempPre.style.cssText = 'background-color: #fafafa; padding: 12px; font-family: monospace; white-space: pre; overflow-x: auto;';
    const html = tempPre.outerHTML;
    document.body.removeChild(tempDiv);
    return html;
}

export function copyFormattedCode(app) {
    try {
        const htmlContent = getInlineStyledHTML(app.editor);
        const tempEl = document.createElement('div');
        tempEl.style.cssText = 'position: absolute; left: -9999px;';
        tempEl.innerHTML = htmlContent;
        document.body.appendChild(tempEl);
        const range = document.createRange();
        range.selectNode(tempEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        const successful = document.execCommand('copy');
        document.body.removeChild(tempEl);
        window.getSelection().removeAllRanges();
        app.editor.statusText.textContent = successful ? '✓ Copied to clipboard!' : 'Copy failed!';
    } catch (err) {
        app.editor.statusText.textContent = 'Copy failed!';
    } finally {
        setTimeout(() => app.editor.statusText.textContent = 'Ready', 2000);
    }
}

export function formatCode(app) {
    if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
        app.editor.statusText.textContent = 'Prettier library not loaded.';
        setTimeout(() => app.editor.statusText.textContent = 'Ready', 3000);
        return;
    }

    const language = languages.find(lang => lang.id === app.editor.currentLanguage);
    const parser = language?.prettier;

    if (!parser) {
        app.editor.statusText.textContent = `Formatting not available for ${language?.name || app.editor.currentLanguage}.`;
        setTimeout(() => app.editor.statusText.textContent = 'Ready', 3000);
        return;
    }

    try {
        const formattedCode = prettier.format(app.editor.getValue(), {
            parser: parser,
            plugins: prettierPlugins,
        });
        app.editor.setValue(formattedCode);
        app.isDirty = true;
        app.updateTitle();
        app.editor.statusText.textContent = 'Code formatted successfully.';
    } catch (error) {
        console.error('Prettier formatting error:', error);
        app.editor.statusText.textContent = `Error formatting code: ${error.message.split('\\n')[0]}`;
    } finally {
        setTimeout(() => app.editor.statusText.textContent = 'Ready', 3000);
    }
}

export function pasteText(editor) {
    editor.focus();
    navigator.clipboard.readText().then(text => {
        document.execCommand('insertText', false, text);
    }).catch(() => {
        document.execCommand('paste');
    });
}
