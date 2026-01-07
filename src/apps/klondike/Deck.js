import { Card } from "./Card.js";

export const SUITS = ["♠️", "♥️", "♦️", "♣️"];
export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export class Deck {
  constructor() {
    this.cards = this.createCards();
    this.shuffle();
  }

  createCards() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(new Card(suit, rank));
      }
    }
    return deck;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
}
