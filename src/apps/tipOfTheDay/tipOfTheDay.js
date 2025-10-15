import './tipOfTheDay.css';
import tipOfTheDayHTML from './tipOfTheDay.html?raw';
import { handleAppAction } from '../../utils/appManager.js';
import { apps } from '../../config/apps.js';
import tipIconUrl from '../../assets/icons/RNAUI_106.ico';

export const tipOfTheDayContent = tipOfTheDayHTML.replace('TIP_ICON_PLACEHOLDER', tipIconUrl);

export function setup(contentElement) {
  const tips = [
    "To open a file or an application from desktop, double-click the icon.",
    "To close a window, click the X in the top-right corner.",
    "Need help? Try the <a href='#' class='tip-link' data-app='clippy'>Assistant</a> for assistance with azOS features."
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