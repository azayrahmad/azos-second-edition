import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

let term;
let fitAddon;

function initTerminal() {
    const terminalContainer = document.getElementById("terminal-container");
    if (!terminalContainer) {
        console.error("Terminal container not found");
        return;
    }

    term = new Terminal({
        cursorBlink: true,
        theme: {
            background: "#000000",
            foreground: "#AAAAAA",
        },
        fontFamily: '"IBM BIOS", Courier, monospace',
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalContainer);
    fitAddon.fit();

    window.addEventListener("resize", () => {
        fitAddon.fit();
    });
}

function writeToTerminal(text) {
    if (term) {
        term.write(text);
    }
}

function clearTerminal() {
    if (term) {
        term.clear();
    }
}

function disposeTerminal() {
    if (term) {
        term.dispose();
        term = null;
    }
}

function hideTerminal() {
    const bootScreenContainer = document.getElementById("boot-screen-container");
    if (bootScreenContainer) {
        bootScreenContainer.style.display = "none";
    }
}

function showSetupScreen() {
    clearTerminal();
    writeToTerminal("Welcome to setup screen");
}

function promptToContinue() {
    return new Promise((resolve) => {
        writeToTerminal("\r\nPress any key to continue... 10");
        let countdown = 9;
        const timer = setInterval(() => {
            term.write(`\rPress any key to continue... ${countdown}`);
            countdown--;
            if (countdown < 0) {
                clearInterval(timer);
                resolve();
            }
        }, 1000);

        const disposable = term.onKey((e) => {
            clearInterval(timer);
            disposable.dispose();
            resolve();
        });
    });
}

export {
    initTerminal,
    writeToTerminal,
    clearTerminal,
    disposeTerminal,
    hideTerminal,
    showSetupScreen,
    promptToContinue,
};
