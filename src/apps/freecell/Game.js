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
    if (!destinationPile || destinationPile.length === 0) {
      return true; // Can move any card to an empty tableau pile.
    }
    const topCard = destinationPile[destinationPile.length - 1];
    if (!topCard) {
      return true; // Should be covered by the previous check, but as a safeguard.
    }
    const cardColor = (cardToMove.suit === "♥" || cardToMove.suit === "♦") ? 'red' : 'black';
    const topCardColor = (topCard.suit === "♥" || topCard.suit === "♦") ? 'red' : 'black';
    const cardRankIndex = RANKS.indexOf(cardToMove.rank);
    const topCardRankIndex = RANKS.indexOf(topCard.rank);

    return cardColor !== topCardColor && cardRankIndex === topCardRankIndex - 1;
  }

  isFoundationMoveValid(cardToMove, foundationPile) {
    if (!foundationPile || foundationPile.length === 0) {
        return cardToMove.rank === "A";
    }

    const topCard = foundationPile[foundationPile.length - 1];

    if (!topCard) {
        return cardToMove.rank === "A";
    }

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

  calculateMaxMoveSize() {
    const emptyFreeCells = this.freeCells.filter(c => c === null).length;
    const emptyTableauPiles = this.tableauPiles.filter(p => p.length === 0).length;
    // The formula is (1 + number of empty freecells) * 2 ^ (number of empty tableau columns)
    return (1 + emptyFreeCells) * Math.pow(2, emptyTableauPiles);
  }

  findMovableStack(tableauIndex) {
      const pile = this.tableauPiles[tableauIndex];
      if (pile.length === 0) {
          return null;
      }

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
              break; // End of valid stack
          }
      }
      const stack = pile.slice(lastValidCardIndex);
      return stack;
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

  getValidStackForMove(stack, destinationPile) {
    const maxMoveSize = this.calculateMaxMoveSize();
    // The candidate stack is the top-most portion of the selected stack,
    // limited by the max move size.
    const candidateStack = stack.length > maxMoveSize
        ? stack.slice(stack.length - maxMoveSize)
        : stack;

    // Starting with the full candidate stack, check for a valid move.
    // If not valid, reduce the stack by one card from the bottom and check again.
    for (let i = 0; i < candidateStack.length; i++) {
      const subStack = candidateStack.slice(i);
      // The bottom card of the sub-stack must be valid to place on the destination.
      if (this.isTableauMoveValid(subStack[0], destinationPile)) {
        return subStack; // This is the largest possible valid stack to move.
      }
    }

    return null; // No portion of the candidate stack can be moved.
  }
}
