import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./freecell.css";
import "../../styles/solitaire.css";
import freecellTable from "./assets/freecell-table.png";

export class FreeCellApp extends Application {
  static config = {
    id: "freecell",
    title: "FreeCell",
    width: 632,
    height: 446,
    resizable: false,
    icon: ICONS.freecell,
  };

  async _createWindow() {
    const win = new window.$Window({
      title: this.config.title,
      innerWidth: this.config.width,
      innerHeight: this.config.height,
      resizable: this.config.resizable,
      icons: this.icon,
    });

    this._updateMenuBar(win);

    win.element.querySelector(".window-content").innerHTML = `
      <div class="freecell-container">
        <div class="game-board" style="background-image: url(${freecellTable})">
          <div class="top-area">
            <div class="free-cells"></div>
            <div class="foundations"></div>
          </div>
          <div class="tableau-piles"></div>
        </div>
      </div>
    `;

    this.win = win;
    this.container = win.element.querySelector(".freecell-container");

    this.selectedCard = null;
    this.game = null;

    this.boundOnClick = this.onClick.bind(this);
    this.addEventListeners();
    this.render();

    win.on("close", () => {
      this.removeEventListeners();
    });

    return win;
  }

  startNewGame(gameNumber) {
    this.game = new Game(gameNumber);
    this.win.title(`FreeCell Game #${this.game.gameNumber}`);
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
        {
          label: "Select Game...",
          action: () => this._showSelectGameDialog(),
        },
        {
          label: "Undo",
          action: () => this._undoMove(),
          shortcut: "F10",
          enabled: () => this.game && this.game.previousState !== null,
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

  _showNewGameDialog() {
    const gameNumber = Math.floor(Math.random() * 32000) + 1;
    this.startNewGame(gameNumber);
  }

  _showSelectGameDialog() {
    const dialogContent = document.createElement("div");
    dialogContent.innerHTML = `
        <div class="select-game-dialog">
            <label for="game-number-input">Game Number:</label>
            <input type="number" id="game-number-input" value="1">
        </div>
    `;

    const input = dialogContent.querySelector("#game-number-input");

    const handleOk = () => {
      const gameNumber = parseInt(input.value, 10);
      if (!isNaN(gameNumber) && gameNumber >= 1 && gameNumber <= 32000) {
        this.startNewGame(gameNumber);
        dialog.close();
      } else {
        input.value = "0";
      }
    };

    const dialog = ShowDialogWindow({
      title: "Select Game",
      content: dialogContent,
      buttons: [
        {
          label: "OK",
          action: handleOk,
        },
        {
          label: "Cancel",
          action: () => dialog.close(),
        },
      ],
      parentWindow: this.win,
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleOk();
      }
    });
  }

  _undoMove() {
    if (this.game.undo()) {
      this.render();
      this._updateMenuBar(this.win);
    }
  }

  render() {
    this.renderFreeCells();
    this.renderFoundations();
    this.renderTableau();
  }

  renderFreeCells() {
    const freeCellsContainer = this.container.querySelector(".free-cells");
    freeCellsContainer.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const cellDiv = document.createElement("div");
      cellDiv.className = "free-cell-pile";
      cellDiv.dataset.type = "freecell";
      cellDiv.dataset.index = i;

      const card = this.game?.freeCells[i];
      if (card) {
        const cardEl = card.element;
        // Reset styles from animation
        cardEl.style.opacity = "1";
        cardEl.style.top = "0";
        cardEl.style.left = "0";
        cellDiv.appendChild(cardEl);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        cellDiv.appendChild(placeholder);
      }
      freeCellsContainer.appendChild(cellDiv);
    }
  }

