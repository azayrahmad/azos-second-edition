import { Pile } from "./Pile.js";

export class StockPile extends Pile {
  constructor(cards) {
    super();
    this.cards = cards;
  }

  canDeal() {
    return this.cards.length > 0;
  }

  deal() {
    if (!this.canDeal()) {
      return null;
    }
    return this.cards.pop();
  }
}
