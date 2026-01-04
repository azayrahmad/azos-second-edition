import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { getItem, setItem } from "../../utils/localStorage.js";
import "./spidersolitairenew.css";

const STYLE_KEY = "spidersolitairenew.use98style";

export class SpiderSolitaireNewApp extends Application {
  static config = {
    id: "spidersolitairenew",
    title: "Spider",
    width: 1024,
    height: 768,
    resizable: true,
    icon: ICONS.spidersolitairenew,
  };

  async _createWindow() {
    this.use98Style = getItem(STYLE_KEY);
    if (this.use98Style === null) {
      this.use98Style = true;
    }

    const win = new window.$Window({
      title: this.config.title,
      outerWidth: this.config.width,
      outerHeight: this.config.height,
      resizable: this.config.resizable,
      icons: this.icon,
    });

    this._updateMenuBar(win);

    win.element.querySelector(".window-content").innerHTML = `
            <div class="spider-solitaire-container">
                <div class="game-board">
                    <div class="tableau-piles"></div>
                    <div class="bottom-area">
                        <div class="foundation-piles"></div>
                        <div class="stock-pile"></div>
                    </div>
                </div>
                <div class="status-bar">
                    <div class="status-bar-field" id="score-display">Score: 500</div>
                    <div class="status-bar-field" id="moves-display">Moves: 0</div>
                    <div class="status-bar-field" id="suits-removed-display">Suits removed: </div>
                </div>
            </div>
        `;

    this.win = win;
    this.container = win.element.querySelector(".spider-solitaire-container");
    if (this.use98Style) {
      this.container.classList.add("style-98");
    }
    this.availableMovesIndex = 0;
    this.addEventListeners();
    this.startNewGame(4); // Default to hard

    return win;
  }

  _showNewGameDialog() {
    if (this.game) {
      ShowDialogWindow({
        title: "New Game",
        text: "Are you sure you want to start a new game?",
        buttons: [
          {
            label: "Yes",
            action: () => this._showDifficultyDialog(),
          },
          {
            label: "No",
            action: () => {},
          },
        ],
      });
    } else {
      this._showDifficultyDialog();
    }
  }

  _showDifficultyDialog() {
    let selectedDifficulty = 4;
    const content = document.createElement("div");
    content.innerHTML = `
            <div class="field-row">
                <input type="radio" name="difficulty" value="1" id="easy">
                <label for="easy">1 Suit (Easy)</label>
            </div>
            <div class="field-row">
                <input type="radio" name="difficulty" value="2" id="medium">
                <label for="medium">2 Suits (Medium)</label>
            </div>
            <div class="field-row">
                <input type="radio" name="difficulty" value="4" id="hard" checked>
                <label for="hard">4 Suits (Hard)</label>
            </div>
        `;

    ShowDialogWindow({
      title: "New Game",
      content: content,
      buttons: [
        {
          label: "OK",
          action: () => {
            const selected = content.querySelector(
              'input[name="difficulty"]:checked',
            );
            if (selected) {
              selectedDifficulty = parseInt(selected.value, 10);
            }
            this.startNewGame(selectedDifficulty);
          },
        },
        {
          label: "Cancel",
          action: () => {},
        },
      ],
    });
  }

  startNewGame(difficulty = 1) {
    this.game = new Game(difficulty);
    this.render();
    this._updateMenuBar(this.win);
    this._updateStatusBar();
  }

  undoMove() {
    if (this.game.undo()) {
      this.render();
      this._updateMenuBar(this.win);
    }
  }

  _updateMenuBar(win) {
    const canDeal =
      this.game?.stockPile?.canDeal() && !this.game?.checkForWin();
    const canUndo = this.game?.history?.length > 0;

    const menuBar = new window.MenuBar({
      Game: [
        {
          label: "New Game",
          action: () => this._showNewGameDialog(),
        },
        {
          label: "Undo",
          action: () => this.undoMove(),
          enabled: () => canUndo,
          shortcut: "Ctrl+Z",
        },
        {
          label: "Deal New Row",
          action: () => this.onStockClick(),
          enabled: () => canDeal,
        },
        {
          label: "Show Available Moves",
          action: () => this.showNextAvailableMove(),
        },
        "MENU_DIVIDER",
        {
          label: "98 Style",
          checkbox: {
            check: () => this.use98Style,
            toggle: () => {
              this.use98Style = !this.use98Style;
              setItem(STYLE_KEY, this.use98Style);
              this.container.classList.toggle("style-98", this.use98Style);
              this.render();
            },
          },
        },
      ],
    });

    const dealButton = document.createElement("div");
    dealButton.className = "menu-button";
    dealButton.innerHTML = "<span>Deal!</span>";
    dealButton.addEventListener("click", () => {
      if (canDeal) {
        this.onStockClick();
      }
    });

    if (canDeal) {
      dealButton.removeAttribute("disabled");
      dealButton.removeAttribute("aria-disabled");
    } else {
      dealButton.setAttribute("disabled", "");
      dealButton.setAttribute("aria-disabled", "true");
    }

    menuBar.element.appendChild(dealButton);

    win.setMenuBar(menuBar);
  }

