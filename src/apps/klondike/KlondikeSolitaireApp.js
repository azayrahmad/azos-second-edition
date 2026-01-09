import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./klondike.css";
import "../../styles/solitaire.css";
import { apps as desktopApps } from "../../config/apps.js";

export class KlondikeSolitaireApp extends Application {
  static config = {
    id: "klondike",
    title: "Klondike Solitaire",
    width: 700,
    height: 600,
    resizable: true,
    icon: ICONS.solitaire,
  };

  async _createWindow() {
    const win = new window.$Window({
      title: this.config.title,
      outerWidth: this.config.width,
      outerHeight: this.config.height,
      resizable: this.config.resizable,
      icons: this.icon,
    });

    this._updateMenuBar(win);

    win.element.querySelector(".window-content").innerHTML = `
      <div class="klondike-solitaire-container">
        <div class="game-board">
          <div class="top-piles">
            <div class="stock-pile"></div>
            <div class="waste-pile"></div>
            <div class="spacer"></div>
            <div class="foundation-piles"></div>
          </div>
          <div class="tableau-piles"></div>
        </div>
      </div>
    `;

    this.win = win;
    this.container = win.element.querySelector(".klondike-solitaire-container");
    this.container.classList.add("style-98");

    this.isDragging = false;
    this.draggedElement = null;
    this.draggedCardsInfo = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);

    this.addEventListeners();

