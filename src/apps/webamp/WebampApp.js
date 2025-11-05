import { Application } from '../Application.js';
import { createTaskbarButton, removeTaskbarButton, updateTaskbarButton } from '../../components/taskbar.js';
import { ICONS } from '../../config/icons.js';
import { appManager } from '../../utils/appManager.js';

export class WebampApp extends Application {
    constructor(config) {
        super(config);
        this.hasTaskbarButton = true;

        // Instance properties instead of module-level variables
        this.webampInstance = null;
        this.webampContainer = null;
        this.webampTaskbarButton = null;
        this.isMinimized = false;
    }

    _createWindow() {
        // Webamp doesn't use a standard OS-GUI window.
        return null;
    }

    async _onLaunch() {
        return new Promise((resolve, reject) => {
            // Check instance property for existing instance
            if (this.webampInstance) {
                this.showWebamp();
                return resolve();
            }

            this.webampContainer = document.createElement('div');
            this.webampContainer.id = 'webamp-container';
            this.webampContainer.style.position = 'absolute';
            this.webampContainer.style.zIndex = $Window.Z_INDEX++;
            this.webampContainer.style.left = '50px';
            this.webampContainer.style.top = '50px';
            document.body.appendChild(this.webampContainer);

            this.webampContainer.addEventListener('mousedown', () => {
                this.webampContainer.style.zIndex = $Window.Z_INDEX++;
            }, true);

            import('https://unpkg.com/webamp@^2').then((Webamp) => {
                const { default: WebampClass } = Webamp;

                this.webampInstance = new WebampClass({
                    initialTracks: [{
                        metaData: { artist: "DJ Mike Llama", title: "Llama Whippin' Intro" },
                        url: "https://dn721609.ca.archive.org/0/items/llamawhippinintrobydjmikellama/demo.mp3"
                    }]
                });

                this.webampInstance.onMinimize(() => this.minimizeWebamp());
                this.webampInstance.onClose(() => appManager.closeApp(this.id));

                this.webampInstance.renderWhenReady(this.webampContainer).then(() => {
                    this.setupTaskbarButton();
                    this.showWebamp();
                    resolve();
                }).catch(reject);

            }).catch(reject);
        });
    }

    setupTaskbarButton() {
        const taskbarButtonId = 'webamp-taskbar-button';
        this.webampTaskbarButton = createTaskbarButton(
            taskbarButtonId,
            ICONS.webamp,
            "Winamp"
        );

        if (this.webampTaskbarButton) {
            this.webampTaskbarButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (this.isMinimized) {
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

        webampElement.style.setProperty('display', 'block', 'important');
        webampElement.style.setProperty('visibility', 'visible', 'important');
        this.isMinimized = false;
        this.webampContainer.style.zIndex = $Window.Z_INDEX++;
        if (this.webampTaskbarButton) {
            updateTaskbarButton('webamp-taskbar-button', true, false);
        }
    }

    minimizeWebamp() {
        const webampElement = document.getElementById('webamp');
        if (!webampElement) return;

        webampElement.style.display = 'none';
        webampElement.style.visibility = 'hidden';
        this.isMinimized = true;
        if (this.webampTaskbarButton) {
            updateTaskbarButton('webamp-taskbar-button', false, true);
        }
    }

    close() {
        if (this.webampInstance) {
            this.webampInstance.dispose();
            this.webampInstance = null;
        }

        if (this.webampContainer) {
            this.webampContainer.remove();
            this.webampContainer = null;
        }

        if (this.webampTaskbarButton) {
            removeTaskbarButton('webamp-taskbar-button');
            this.webampTaskbarButton = null;
        }
        this.isMinimized = false;
    }
}
