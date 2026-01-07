export class Pile {
    constructor() {
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeCard() {
        return this.cards.pop();
    }
}

export class StockPile extends Pile {
    deal() {
        return this.removeCard();
    }
}

export class WastePile extends Pile {}

export class FoundationPile extends Pile {
    canAddCard(card) {
        if (this.cards.length === 0) {
            return card.rank === "A";
        }
        const topCard = this.cards[this.cards.length - 1];
        return card.suit === topCard.suit && this.isNextRank(topCard.rank, card.rank);
    }

    isNextRank(rank1, rank2) {
        const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        return ranks.indexOf(rank2) === ranks.indexOf(rank1) + 1;
    }
}

export class TableauPile extends Pile {
    canAddCard(card) {
        if (this.cards.length === 0) {
            return card.rank === "K";
        }
        const topCard = this.cards[this.cards.length - 1];
        return this.isAlternateColor(card, topCard) && this.isPreviousRank(topCard.rank, card.rank);
    }

    isAlternateColor(card1, card2) {
        const redSuits = ["♥️", "♦️"];
        const blackSuits = ["♠️", "♣️"];
        return (redSuits.includes(card1.suit) && blackSuits.includes(card2.suit)) || (blackSuits.includes(card1.suit) && redSuits.includes(card2.suit));
    }

    isPreviousRank(rank1, rank2) {
        const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        return ranks.indexOf(rank2) === ranks.indexOf(rank1) - 1;
    }
}
