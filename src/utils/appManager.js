/**
 * AppManager - Handles app launching and window creation
 */
import { createTaskbarButton } from '../components/taskbar.js';

// Track open windows by app identifier
const openWindows = new Map();

export function handleAppAction(app) {
  if (app.action.type === "window") {
    // Check if window already exists
    const existingWindow = openWindows.get(app.id);
    if (existingWindow) {
      // Focus existing window instead of creating new one
      const $win = $(existingWindow.element);
      if ($win.is(":visible")) {
        $win.trigger("refocus-window");
      } else {
        // Restore if minimized
        existingWindow.restore();
        setTimeout(() => {
          $win.trigger("refocus-window");
        }, 0);
      }
      return;
    }

    // Create new window if none exists
    const win = createWindow({
      id: app.id,
      title: app.title,
      icon: app.icon,
      ...app.action.window,
    });

    // Store reference to window
    openWindows.set(app.id, win);
  } else if (app.action.type === "function") {
    app.action.handler();
  }
}

function createWindow(windowConfig) {
  const win = new $Window({
    title: windowConfig.title,
    outerWidth: windowConfig.width,
    outerHeight: windowConfig.height,
    resizable: windowConfig.resizable,
    icons: {
      16: windowConfig.icon,
    },
  });

  if (windowConfig.menuBar) {
    const menuBar = new MenuBar(windowConfig.menuBar);
    Object.values(windowConfig.menuBar)
      .flat()
      .forEach((item) => {
        if (item.action) {
          const originalAction = item.action;
          item.action = () => originalAction(win);
        }
      });
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

  // Create taskbar button
  const taskbarButton = createTaskbarButton(
    win.element.id,
    windowConfig.icon,
    windowConfig.title
  );  // Add app-window class for taskbar compatibility
  win.element.classList.add('app-window');

  // Connect the window's minimize target to the taskbar button
  win.setMinimizeTarget(taskbarButton);

  win.focus();
  win.center();

  return win;
}
