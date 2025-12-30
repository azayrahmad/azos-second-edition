import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { sprite } from "./sprite.js";
import solitaireHTML from "./solitaire.html?raw";
import "./solitaire.css";
import { ShowComingSoonDialog } from "../../components/DialogWindow.js";

export class SolitaireApp extends Application {
  static config = {
    id: "solitaire",
    title: "Solitaire",
    icon: ICONS.solitaire,
    width: 675,
    height: 500,
    resizable: false,
    menu: [
      {
        label: "Game",
        submenu: [
          {
            label: "New Game",
            action: "app.resetGame",
          },
          {
            type: "divider",
          },
          {
            label: "Options...",
            action: () => ShowComingSoonDialog("Options"),
          },
          {
            type: "divider",
          },
          {
            label: "Exit",
            action: "app.win.close",
          },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Help Topics",
            action: () => ShowComingSoonDialog("Help Topics"),
          },
          {
            label: "About Solitaire",
            action: () => ShowComingSoonDialog("About Solitaire"),
          },
        ],
      },
    ],
  };

  _createWindow() {
    const win = super._createWindow(this.constructor.config);
    win.app = this; // Make app instance available to menu actions
    win.$content.html(solitaireHTML);
    win.$content.addClass("solitaire-container");

    // Add card sprite sheet to the document head
    if (!document.getElementById("solitaire-sprite-style")) {
      const css = document.createElement("style");
      css.id = "solitaire-sprite-style";
      css.textContent = `.card--front { background-image: url("${sprite}"); }`;
      document.head.appendChild(css);
    }

    return win;
  }

  async _onLaunch() {
    this._initGame();
  }

  _initGame() {
    // --- Get DOM elements ---
    this.gameEl = this.win.$content.find(".solitaire")[0];
    this.dealPileEl = this.win.$content.find("#js-deck-pile")[0];
    this.dealEl = this.win.$content.find("#js-deck-deal")[0];
    this.finishContainerEl = this.win.$content.find("#js-finish")[0];
    this.deskContainerEl = this.win.$content.find("#js-board")[0];

    // --- Initialize State ---
    this.state = {
      types: ["c", "d", "h", "s"],
      colors: { c: 0, d: 1, h: 1, s: 0 }, // 0: black, 1: red
      cards: [],
      deal: {
        pile: { el: this.dealPileEl, cards: [] },
        deal: { el: this.dealEl, cards: [] },
      },
      finish: [],
      desk: [],
      moving: {
        capture: false,
        element: null,
        index: -1,
        card: null,
        origin: null,
        offset: { x: 0, y: 0 },
        destinations: [],
      },
    };

    // --- Create Cards ---
    for (let i = 0; i < 4; i++) {
      for (let j = 1; j <= 13; j++) {
        const el = document.createElement("div");
        el.classList.add(
          "card",
          `card--${this.state.types[i]}-${j}`,
          "card--back"
        );
        this.state.cards.push({
          el: el,
          type: this.state.types[i],
          number: j,
          facingUp: false,
          id: this.state.cards.length,
        });
      }
    }

    // --- Create Finish Piles (Aces) ---
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("div");
      el.classList.add("aces", `aces--${i}`);
      this.state.finish.push({ el: el, cards: [] });
      this.finishContainerEl.appendChild(el);
    }

    // --- Create Desk Piles (Tableau) ---
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("div");
      el.classList.add("seven", `seven--${i}`);
      this.state.desk.push({ el: el, cards: [] });
      this.deskContainerEl.appendChild(el);
    }

    // --- Setup Event Listeners ---
    this.dealPileEl.onclick = () => this._restartDeal();
    this.win.$content[0].onmousemove = (e) => this._handleMove(e);
    this.win.$content[0].onmouseup = (e) => this._releaseMove(e);

    this.resetGame();
  }

  resetGame() {
    if (this.winAnimation) {
        this.winAnimation.stop();
        this.winAnimation = null;
    }
    // Clear decks
    this.state.desk.forEach((pile) => {
        pile.cards = [];
        // Clear any leftover card elements
        while(pile.el.firstChild) {
            pile.el.removeChild(pile.el.firstChild);
        }
    });
    this.state.finish.forEach((pile) => {
        pile.cards = [];
        while(pile.el.firstChild) {
            pile.el.removeChild(pile.el.firstChild);
        }
    });
    this.state.deal.pile.cards = [];
    this.state.deal.deal.cards = [];
     while(this.dealEl.firstChild) {
        this.dealEl.removeChild(this.dealEl.firstChild);
    }
     while(this.dealPileEl.firstChild) {
        this.dealPileEl.removeChild(this.dealPileEl.firstChild);
    }

    // Create a shuffled deck
    this.shuffledDeck = [...this.state.cards].sort(() => Math.random() - 0.5);

    // Re-parent all card elements to the deal pile and set them face down
    this.shuffledDeck.forEach((cardData) => {
      this.state.deal.pile.cards.push(cardData.id);
      this._faceDown(cardData);
       // Ensure card is not absolutely positioned from a previous game
      cardData.el.style.position = '';
      cardData.el.style.left = '';
      cardData.el.style.top = '';
      this.dealPileEl.appendChild(cardData.el);

      cardData.el.onmousedown = (e) => this._captureMove(cardData.id, e);
      cardData.el.onclick = (e) => this._handleClick(cardData.id, e);
    });

    this._dealCards();
  }

  _dealCards() {
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            const cardId = this.state.deal.pile.cards.pop();
            if (cardId === undefined) continue;

            const cardData = this.state.cards[cardId];
            const deskPile = this.state.desk[j];

            const lastCardInPile = deskPile.cards.length > 0
                ? this.state.cards[deskPile.cards[deskPile.cards.length - 1]]
                : null;

            if (lastCardInPile) {
                lastCardInPile.el.appendChild(cardData.el);
            } else {
                deskPile.el.appendChild(cardData.el);
            }

            deskPile.cards.push(cardId);

            if (j === i) {
                this._faceUp(cardData);
            }
        }
    }
  }

  // --- Event Handlers ---

  _handleClick(cardId, event) {
      event.stopPropagation();
      if (this.state.moving.capture) return;
      this._releaseMove(event); // Clear any pending move timeouts

      const card = this.state.cards[cardId];
      if (!card.facingUp) {
          // Logic for clicking face-down card in the deal pile
          const location = this._getCardLocation(cardId);
          if (location && location.location === 'deal' && location.pile === 'pile') {
              const count = Math.min(3, this.state.deal.pile.cards.length);

              for (let i = 0; i < count; i++) {
                  const dealtCardId = this.state.deal.pile.cards.pop();
                  const dealtCard = this.state.cards[dealtCardId];
                  this._faceUp(dealtCard);
                  this.state.deal.deal.cards.push(dealtCardId);
                  this.dealEl.appendChild(dealtCard.el);
              }
          }
          return;
      }

      // Logic for clicking a face-up card
      const { location, pile } = this._getCardLocation(cardId);

      // Check if it's the top card of the dealt pile
      if (location === 'deal' && pile === 'deal') {
          const dealPile = this.state.deal.deal.cards;
          if (cardId !== dealPile[dealPile.length - 1]) return;
      }

      const destinations = this._getAvailableDestinations(cardId, true);
      if (destinations.length > 0) {
          const { target, el: destEl } = destinations[0];
          const { dest: destTarget, pile: pileTarget, card: cardTarget } = target;

          this._moveCardTo(destTarget, pileTarget, cardTarget);

          if (location === 'desk') {
              this._faceUpLastOnDesk(pile);
          }
          destEl.appendChild(card.el);
          this._gameFinishCheck();
      }
  }

  _restartDeal() {
      if (this.state.deal.pile.cards.length > 0 || this.state.deal.deal.cards.length === 0) return;

      this.state.deal.pile.cards = this.state.deal.deal.cards.reverse();
      this.state.deal.deal.cards = [];

      for (const cardId of this.state.deal.pile.cards) {
          const card = this.state.cards[cardId];
          this._faceDown(card);
          this.dealPileEl.appendChild(card.el);
      }
  }

  _captureMove(cardId, event) {
      event.preventDefault();
      event.stopPropagation();

      const card = this.state.cards[cardId];
      if (!card.facingUp) return;

      const { location, pile } = this._getCardLocation(cardId);
      if (location === 'deal' && pile === 'deal') {
          const dealPile = this.state.deal.deal.cards;
          if (cardId !== dealPile[dealPile.length - 1]) return;
      }

      this.movingTimeout = setTimeout(() => {
          this.state.moving.element = event.target;
          this.state.moving.capture = true;
          this.state.moving.index = cardId;
          this.state.moving.card = card;
          this.state.moving.origin = this._getCardLocation(cardId);

          this._startMovingPosition(event);

          const destinations = this._getAvailableDestinations(cardId);
          this.state.moving.destinations = destinations;

          destinations.forEach(dest => dest.el.classList.add('finish-dest'));
      }, 200);
  }

  _handleMove(event) {
      if (!this.state.moving.capture) return;

      const el = this.state.moving.element;
      const { clientX, clientY } = event;

      const contentRect = this.win.$content[0].getBoundingClientRect();

      el.style.left = `${clientX - contentRect.left - this.state.moving.offset.x}px`;
      el.style.top = `${clientY - contentRect.top - this.state.moving.offset.y}px`;
  }

  _releaseMove(event) {
      clearTimeout(this.movingTimeout);
      if (!this.state.moving.capture) return;

      const { clientX, clientY } = event;
      this._dropCard(clientX, clientY);

      this.state.moving.element.classList.remove('card--moving');
      this.state.moving.element.style.left = '';
      this.state.moving.element.style.top = '';

      this.state.moving.destinations.forEach(dest => dest.el.classList.remove('finish-dest'));

      this.state.moving = { ...this.state.moving, capture: false, element: null, destinations: [] };
  }

  _dropCard(x, y) {
      let dropped = false;
      for (const destination of this.state.moving.destinations) {
          const rect = destination.el.getBoundingClientRect();
          if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
              const { dest, pile, card } = destination.target;
              this._moveCardTo(dest, pile, card);
              destination.el.appendChild(this.state.moving.element);

              const { location: originLocation, pile: originPile } = this.state.moving.origin;
              if (originLocation === 'desk') {
                  this._faceUpLastOnDesk(originPile);
              }
              this._gameFinishCheck();
              dropped = true;
              break;
          }
      }

      if(!dropped) {
        //   Return card to original position
        const { location, pile, index } = this.state.moving.origin;
        if (!location) return;
        const sourcePileData = this.state[location][pile];

        if(location === 'desk' && sourcePileData.cards.length > 0) {
            const lastCardId = sourcePileData.cards[sourcePileData.cards.length - 1];
            const lastCardEl = this.state.cards[lastCardId].el;
            lastCardEl.appendChild(this.state.moving.element);
        } else {
            sourcePileData.el.appendChild(this.state.moving.element);
        }
      }
  }

  // --- Game Logic & Utility Methods ---

  _startMovingPosition(event) {
      const el = this.state.moving.element;
      const { clientX, clientY } = event;
      const rect = el.getBoundingClientRect();
      const contentRect = this.win.$content[0].getBoundingClientRect();

      el.classList.add('card--moving');

      this.state.moving.offset = {
          x: clientX - rect.left,
          y: clientY - rect.top,
      };

      this.win.$content[0].appendChild(el);
      el.style.left = `${clientX - contentRect.left - this.state.moving.offset.x}px`;
      el.style.top = `${clientY - contentRect.top - this.state.moving.offset.y}px`;
  }

  _getCardLocation(cardId) {
      for (let i = 0; i < 7; i++) {
          const index = this.state.desk[i].cards.indexOf(cardId);
          if (index > -1) return { location: 'desk', pile: i, index: index };
      }
      for (let i = 0; i < 4; i++) {
          const index = this.state.finish[i].cards.indexOf(cardId);
          if (index > -1) return { location: 'finish', pile: i, index: index };
      }
      for (const pileName of ['deal', 'pile']) {
          const index = this.state.deal[pileName].cards.indexOf(cardId);
          if (index > -1) return { location: 'deal', pile: pileName, index: index };
      }
      return null;
  }

  _moveCardTo(dest, pileIndex, cardId) {
      const location = this._getCardLocation(cardId);
      if (!location) return;

      const { location: sourceLocation, pile: sourcePileName, index: sourceIndex } = location;

      const sourcePile = this.state[sourceLocation][sourcePileName].cards;
      const movingIds = sourcePile.slice(sourceIndex);

      // Remove from source
      sourcePile.length = sourceIndex;

      // Add to destination
      this.state[dest][pileIndex].cards.push(...movingIds);
  }

  _getAvailableDestinations(cardId, firstOnly = false) {
      const card = this.state.cards[cardId];
      const destinations = [];

      // Check finish piles
      const subCards = this._getSubCards(cardId);
      if (subCards.length === 0) {
          for (let i = 0; i < 4; i++) {
              const finishPile = this.state.finish[i];
              if (finishPile.cards.length === 0) {
                  if (card.number === 1) {
                      destinations.push({ el: finishPile.el, target: { dest: 'finish', pile: i, card: cardId } });
                      if (firstOnly) return destinations;
                  }
              } else {
                  const topCard = this.state.cards[finishPile.cards[finishPile.cards.length - 1]];
                  if (topCard.type === card.type && topCard.number + 1 === card.number) {
                      destinations.push({ el: finishPile.el, target: { dest: 'finish', pile: i, card: cardId } });
                      if (firstOnly) return destinations;
                  }
              }
          }
      }

      // Check desk piles
      for (let i = 0; i < 7; i++) {
          const deskPile = this.state.desk[i];
          if (deskPile.cards.length === 0) {
              if (card.number === 13) { // King
                  destinations.push({ el: deskPile.el, target: { dest: 'desk', pile: i, card: cardId } });
                  if (firstOnly) return destinations;
              }
          } else {
              const topCard = this.state.cards[deskPile.cards[deskPile.cards.length - 1]];
              if (this._canBePlacedOnCard(card, topCard)) {
                  destinations.push({ el: topCard.el, target: { dest: 'desk', pile: i, card: cardId } });
                  if (firstOnly) return destinations;
              }
          }
      }
      return destinations;
  }

  _canBePlacedOnCard(child, parent) {
      return (parent.number - 1 === child.number && this.state.colors[parent.type] !== this.state.colors[child.type]);
  }

  _getSubCards(cardId) {
      const location = this._getCardLocation(cardId);
      if (!location || location.location !== 'desk') return [];
      const { pile, index } = location;
      return this.state.desk[pile].cards.slice(index + 1);
  }

  _faceUpLastOnDesk(pileIndex) {
      const pile = this.state.desk[pileIndex];
      if (pile.cards.length > 0) {
          const card = this.state.cards[pile.cards[pile.cards.length - 1]];
          this._faceUp(card);
      }
  }

  _gameFinishCheck() {
      const isFinished = this.state.finish.every(pile => pile.cards.length === 13);
      if (isFinished) {
          this._runWinAnimation();
      }
  }

  _runWinAnimation() {
    const cardWidth = 71;
    const cardHeight = 96;
    const contentRect = this.win.$content[0].getBoundingClientRect();

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.width = this.win.$content[0].clientWidth;
    canvas.height = this.win.$content[0].clientHeight;
    this.gameEl.appendChild(canvas);

    const context = canvas.getContext('2d');
    const image = new Image();
    image.src = sprite;

    let particles = [];
    let remainingCards = 52;

    const drawCard = (x, y, spriteX, spriteY) => {
        context.drawImage(image, spriteX, spriteY, cardWidth, cardHeight, x, y, cardWidth, cardHeight);
    };

    const Particle = function(id, x, y, sx, sy) {
        let spriteX, spriteY;

        // Correctly calculate sprite offsets based on CSS, accounting for borders
        switch(this.state.cards[id].type) {
            case 'h': spriteX = 1; break;
            case 'c': spriteX = 72; break;
            case 'd': spriteX = 143; break;
            case 's': spriteX = 214; break;
        }
        spriteY = (this.state.cards[id].number - 1) * 97 + 1;

        this.update = () => {
            x += sx;
            y += sy;

            if (x < -cardWidth || x > canvas.width) {
                return false; // Remove particle
            }

            if (y > canvas.height - cardHeight) {
                y = canvas.height - cardHeight;
                sy = -sy * 0.85;
            }
            sy += 0.98; // Gravity

            drawCard(Math.floor(x), Math.floor(y), spriteX, spriteY);
            return true;
        };
    }.bind(this);

    const throwCard = (x, y) => {
        if (remainingCards < 1) return;
        remainingCards--;

        const sx = (Math.random() * 6 - 3) * 2;
        const sy = -Math.random() * 16;
        particles.push(new Particle(remainingCards, x, y, sx, sy));
    };

    const throwIntervals = this.state.finish.map(pile => {
        const pileRect = pile.el.getBoundingClientRect();
        const x = pileRect.left - contentRect.left;
        const y = pileRect.top - contentRect.top;
        return setInterval(() => throwCard(x, y), 500);
    });

    const update = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => p.update());
        if (remainingCards > 0 || particles.length > 0) {
            this.animationFrameId = requestAnimationFrame(update);
        } else {
            this.winAnimation.stop();
        }
    };

    this.animationFrameId = requestAnimationFrame(update);

    this.winAnimation = {
        stop: () => {
            cancelAnimationFrame(this.animationFrameId);
            throwIntervals.forEach(clearInterval);
            if(canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    };

    canvas.onclick = () => this.winAnimation.stop();
  }


  // --- Card Utility Methods ---
  _faceUp(cardData) {
    cardData.facingUp = true;
    cardData.el.classList.add("card--front");
    cardData.el.classList.remove("card--back");
  }

  _faceDown(cardData) {
    cardData.facingUp = false;
    cardData.el.classList.remove("card--front");
    cardData.el.classList.add("card--back");
  }
}
