import { showErrorDialog } from '../components/ErrorDialog.js';
import { logBootError } from '../components/bootScreen.js';
import '../styles/error-dialog.css';

let isBooting = true;

export function initErrorHandler() {
  const originalConsoleError = console.error;

  const handleError = (error) => {
    if (isBooting) {
      logBootError(error);
    } else {
      showErrorDialog(error);
    }
  };

  console.error = function(...args) {
    originalConsoleError.apply(console, args);

    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    handleError({
      message: 'console.error: ' + message,
      stack: (args.find(arg => arg instanceof Error))?.stack
    });
  };

  window.onerror = function(message, source, lineno, colno, error) {
    handleError({
      message: `[uncaught] ${message}`,
      stack: error ? error.stack : `at ${source}:${lineno}:${colno}`
    });
    return true; // Prevents the default browser error handler
  };

  window.onunhandledrejection = function(event) {
    const error = event.reason || {};
    handleError({
      message: `[unhandledrejection] ${error.message || 'Unhandled promise rejection'}`,
      stack: error.stack
    });
  };
}

export function signalBootComplete() {
  isBooting = false;
}
