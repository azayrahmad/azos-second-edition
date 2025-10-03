let webampInstance = null;

/**
 * Creates and renders the Webamp instance within a given container.
 * @param {HTMLElement} container - The DOM element to render Webamp into.
 */
export async function setupWebamp(container) {
  if (webampInstance) {
    // This case should ideally not be hit if window management is correct.
    return;
  }

  // Dynamically import Webamp
  const Webamp = (await import("https://unpkg.com/webamp@^2")).default;

  // Ensure the container is empty before rendering
  container.innerHTML = '';

  webampInstance = new Webamp({
    // Initial options can be set here if needed
  });

  // Render the Webamp instance into the provided container
  await webampInstance.renderWhenReady(container);
}

/**
 * Returns the context menu items for the Webamp application.
 * This is used for the taskbar button context menu.
 */
export function getWebampMenuItems() {
  return [
    {
      label: "E&xit",
      action: () => {
        if (webampInstance) {
          webampInstance.close();
          webampInstance = null;
        }
      },
    },
  ];
}

/**
 * Handles the cleanup when the Webamp window is closed.
 */
export function onWindowClose() {
  if (webampInstance) {
    webampInstance.close();
    webampInstance = null;
  }
}