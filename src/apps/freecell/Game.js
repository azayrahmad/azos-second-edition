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
    this.lastMove = null;
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

  undo() {
    if (!this.lastMove) {
      return false;
    }

    const { type, payload, from, toType, toIndex, to } = this.lastMove;

    if (type === 'card') {
      // Remove card from the destination it was moved to
      if (toType === 'freecell') {
        this.freeCells[toIndex] = null;
      } else if (toType === 'tableau') {
        this.tableauPiles[toIndex].pop();
      } else if (toType === 'foundation') {
        this.foundationPiles[toIndex].pop();
      }

      // Add card back to its original source
      if (from.type === 'freecell') {
        this.freeCells[from.index] = payload;
      } else if (from.type === 'tableau') {
        this.tableauPiles[from.index].push(payload);
      }
    } else if (type === 'stack') {
        // Remove the stack from the destination tableau pile
        const toPile = this.tableauPiles[to];
        toPile.splice(toPile.length - payload.length);

        // Add the stack back to the source tableau pile
        const fromPile = this.tableauPiles[from];
        this.tableauPiles[from] = fromPile.concat(payload);
    }


    this.lastMove = null;
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
    if (!source) return false;

    this.lastMove = {
      type: 'card',
      payload: card,
      from: source,
      toType: destinationType,
      toIndex: destinationIndex,
    };

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

  findAllFoundationMoves() {
    const moves = [];
    const candidates = [];

    // Gather candidate cards from free cells
    this.freeCells.forEach((card, index) => {
      if (card) {
        candidates.push({ card, from: { type: 'freecell', index } });
      }
    });

    // Gather candidate cards from the top of tableau piles
    this.tableauPiles.forEach((pile, index) => {
      if (pile.length > 0) {
        const card = pile[pile.length - 1];
        candidates.push({ card, from: { type: 'tableau', index, position: pile.length - 1 } });
      }
    });

    // Find a valid foundation for each candidate
    for (const candidate of candidates) {
      for (let i = 0; i < this.foundationPiles.length; i++) {
        if (this.isFoundationMoveValid(candidate.card, this.foundationPiles[i])) {
          moves.push({
            card: candidate.card,
            from: candidate.from,
            toType: 'foundation',
            toIndex: i
          });
          break; // Move to the next candidate once a valid foundation is found
        }
      }
    }

    return moves;
  }

  // --- Supermoves (moving a stack of cards) ---

  calculateMaxMoveSize() {
    const emptyFreeCells = this.freeCells.filter((c) => c === null).length;
    return 1 + emptyFreeCells;
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
    const maxMoveSize = this.calculateMaxMoveSize();

    for (let i = 0; i < fullStack.length; i++) {
      const subStack = fullStack.slice(i);
      if (subStack.length <= maxMoveSize && this.isTableauMoveValid(subStack[0], toPile)) {
        return subStack;
      }
    }

    return null; // No valid move found
  }

  moveStack(stack, fromTableauIndex, toTableauIndex) {
    this.lastMove = {
      type: 'stack',
      payload: stack,
      from: fromTableauIndex,
      to: toTableauIndex,
    };

    // Remove stack from source pile
    const fromPile = this.tableauPiles[fromTableauIndex];
    fromPile.splice(fromPile.length - stack.length);

    // Add stack to destination pile
    const toPile = this.tableauPiles[toTableauIndex];
    this.tableauPiles[toTableauIndex] = toPile.concat(stack);

    return true;
  }

  getSupermovePlan(stack, fromTableauIndex, toTableauIndex) {
    const availableFreeCells = this.freeCells
      .map((card, index) => (card === null ? index : -1))
      .filter((index) => index !== -1);
    const availableTableau = this.tableauPiles
      .map((pile, index) => (pile.length === 0 ? index : -1))
      .filter((index) => index !== -1);

    const plan = [];
    const tempLocations = new Map(); // card -> {type, index}
    const baseCard = stack[0];
    const cardsToMove = stack.slice(1).reverse(); // Top cards first

    // Phase 1: Move all but the base card to temporary locations
    for (const card of cardsToMove) {
      let tempTo;
      if (availableFreeCells.length > 0) {
        const fcIndex = availableFreeCells.shift();
        tempTo = { type: 'freecell', index: fcIndex };
      } else if (availableTableau.length > 0) {
        const tIndex = availableTableau.shift();
        tempTo = { type: 'tableau', index: tIndex };
      } else {
        // This should not happen if the move is valid
        console.error("Not enough space for supermove");
        return [];
      }
      const fromLocation = { type: 'tableau', index: fromTableauIndex };
      plan.push({ card, from: fromLocation, to: tempTo });
      tempLocations.set(card, tempTo);
    }

    // Phase 2: Move the base card of the stack directly to the destination
    plan.push({
      card: baseCard,
      from: { type: 'tableau', index: fromTableauIndex },
      to: { type: 'tableau', index: toTableauIndex },
    });
    tempLocations.set(baseCard, { type: 'tableau', index: toTableauIndex });

    // Phase 3: Re-assemble the stack from the temporary locations
    const cardsToReassemble = stack.slice(1); // In order from base to top
    for (let i = 0; i < cardsToReassemble.length; i++) {
      const card = cardsToReassemble[i];
      const cardBelow = stack[i];
      const from = tempLocations.get(card);
      const toCardLocation = tempLocations.get(cardBelow);

      if (!toCardLocation) continue;

      const reassemblyTo = { type: 'tableau', index: toCardLocation.index };
      plan.push({ card, from, to: reassemblyTo });
      tempLocations.set(card, reassemblyTo);
    }

    return plan;
  }
}
