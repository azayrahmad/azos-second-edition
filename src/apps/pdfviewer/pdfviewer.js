export function createPdfViewerContent(filePath) {
  const dataPath = filePath ? filePath.replace('public/', '') : '';
  const fileName = dataPath.split('/').pop();
  const title = fileName ? `PDF Viewer - ${fileName}` : 'PDF Viewer';

  const content = `
    <div class="pdf-viewer-content" style="width: 100%; height: 100%; padding: 0;">
      ${dataPath ? `
        <object
          data="${dataPath}"
          type="application/pdf"
          style="width: 100%; height: 100%; border: none;"
          title="${title}"
        >
          <p>Your browser doesn't support PDF viewing. <a href="${dataPath}">Download the PDF</a> instead.</p>
        </object>
      ` : `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background-color: #f0f0f0;">
          <p>No PDF file loaded. Please open a PDF file.</p>
        </div>
      `}
    </div>
  `;

  return { title, content };
}