  render() {
    this.renderTableau();
    this.renderStock();
    this.renderFoundations();
    this._updateStatusBar();
  }

  renderTableau() {
    const tableauContainer = this.container.querySelector(".tableau-piles");
    tableauContainer.innerHTML = "";
    this.game.tableauPiles.forEach((pile, pileIndex) => {
      const pileDiv = document.createElement("div");
      pileDiv.className = "tableau-pile";
      pileDiv.dataset.pileIndex = pileIndex;

      if (pile.cards.length === 0) {
        const placeholderDiv = document.createElement("div");
        placeholderDiv.className = "tableau-placeholder";
        pileDiv.appendChild(placeholderDiv);
      } else {
        pile.cards.forEach((card, cardIndex) => {
          const cardDiv = card.element;
        cardDiv.dataset.pileIndex = pileIndex;
        cardDiv.dataset.cardIndex = cardIndex;
        pileDiv.appendChild(cardDiv);
        });
      }
      tableauContainer.appendChild(pileDiv);
    });
  }

  renderStock() {
    const stockContainer = this.container.querySelector(".stock-pile");
    stockContainer.innerHTML = "";
    if (this.game.stockPile.canDeal()) {
      const dealsLeft = Math.floor(this.game.stockPile.cards.length / 10);
      for (let i = 0; i < dealsLeft; i++) {
        const placeholder = document.createElement("div");
        placeholder.className = "stock-card-placeholder";
        // To make the leftmost card appear on top, set the z-index in reverse order.
        placeholder.style.zIndex = dealsLeft - i;
        stockContainer.appendChild(placeholder);
      }
    }
  }

  renderFoundations() {
    const foundationContainer =
      this.container.querySelector(".foundation-piles");
    foundationContainer.innerHTML = "";
    this.game.foundationPiles.forEach((pile) => {
      const pileDiv = document.createElement("div");
      pileDiv.className = "foundation-pile";
      if (pile.topCard) {
        pileDiv.appendChild(pile.topCard.element);
      }
      foundationContainer.appendChild(pileDiv);
    });
  }

