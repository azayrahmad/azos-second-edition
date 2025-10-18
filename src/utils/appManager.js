/**
 * AppManager - Handles app launching and window creation
 */
import { createTaskbarButton, createTrayIcon } from '../components/taskbar.js';

// Track open windows by app identifier
const openWindows = new Map();

import { createPdfViewerContent } from "../apps/pdfviewer/pdfviewer.js";
import { Notepad } from '../apps/notepad/notepad.js';
import { Explorer } from '../apps/explorer/Explorer.js';

export function handleAppAction(app) {
  document.body.style.cursor = "wait";

  try {
    if (app.action.type === "window") {
      // For apps that open files, we use the file path as a unique identifier for the window.
      const windowId = app.filePath ? `${app.id}-${app.filePath}` : app.id;

      const existingWindow = openWindows.get(windowId);
      if (existingWindow) {
        const $win = $(existingWindow.element);
        if ($win.is(":visible")) {
          $win.trigger("refocus-window");
        } else {
          existingWindow.restore();
          setTimeout(() => {
            $win.trigger("refocus-window");
          }, 0);
        }
        return;
      }

      let windowContent = app.action.window.content;
      if (app.filePath && app.id === "pdfviewer") {
        windowContent = createPdfViewerContent(app.filePath);
      }

      const win = createWindow({
        id: windowId,
        title: app.title,
        icon: app.icon,
        hasTaskbarButton: app.hasTaskbarButton,
        ...app.action.window,
        content: windowContent, // Use potentially modified content
      });

      if (app.id === "notepad") {
        const notepadContainer = win.$content.find(".notepad-container")[0];
        if (notepadContainer) {
          new Notepad(notepadContainer, win);
        }
      }

      if (app.id === "explorer") {
        const explorerContainer = win.$content.find(".explorer-container")[0];
        if (explorerContainer) {
          new Explorer(explorerContainer, win);
        }
      }

      openWindows.set(windowId, win);
    } else if (app.action.type === "function") {
      app.action.handler();
    }

    // Create tray icon if app is configured to have one
    if (app.hasTray) {
      createTrayIcon(app);
    }
  } finally {
    // Use a short timeout to ensure the browser has time to render the 'wait' cursor
    // before it's immediately reset. This prevents a race condition.
    setTimeout(() => {
      document.body.style.cursor = "default";
    }, 50);
  }
}

function createWindow(windowConfig) {
  const win = new $Window({
    title: windowConfig.title,
    outerWidth: windowConfig.width,
    outerHeight: windowConfig.height,
    resizable: windowConfig.resizable,
    minimizeButton: windowConfig.minimizeButton,
    maximizeButton: windowConfig.maximizeButton,
    icons: {
      16: windowConfig.icon,
    },
  });

  if (windowConfig.menuBar) {
    const menuBarDef =
      typeof windowConfig.menuBar === "function"
        ? windowConfig.menuBar(win)
        : windowConfig.menuBar;
    const menuBar = new MenuBar(menuBarDef);
    win.setMenuBar(menuBar);
  }

  if (windowConfig.content) {
    win.$content.html(windowConfig.content);
    if (windowConfig.setup) {
      windowConfig.setup(win.$content[0]);
    }
  }

  win.onClosed(() => {
    // Remove taskbar button when window is closed
    const taskbarButton = document.querySelector(
      `.taskbar-button[for="${win.element.id}"]`
    );
    if (taskbarButton) {
      taskbarButton.remove();
    }
    // Remove from openWindows Map
    for (const [appId, window] of openWindows.entries()) {
      if (window === win) {
        openWindows.delete(appId);
        break;
      }
    }
  });

  document.body.appendChild(win.element);

  // Use the passed-in ID, otherwise generate a unique one
  if (windowConfig.id) {
    win.element.id = windowConfig.id;
  } else if (!win.element.id) {
    win.element.id = 'window_' + Math.random().toString(36).substr(2, 9);
  }

  // Store jQuery window object reference
  $(win.element).data('$window', win);

  // Create taskbar button only if explicitly configured
  if (windowConfig.hasTaskbarButton) {
    const taskbarButton = createTaskbarButton(
      win.element.id,
      windowConfig.icon,
      windowConfig.title
    );
    win.element.classList.add('app-window');
    win.setMinimizeTarget(taskbarButton);
  }

  win.focus();
  win.center();

  return win;
}
