
const TRAIL_LENGTH = 8;
const ANIMATION_DURATION = 12000; // 12 seconds

export class CardAnimator {
  constructor(container, foundationPiles) {
    this.container = container;
    this.foundationPiles = foundationPiles;
    this.cards = [];
    this.animationFrameId = null;
    this.onComplete = null;
    this.startTime = null;
  }

  start(onComplete) {
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this._prepareCards();
    this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this._cleanup();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  _prepareCards() {
    const containerRect = this.container.getBoundingClientRect();
    this.container.querySelector('.game-board').style.display = 'none';

    this.foundationPiles.forEach((pile) => {
      pile.cards.forEach((card) => {
        const cardElement = card.element;
        const rect = cardElement.getBoundingClientRect();

        const animatedCard = {
          element: cardElement.cloneNode(true),
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          vx: Math.random() * 6 - 3,
          vy: Math.random() * 6 - 3,
          trail: [],
          trailIndex: 0,
        };

        animatedCard.element.style.position = 'absolute';
        animatedCard.element.style.left = '0px';
        animatedCard.element.style.top = '0px';
        animatedCard.element.style.transform = `translate(${animatedCard.x}px, ${animatedCard.y}px)`;
        animatedCard.element.style.zIndex = 1000;
        this.container.appendChild(animatedCard.element);

        for (let i = 0; i < TRAIL_LENGTH; i++) {
            const trailElement = cardElement.cloneNode(true);
            trailElement.style.position = 'absolute';
            trailElement.style.left = '0px';
            trailElement.style.top = '0px';
            trailElement.style.zIndex = 999;
            trailElement.style.opacity = '0';
            this.container.appendChild(trailElement);
            animatedCard.trail.push(trailElement);
        }

        this.cards.push(animatedCard);
      });
    });
  }

  _animate() {
    const now = Date.now();
    if (now - this.startTime > ANIMATION_DURATION) {
      this.stop();
      return;
    }

    const bounds = this.container.getBoundingClientRect();

    this.cards.forEach((card) => {
      card.x += card.vx;
      card.y += card.vy;

      if (card.x <= 0 || card.x + card.element.offsetWidth >= bounds.width) {
        card.vx *= -1;
      }
      if (card.y <= 0 || card.y + card.element.offsetHeight >= bounds.height) {
        card.vy *= -1;
      }

      card.x = Math.max(0, Math.min(card.x, bounds.width - card.element.offsetWidth));
      card.y = Math.max(0, Math.min(card.y, bounds.height - card.element.offsetHeight));

      card.element.style.transform = `translate(${card.x}px, ${card.y}px)`;

      const trailElement = card.trail[card.trailIndex];
      trailElement.style.transform = `translate(${card.x}px, ${card.y}px)`;

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const index = (card.trailIndex - i + TRAIL_LENGTH) % TRAIL_LENGTH;
        const opacity = (1 - i / TRAIL_LENGTH) * 0.4;
        card.trail[index].style.opacity = opacity.toString();
      }

      card.trailIndex = (card.trailIndex + 1) % TRAIL_LENGTH;
    });

    this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
  }

  _cleanup() {
    this.cards.forEach((card) => {
      if (card.element.parentNode) {
        card.element.parentNode.removeChild(card.element);
      }
      card.trail.forEach((trailElement) => {
        if (trailElement.parentNode) {
            trailElement.parentNode.removeChild(trailElement);
        }
      });
    });
    this.cards = [];

     const gameBoard = this.container.querySelector('.game-board');
     if (gameBoard) {
        gameBoard.style.display = '';
     }
  }
}
