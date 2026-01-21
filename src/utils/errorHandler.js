import { showErrorDialog } from '../components/ErrorDialog.js';
import '../styles/error-dialog.css';

export function initErrorHandler() {
  const originalConsoleError = console.error;

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

    showErrorDialog({
      message: 'console.error: ' + message,
      stack: (args.find(arg => arg instanceof Error))?.stack
    });
  };

  window.onerror = function(message, source, lineno, colno, error) {
    showErrorDialog({
      message: `[uncaught] ${message}`,
      stack: error ? error.stack : `at ${source}:${lineno}:${colno}`
    });
    return true; // Prevents the default browser error handler
  };

  window.onunhandledrejection = function(event) {
    const error = event.reason || {};
    showErrorDialog({
      message: `[unhandledrejection] ${error.message || 'Unhandled promise rejection'}`,
      stack: error.stack
    });
  };
}