  renderFoundations() {
    const foundationsContainer = this.container.querySelector(".foundations");
    foundationsContainer.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const pileDiv = document.createElement("div");
      pileDiv.className = "foundation-pile";
      pileDiv.dataset.type = "foundation";
      pileDiv.dataset.index = i;

      const pile = this.game?.foundationPiles[i];
      if (pile?.length > 0) {
        const topCard = pile[pile.length - 1];
        const cardEl = topCard.element;
        // Reset styles from animation
        cardEl.style.opacity = "1";
        cardEl.style.top = "0";
        cardEl.style.left = "0";
        pileDiv.appendChild(cardEl);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        pileDiv.appendChild(placeholder);
      }
      foundationsContainer.appendChild(pileDiv);
    }
  }

  renderTableau() {
    const tableauContainer = this.container.querySelector(".tableau-piles");
    tableauContainer.innerHTML = "";
    this.game?.tableauPiles.forEach((pile, pileIndex) => {
      const pileDiv = document.createElement("div");
      pileDiv.className = "tableau-pile";
      pileDiv.dataset.type = "tableau";
      pileDiv.dataset.index = pileIndex;

      if (pile.length === 0) {
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        pileDiv.appendChild(placeholder);
      } else {
        pile.forEach((card, cardIndex) => {
          const cardEl = card.element;
          // Reset styles from animation
          cardEl.style.opacity = "1";
          cardEl.style.left = "0";
          cardEl.style.top = `${cardIndex * 25}px`; // Overlap cards
          pileDiv.appendChild(cardEl);
        });
      }
      tableauContainer.appendChild(pileDiv);
    });
  }

  addEventListeners() {
    this.container.addEventListener("click", this.boundOnClick);
    this.win.element.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  removeEventListeners() {
    this.container.removeEventListener("click", this.boundOnClick);
    this.win.element.removeEventListener(
      "keydown",
      this.handleKeyDown.bind(this),
    );
  }

  handleKeyDown(event) {
    if (event.key === "F2") {
      event.preventDefault();
      this._showNewGameDialog();
    } else if (event.key === "F10") {
      event.preventDefault();
      this._undoMove();
    }
  }

  onClick(event) {
    const target = event.target;
    const cardElement = target.closest(".card");
    const pileElement = target.closest(
      ".free-cell-pile, .foundation-pile, .tableau-pile, .placeholder",
    );

    if (this.selectedCard) {
      this.handleMove(cardElement, pileElement);
    } else if (cardElement) {
      this.handleSelectCard(cardElement);
    }
  }

  handleSelectCard(cardElement) {
    const uid = cardElement.dataset.uid;
    const card = this.game.allCards.find((c) => c.uid === uid);

    // Find which tableau pile the card is in
    const fromPileIndex = this.game.tableauPiles.findIndex((p) =>
      p.includes(card),
    );

    if (fromPileIndex !== -1) {
      const fromPile = this.game.tableauPiles[fromPileIndex];
      const cardIndexInPile = fromPile.indexOf(card);

      // Check if the card is part of a valid movable stack
      const movableStack = this.game.findMovableStack(fromPileIndex);
      if (movableStack && movableStack.includes(card)) {
        // Select the whole stack
        this.selectedCard = card; // The top card of the selection
        this.selectedStack = movableStack;
        this.selectedSource = { type: "tableau", index: fromPileIndex };
        this.selectedCard.element.classList.add("selected");
        return;
      }
    }

    // Default to single card selection if not in a movable stack or is a single card
    const location = this.game.getCardLocation(card);
    if (location) {
      if (location.type === "tableau") {
        const pile = this.game.tableauPiles[location.index];
        if (pile[pile.length - 1] !== card) {
          // Only the last card can be selected individually
          return;
        }
      }
      this.selectedCard = card;
      this.selectedStack = null; // Ensure no stack is selected
      this.selectedSource = location;
      card.element.classList.add("selected");
    }
  }

  async handleMove(cardElement, pileElement) {
    const cardToMove = this.selectedCard;
    const stackToMove = this.selectedStack;

    // Deselect everything visually
    cardToMove.element.classList.remove("selected");

    // Deselect if clicking the same card
    if (cardElement === cardToMove.element) {
      this.selectedCard = null;
      this.selectedStack = null;
      return;
    }

    // Determine destination
    let destinationType, destinationIndex;
    if (pileElement) {
      const pileContainer = pileElement.closest("[data-type]");
      if (pileContainer) {
        destinationType = pileContainer.dataset.type;
        destinationIndex = parseInt(pileContainer.dataset.index, 10);
      }
    }

    // Reset selection state
    this.selectedCard = null;
    this.selectedStack = null;

    if (!destinationType) return;

    // Determine if the move is valid and what kind of move it is
    let moveDetails = null;
    const fromLocation = this.selectedSource;

    if (destinationType === "tableau") {
      const toPile = this.game.tableauPiles[destinationIndex];
      const maxMoveSize = this.game.calculateMaxMoveSize();
      const isStackMoveValid =
        stackToMove &&
        this.game.isTableauMoveValid(stackToMove[0], toPile) &&
        stackToMove.length <= maxMoveSize;
      const isSingleMoveValid = this.game.isTableauMoveValid(
        cardToMove,
        toPile,
      );

      if (isStackMoveValid && isSingleMoveValid && stackToMove.length > 1) {
        // Both are valid, so we need to ask the user
        this.promptForMoveType(
          stackToMove,
          cardToMove,
          fromLocation,
          destinationIndex,
        );
        return; // Don't proceed further in handleMove
      } else if (isStackMoveValid) {
        moveDetails = {
          type: "stack",
          payload: stackToMove,
          from: fromLocation.index,
          to: destinationIndex,
        };
      } else if (isSingleMoveValid) {
        moveDetails = {
          type: "card",
          payload: cardToMove,
          from: fromLocation,
          toType: "tableau",
          toIndex: destinationIndex,
        };
      }
    } else if (destinationType === "freecell") {
      if (this.game.freeCells[destinationIndex] === null) {
        moveDetails = {
          type: "card",
          payload: cardToMove,
          from: fromLocation,
          toType: "freecell",
          toIndex: destinationIndex,
        };
      }
    } else if (destinationType === "foundation") {
      const toPile = this.game.foundationPiles[destinationIndex];
      if (this.game.isFoundationMoveValid(cardToMove, toPile)) {
        moveDetails = {
          type: "card",
          payload: cardToMove,
          from: fromLocation,
          toType: "foundation",
          toIndex: destinationIndex,
        };
      }
    }

    if (moveDetails) {
      const animatingCards =
        moveDetails.type === "stack"
          ? moveDetails.payload
          : [moveDetails.payload];

      // Hide original cards
      animatingCards.forEach((c) => (c.element.style.opacity = "0"));

      await this.animateMove(animatingCards, destinationType, destinationIndex);

      // Update game state after animation
      if (moveDetails.type === "stack") {
        this.game.moveStack(
          moveDetails.payload,
          moveDetails.from,
          moveDetails.to,
        );
      } else {
        this.game.moveCard(
          moveDetails.payload,
          moveDetails.from,
          moveDetails.toType,
          moveDetails.toIndex,
        );
      }

      this.render(); // Re-render the board in the final state
      if (this.game.checkForWin()) {
        this.showWinDialog();
      }
    } else {
      // If no move was made, it was an invalid move
      ShowDialogWindow({
        title: "Invalid Move",
        text: "That move is not allowed.",
        buttons: [{ label: "OK" }],
        parentWindow: this.win,
      });
    }
  }

  promptForMoveType(stack, card, fromLocation, toIndex) {
    ShowDialogWindow({
      title: "Move Cards",
      text: "Do you want to move the entire stack or just the single card?",
      buttons: [
        {
          label: `Move ${stack.length} cards`,
          action: async () => {
            stack.forEach((c) => (c.element.style.opacity = "0"));
            await this.animateMove(stack, "tableau", toIndex);
            this.game.moveStack(stack, fromLocation.index, toIndex);
            this.render();
            if (this.game.checkForWin()) this.showWinDialog();
          },
        },
        {
          label: "Move 1 card",
          action: async () => {
            card.element.style.opacity = "0";
            await this.animateMove([card], "tableau", toIndex);
            this.game.moveCard(card, fromLocation, "tableau", toIndex);
            this.render();
            if (this.game.checkForWin()) this.showWinDialog();
          },
        },
      ],
      parentWindow: this.win,
    });
  }

  animateMove(cardsToAnimate, toType, toIndex) {
    return new Promise((resolve) => {
      const containerRect = this.container.getBoundingClientRect();
      const animationLayer = document.createElement("div");
      animationLayer.className = "animation-layer";
      this.container.appendChild(animationLayer);

      const toPileEl = this.container.querySelector(
        `[data-type="${toType}"][data-index="${toIndex}"]`,
      );
      const toPileRect = toPileEl.getBoundingClientRect();

      let destBaseTop = toPileRect.top;
      if (toType === "tableau") {
        const pile = this.game.tableauPiles[toIndex];
        destBaseTop += pile.length * 25;
      }

      const isStackMove = cardsToAnimate.length > 1;
      const startRect = cardsToAnimate[0].element.getBoundingClientRect();
      let elementToAnimate;

      if (isStackMove) {
        elementToAnimate = document.createElement("div");
        elementToAnimate.style.zIndex = "1000";
        cardsToAnimate.forEach((card, i) => {
          const cardElClone = card.element.cloneNode(true);
          cardElClone.style.position = "absolute";
          cardElClone.style.left = "0px";
          cardElClone.style.top = `${i * 25}px`;
          elementToAnimate.appendChild(cardElClone);
        });
      } else {
        elementToAnimate = cardsToAnimate[0].element.cloneNode(true);
        elementToAnimate.style.zIndex = "100";
      }

      elementToAnimate.style.position = "absolute";
      elementToAnimate.style.left = `${startRect.left - containerRect.left}px`;
      elementToAnimate.style.top = `${startRect.top - containerRect.top}px`;
      animationLayer.appendChild(elementToAnimate);

      setTimeout(() => {
        elementToAnimate.style.transition =
          "left 0.2s linear, top 0.2s linear";
        elementToAnimate.style.left = `${toPileRect.left - containerRect.left}px`;
        elementToAnimate.style.top = `${destBaseTop - containerRect.top}px`;

        elementToAnimate.addEventListener(
          "transitionend",
          () => {
            animationLayer.remove();
            resolve();
          },
          { once: true },
        );
      }, 10);
    });
  }

  showWinDialog() {
    ShowDialogWindow({
      title: "Congratulations!",
      text: "You've won! Do you want to play another game?",
      buttons: [
        { label: "Yes", action: () => this.startNewGame() },
        { label: "No" },
      ],
      parentWindow: this.win,
    });
  }
}