    this.startNewGame();

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
            action: () => this.startNewGame(),
          },
          {
            label: "No",
            action: () => {},
          },
        ],
        parentWindow: this.win,
      });
    } else {
      this.startNewGame();
    }
  }

  async startNewGame() {
    this.game = new Game();
    this.render();
    this._updateMenuBar(this.win);
  }

  _updateMenuBar(win) {
    const menuBar = new window.MenuBar({
      Game: [
        {
          label: "New Game",
          action: () => this._showNewGameDialog(),
          shortcut: "F2",
        },
        "MENU_DIVIDER",
        {
          label: "Exit",
          action: () => this.win.close(),
        },
      ],
    });
    win.setMenuBar(menuBar);
  }

  render() {
    this.renderTableau();
    this.renderStock();
    this.renderWaste();
    this.renderFoundations();
  }

  renderTableau() {
    const tableauContainer = this.container.querySelector(".tableau-piles");
    tableauContainer.innerHTML = "";
    this.game.tableauPiles.forEach((pile, pileIndex) => {
      const pileDiv = document.createElement("div");
      pileDiv.className = "tableau-pile";
      pileDiv.dataset.pileIndex = pileIndex;
      pileDiv.dataset.pileType = "tableau";

      if (pile.cards.length === 0) {
        const placeholderDiv = document.createElement("div");
        placeholderDiv.className = "tableau-placeholder";
        pileDiv.appendChild(placeholderDiv);
      } else {
        let topOffset = 0;
        const overlap = 15;
        const faceDownOverlap = 5;

        pile.cards.forEach((card, cardIndex) => {
          const cardDiv = card.element;
          cardDiv.style.top = `${topOffset}px`;
          cardDiv.dataset.pileIndex = pileIndex;
          cardDiv.dataset.cardIndex = cardIndex;
          cardDiv.dataset.pileType = "tableau";
          pileDiv.appendChild(cardDiv);

          if (card.faceUp) {
            topOffset += overlap;
          } else {
            topOffset += faceDownOverlap;
          }
        });
      }
      tableauContainer.appendChild(pileDiv);
    });
  }

  renderStock() {
    const stockContainer = this.container.querySelector(".stock-pile");
    stockContainer.innerHTML = "";
    stockContainer.dataset.pileType = "stock";
    if (this.game.stockPile.cards.length > 0) {
        const placeholder = document.createElement("div");
        placeholder.className = "stock-card-placeholder";
        stockContainer.appendChild(placeholder);
    }
  }

  renderWaste() {
    const wasteContainer = this.container.querySelector(".waste-pile");
    wasteContainer.innerHTML = "";
    wasteContainer.dataset.pileType = "waste";
    if (this.game.wastePile.cards.length > 0) {
        const topCard = this.game.wastePile.topCard;
        const cardDiv = topCard.element;
        cardDiv.dataset.pileType = "waste";
        cardDiv.dataset.cardIndex = this.game.wastePile.cards.length - 1;
        cardDiv.dataset.pileIndex = 0;
        wasteContainer.appendChild(cardDiv);
    }
  }

  renderFoundations() {
    const foundationContainer = this.container.querySelector(".foundation-piles");
    foundationContainer.innerHTML = "";
    this.game.foundationPiles.forEach((pile, pileIndex) => {
      const pileDiv = document.createElement("div");
      pileDiv.className = "foundation-pile";
      pileDiv.dataset.pileIndex = pileIndex;
      pileDiv.dataset.pileType = "foundation";

      if (pile.topCard) {
        const cardDiv = pile.topCard.element;
        cardDiv.dataset.pileIndex = pileIndex;
        cardDiv.dataset.cardIndex = pile.cards.length - 1;
        cardDiv.dataset.pileType = "foundation";
        pileDiv.appendChild(cardDiv);
      } else {
        const placeholderDiv = document.createElement("div");
        placeholderDiv.className = "foundation-placeholder";
        pileDiv.appendChild(placeholderDiv);
      }
      foundationContainer.appendChild(pileDiv);
    });
  }

  addEventListeners() {
    this.container.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.container.addEventListener("click", this.onClick.bind(this));
    this.container.addEventListener("dblclick", this.onDoubleClick.bind(this));
    this.win.element.addEventListener("keydown", (event) => {
       if (event.key === "F2") {
        event.preventDefault();
        this._showNewGameDialog();
      }
    });
  }

  onClick(event) {
    if (this.wasDragged) return;

    const stockPileDiv = event.target.closest(".stock-pile");
    if (stockPileDiv) {
        this.game.dealFromStock();
        this.render();
        return;
    }

    const cardDiv = event.target.closest(".card");
    if (cardDiv) {
        const pileType = cardDiv.dataset.pileType;
        if (pileType === 'tableau') {
            const pileIndex = parseInt(cardDiv.dataset.pileIndex, 10);
            const cardIndex = parseInt(cardDiv.dataset.cardIndex, 10);
            this.game.flipTableauCard(pileIndex, cardIndex);
            this.render();
        }
    }
  }

  onDoubleClick(event) {
    const cardDiv = event.target.closest(".card");
    if (!cardDiv) return;

    const pileType = cardDiv.dataset.pileType;
    const pileIndex = parseInt(cardDiv.dataset.pileIndex, 10);
    const cardIndex = parseInt(cardDiv.dataset.cardIndex, 10);

    console.log(`Double-clicked on: ${pileType}, pile ${pileIndex}, card ${cardIndex}`);

    if (this.game.autoMoveToFoundation(pileType, pileIndex, cardIndex)) {
      this.render();
      if (this.game.checkForWin()) {
        this.showWinDialog();
      }
    }
  }

  onMouseDown(event) {
    if (event.button !== 0) return; // Only main button
    this.wasDragged = false;

    const cardDiv = event.target.closest(".card");
    if (!cardDiv) return;

    const pileType = cardDiv.dataset.pileType;
    const pileIndex = parseInt(cardDiv.dataset.pileIndex, 10);
    const cardIndex = parseInt(cardDiv.dataset.cardIndex, 10);

    if (!this.game.isValidMoveStack(pileType, pileIndex, cardIndex)) return;

    event.preventDefault();

    this.isDragging = true;
    this.draggedCardsInfo = { pileType, pileIndex, cardIndex };

    let fromPile;
    if (pileType === 'tableau') fromPile = this.game.tableauPiles[pileIndex];
    else if (pileType === 'waste') fromPile = this.game.wastePile;
    else if (pileType === 'foundation') fromPile = this.game.foundationPiles[pileIndex];
    else return;

    const cardsToDrag = fromPile.cards.slice(cardIndex);

    const containerRect = this.container.getBoundingClientRect();
    const cardRect = cardDiv.getBoundingClientRect();
    this.dragOffsetX = event.clientX - cardRect.left;
    this.dragOffsetY = event.clientY - cardRect.top;

    this.draggedElement = document.createElement("div");
    this.draggedElement.className = "dragged-stack";
    this.draggedElement.style.position = "absolute";
    this.draggedElement.style.zIndex = "1000";
    this.draggedElement.style.width = `${cardDiv.offsetWidth}px`;
    this.draggedElement.style.height = `${cardDiv.offsetHeight * (1 + (cardsToDrag.length - 1) * 0.2)}px`;

    let topOffset = 0;
    const overlap = 15;

    cardsToDrag.forEach((card) => {
      const originalElement = this.container.querySelector(`.card[data-uid='${card.uid}']`);
      if (originalElement) {
        const clone = originalElement.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.top = `${topOffset}px`;
        this.draggedElement.appendChild(clone);
        originalElement.classList.add("dragging");

        if (card.faceUp) {
            topOffset += overlap;
        } else {
            topOffset += 5; // faceDownOverlap
        }
      }
    });

    this.container.appendChild(this.draggedElement);

    this.draggedElement.style.left = `${cardRect.left - containerRect.left}px`;
    this.draggedElement.style.top = `${cardRect.top - containerRect.top}px`;

    window.addEventListener("mousemove", this.boundOnMouseMove);
    window.addEventListener("mouseup", this.boundOnMouseUp);
  }

  onMouseMove(event) {
    if (!this.isDragging) return;
    this.wasDragged = true;
    const containerRect = this.container.getBoundingClientRect();
    this.draggedElement.style.left = `${event.clientX - containerRect.left - this.dragOffsetX}px`;
    this.draggedElement.style.top = `${event.clientY - containerRect.top - this.dragOffsetY}px`;
  }

  onMouseUp(event) {
    if (!this.isDragging) return;

    // Cleanup dragging state
    this.isDragging = false;
    window.removeEventListener("mousemove", this.boundOnMouseMove);
    window.removeEventListener("mouseup", this.boundOnMouseUp);

    // Un-hide the original cards
    this.container
      .querySelectorAll(".dragging")
      .forEach((el) => el.classList.remove("dragging"));

    // Hide the clone to find the underlying element
    this.draggedElement.style.display = "none";
    const dropTarget = document.elementFromPoint(event.clientX, event.clientY);

    // Remove the clone
    this.container.removeChild(this.draggedElement);
    this.draggedElement = null;

    const toPileDiv = dropTarget?.closest(".tableau-pile, .foundation-pile");

    if (toPileDiv) {
      const { pileType: fromPileType, pileIndex: fromPileIndex, cardIndex } = this.draggedCardsInfo;
      const toPileType = toPileDiv.dataset.pileType;
      const toPileIndex = parseInt(toPileDiv.dataset.pileIndex, 10);

      if (this.game.moveCards(fromPileType, fromPileIndex, cardIndex, toPileType, toPileIndex)) {
        if (this.game.checkForWin()) {
          this.showWinDialog();
        }
        this.render();
        this._updateMenuBar(this.win);
      }
    }

    this.draggedCardsInfo = null;
  }

  async showWinDialog() {
    ShowDialogWindow({
      title: "Game Over",
      text: "Congratulations, you won!\nDo you want to start another game?",
      buttons: [
        {
          label: "Yes",
          action: () => this.startNewGame(),
        },
        { label: "No" },
      ],
      parentWindow: this.win,
    });
    this._updateMenuBar(this.win);
  }
}
