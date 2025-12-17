document.addEventListener('DOMContentLoaded', () => {
  const screensaverSelect = document.getElementById('screensaver-select');
  const screensaverIframe = document.getElementById('screensaver-iframe');
  const previewButton = document.getElementById('preview-button');

  const screensavers = [
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
    }
  }

  // Load initial screensaver
  if (screensavers.length > 0) {
      const initialScreensaver = screensavers[0].id;
      screensaverSelect.value = initialScreensaver;
      loadScreensaver(initialScreensaver);
  }

  // Handle selection change
  screensaverSelect.addEventListener('change', (event) => {
    loadScreensaver(event.target.value);
  });

  // Handle preview button click
  previewButton.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = screensaverIframe.src;
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.zIndex = '9999';

    document.body.appendChild(iframe);

    const exitFullscreen = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      window.removeEventListener('click', exitFullscreen);
      window.removeEventListener('keydown', exitFullscreen);
      window.removeEventListener('mousemove', exitFullscreen);
    };

    // Use a timeout to avoid capturing the initial click
    setTimeout(() => {
        window.addEventListener('click', exitFullscreen);
        window.addEventListener('keydown', exitFullscreen);
        window.addEventListener('mousemove', exitFullscreen);
    }, 100);
  });
});
