export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
  }

  get element() {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.dataset.rank = this.rank;
    cardDiv.dataset.suit = this.suit;

    if (this.faceUp) {
      cardDiv.classList.add("face-up");
      cardDiv.textContent = `${this.rank}${this.suit}`;
      cardDiv.draggable = true;
    } else {
      cardDiv.classList.add("face-down");
    }

    return cardDiv;
  }
}
