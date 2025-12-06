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
                    window.removeEventListener("keydown", continueHandler);
                    window.removeEventListener("touchstart", continueHandler);
                    resolve();
                }
            }, 1000);

            const continueHandler = () => {
                clearInterval(timer);
                window.removeEventListener("keydown", continueHandler);
                window.removeEventListener("touchstart", continueHandler);
                resolve();
            };

            window.addEventListener("keydown", continueHandler, { once: true });
            window.addEventListener("touchstart", continueHandler, { once: true });
        } else {
            resolve();
        }
    });
}

function hideSetupPrompt() {
    const setupPromptEl = document.getElementById("setup-prompt");
    if (setupPromptEl) {
        setupPromptEl.style.display = "none";
    }
}

function enterSetupMode() {
    const bootScreenEl = document.getElementById("boot-screen");

    if (bootScreenEl) {
        const bootScreenContentEl = document.getElementById("boot-screen-content");
        if (bootScreenContentEl) {
            bootScreenContentEl.innerHTML = '<div id="boot-log" style="flex-grow: 1"></div>';
        }
        const bootLogEl = document.getElementById("boot-log");
        if (!bootLogEl) return;

        const setupContent = document.createElement("div");
        setupContent.innerHTML = `
            <div>Select what you want to do:</div>
            <div>1. Reset local storage</div>
            <div class="prompt">Enter selection:&nbsp;</div>
        `;
        bootLogEl.appendChild(setupContent);

        const inputContainer = setupContent.querySelector('.prompt');
        const blinkingCursor = document.createElement("span");
        blinkingCursor.className = "blinking-cursor";
        blinkingCursor.textContent = "_";
        inputContainer.appendChild(blinkingCursor);

        const keydownHandler = (e) => {
            if (e.key === '1') {
                window.removeEventListener('keydown', keydownHandler);
                blinkingCursor.remove();
                inputContainer.append('1');
                promptForConfirmation();
            }
        };

        const promptForConfirmation = () => {
            const confirmationPrompt = document.createElement("div");
            confirmationPrompt.innerHTML = `<div>Resetting local storage will erase all files and configurations. Continue? (Y/n)&nbsp;</div>`;
            bootLogEl.appendChild(confirmationPrompt);

            const confirmationInputContainer = confirmationPrompt.querySelector('div');
            const confirmationBlinkingCursor = document.createElement("span");
            confirmationBlinkingCursor.className = "blinking-cursor";
            confirmationBlinkingCursor.textContent = "_";
            confirmationInputContainer.appendChild(confirmationBlinkingCursor);

            const confirmationKeydownHandler = (e) => {
                const key = e.key.toLowerCase();
                if (key === 'y') {
                    window.removeEventListener('keydown', confirmationKeydownHandler);
                    confirmationBlinkingCursor.remove();
                    confirmationInputContainer.append('Y');
                    localStorage.clear();
                    location.reload();
                } else if (key === 'n') {
                    window.removeEventListener('keydown', confirmationKeydownHandler);
                    confirmationBlinkingCursor.remove();
                    confirmationInputContainer.append('n');
                    location.reload();
                }
            };

            window.addEventListener('keydown', confirmationKeydownHandler);
        };

        window.addEventListener('keydown', keydownHandler);
    }
}

export {
    hideBootScreen,
    startBootProcessStep,
    finalizeBootProcessStep,
    showBlinkingCursor,
    promptToContinue,
    removeLastBlinkingCursor,
    enterSetupMode,
    hideSetupPrompt
};
