// Webamp integration for the desktop environment
import { launchApp } from '../../utils/appManager.js';
import { openApps } from '../Application.js';
import { webampInstance } from './WebampApp.js';

export async function playInWebamp(file) {
  await launchApp('webamp');

  const track = {
    metaData: {
      artist: file.artist || 'Unknown Artist',
      title: file.title || file.name,
    },
    url: file.contentUrl || file.content,
  };

  if (webampInstance) {
    webampInstance.setTracksToPlay([track]);
  }
}

export function getWebampMenuItems(app) {
  const webampApp = openApps.get('webamp');

  if (!webampApp) {
    return [
      { label: "Webamp not running", enabled: false },
      "MENU_DIVIDER",
      { label: "&Launch Webamp", click: () => launchApp('webamp') }
    ];
  }

  const webampInstance = webampApp.webampInstance;
  if (!webampInstance) {
    return [
      { label: "Webamp is loading...", enabled: false },
      "MENU_DIVIDER",
      { label: "&Launch Webamp", click: () => launchApp('webamp') }
    ];
  }

  return [
    {
      label: "&Play/Pause",
      click: () => {
        const status = webampInstance.getMediaStatus();
        if (status === "PLAYING") {
          webampInstance.pause();
        } else {
          webampInstance.play();
        }
      },
    },
    {
      label: "&Stop",
      click: () => webampInstance.stop(),
    },
    {
      label: "&Next Track",
      click: () => webampInstance.nextTrack(),
    },
    {
      label: "&Previous Track",
      click: () => webampInstance.previousTrack(),
    },
    "MENU_DIVIDER",
    {
      label: "&Show Webamp",
      click: () => webampApp.showWebamp(),
    },
    {
      label: "&Minimize Webamp",
      click: () => webampApp.minimizeWebamp(),
    },
    "MENU_DIVIDER",
    {
      label: "&Close Webamp",
      click: () => webampApp.close(),
    },
  ];
}
