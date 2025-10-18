import { Application } from '../Application.js';
import { tipOfTheDayContent } from './tipOfTheDay.js';
import { tips } from '../../config/tips.js';
import { launchApp } from '../../utils/appManager.js';

export class TipOfTheDayApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            minimizeButton: this.minimizeButton,
            maximizeButton: this.maximizeButton,
            icons: this.icon,
        });

        win.$content.html(tipOfTheDayContent);
        return win;
    }

    _onLaunch() {
        const contentElement = this.win.$content[0];
        let currentTipIndex = Math.floor(Math.random() * tips.length);

        const tipTextElement = contentElement.querySelector('#tip-text');
        const nextTipButton = contentElement.querySelector('#next-tip');
        const closeButton = contentElement.querySelector('.button-group button:last-child');

        if (nextTipButton) {
            nextTipButton.innerHTML = '';
            nextTipButton.appendChild(window.AccessKeys.toFragment('&Next Tip'));
        }
        if (closeButton) {
            closeButton.innerHTML = '';
            closeButton.appendChild(window.AccessKeys.toFragment('&Close'));
            closeButton.addEventListener('click', () => this.win.close());
        }

        const displayTip = (tipIndex) => {
            if (tipTextElement) {
                tipTextElement.innerHTML = tips[tipIndex];
                const links = tipTextElement.querySelectorAll('.tip-link');
                links.forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const appId = link.getAttribute('data-app');
                        launchApp(appId);
                    });
                });
            }
        };

        displayTip(currentTipIndex);

        if (nextTipButton && tipTextElement) {
            nextTipButton.addEventListener('click', () => {
                currentTipIndex = (currentTipIndex + 1) % tips.length;
                displayTip(currentTipIndex);
            });
        }
    }
}