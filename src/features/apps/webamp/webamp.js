// Webamp integration for the desktop environment
import { createTaskbarButton, removeTaskbarButton, updateTaskbarButton } from '../../components/taskbar.js';

let webampInstance = null;
let webampContainer = null;
let webampTaskbarButton = null;
let isMinimized = false;

export function launchWebampApp() {
  // If Webamp is already running, show it
  if (webampInstance) {
    showWebamp();
    return;
  }

  // Create container for Webamp (render directly to desktop)
  webampContainer = document.createElement('div');
  webampContainer.id = 'webamp-container';
  webampContainer.style.position = 'absolute';
  webampContainer.style.zIndex = window.Win98System ? window.Win98System.incrementZIndex() : '1000';
  webampContainer.style.left = '50px';
  webampContainer.style.top = '50px';
  document.body.appendChild(webampContainer);



  // Initialize Webamp
  import('https://unpkg.com/webamp@^2').then((Webamp) => {
    const { default: WebampClass } = Webamp;

    webampInstance = new WebampClass({
      initialTracks: [
        {
          metaData: {
            artist: "DJ Mike Llama",
            title: "Llama Whippin' Intro"
          },
          url: "https://dn721609.ca.archive.org/0/items/llamawhippinintrobydjmikellama/demo.mp3"
        }
      ]
    });

    // Set up Webamp event listeners
    webampInstance.onMinimize(() => {
      minimizeWebamp();
    });

    webampInstance.onClose(() => {
      closeWebamp();
    });

    webampInstance.renderWhenReady(webampContainer).then(() => {
      // Webamp is ready, show it
      showWebamp();

      // Add focus/blur event listeners to update taskbar button state
      const webampElement = document.getElementById('webamp');
      if (webampElement) {
        // Set the id for window management
        webampElement.id = 'webamp';

        webampElement.addEventListener('focusin', () => {
          // Webamp gained focus, update taskbar button and z-index
          if (webampTaskbarButton && !isMinimized) {
            updateTaskbarButton('webamp-taskbar-button', true, false);
            if (window.Win98System) {
              webampElement.style.zIndex = window.Win98System.incrementZIndex();
            }
          }
        });

        webampElement.addEventListener('focusout', () => {
          // Webamp lost focus, update taskbar button to appear unselected
          if (webampTaskbarButton) {
            updateTaskbarButton('webamp-taskbar-button', false, false);
          }
        });
      }
    });
    // Create taskbar button
    const taskbarButtonId = 'webamp-taskbar-button';
    webampTaskbarButton = createTaskbarButton(
      taskbarButtonId,
      new URL("../../assets/icons/winamp.png", import.meta.url).href,
      "Winamp"
    );

    // Override the default click behavior for Webamp taskbar button
    if (webampTaskbarButton) {
      webampTaskbarButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (isMinimized) {
          showWebamp();
        } else {
          minimizeWebamp();
        }
      });
    }
  }).catch((error) => {
    console.error('Failed to load Webamp:', error);
    webampContainer.innerHTML = '<div style="padding: 20px; text-align: center; background: white; border: 1px solid #ccc;">Failed to load Webamp. Please check your internet connection.</div>';
    showWebamp();
  });
}

function showWebamp() {
  const webampElement = document.getElementById('webamp');
  if (!webampElement) return;

  // Show Webamp completely when restored
  webampElement.style.display = 'block';
  webampElement.style.visibility = 'visible';
  isMinimized = false;

  // Bring Webamp to front using the window management system
  if (window.Win98System) {
    webampElement.style.zIndex = window.Win98System.incrementZIndex();
  }

  // Update taskbar button to show active state
  if (webampTaskbarButton) {
    updateTaskbarButton('webamp-taskbar-button', true, false);
  }
}

function minimizeWebamp() {
  const webampElement = document.getElementById('webamp');
  if (!webampElement) return;

  // Hide Webamp completely when minimized
  webampElement.style.display = 'none';
  webampElement.style.visibility = 'hidden';
  isMinimized = true;

  // Update taskbar button to show minimized state
  if (webampTaskbarButton) {
    updateTaskbarButton('webamp-taskbar-button', false, true);
  }
}

function closeWebamp() {
  if (webampContainer) {
    webampContainer.remove();
    webampContainer = null;
  }

  if (webampInstance) {
    webampInstance.dispose();
    webampInstance = null;
  }

  if (webampTaskbarButton) {
    removeTaskbarButton('webamp-taskbar-button');
    webampTaskbarButton = null;
  }

  isMinimized = false;
}

export function getWebampMenuItems() {
  if (!webampInstance) {
    return [
      { label: "Webamp not running", enabled: false },
      "MENU_DIVIDER",
      { label: "&Launch Webamp", click: () => launchWebampApp() }
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
      click: () => showWebamp(),
    },
    {
      label: "&Minimize Webamp",
      click: () => minimizeWebamp(),
    },
    "MENU_DIVIDER",
    {
      label: "&Close Webamp",
      click: () => closeWebamp(),
    },
  ];
}
