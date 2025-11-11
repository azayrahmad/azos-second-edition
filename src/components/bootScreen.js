function hideBootScreen() {
  const bootScreenEl = document.getElementById('boot-screen');
  if (bootScreenEl) {
    bootScreenEl.remove();
  }
}

function updateBootLog(message) {
  const bootLogEl = document.getElementById('boot-log');
  if (bootLogEl) {
    bootLogEl.innerHTML += `<div>${message}</div>`;
  }
}

function promptToContinue() {
    return new Promise((resolve) => {
        const bootLogEl = document.getElementById('boot-log');
        if (bootLogEl) {
            const promptEl = document.createElement('div');
            let countdown = 10;
            promptEl.textContent = `Press any key to continue... ${countdown}`;
            bootLogEl.appendChild(promptEl);

            const timer = setInterval(() => {
                countdown--;
                promptEl.textContent = `Press any key to continue... ${countdown}`;
                if (countdown <= 0) {
                    clearInterval(timer);
                    window.removeEventListener('keydown', keydownHandler);
                    resolve();
                }
            }, 1000);

            const keydownHandler = () => {
                clearInterval(timer);
                window.removeEventListener('keydown', keydownHandler);
                resolve();
            };

            window.addEventListener('keydown', keydownHandler, { once: true });
        } else {
            resolve();
        }
    });
}

export { hideBootScreen, updateBootLog, promptToContinue };
