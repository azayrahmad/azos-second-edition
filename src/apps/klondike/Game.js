import { Deck } from "./Deck.js";
import { StockPile, WastePile, FoundationPile, TableauPile } from "./Pile.js";

export class Game {
    constructor() {
        this.deck = new Deck();
        this.stockPile = new StockPile();
        this.wastePile = new WastePile();
        this.foundationPiles = Array(4).fill(null).map(() => new FoundationPile());
        this.tableauPiles = Array(7).fill(null).map(() => new TableauPile());
        this.deal();
    }

    deal() {
        // Deal cards to the tableau piles
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.cards.pop();
                if (j === i) {
                    card.faceUp = true;
                }
                this.tableauPiles[j].addCard(card);
            }
        }
        // Add remaining cards to the stock pile
        this.stockPile.cards = this.deck.cards;
    }

    moveCard(fromPile, toPile, card) {
        if (toPile.canAddCard(card)) {
            const cardToMove = fromPile.removeCard();
            toPile.addCard(cardToMove);
            return true;
        }
        return false;
    }

    moveStack(fromPile, toPile, card) {
        const cardIndex = fromPile.cards.indexOf(card);
        if (cardIndex === -1) return false;

        const stack = fromPile.cards.slice(cardIndex);
        if (toPile.canAddCard(stack[0])) {
            fromPile.cards.splice(cardIndex);
            toPile.cards.push(...stack);
            return true;
        }
        return false;
    }

    checkForWin() {
        return this.foundationPiles.every(pile => pile.cards.length === 13);
    }
}
