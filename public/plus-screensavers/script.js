document.addEventListener('DOMContentLoaded', () => {
  const screensaverSelect = document.getElementById('screensaver-select');
  const screensaverIframe = document.getElementById('screensaver-iframe');
  const previewButton = document.getElementById('preview-button');
  let fullscreenIframe = null;
  let fullscreenOverlay = null; // Variable for the overlay

  const screensavers = [
    { id: 'none', name: '(None)', path: 'about:blank' },
    { id: 'underwater', name: '3D Underwater', path: 'underwater/index.html' },
    { id: 'space', name: '3D Space', path: 'space/index.html' },
  ];

  // Populate the dropdown
  screensavers.forEach(ss => {
    const option = document.createElement('option');
    option.value = ss.id;
    option.textContent = ss.name;
    screensaverSelect.appendChild(option);
  });

  function loadScreensaver(id) {
    const screensaver = screensavers.find(ss => ss.id === id);
    if (screensaver) {
      screensaverIframe.src = screensaver.path;
      previewButton.disabled = id === 'none';
    }
  }

  // Load initial screensaver
  const initialScreensaver = screensavers[0].id;
  screensaverSelect.value = initialScreensaver;
  loadScreensaver(initialScreensaver);

  // Handle selection change
  screensaverSelect.addEventListener('change', (event) => {
    loadScreensaver(event.target.value);
  });

  const exitFullscreen = () => {
    // Remove both the iframe and the overlay
    if (fullscreenIframe && document.body.contains(fullscreenIframe)) {
      document.body.removeChild(fullscreenIframe);
      fullscreenIframe = null;
    }
    if (fullscreenOverlay && document.body.contains(fullscreenOverlay)) {
      document.body.removeChild(fullscreenOverlay);
      fullscreenOverlay = null;
    }
  };

  // Handle preview button click
  previewButton.addEventListener('click', () => {
    if (screensaverSelect.value === 'none') return;

    // Create iframe
    fullscreenIframe = document.createElement('iframe');
    fullscreenIframe.src = screensaverIframe.src;
    fullscreenIframe.id = 'fullscreen-preview';
    fullscreenIframe.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; border:none; z-index:9998;';

    // Create overlay
    fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.id = 'fullscreen-overlay'; // Add ID for easier selection in tests
    fullscreenOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:transparent; z-index:9999;';

    document.body.appendChild(fullscreenIframe);
    document.body.appendChild(fullscreenOverlay);

    // Add listeners to the overlay, not the window
    fullscreenOverlay.addEventListener('click', exitFullscreen, { once: true });
    window.addEventListener('keydown', exitFullscreen, { once: true });
  });
});
