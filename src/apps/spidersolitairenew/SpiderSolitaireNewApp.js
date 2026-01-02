import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./spidersolitairenew.css";

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
    const win = new window.$Window({
      title: this.config.title,
      outerWidth: this.config.width,
      outerHeight: this.config.height,
      resizable: this.config.resizable,
      icons: this.icon,
    });

    const menuBar = new window.MenuBar({
      Game: [
        {
          label: "New Game",
          action: () => this._showNewGameDialog(),
        },
      ],
    });
    win.setMenuBar(menuBar);

    win.element.querySelector(".window-content").innerHTML = `
            <div class="spider-solitaire-container">
                <div class="game-board">
                    <div class="tableau-piles"></div>
                    <div class="bottom-area">
                        <div class="foundation-piles"></div>
                        <div class="stock-pile"></div>
                    </div>
                </div>
            </div>
        `;

    this.win = win;
    this.container = win.element.querySelector(".spider-solitaire-container");
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
  }

  render() {
    this.renderTableau();
    this.renderStock();
    this.renderFoundations();
  }

  renderTableau() {
    const tableauContainer = this.container.querySelector(".tableau-piles");
    tableauContainer.innerHTML = "";
    this.game.tableauPiles.forEach((pile, pileIndex) => {
      const pileDiv = document.createElement("div");
      pileDiv.className = "tableau-pile";
      pileDiv.dataset.pileIndex = pileIndex;

      pile.cards.forEach((card, cardIndex) => {
        const cardDiv = card.element;
        cardDiv.dataset.pileIndex = pileIndex;
        cardDiv.dataset.cardIndex = cardIndex;
        pileDiv.appendChild(cardDiv);
      });
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
      const stockPilePlaceholders = this.container.querySelectorAll(
        ".stock-card-placeholder",
      );
      const startRect =
        stockPilePlaceholders[
          stockPilePlaceholders.length - 1
        ]?.getBoundingClientRect() ||
        this.container.querySelector(".stock-pile").getBoundingClientRect();

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
        cardDiv.style.left = `${startRect.left - containerRect.left}px`;
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
  }

  async showWinDialog() {
    const { ShowDialogWindow } =
      await import("../../components/DialogWindow.js");
    ShowDialogWindow({
      title: "Congratulations!",
      text: "You Win!",
      buttons: [{ label: "OK" }],
    });
  }
}
