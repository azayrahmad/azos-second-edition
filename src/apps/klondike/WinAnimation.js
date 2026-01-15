class BouncingCard {
  constructor(cardCanvas, startX, startY, canvasWidth, canvasHeight) {
    this.cardCanvas = cardCanvas;
    this.x = startX;
    this.y = startY;
    this.width = cardCanvas.width;
    this.height = cardCanvas.height;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    const angle = Math.random() * Math.PI - Math.PI; // Upward-biased angle
    const speed = 8 + Math.random() * 6;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.4;
    this.bounce = 0.65;

    this.trail = [];
    this.offScreen = false;
  }

  update() {
    if (this.offScreen) return;

    this.trail.push({ x: this.x, y: this.y });

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    // Bounce off bottom
    if (this.y + this.height > this.canvasHeight) {
      this.y = this.canvasHeight - this.height;
      this.vy *= -this.bounce;
      this.vx *= 0.98; // friction
    }

    // Check if off screen (top or sides)
    if (this.x + this.width < 0 || this.x > this.canvasWidth || this.y + this.height < 0) {
      this.offScreen = true;
    }
  }

  draw(ctx) {
    // Draw trail from oldest to newest
    for (const pos of this.trail) {
      ctx.drawImage(this.cardCanvas, pos.x, pos.y);
    }
    // Draw the main card on top
    if (!this.offScreen) {
      ctx.drawImage(this.cardCanvas, this.x, this.y);
    }
  }
}

export class WinAnimation {
  constructor(gameWindowElement, foundationPiles, onComplete) {
    this.gameWindowElement = gameWindowElement;
    this.foundationPiles = foundationPiles;
    this.onComplete = onComplete;
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.bouncingCards = [];
    this.cardRenderCache = new Map();
    this.animationSequence = [];

    this.boundAnimationLoop = this._animationLoop.bind(this);
    this.boundHandleKeyDown = this._handleKeyDown.bind(this);
  }

  async start() {
    this._createCanvas();
    if (!this.canvas) return;

    // Wait for the next frame to ensure the UI is fully rendered before capturing cards
    await new Promise(resolve => requestAnimationFrame(resolve));

    await this._preRenderCards();
    this._prepareAnimationSequence();
    document.addEventListener('keydown', this.boundHandleKeyDown);
    this.animationFrameId = requestAnimationFrame(this.boundAnimationLoop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }

  async _preRenderCards() {
    const allCards = this.foundationPiles.flatMap((pile) => pile.cards);
    if (allCards.length === 0) return;

    for (const card of allCards) {
      const key = `${card.suit}-${card.rank}`;
      if (this.cardRenderCache.has(key)) continue;

      // Ensure the card element is ready for rendering
      card.faceUp = true;
      const cardElement = card.element;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null, // Use transparent background
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight,
      });
      this.cardRenderCache.set(key, canvas);

      // Yield to the main thread to prevent UI from freezing
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }

  _createCanvas() {
    const gameBoard = this.gameWindowElement.querySelector('.game-board');
    if (!gameBoard) {
      console.error('Klondike game board not found for animation.');
      return;
    }

    const windowContent = this.gameWindowElement.querySelector('.window-content');
    windowContent.style.position = 'relative'; // Ensure correct positioning context

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = `${gameBoard.offsetTop}px`;
    this.canvas.style.left = `${gameBoard.offsetLeft}px`;
    this.canvas.width = gameBoard.offsetWidth;
    this.canvas.height = gameBoard.offsetHeight;
    this.canvas.style.zIndex = '1000';
    this.canvas.style.pointerEvents = 'none';

    windowContent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  _animationLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const lastCard = this.bouncingCards[this.bouncingCards.length - 1];
    const canLaunchNext = !lastCard || lastCard.offScreen;

    if (this.animationSequence.length > 0 && canLaunchNext) {
      const cardToLaunch = this.animationSequence.shift();
      const key = `${cardToLaunch.suit}-${cardToLaunch.rank}`;
      const cardCanvas = this.cardRenderCache.get(key);
      const startPos = this._getFoundationPileStartPosition(cardToLaunch);

      const newCard = new BouncingCard(cardCanvas, startPos.x, startPos.y, this.canvas.width, this.canvas.height);
      this.bouncingCards.push(newCard);
    }

    // Update and draw cards from oldest to newest
    for (const card of this.bouncingCards) {
      card.update();
      card.draw(this.ctx);
    }

    // Stop when all cards have been launched and are off screen
    if (this.animationSequence.length === 0 && this.bouncingCards.every(c => c.offScreen)) {
      this.stop();
      this.onComplete();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.boundAnimationLoop);
  }

  _getFoundationPileStartPosition(card) {
    const pileIndex = this.foundationPiles.findIndex(p => p.cards.some(c => c.uid === card.uid));
    const pileElement = this.gameWindowElement.querySelector(`.foundation-pile[data-pile-index='${pileIndex}']`);
    if (!pileElement) return { x: 0, y: 0 };

    const gameBoard = this.gameWindowElement.querySelector('.game-board');
    return {
      x: pileElement.offsetLeft - gameBoard.offsetLeft,
      y: pileElement.offsetTop - gameBoard.offsetTop,
    };
  }

  _prepareAnimationSequence() {
    const rankOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
    const suitOrder = ['♠', '♥', '♣', '♦'];
    const allCards = this.foundationPiles.flatMap((pile) => pile.cards);

    this.animationSequence = allCards.sort((a, b) => {
      const rankComparison = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
      if (rankComparison !== 0) return rankComparison;
      return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    });
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.stop();
      this.onComplete();
    }
  }
}
