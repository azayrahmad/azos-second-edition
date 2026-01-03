import { Deck, RANKS } from "./Deck.js";
import { TableauPile } from "./TableauPile.js";
import { StockPile } from "./StockPile.js";
import { FoundationPile } from "./FoundationPile.js";

export class Game {
  constructor(numberOfSuits = 1) {
    this.numberOfSuits = numberOfSuits;
    this.deck = new Deck(this.numberOfSuits);
    this.tableauPiles = Array.from({ length: 10 }, () => new TableauPile());
    this.foundationPiles = Array.from({ length: 8 }, () => new FoundationPile());
    this.initializeGame();
  }

  initializeGame() {
    this.score = 500;
    this.moves = 0;
    this.dealInitialCards();
    // The rest of the deck becomes the stock
    this.stockPile = new StockPile(this.deck.cards);
  }

  dealInitialCards() {
    // 54 cards are dealt to the tableau
    for (let i = 0; i < 54; i++) {
      const card = this.deck.cards.pop();
      const pileIndex = i % 10;
      this.tableauPiles[pileIndex].addCard(card);
    }

    // Flip the top card of each tableau pile
    this.tableauPiles.forEach((pile) => pile.flipTopCard());
  }

  dealFromStock() {
    if (this.tableauPiles.some((pile) => pile.cards.length === 0)) {
      return { success: false, reason: "EMPTY_PILE" };
    }

    if (this.stockPile.canDeal()) {
      const cardsToDeal = this.stockPile.deal();
      return { success: true, cards: cardsToDeal };
    }
    return { success: false, reason: "NO_STOCK" };
  }

  addDealtCardsToTableau(cards) {
    cards.forEach((card, index) => {
      card.faceUp = true;
      this.tableauPiles[index].addCard(card);
    });
  }

  moveCards(fromPileIndex, cardIndex, toPileIndex) {
    const fromPile = this.tableauPiles[fromPileIndex];
    const toPile = this.tableauPiles[toPileIndex];
    const cardsToMove = fromPile.cards.slice(cardIndex);

    if (cardsToMove.length > 0 && toPile.canAccept(cardsToMove[0])) {
      // Move cards
      fromPile.cards.splice(cardIndex);
      toPile.cards.push(...cardsToMove);

      // Flip the new top card of the source pile
      fromPile.flipTopCard();

      this.moves++;
      this.score--;

      return true;
    }
    return false;
  }

  isValidMoveStack(pileIndex, cardIndex) {
    const pile = this.tableauPiles[pileIndex];
    if (!pile || cardIndex < 0 || cardIndex >= pile.cards.length) {
      return false;
    }

    const stack = pile.cards.slice(cardIndex);

    // All cards in the stack must be face up and of the same suit.
    const firstSuit = stack[0].suit;
    if (!stack.every((card) => card.faceUp && card.suit === firstSuit)) {
      return false;
    }

    // Check for descending rank order.
    for (let i = 0; i < stack.length - 1; i++) {
      const currentRankIndex = RANKS.indexOf(stack[i].rank);
      const nextRankIndex = RANKS.indexOf(stack[i + 1].rank);
      if (currentRankIndex !== nextRankIndex + 1) {
        return false;
      }
    }

    return true;
  }

  checkForCompletedSets(pileIndex) {
    const pile = this.tableauPiles[pileIndex];
    const completedSet = pile.checkForCompletedSet();

    if (completedSet) {
      const emptyFoundation = this.foundationPiles.find(
        (p) => p.cards.length === 0,
      );
      if (emptyFoundation) {
        emptyFoundation.addSet(completedSet);
        this.score += 100;
        return true;
      }
    }
    return false;
  }

  checkForWin() {
    return this.foundationPiles.every((pile) => pile.cards.length > 0);
  }
}
