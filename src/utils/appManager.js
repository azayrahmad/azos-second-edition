/**
 * AppManager - Handles app launching and window creation
 */

export function handleAppAction(app) {
  if (app.action.type === "window") {
    createWindow({
      title: app.title,
      icon: app.icon,
      ...app.action.window,
    });
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
  }

  document.body.appendChild(win.element);
  win.center();

  return win;
}
