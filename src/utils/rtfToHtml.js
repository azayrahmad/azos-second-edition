export function convertRtfToHtml(rtf) {
    if (typeof rtf !== 'string') {
        return '';
    }

    let html = rtf;

    // Remove RTF header and footer
    html = html.replace(/^{\\rtf1[\\s\\S]*?{/g, '');
    html = html.replace(/}}$/g, '');

    // Define the replacements in reverse order
    const replacements = [
        { rtf: /{\\pard\\par}/g, html: '<br>' },
        { rtf: /{\\pard\s?([\s\S]*?)\\par}/g, html: '<p>$1</p>' },
        { rtf: /{\\b\s?([\s\S]*?)}/g, html: '<b>$1</b>' },
        { rtf: /{\\i\s?([\s\S]*?)}/g, html: '<i>$1</i>' },
        { rtf: /{\\ul\s?([\s\S]*?)}/g, html: '<u>$1</u>' },
        { rtf: /{\\strike\s?([\s\S]*?)}/g, html: '<strike>$1</strike>' },
        { rtf: /{\\super\s?([\s\S]*?)}/g, html: '<sup>$1</sup>' },
        { rtf: /{\\sub\s?([\s\S]*?)}/g, html: '<sub>$1</sub>' },
        { rtf: /{\\field{\\\*\\fldinst{HYPERLINK\s*"(.*?)"}}{\\fldrslt{\\ul\\cf1\s?([\s\S]*?)}}}/g, html: '<a href="$1">$2</a>' }
    ];

    // Iteratively apply replacements to handle nested tags
    let changed = true;
    while(changed) {
        let before = html;
        for (const replacement of replacements) {
            html = html.replace(replacement.rtf, replacement.html);
        }
        changed = before !== html;
    }

    // Remove any remaining RTF control words and braces
    html = html.replace(/\\[a-z]+\d*\s?/g, '');
    html = html.replace(/[{}]/g, '');
    html = html.replace(/\\'/g, "'");

    return html;
}
