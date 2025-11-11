function hideBootScreen() {
  const bootScreenEl = document.getElementById('boot-screen');
  if (bootScreenEl) {
    bootScreenEl.remove();
  }
}

function updateBootLog(message, append = false) {
  const bootLogEl = document.getElementById("boot-log");
  if (bootLogEl) {
    // Remove the previous cursor if it exists
    const existingCursor = bootLogEl.querySelector(".blinking-cursor-container");
    if (existingCursor) {
      existingCursor.remove();
    }

    if (append && bootLogEl.lastChild) {
      // Append message to the last log entry
      bootLogEl.lastChild.innerHTML += message;
    } else {
      // Create a new log entry
      const newLogEntry = document.createElement("div");
      newLogEntry.innerHTML = message;
      bootLogEl.appendChild(newLogEntry);
    }

    // Add the blinking cursor at the end
    const cursorEl = document.createElement("div");
    cursorEl.className = "blinking-cursor-container";
    cursorEl.innerHTML = '<span class="blinking-cursor">_</span>';
    bootLogEl.appendChild(cursorEl);
  }
}

function promptToContinue() {
  return new Promise((resolve) => {
    const bootLogEl = document.getElementById("boot-log");
    if (bootLogEl) {
      // Remove the blinking cursor before showing the prompt
      const existingCursor = bootLogEl.querySelector(
        ".blinking-cursor-container",
      );
      if (existingCursor) {
        existingCursor.remove();
      }

      const promptEl = document.createElement("div");
      let countdown = 10;
      promptEl.textContent = `Press any key to continue... ${countdown}`;
      bootLogEl.appendChild(promptEl);

      const timer = setInterval(() => {
        countdown--;
        promptEl.textContent = `Press any key to continue... ${countdown}`;
        if (countdown <= 0) {
          clearInterval(timer);
          window.removeEventListener("keydown", keydownHandler);
          resolve();
        }
      }, 1000);

      const keydownHandler = () => {
        clearInterval(timer);
        window.removeEventListener("keydown", keydownHandler);
        resolve();
      };

      window.addEventListener("keydown", keydownHandler, { once: true });
    } else {
      resolve();
    }
  });
}

export { hideBootScreen, updateBootLog, promptToContinue };
