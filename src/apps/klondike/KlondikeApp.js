import { Application } from "../Application.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { getIcon } from "../../utils/iconManager.js";

export class KlondikeApp extends Application {
    _createWindow() {
        const win = new $Window({
            title: "Klondike Solitaire",
            width: 620,
            height: 500,
            resizable: true,
            content: `<div id="klondike-app-container" class="klondike-container"></div>`,
            onReady: () => {
                this._initApp(win);
            },
            onClosed: () => {
                this.cleanup();
            }
        });
        return win;
    }

    _initApp(win) {
        this.game = new Game();
        this.container = win.$content.find(".klondike-container");
        this.renderBoard();
        this.addEventListeners();
    }

    renderBoard() {
        const board = $(`
            <div class="klondike-board">
                <div class="top-piles">
                    <div class="stock-pile"></div>
                    <div class="waste-pile"></div>
                    <div class="foundation-piles">
                        ${this.game.foundationPiles.map(() => `<div class="foundation-pile"></div>`).join('')}
                    </div>
                </div>
                <div class="tableau-piles">
                    ${this.game.tableauPiles.map(() => `<div class="tableau-pile"></div>`).join('')}
                </div>
            </div>
        `);

        this.container.empty().append(board);
        this.renderCards();
    }

    renderCards() {
        const board = this.container.find(".klondike-board");
        this.game.tableauPiles.forEach((pile, i) => {
            const pileEl = board.find(".tableau-pile").eq(i);
            pileEl.empty();
            pile.cards.forEach(card => {
                pileEl.append(card.element);
            });
        });

        const stockPileEl = board.find(".stock-pile");
        stockPileEl.empty();
        this.game.stockPile.cards.forEach(card => {
            stockPileEl.append(card.element);
        });

        const wastePileEl = board.find(".waste-pile");
        wastePileEl.empty();
        this.game.wastePile.cards.forEach(card => {
            wastePileEl.append(card.element);
        });

        this.game.foundationPiles.forEach((pile, i) => {
            const pileEl = board.find(".foundation-pile").eq(i);
            pileEl.empty();
            pile.cards.forEach(card => {
                pileEl.append(card.element);
            });
        });
    }

    addEventListeners() {
        // Manual flip
        this.container.on("click", ".tableau-pile .card.face-down", (e) => {
            const cardEl = $(e.currentTarget);
            const pileEl = cardEl.closest(".tableau-pile");
            const pileIndex = pileEl.index();
            const pile = this.game.tableauPiles[pileIndex];
            if (cardEl.is(pileEl.children().last())) {
                const card = pile.cards[pile.cards.length - 1];
                card.faceUp = true;
                this.renderCards();
            }
        });

        // Deal from stock
        this.container.on("click", ".stock-pile", () => {
            const card = this.game.stockPile.deal();
            if (card) {
                card.faceUp = true;
                this.game.wastePile.addCard(card);
            } else if (this.game.wastePile.cards.length > 0) {
                // Recycle waste pile
                this.game.stockPile.cards = this.game.wastePile.cards.reverse().map(c => {
                    c.faceUp = false;
                    return c;
                });
                this.game.wastePile.cards = [];
            }
            this.renderCards();
        });

        // Drag and drop
        let draggedItems = null;
        let fromPile = null;

        const onMouseMove = (e) => {
            if (draggedItems) {
                $(".dragged-stack").css({ left: e.pageX - 35, top: e.pageY - 48 });
            }
        };

        const onMouseUp = (e) => {
            if (draggedItems) {
                const dropTarget = $(e.target).closest(".tableau-pile, .foundation-pile");
                let toPile = null;
                if (dropTarget.length) {
                    const pileIndex = dropTarget.index();
                    if (dropTarget.hasClass("tableau-pile")) toPile = this.game.tableauPiles[pileIndex];
                    else if (dropTarget.hasClass("foundation-pile")) toPile = this.game.foundationPiles[pileIndex];
                }

                if (toPile) {
                    if (draggedItems.length > 1) {
                        this.game.moveStack(fromPile, toPile, draggedItems[0]);
                    } else {
                        this.game.moveCard(fromPile, toPile, draggedItems[0]);
                    }

                    if (this.game.checkForWin()) {
                        ShowDialogWindow({
                            title: "Congratulations!",
                            text: "You won!",
                            buttons: [{ label: "OK", isDefault: true }],
                        });
                    }
                }

                $(".dragged-stack").remove();
                draggedItems = null;
                this.renderCards();
            }
        };

        this.container.on("mousedown", ".card", (e) => {
            const cardEl = $(e.currentTarget);
            if (cardEl.hasClass("face-down")) return;

            const pileEl = cardEl.closest(".tableau-pile, .waste-pile, .foundation-pile");
            if (!pileEl.length) return;

            const pileIndex = pileEl.index();
            const cardIndex = cardEl.index();

            if (pileEl.hasClass("tableau-pile")) {
                fromPile = this.game.tableauPiles[pileIndex];
                draggedItems = fromPile.cards.slice(cardIndex);
            } else if (pileEl.hasClass("waste-pile")) {
                fromPile = this.game.wastePile;
                draggedItems = [fromPile.cards[fromPile.cards.length - 1]];
            } else if (pileEl.hasClass("foundation-pile")) {
                fromPile = this.game.foundationPiles[pileIndex];
                draggedItems = [fromPile.cards[fromPile.cards.length - 1]];
            }

            const draggedStack = $("<div class='dragged-stack'></div>");
            draggedItems.forEach(card => {
                draggedStack.append(card.element);
            });

            $("body").append(draggedStack);
            draggedStack.css({ left: e.pageX - 35, top: e.pageY - 48, position: "absolute" });

            $(document).on("mousemove", onMouseMove);
            $(document).on("mouseup", onMouseUp);
        });

        this.cleanup = () => {
            $(document).off("mousemove", onMouseMove);
            $(document).off("mouseup", onMouseUp);
        };
    }
}
