export function renderHTML(container, htmlString) {
    const isFullHtml = /<html[\s>]/i.test(htmlString) || /<body[\s>]/i.test(htmlString);

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
        container.innerHTML = htmlString;
    }
}
