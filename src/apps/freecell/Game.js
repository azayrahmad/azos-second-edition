import { Card } from './Card.js';

const SUITS = ['♣', '♦', '♥', '♠'];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Microsoft's random number generator constants
const MS_RAND_MAX = 32767;

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
        const card = new Card(suit, rank, 'cardback1'); // Card back is irrelevant as they are all face up
        card.faceUp = true;
        this.allCards.push(card);
      }
    }
  }

  /**
   * Shuffles and deals the cards based on the game number.
   * This uses the same pseudo-random number generator algorithm as the original Microsoft FreeCell.
   */
  deal() {
    // This class is a port of the Microsoft C Runtime random number generator
    class MSRand {
        constructor(seed) {
            this.seed = seed;
        }

        rand() {
            this.seed = (this.seed * 214013 + 2531011) & 0x7FFFFFFF;
            return (this.seed >> 16) & 0x7FFF;
        }

        maxRand(max) {
            return this.rand() % max;
        }
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

    // Map the shuffled numbers back to cards
    const shuffledDeck = shuffledIndices.map(index => this.allCards[index]);

    // Deal the cards to the tableau piles
    this.tableauPiles = [[], [], [], [], [], [], [], []];
    for (let i = 0; i < 52; i++) {
        this.tableauPiles[i % 8].push(shuffledDeck[i]);
    }
  }

  /**
   * Saves the current state of the game for the undo functionality.
   */
  saveState() {
    this.previousState = {
      freeCells: this.freeCells.map(card => card ? card.uid : null),
      foundationPiles: this.foundationPiles.map(pile => pile.map(card => card.uid)),
      tableauPiles: this.tableauPiles.map(pile => pile.map(card => card.uid)),
    };
  }

  /**
   * Restores the game to the last saved state.
   */
  undo() {
    if (!this.previousState) {
      return false;
    }

    const uidToCardMap = new Map(this.allCards.map(card => [card.uid, card]));

    this.freeCells = this.previousState.freeCells.map(uid => uid ? uidToCardMap.get(uid) : null);
    this.foundationPiles = this.previousState.foundationPiles.map(pileUids => pileUids.map(uid => uidToCardMap.get(uid)));
    this.tableauPiles = this.previousState.tableauPiles.map(pileUids => pileUids.map(uid => uidToCardMap.get(uid)));

    this.previousState = null;
    return true;
  }

  checkForWin() {
    return this.foundationPiles.every(pile => pile.length === 13);
  }

  // --- Move Validation ---

  getCardLocation(card) {
    // Check free cells
    for (let i = 0; i < this.freeCells.length; i++) {
      if (this.freeCells[i] === card) {
        return { type: 'freecell', index: i };
      }
    }
    // Check tableau piles
    for (let i = 0; i < this.tableauPiles.length; i++) {
      const pile = this.tableauPiles[i];
      if (pile.length > 0 && pile[pile.length - 1] === card) {
        return { type: 'tableau', index: i, position: pile.length - 1 };
      }
    }
    return null; // Card not found or not movable
  }

  isTableauMoveValid(cardToMove, destinationPile) {
      if (destinationPile.length === 0) {
        return true; // Can move any card to an empty tableau pile
      }
      const topCard = destinationPile[destinationPile.length - 1];
      const cardColor = (cardToMove.suit === "♥" || cardToMove.suit === "♦") ? 'red' : 'black';
      const topCardColor = (topCard.suit === "♥" || topCard.suit === "♦") ? 'red' : 'black';
      const cardRankIndex = RANKS.indexOf(cardToMove.rank);
      const topCardRankIndex = RANKS.indexOf(topCard.rank);

      return cardColor !== topCardColor && cardRankIndex === topCardRankIndex - 1;
  }

  isFoundationMoveValid(cardToMove, foundationPile) {
    if (foundationPile.length === 0) {
        // Any Ace can be moved to an empty foundation pile.
        return cardToMove.rank === "A";
    }

    const topCard = foundationPile[foundationPile.length - 1];

    // Check if the suits match
    if (cardToMove.suit !== topCard.suit) {
        return false;
    }

    // Check if the rank is one higher than the top card
    const cardRankIndex = RANKS.indexOf(cardToMove.rank);
    const topCardRankIndex = RANKS.indexOf(topCard.rank);

    return cardRankIndex === topCardRankIndex + 1;
  }

  // --- Move Execution ---

  moveCard(card, source, destinationType, destinationIndex) {
    this.saveState();

    if (!source) return false;

    // Remove card from source
    if (source.type === 'freecell') {
      this.freeCells[source.index] = null;
    } else if (source.type === 'tableau') {
      this.tableauPiles[source.index].pop();
    }

    // Add card to destination
    if (destinationType === 'freecell') {
      this.freeCells[destinationIndex] = card;
    } else if (destinationType === 'tableau') {
      this.tableauPiles[destinationIndex].push(card);
    } else if (destinationType === 'foundation') {
      this.foundationPiles[destinationIndex].push(card);
    }

    return true;
  }

  // --- Supermoves (moving a stack of cards) ---

  calculateMaxMoveSize(isDestinationEmptyTableau = false) {
    const emptyFreeCells = this.freeCells.filter((c) => c === null).length;
    let emptyTableauPiles = this.tableauPiles.filter(
      (p) => p.length === 0,
    ).length;

    // If the destination is an empty tableau, it doesn't count as available for intermediate moves.
    if (isDestinationEmptyTableau) {
      emptyTableauPiles = Math.max(0, emptyTableauPiles - 1);
    }

    // The formula is (1 + number of empty freecells) * 2 ^ (number of empty tableau columns)
    return (1 + emptyFreeCells) * Math.pow(2, emptyTableauPiles);
  }

  getStackToMove(selectedCard, fromPile, toPile) {
    if (!fromPile || fromPile.length === 0 || selectedCard !== fromPile[fromPile.length - 1]) {
      return null;
    }

    // 1. Find the largest validly-sequenced stack at the end of the source pile.
    let fullStack = [];
    for (let i = fromPile.length - 1; i >= 0; i--) {
      const card = fromPile[i];
      if (i === fromPile.length - 1) {
        fullStack.unshift(card);
      } else {
        const nextCard = fromPile[i + 1];
        if (this.isTableauMoveValid(nextCard, [card])) {
          fullStack.unshift(card);
        } else {
          break; // End of the valid sequence
        }
      }
    }

    // 2. Find the largest valid sub-stack that can move to the destination.
    const maxMoveSize = this.calculateMaxMoveSize(toPile.length === 0);

    for (let i = 0; i < fullStack.length; i++) {
      const subStack = fullStack.slice(i);
      if (subStack.length <= maxMoveSize && this.isTableauMoveValid(subStack[0], toPile)) {
        return subStack;
      }
    }

    return null; // No valid move found
  }

  moveStack(stack, fromTableauIndex, toTableauIndex) {
    this.saveState();

    // Remove stack from source pile
    const fromPile = this.tableauPiles[fromTableauIndex];
    fromPile.splice(fromPile.length - stack.length);

    // Add stack to destination pile
    const toPile = this.tableauPiles[toTableauIndex];
    this.tableauPiles[toTableauIndex] = toPile.concat(stack);

    return true;
  }

  getSupermovePlan(stack, fromTableauIndex, toTableauIndex) {
    const plan = [];
    const fromLocation = { type: 'tableau', index: fromTableauIndex };
    const toLocation = { type: 'tableau', index: toTableauIndex };

    const generateSimpleMove = (cards, from, to, free) => {
        if (cards.length === 0) return;
        const tempLocations = new Map();
        const baseCard = cards[0];
        const cardsToMove = cards.slice(1).reverse();

        cardsToMove.forEach((card, i) => {
            const tempDest = free[i];
            plan.push({ card, from, to: tempDest });
            tempLocations.set(card, tempDest);
        });

        plan.push({ card: baseCard, from, to });
        tempLocations.set(baseCard, to);

        cards.slice(1).forEach(card => {
            const fromLoc = tempLocations.get(card);
            plan.push({ card, from: fromLoc, to });
            tempLocations.set(card, to);
        });
    };

    const generateRecursiveMove = (cards, from, to, aux, free) => {
        const n = cards.length;
        const k = free.length + 1;

        if (n <= k) {
            generateSimpleMove(cards, from, to, free);
            return;
        }

        const tempPile = aux[0];
        const remainingAux = aux.slice(1);

        const topStackSize = n - k;
        const topStack = cards.slice(k);
        const bottomStack = cards.slice(0, k);

        // Step 1: Move top stack from Source to an Auxiliary pile.
        // The other auxiliary piles can be used. The final destination pile is NOT available.
        generateRecursiveMove(topStack, from, tempPile, remainingAux, free);

        // Step 2: Move bottom stack from Source to Destination.
        // This is a simple move that only uses free cells.
        generateSimpleMove(bottomStack, from, to, free);

        // Step 3: Move top stack from the Auxiliary pile to the Destination.
        // The original source pile is now empty and can be used as an auxiliary.
        generateRecursiveMove(topStack, tempPile, to, [from, ...remainingAux], free);
    };

    const freeCells = this.freeCells
      .map((card, index) => (card === null ? { type: 'freecell', index } : null))
      .filter(Boolean);

    const emptyTableau = this.tableauPiles
      .map((pile, index) => (pile.length === 0 ? { type: 'tableau', index } : null))
      .filter(p => p && p.index !== toTableauIndex && p.index !== fromTableauIndex);

    generateRecursiveMove(stack, fromLocation, toLocation, emptyTableau, freeCells);

    return plan;
  }
}
