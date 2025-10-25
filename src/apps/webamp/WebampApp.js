import { Application } from '../Application.js';
import { createTaskbarButton, removeTaskbarButton, updateTaskbarButton } from '../../components/taskbar.js';
import { ICONS } from '../../config/icons.js';

let webampInstance = null;
let webampContainer = null;
let webampTaskbarButton = null;
let isMinimized = false;

export class WebampApp extends Application {
    constructor(config) {
        super(config);
        this.hasTaskbarButton = true;
    }

    _createWindow() {
        // Webamp doesn't use a standard OS-GUI window, it renders directly to the body.
        // We manage its container and lifecycle here.
        return null; // Return null to prevent default window creation.
    }

    async _onLaunch() {
        return new Promise((resolve, reject) => {
            if (webampInstance) {
                this.showWebamp();
                return resolve();
            }

            webampContainer = document.createElement('div');
            webampContainer.id = 'webamp-container';
            webampContainer.style.position = 'absolute';
            webampContainer.style.zIndex = $Window.Z_INDEX++;
            webampContainer.style.left = '50px';
            webampContainer.style.top = '50px';
            document.body.appendChild(webampContainer);

            webampContainer.addEventListener('mousedown', () => {
                webampContainer.style.zIndex = $Window.Z_INDEX++;
            }, true);

            import('https://unpkg.com/webamp@^2').then((Webamp) => {
                const { default: WebampClass } = Webamp;

                webampInstance = new WebampClass({
                    initialTracks: [{
                        metaData: { artist: "DJ Mike Llama", title: "Llama Whippin' Intro" },
                        url: "https://dn721609.ca.archive.org/0/items/llamawhippinintrobydjmikellama/demo.mp3"
                    }]
                });

                webampInstance.onMinimize(() => this.minimizeWebamp());
                webampInstance.onClose(() => this.close());

                webampInstance.renderWhenReady(webampContainer).then(() => {
                    this.setupTaskbarButton();
                    this.showWebamp();
                    resolve(); // Resolve the promise once Webamp is ready
                }).catch(reject);

            }).catch(reject);
        });
    }

    setupTaskbarButton() {
        const taskbarButtonId = 'webamp-taskbar-button';
        webampTaskbarButton = createTaskbarButton(
            taskbarButtonId,
            ICONS.webamp,
            "Winamp"
        );

        if (webampTaskbarButton) {
            webampTaskbarButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isMinimized) {
                    this.showWebamp();
                } else {
                    this.minimizeWebamp();
                }
            });
        }
    }

    showWebamp() {
        const webampElement = document.getElementById('webamp');
        if (!webampElement) return;

        webampElement.style.display = 'block';
        webampElement.style.visibility = 'visible';
        isMinimized = false;
        webampContainer.style.zIndex = $Window.Z_INDEX++;
        if (webampTaskbarButton) {
            updateTaskbarButton('webamp-taskbar-button', true, false);
        }
    }

    minimizeWebamp() {
        const webampElement = document.getElementById('webamp');
        if (!webampElement) return;

        webampElement.style.display = 'none';
        webampElement.style.visibility = 'hidden';
        isMinimized = true;
        if (webampTaskbarButton) {
            updateTaskbarButton('webamp-taskbar-button', false, true);
        }
    }

    close() {
        if (webampContainer) {
            webampContainer.remove();
            webampContainer = null;
        }

        if (webampInstance) {
            webampInstance.dispose();
            webampInstance = null;
        }

        if (webampTaskbarButton) {
            removeTaskbarButton('webamp-taskbar-button');
            webampTaskbarButton = null;
        }
        isMinimized = false;

        // Remove from open apps list
        const { openApps } = require('../Application.js');
        openApps.delete(this.id);
    }
}
