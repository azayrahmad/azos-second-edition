import { appManager } from "../../utils/appManager.js";

let sheepInstances = [];
let eSheepAppInstance = null;

export function closeAllESheep() {
  sheepInstances.forEach((sheep) => sheep.remove());
  sheepInstances = [];
  const trayIcon = document.querySelector("#tray-icon-esheep");
  if (trayIcon) {
    trayIcon.remove();
  }
}

export function getESheepMenuItems(app) {
  return [
    {
      label: "Add another sheep",
      action: () => {
        const newSheep = new window.eSheep();
        newSheep.Start();
        sheepInstances.push(newSheep);
      },
    },
    "MENU_DIVIDER",
    {
      label: "Close",
      action: () => {
        if (eSheepAppInstance) {
          appManager.closeApp(eSheepAppInstance.id);
        }
      },
    },
  ];
}

export function showESheepContextMenu(event, app) {
  const menuItems = getESheepMenuItems(app);
  new window.ContextMenu(menuItems, event);
}

export function launchESheepApp(app) {
  if (app) {
    eSheepAppInstance = app;
  }

  if (sheepInstances.length === 0) {
    const firstSheep = new window.eSheep();
    firstSheep.Start();
    sheepInstances.push(firstSheep);
  } else {
    const newSheep = new window.eSheep();
    newSheep.Start();
    sheepInstances.push(newSheep);
  }
}
