let lastCursorElement = null;

function hideBootScreen() {
    const bootScreenEl = document.getElementById("boot-screen");
    if (bootScreenEl) {
        bootScreenEl.classList.add("fade-out");
        bootScreenEl.addEventListener("animationend", () => {
            bootScreenEl.remove();
        });
    }
}

function startBootProcessStep(message) {
    const bootLogEl = document.getElementById("boot-log");
    if (bootLogEl) {
        const logEntry = document.createElement("div");
        logEntry.textContent = message;

        const cursor = document.createElement("span");
        cursor.className = "blinking-cursor";
        cursor.textContent = "_";
        logEntry.appendChild(cursor);

        bootLogEl.appendChild(logEntry);
        return logEntry;
    }
    return null;
}

function finalizeBootProcessStep(logElement, status) {
    if (logElement) {
        const cursor = logElement.querySelector(".blinking-cursor");
        if (cursor) {
            cursor.remove();
        }
        logElement.textContent += ` ${status}`;
    }
}

function showBlinkingCursor() {
    const bootLogEl = document.getElementById("boot-log");
    if (bootLogEl) {
        if (lastCursorElement) {
            lastCursorElement.remove();
        }
        const cursorEntry = document.createElement("div");
        const cursor = document.createElement("span");
        cursor.className = "blinking-cursor";
        cursor.textContent = "_";
        cursorEntry.appendChild(cursor);
        bootLogEl.appendChild(cursorEntry);
        lastCursorElement = cursorEntry;
    }
}

function removeLastBlinkingCursor() {
    if (lastCursorElement) {
        lastCursorElement.remove();
        lastCursorElement = null;
    }
}

function promptToContinue() {
    return new Promise((resolve) => {
        removeLastBlinkingCursor();
        const bootLogEl = document.getElementById("boot-log");
        if (bootLogEl) {
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

export {
    hideBootScreen,
    startBootProcessStep,
    finalizeBootProcessStep,
    showBlinkingCursor,
    promptToContinue,
    removeLastBlinkingCursor,
};
