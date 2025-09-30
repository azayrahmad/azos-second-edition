import './tipOfTheDay.css';
import tipOfTheDayHTML from './tipOfTheDay.html?raw';

export const tipOfTheDayContent = tipOfTheDayHTML;

export function setup(contentElement) {
  const tips = [
    "You can scroll text up one screen by pressing Page Up. Pressing Page Down scrolls text down one screen.",
    "To open a file, click the File menu, and then click Open.",
    "To save a file, click the File menu, and then click Save.",
    "You can switch between open windows by pressing Alt+Tab.",
    "To close a window, click the X in the top-right corner."
  ];

  let currentTipIndex = Math.floor(Math.random() * tips.length);

  const tipTextElement = contentElement.querySelector('#tip-text');
  const nextTipButton = contentElement.querySelector('#next-tip');

  // Display the initial random tip
  if (tipTextElement) {
    tipTextElement.textContent = tips[currentTipIndex];
  }

  if (nextTipButton && tipTextElement) {
    nextTipButton.addEventListener('click', () => {
      currentTipIndex = (currentTipIndex + 1) % tips.length;
      tipTextElement.textContent = tips[currentTipIndex];
    });
  }
}