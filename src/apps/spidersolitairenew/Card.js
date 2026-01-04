export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
    this.uid = 'card-' + Math.random().toString(36).substr(2, 9);
  }

  get element() {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.dataset.rank = this.rank;
    cardDiv.dataset.suit = this.suit;
    cardDiv.dataset.uid = this.uid;

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