  addEventListeners() {
    this.container.addEventListener("dragstart", this.onDragStart.bind(this));
    this.container.addEventListener("dragover", this.onDragOver.bind(this));
    this.container.addEventListener("drop", this.onDrop.bind(this));
    this.container
      .querySelector(".stock-pile")
      .addEventListener("click", this.onStockClick.bind(this));
    this.win.element.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        this.undoMove();
      }
    });
  }

  onDragStart(event) {
    const cardDiv = event.target;
    const pileIndex = parseInt(cardDiv.dataset.pileIndex, 10);
    const cardIndex = parseInt(cardDiv.dataset.cardIndex, 10);

    if (this.game.isValidMoveStack(pileIndex, cardIndex)) {
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ pileIndex, cardIndex }),
      );
      event.dataTransfer.effectAllowed = "move";
    } else {
      event.preventDefault();
    }
  }

  onDragOver(event) {
    event.preventDefault();
  }

  onDrop(event) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    const toPileDiv = event.target.closest(".tableau-pile");

    if (toPileDiv) {
      const fromPileIndex = parseInt(data.pileIndex, 10);
      const cardIndex = parseInt(data.cardIndex, 10);
      const toPileIndex = parseInt(toPileDiv.dataset.pileIndex, 10);

      if (this.game.moveCards(fromPileIndex, cardIndex, toPileIndex)) {
        this.game.checkForCompletedSets(toPileIndex);
        if (this.game.checkForWin()) {
          this.showWinDialog();
        }
      }
      this.render();
      this._updateMenuBar(this.win);
      this._updateStatusBar();
    }
  }

  async onStockClick() {
    const result = this.game.dealFromStock();

    if (result.success) {
      this.container.style.pointerEvents = "none";
      try {
        this.renderStock();
        await this.animateDealing(result.cards);
        this.game.addDealtCardsToTableau(result.cards);
        this.renderTableau();
        this.game.tableauPiles.forEach((pile, index) => {
          this.game.checkForCompletedSets(index);
        });
        if (this.game.checkForWin()) {
          this.showWinDialog();
        }
        this._updateMenuBar(this.win);
        this._updateStatusBar();
      } finally {
        this.container.style.pointerEvents = "auto";
      }
    } else if (result.reason === "EMPTY_PILE") {
      const { ShowDialogWindow } =
        await import("../../components/DialogWindow.js");
      ShowDialogWindow({
        title: "Invalid Move",
        text: "You cannot deal from the stock while a tableau pile is empty.",
        buttons: [{ label: "OK" }],
      });
    }
  }

  animateDealing(cards) {
    return new Promise((resolve) => {
      let startRect;
      if (this.use98Style) {
        const containerRect = this.container.getBoundingClientRect();
        startRect = {
          left: containerRect.left,
          top: containerRect.bottom,
          width: 0,
          height: 0,
        };
      } else {
        const stockPilePlaceholders = this.container.querySelectorAll(
          ".stock-card-placeholder",
        );
        startRect =
          stockPilePlaceholders[
            stockPilePlaceholders.length
          ]?.getBoundingClientRect() ||
          this.container.querySelector(".stock-pile").getBoundingClientRect();
      }

      const tableauPileRects = Array.from(
        this.container.querySelectorAll(".tableau-pile"),
      ).map((pile) => pile.getBoundingClientRect());
      const containerRect = this.container.getBoundingClientRect();

      const animationLayer = document.createElement("div");
      animationLayer.className = "animation-layer";
      this.container.appendChild(animationLayer);

      let animationsCompleted = 0;

      cards.forEach((card, index) => {
        card.faceUp = true; // Ensure card is face-up before creating the element
        const cardDiv = card.element;

        cardDiv.style.position = "absolute";
        cardDiv.style.left = `${startRect.left - containerRect.left - 70}px`;
        cardDiv.style.top = `${startRect.top - containerRect.top}px`;
        cardDiv.style.transition = "left 0.2s ease-out, top 0.2s ease-out";
        cardDiv.style.zIndex = 100 + index;
        animationLayer.appendChild(cardDiv);

        setTimeout(() => {
          const pile = this.game.tableauPiles[index];
          const targetRect = tableauPileRects[index];

          // Calculate final top offset based on CSS margins
          let topOffset = 0;
          for (let i = 0; i < pile.cards.length; i++) {
            topOffset += pile.cards[i].faceUp ? 20 : 5;
          }

          cardDiv.style.left = `${targetRect.left - containerRect.left + 5}px`;
          cardDiv.style.top = `${targetRect.top - containerRect.top + 5 + topOffset}px`;

          cardDiv.addEventListener(
            "transitionend",
            () => {
              animationsCompleted++;
              if (animationsCompleted === cards.length) {
                animationLayer.remove();
                resolve();
              }
            },
            { once: true },
          );
        }, index * 100);
      });
    });
    this.render();
    this._updateMenuBar(this.win);
  }

  _updateStatusBar() {
    const scoreDisplay = this.container.querySelector("#score-display");
    const movesDisplay = this.container.querySelector("#moves-display");
    if (scoreDisplay) {
      scoreDisplay.textContent = `Score: ${this.game.score}`;
    }
    if (movesDisplay) {
      movesDisplay.textContent = `Moves: ${this.game.moves}`;
    }
    this._updateSuitsRemovedStatus();
  }

  _updateSuitsRemovedStatus() {
    const suitsRemovedDisplay = this.container.querySelector("#suits-removed-display");
    if (suitsRemovedDisplay && this.game) {
      const suitSymbols = {
        spades: '♠',
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
      };

      const completedSets = this.game.completedSetsBySuit;
      const numberOfSuits = this.game.numberOfSuits;

      let suitsToDisplay;
      if (numberOfSuits === 1) {
        suitsToDisplay = ['spades'];
      } else if (numberOfSuits === 2) {
        suitsToDisplay = ['spades', 'hearts'];
      } else {
        suitsToDisplay = ['spades', 'hearts', 'diamonds', 'clubs'];
      }

      let html = "Suits removed: ";
      for (const suit of suitsToDisplay) {
        html += `${suitSymbols[suit]} ${completedSets[suit] ?? 0} `;
      }
      suitsRemovedDisplay.innerHTML = html.trim();
    }
  }

  async showWinDialog() {
    const { ShowDialogWindow } =
      await import("../../components/DialogWindow.js");
    ShowDialogWindow({
      title: "Congratulations!",
      text: "You Win!",
      buttons: [{ label: "OK" }],
    });
    this._updateMenuBar(this.win);
  }

  showNextAvailableMove() {
    const moves = this.game.findAllAvailableMoves();
    if (moves.length === 0) {
      window.playSound('Warning');
      return;
    }

    if (this.availableMovesIndex >= moves.length) {
      this.availableMovesIndex = 0;
    }

    const move = moves[this.availableMovesIndex];
    const { fromPileIndex, cardIndex, toPileIndex } = move;

    const fromPile = this.game.tableauPiles[fromPileIndex];
    const cardsToHighlight = fromPile.cards.slice(cardIndex);

    const sourceElements = cardsToHighlight.map(card => {
        return this.container.querySelector(`.card[data-uid='${card.uid}']`);
    }).filter(el => el);
    sourceElements.forEach(el => el.classList.add('card-highlight'));

    const toPileDiv = this.container.querySelector(`.tableau-pile[data-pile-index='${toPileIndex}']`);
    let targetElement;
    if (this.game.tableauPiles[toPileIndex].cards.length === 0) {
      targetElement = toPileDiv.querySelector('.tableau-placeholder');
    } else {
      const topCard = this.game.tableauPiles[toPileIndex].topCard;
      targetElement = this.container.querySelector(`.card[data-uid='${topCard.uid}']`);
    }

    setTimeout(() => {
      sourceElements.forEach(el => el.classList.remove('card-highlight'));
      if (targetElement) {
        targetElement.classList.add('card-highlight');
      }

      setTimeout(() => {
        if (targetElement) {
          targetElement.classList.remove('card-highlight');
        }
      }, 500);
    }, 500);

    this.availableMovesIndex++;
  }
}
