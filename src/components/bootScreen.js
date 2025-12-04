let lastCursorElement = null;

function hideBootScreen() {
    const bootScreenEl = document.getElementById("boot-screen");
    if (bootScreenEl) {
        const contentEl = document.getElementById("boot-screen-content");
        if (contentEl) {
            contentEl.style.visibility = "hidden";
        }
        bootScreenEl.classList.add("fade-out");
        setTimeout(() => {
            bootScreenEl.remove();
        }, 500);
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

function promptToContinue(showDiagnosticsPrompt = false) {
    return new Promise((resolve) => {
        removeLastBlinkingCursor();
        const bootLogEl = document.getElementById("boot-log");
        if (bootLogEl) {
            if (showDiagnosticsPrompt) {
                const diagPromptEl = document.createElement("div");
                diagPromptEl.textContent = "Press DEL for diagnostics...";
                bootLogEl.appendChild(diagPromptEl);
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
                    window.removeEventListener("keydown", continueHandler);
                    window.removeEventListener("touchstart", continueHandler);
                    resolve(null); // Timeout resolves with null
                }
            }, 1000);

            const continueHandler = (event) => {
                clearInterval(timer);
                window.removeEventListener("keydown", continueHandler);
                window.removeEventListener("touchstart", continueHandler);
                resolve(event.key || "any"); // Resolve with key name or 'any' for touch
            };

            window.addEventListener("keydown", continueHandler, { once: true });
            window.addEventListener("touchstart", continueHandler, { once: true });
        } else {
            resolve(null);
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
