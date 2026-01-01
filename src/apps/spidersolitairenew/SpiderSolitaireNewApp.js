import { Application } from "../Application.js";

export class SpiderSolitaireNewApp extends Application {
    static config = {
        id: "spidersolitairenew",
        title: "Spider Solitaire New",
        width: 800,
        height: 600,
        resizable: true,
    };

    async _createWindow() {
        const win = new window.$Window({
            title: this.config.title,
            width: this.config.width,
            height: this.config.height,
            resizable: this.config.resizable,
            icon: this.icon,
        });

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'src/apps/spidersolitairenew/spidersolitairenew.css';
        win.element.querySelector('.window-content').appendChild(styleLink);

        const gameBoard = document.createElement('div');
        gameBoard.className = 'solitaire-container';
        gameBoard.innerHTML = `
            <div class="tableau-piles">
                ${Array(10).fill('<div class="tableau-pile"></div>').join('')}
            </div>
            <div class="bottom-area">
                <div class="foundation-piles">
                    ${Array(8).fill('<div class="foundation-pile"></div>').join('')}
                </div>
                <div class="stock-pile">
                    <div class="stock-card-placeholder"></div>
                </div>
            </div>
        `;

        win.element.querySelector('.window-content').appendChild(gameBoard);
        this.gameBoard = gameBoard;
        this.initGame();

        return win;
    }

    initGame() {
        this.dealCards();
        this.addEventListeners();
    }

    addEventListeners() {
        this.gameBoard.addEventListener('dragstart', this.onDragStart.bind(this));
        this.gameBoard.addEventListener('dragover', this.onDragOver.bind(this));
        this.gameBoard.addEventListener('drop', this.onDrop.bind(this));
        this.gameBoard.querySelector('.stock-pile').addEventListener('click', this.dealFromStock.bind(this));
    }

    onDragStart(event) {
        const card = event.target;
        if (!card.classList.contains('face-up')) {
            event.preventDefault();
            return;
        }

        const pile = card.parentElement;
        const pileCards = Array.from(pile.children);
        const cardIndex = pileCards.indexOf(card);
        const draggedStack = pileCards.slice(cardIndex);

        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        for (let i = 0; i < draggedStack.length - 1; i++) {
            const currentRankIndex = ranks.indexOf(draggedStack[i].dataset.rank);
            const nextRankIndex = ranks.indexOf(draggedStack[i + 1].dataset.rank);
            if (currentRankIndex !== nextRankIndex + 1) {
                event.preventDefault();
                return;
            }
        }

        event.dataTransfer.setData('text/plain', card.dataset.rank);
        this.draggedStack = draggedStack;
    }

    onDragOver(event) {
        event.preventDefault();
    }

    onDrop(event) {
        event.preventDefault();
        const targetPile = event.target.closest('.tableau-pile');
        if (targetPile && this.draggedStack && this.isValidMove(this.draggedStack[0], targetPile)) {
            const originalPile = this.draggedStack[0].parentElement;
            this.draggedStack.forEach(card => targetPile.appendChild(card));

            this.checkForCompletedSet(targetPile);
            this.flipTopCard(originalPile);
        }
        this.draggedStack = null;
    }

    flipTopCard(pile) {
        if (pile.children.length > 0) {
            const topCard = pile.children[pile.children.length - 1];
            if (topCard.classList.contains('face-down')) {
                topCard.classList.remove('face-down');
                topCard.classList.add('face-up');
                topCard.textContent = `${topCard.dataset.rank}${topCard.dataset.suit}`;
            }
        }
    }

    checkForCompletedSet(pile) {
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const pileCards = Array.from(pile.children);
        if (pileCards.length < 13) return;

        const top13 = pileCards.slice(-13);
        let isSet = true;
        for (let i = 0; i < 13; i++) {
            if (top13[i].dataset.rank !== ranks[12 - i]) {
                isSet = false;
                break;
            }
        }

        if (isSet) {
            top13.forEach(card => card.remove());
            const foundationPiles = this.gameBoard.querySelectorAll('.foundation-pile');
            const emptyPile = Array.from(foundationPiles).find(p => p.children.length === 0);
            if(emptyPile) {
                const completedSet = document.createElement('div');
                completedSet.className = 'card face-up';
                completedSet.textContent = 'K♠️';
                emptyPile.appendChild(completedSet);
            }
            this.checkForWin();
        }
    }

    async checkForWin() {
        const foundationPiles = this.gameBoard.querySelectorAll('.foundation-pile');
        const completedSets = Array.from(foundationPiles).filter(p => p.children.length > 0).length;
        if (completedSets === 8) {
            const { ShowDialogWindow } = await import("../../components/DialogWindow.js");
            ShowDialogWindow({
                title: "Congratulations!",
                text: "You Win!",
                buttons: [{ label: "OK" }],
            });
        }
    }

    isValidMove(card, pile) {
        const pileCards = Array.from(pile.children);
        if (pileCards.length === 0) {
            return true;
        }
        const topCard = pileCards[pileCards.length - 1];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const draggedRankIndex = ranks.indexOf(card.dataset.rank);
        const topRankIndex = ranks.indexOf(topCard.dataset.rank);
        return topRankIndex === draggedRankIndex + 1;
    }

    async dealFromStock() {
        const tableauPiles = Array.from(this.gameBoard.querySelectorAll('.tableau-pile'));
        if (tableauPiles.some(pile => pile.children.length === 0)) {
            const { ShowDialogWindow } = await import("../../components/DialogWindow.js");
            ShowDialogWindow({
                title: "Invalid Move",
                text: "You cannot deal from the stock while a tableau pile is empty.",
                buttons: [{ label: "OK" }],
            });
            return;
        }

        if (this.stock.length > 0) {
            for (let i = 0; i < 10; i++) {
                if (this.stock.length > 0) {
                    const card = this.stock.pop();
                    card.faceUp = true;
                    const cardElement = this.createCardElement(card);
                    tableauPiles[i].appendChild(cardElement);
                    this.checkForCompletedSet(tableauPiles[i]);
                }
            }
        }
    }

    createDecks() {
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const suit = '♠️';
        let deck = [];
        for (let i = 0; i < 8; i++) {
            for (const rank of ranks) {
                deck.push({ rank, suit, faceUp: false });
            }
        }
        return deck;
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    dealCards() {
        const deck = this.createDecks();
        this.shuffleDeck(deck);

        const tableauPiles = this.gameBoard.querySelectorAll('.tableau-pile');

        // Deal 54 cards to the tableau
        for (let i = 0; i < 54; i++) {
            const card = deck.pop();
            const pileIndex = i % 10;
            if (i >= 44) {
                card.faceUp = true;
            }
            const cardElement = this.createCardElement(card);
            tableauPiles[pileIndex].appendChild(cardElement);
        }

        this.stock = deck; // Remaining 50 cards
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.rank = card.rank;
        cardDiv.dataset.suit = card.suit;

        if (card.faceUp) {
            cardDiv.classList.add('face-up');
            cardDiv.textContent = `${card.rank}${card.suit}`;
        } else {
            cardDiv.classList.add('face-down');
        }

        return cardDiv;
    }
}
