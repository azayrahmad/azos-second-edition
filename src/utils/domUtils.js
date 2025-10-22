export function renderHTML(container, htmlString, snippetWrapperClass = null) {
    const isFullHtml = /<!DOCTYPE html>/i.test(htmlString) || /<html[\s>]/i.test(htmlString) || /<body[\s>]/i.test(htmlString);

    if (isFullHtml) {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        container.innerHTML = '';
        container.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(htmlString);
        iframe.contentWindow.document.close();
    } else {
        if (snippetWrapperClass) {
            container.innerHTML = `<div class="${snippetWrapperClass}">${htmlString}</div>`;
        } else {
            container.innerHTML = htmlString;
        }
    }
}
