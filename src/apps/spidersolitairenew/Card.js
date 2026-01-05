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
    cardDiv.setAttribute("data-rank", this.rank);
    cardDiv.setAttribute("data-suit", this.suit);
    cardDiv.dataset.uid = this.uid;

    if (this.faceUp) {
      cardDiv.classList.add("face-up");
      const rankMap = {
        A: "Ace",
        K: "King",
        Q: "Queen",
        J: "Jack",
      };
      const rankName = rankMap[this.rank] || this.rank;
      const suitName = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
      cardDiv.setAttribute("aria-label", `${rankName} of ${suitName}s`);
      cardDiv.draggable = true;
    } else {
      cardDiv.classList.add("face-down");
    }

    return cardDiv;
  }

  toJSON() {
    return {
      suit: this.suit,
      rank: this.rank,
      faceUp: this.faceUp,
      uid: this.uid,
    };
  }
}
