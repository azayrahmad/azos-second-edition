import { Card } from './Card.js';

const SUITS = ['♣', '♦', '♥', '♠'];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export class Game {
  constructor(gameNumber = 1) {
    this.gameNumber = gameNumber;
    this.freeCells = [null, null, null, null];
    this.foundationPiles = [[], [], [], []];
    this.tableauPiles = [[], [], [], [], [], [], [], []];
    this.previousState = null;
    this.allCards = [];

    this._createDeck();
    this.deal();
  }

  _createDeck() {
    this.allCards = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        const card = new Card(suit, rank, 'cardback1');
        card.faceUp = true;
        this.allCards.push(card);
      }
    }
  }

  deal() {
    class MSRand {
        constructor(seed) { this.seed = seed; }
        rand() {
            this.seed = (this.seed * 214013 + 2531011) & 0x7FFFFFFF;
            return (this.seed >> 16) & 0x7FFF;
        }
        maxRand(max) { return this.rand() % max; }
    }

    const rng = new MSRand(this.gameNumber);
    const deck = Array.from({ length: 52 }, (_, i) => i);
    const shuffledIndices = [];
    let remaining = 52;

    for (let i = 0; i < 52; i++) {
        const j = rng.maxRand(remaining);
        shuffledIndices.push(deck[j]);
        deck[j] = deck[--remaining];
    }

    const shuffledDeck = shuffledIndices.map(index => this.allCards[index]);

    this.tableauPiles = Array.from({ length: 8 }, () => []);
    for (let i = 0; i < 52; i++) {
        this.tableauPiles[i % 8].push(shuffledDeck[i]);
    }
  }

  saveState() {
    this.previousState = {
      freeCells: this.freeCells.map(card => card ? card.uid : null),
      foundationPiles: this.foundationPiles.map(pile => pile.map(card => card.uid)),
      tableauPiles: this.tableauPiles.map(pile => pile.map(card => card.uid)),
    };
  }

  undo() {
    if (!this.previousState) return false;

    const uidToCardMap = new Map(this.allCards.map(card => [card.uid, card]));

    this.freeCells = this.previousState.freeCells.map(uid => uid ? uidToCardMap.get(uid) : null);
    this.foundationPiles = this.previousState.foundationPiles.map(piles => piles.map(uid => uidToCardMap.get(uid)));
    this.tableauPiles = this.previousState.tableauPiles.map(piles => piles.map(uid => uidToCardMap.get(uid)));

    this.previousState = null;
    return true;
  }

  checkForWin() {
    return this.foundationPiles.every(pile => pile.length === 13);
  }

  getCardLocation(card) {
    for (let i = 0; i < this.freeCells.length; i++) {
      if (this.freeCells[i] === card) return { type: 'freecell', index: i };
    }
    for (let i = 0; i < this.tableauPiles.length; i++) {
      if (this.tableauPiles[i].includes(card)) {
        return { type: 'tableau', index: i, position: this.tableauPiles[i].indexOf(card) };
      }
    }
    return null;
  }

  isTableauMoveValid(cardToMove, destinationPile) {
      if (destinationPile.length === 0) return true;
      const topCard = destinationPile[destinationPile.length - 1];
      const cardColor = (cardToMove.suit === "♥" || cardToMove.suit === "♦") ? 'red' : 'black';
      const topCardColor = (topCard.suit === "♥" || topCard.suit === "♦") ? 'red' : 'black';
      const cardRankIndex = RANKS.indexOf(cardToMove.rank);
      const topCardRankIndex = RANKS.indexOf(topCard.rank);
      return cardColor !== topCardColor && cardRankIndex === topCardRankIndex - 1;
  }

  isFoundationMoveValid(cardToMove, foundationPile) {
    if (foundationPile.length === 0) return cardToMove.rank === "A";
    const topCard = foundationPile[foundationPile.length - 1];
    if (cardToMove.suit !== topCard.suit) return false;
    const cardRankIndex = RANKS.indexOf(cardToMove.rank);
    const topCardRankIndex = RANKS.indexOf(topCard.rank);
    return cardRankIndex === topCardRankIndex + 1;
  }

  moveCard(card, source, destinationType, destinationIndex) {
    this.saveState();
    if (source.type === 'freecell') {
      this.freeCells[source.index] = null;
    } else if (source.type === 'tableau') {
      this.tableauPiles[source.index].pop();
    }

    if (destinationType === 'freecell') {
      this.freeCells[destinationIndex] = card;
    } else if (destinationType === 'tableau') {
      this.tableauPiles[destinationIndex].push(card);
    } else if (destinationType === 'foundation') {
      this.foundationPiles[destinationIndex].push(card);
    }
    return true;
  }

  _calculateMaxMoveSize(numEmptyFreeCells, numEmptyTableauPiles) {
    return (1 + numEmptyFreeCells) * Math.pow(2, numEmptyTableauPiles);
  }

  calculateMaxMoveSize() {
    const emptyFreeCells = this.freeCells.filter((c) => c === null).length;
    const emptyTableauPiles = this.tableauPiles.filter(
      (p) => p.length === 0,
    ).length;
    return this._calculateMaxMoveSize(emptyFreeCells, emptyTableauPiles);
  }

  findMovableStack(tableauIndex) {
      const pile = this.tableauPiles[tableauIndex];
      if (pile.length === 0) return null;
      let lastValidCardIndex = pile.length - 1;
      for (let i = pile.length - 2; i >= 0; i--) {
          const currentCard = pile[i];
          const previousCard = pile[i + 1];
          const currentColor = (currentCard.suit === "♥" || currentCard.suit === "♦") ? 'red' : 'black';
          const previousColor = (previousCard.suit === "♥" || previousCard.suit === "♦") ? 'red' : 'black';
          const currentRankIndex = RANKS.indexOf(currentCard.rank);
          const previousRankIndex = RANKS.indexOf(previousCard.rank);
          if (currentColor !== previousColor && currentRankIndex === previousRankIndex + 1) {
              lastValidCardIndex = i;
          } else {
              break;
          }
      }
      return pile.slice(lastValidCardIndex);
  }

  moveStack(stack, fromTableauIndex, toTableauIndex) {
    this.saveState();
    const fromPile = this.tableauPiles[fromTableauIndex];
    fromPile.splice(fromPile.length - stack.length);
    const toPile = this.tableauPiles[toTableauIndex];
    this.tableauPiles[toTableauIndex] = toPile.concat(stack);
    return true;
  }

  getSupermovePlan(stack, fromTableauIndex, toTableauIndex) {
    const plan = [];
    const freeCells = this.freeCells
      .map((c, i) => (c === null ? i : -1))
      .filter((i) => i !== -1);
    const emptyTableaus = this.tableauPiles
      .map((p, i) => (p.length === 0 ? i : -1))
      .filter((i) => i !== -1 && i !== toTableauIndex);

    const moveStackRecursively = (
      cardsToMove,
      source,
      dest,
      spareTableaus,
      freeCells,
    ) => {
      const n = cardsToMove.length;
      if (n === 0) return;

      const maxSimpleMove = freeCells.length + 1;

      if (n <= maxSimpleMove) {
        const tempFCs = freeCells.slice(0, n - 1);
        const cardToFCMap = new Map();
        const topCards = cardsToMove.slice(1).reverse();

        topCards.forEach((card, i) => {
          const fcIndex = tempFCs[i];
          plan.push({ card, from: { type: 'tableau', index: source }, to: { type: 'freecell', index: fcIndex } });
          cardToFCMap.set(card.uid, fcIndex);
        });

        plan.push({ card: cardsToMove[0], from: { type: 'tableau', index: source }, to: { type: 'tableau', index: dest } });

        cardsToMove.slice(1).forEach((card) => {
          plan.push({ card, from: { type: 'freecell', index: cardToFCMap.get(card.uid) }, to: { type: 'tableau', index: dest } });
        });
      } else {
        const spareCol = spareTableaus[0];
        const remainingSpare = spareTableaus.slice(1);
        const bottomStackSize = this._calculateMaxMoveSize(freeCells.length, spareTableaus.length - 1);
        const topStack = cardsToMove.slice(bottomStackSize);
        const bottomStack = cardsToMove.slice(0, bottomStackSize);

        moveStackRecursively(topStack, source, spareCol, remainingSpare, freeCells);
        moveStackRecursively(bottomStack, source, dest, remainingSpare, freeCells);
        moveStackRecursively(topStack, spareCol, dest, [source, ...remainingSpare], freeCells);
      }
    };

    moveStackRecursively(stack, fromTableauIndex, toTableauIndex, emptyTableaus, freeCells);
    return plan;
  }
}
