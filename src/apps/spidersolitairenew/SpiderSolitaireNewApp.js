import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
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

    win.element.querySelector(".window-content").innerHTML = `
            <div class="spider-solitaire-container">
                <div class="toolbar">
                    <button data-action="new-game">New Game</button>
                    <select data-action="difficulty">
                        <option value="1">Easy (1 Suit)</option>
                        <option value="2">Medium (2 Suits)</option>
                        <option value="4">Hard (4 Suits)</option>
                    </select>
                </div>
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
    this.startNewGame();

    return win;
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
      const placeholder = document.createElement("div");
      placeholder.className = "card face-down";
      stockContainer.appendChild(placeholder);
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
    this.container
      .querySelector('[data-action="new-game"]')
      .addEventListener("click", () => {
        const difficulty = this.container.querySelector(
          '[data-action="difficulty"]',
        ).value;
        this.startNewGame(parseInt(difficulty, 10));
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
    }
  }

  async onStockClick() {
    const result = this.game.dealFromStock();

    if (result.success) {
      this.game.tableauPiles.forEach((pile, index) => {
        this.game.checkForCompletedSets(index);
      });
      if (this.game.checkForWin()) {
        this.showWinDialog();
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

    this.render();
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
