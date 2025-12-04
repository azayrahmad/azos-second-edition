// src/utils/diagnostics.js
import * as Desktop from '../components/desktop.js';
import { taskbar } from '../components/taskbar.js';
import StartMenu from '../components/StartMenu.js';
import * as DialogWindow from '../components/DialogWindow.js';
import { startBootProcessStep, finalizeBootProcessStep, removeLastBlinkingCursor } from '../components/bootScreen.js';

/**
 * A standardized test to check if a module has a specific function.
 * @param {object} module The module or object to test.
 * @param {string} functionName The name of the function to check for.
 * @returns {boolean} True if the function exists, false otherwise.
 */
const checkInitFunction = (module, functionName) => {
    return module && typeof module[functionName] === 'function';
};

/**
 * Runs diagnostic tests on core azOS components.
 * @returns {Promise<boolean>} A promise that resolves to true if all tests pass, false otherwise.
 */
export async function runDiagnostics() {
    removeLastBlinkingCursor();
    const bootLogEl = document.getElementById('boot-log');
    if (bootLogEl) {
        bootLogEl.innerHTML = 'Running System Diagnostics...<br/><br/>';
    }

    const tests = [
        { name: 'Desktop Manager', test: () => checkInitFunction(Desktop, 'initDesktop') },
        { name: 'Taskbar', test: () => checkInitFunction(taskbar, 'init') },
        { name: 'Start Menu', test: () => checkInitFunction(new StartMenu(), 'init') },
        { name: 'Dialog Window', test: () => checkInitFunction(DialogWindow, 'ShowDialogWindow') },
    ];

    let allTestsPassed = true;

    for (const { name, test } of tests) {
        let logElement = startBootProcessStep(`Checking ${name}...`);
        try {
            if (test()) {
                finalizeBootProcessStep(logElement, '[OK]');
            } else {
                throw new Error('Initialization function not found.');
            }
        } catch (error) {
            console.error(`Diagnostic test for ${name} failed:`, error);
            finalizeBootProcessStep(logElement, '[FAIL]');
            allTestsPassed = false;
            break; // Stop on first failure
        }
    }

    if (!allTestsPassed) {
        const errorMsg = document.createElement('div');
        errorMsg.style.marginTop = '1em';
        errorMsg.textContent = 'A critical component failed to load. System halted.';
        bootLogEl.appendChild(errorMsg);
    } else {
        const successMsg = document.createElement('div');
        successMsg.style.marginTop = '1em';
        successMsg.textContent = 'All checks passed.';
        bootLogEl.appendChild(successMsg);
    }

    return allTestsPassed;
}
