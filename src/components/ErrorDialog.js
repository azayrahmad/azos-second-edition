import { ShowDialogWindow } from './DialogWindow.js';

let errorDialogInstance = null;
const errorQueue = [];

function getDialogContent() {
  const container = document.createElement('div');
  container.className = 'error-dialog-container';

  const preface = document.createElement('p');
  preface.textContent = 'An error has occurred. You can report the bug to help us improve the system.';
  container.appendChild(preface);

  const errorArea = document.createElement('div');
  errorArea.className = 'error-area';
  container.appendChild(errorArea);

  return { container, errorArea };
}

function updateErrorArea(errorArea) {
  errorArea.innerHTML = '';
  for (const error of errorQueue) {
    const errorEntry = document.createElement('div');
    errorEntry.className = 'error-entry';

    const errorMessage = document.createElement('pre');
    errorMessage.textContent = error.message;
    errorEntry.appendChild(errorMessage);

    if (error.stack) {
      const errorStack = document.createElement('pre');
      errorStack.textContent = error.stack;
      errorEntry.appendChild(errorStack);
    }

    errorArea.appendChild(errorEntry);
  }
}

function formatErrorForReport() {
  return errorQueue.map(error => {
    let report = `Error: ${error.message}`;
    if (error.stack) {
      report += `\nStack Trace:\n${error.stack}`;
    }
    return report;
  }).join('\n\n---\n\n');
}

export function showErrorDialog(error) {
  errorQueue.push(error);

  if (errorDialogInstance) {
    const errorArea = errorDialogInstance.win.element.querySelector('.error-area');
    updateErrorArea(errorArea);
    errorDialogInstance.win.bringToFront();
    return;
  }

  const { container, errorArea } = getDialogContent();
  updateErrorArea(errorArea);

  const dialog = ShowDialogWindow({
    title: 'Error',
    content: container,
    width: 500,
    height: 350,
    buttons: [
      {
        label: 'Report the bug',
        action: () => {
          window.System.launchApp('reportabug', { report: formatErrorForReport() });
          return true; //  close the dialog
        }
      },
      {
        label: "Don't Send Report",
        action: () => {
          return true; // close the dialog
        }
      }
    ]
  });

  dialog.onClosed(() => {
    errorDialogInstance = null;
    errorQueue.length = 0; // Clear the queue
  });

  errorDialogInstance = { win: dialog };
}
