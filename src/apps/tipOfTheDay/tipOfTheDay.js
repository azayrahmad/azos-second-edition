import './tipOfTheDay.css';
import tipOfTheDayHTML from './tipOfTheDay.html?raw';
import { handleAppAction } from '../../utils/appManager.js';
import { apps } from '../../config/apps.js';

export const tipOfTheDayContent = tipOfTheDayHTML;

export function setup(contentElement) {
  const tips = [
    "You can scroll text up one screen by pressing Page Up. Pressing Page Down scrolls text down one screen.",
    "To open a file, click the File menu, and then click Open.",
    "To save a file, click the File menu, and then click Save.",
    "You can switch between open windows by pressing Alt+Tab.",
    "To close a window, click the X in the top-right corner.",
    "Need help? Try the <a href='#' class='tip-link' data-app='clippy'>Office Assistant</a> for assistance with Windows 98 features."
  ];

  let currentTipIndex = Math.floor(Math.random() * tips.length);

  const tipTextElement = contentElement.querySelector('#tip-text');
  const nextTipButton = contentElement.querySelector('#next-tip');
  const closeButton = contentElement.querySelector('.button-group button:last-child');

  // Apply access keys to buttons
  if (nextTipButton) {
    nextTipButton.innerHTML = '';
    nextTipButton.appendChild(window.AccessKeys.toFragment('&Next Tip'));
  }
  if (closeButton) {
    closeButton.innerHTML = '';
    closeButton.appendChild(window.AccessKeys.toFragment('&Close'));
  }

  // Function to display a tip and setup link handlers
  const displayTip = (tipIndex) => {
    if (tipTextElement) {
      tipTextElement.innerHTML = tips[tipIndex];
      // Setup link handlers
      const links = tipTextElement.querySelectorAll('.tip-link');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const appId = link.getAttribute('data-app');
          const app = apps.find(a => a.id === appId);
          if (app) {
            handleAppAction(app);
          }
        });
      });
    }
  };

  // Display the initial random tip
  displayTip(currentTipIndex);

  if (nextTipButton && tipTextElement) {
    nextTipButton.addEventListener('click', () => {
      currentTipIndex = (currentTipIndex + 1) % tips.length;
      displayTip(currentTipIndex);
    });
  }
}