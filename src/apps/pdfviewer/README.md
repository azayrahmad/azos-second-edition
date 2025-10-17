# PDF Viewer App

## Summary

The PDF Viewer is a simple and efficient application for viewing PDF documents within azOS Second Edition. It leverages the browser's native PDF rendering capabilities to display documents directly inside an application window.

## Features

- **Direct PDF Rendering**: Opens and displays `.pdf` files using the browser's built-in PDF viewer.
- **File Association**: Associated with `.pdf` files, allowing users to open them directly from the desktop or file explorer.
- **Dynamic Title**: The window title updates to show the name of the currently opened PDF file (e.g., "PDF Viewer - MyDocument.pdf").
- **Fallback Support**: If the browser cannot render the PDF, it provides a convenient link to download the file instead.
- **Empty State**: When launched without a file, it displays a clear message prompting the user to open a PDF.

## Technical Details

- **Implementation**: The viewer is implemented using an HTML `<object>` tag, which is a standard way to embed external resources like PDFs into a web page.
- **Dynamic Content**: The content of the viewer is generated dynamically based on the `filePath` passed to it when the application is launched.
- **Resource Path**: It assumes that PDF files are located in the `public/files/` directory, which is the standard location for user files in azOS.