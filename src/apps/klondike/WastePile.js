import { Pile } from "./Pile.js";

export class WastePile extends Pile {
  constructor() {
    super();
  }

  addCard(card) {
    if (card) {
      card.faceUp = true;
      this.cards.push(card);
    }
  }

  reset() {
    const cards = this.cards.map(card => {
        card.faceUp = false;
        return card;
    });
    this.cards = [];
    return cards;
  }
}
