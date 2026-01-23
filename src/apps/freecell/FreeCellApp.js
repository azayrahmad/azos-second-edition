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
    this.isAnimating = false;

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
    if (this.isAnimating) return;

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
    const location = this.game.getCardLocation(card);

    if (!location) return;

    // In tableau piles, only allow selecting the top-most card.
    if (location.type === "tableau") {
      const pile = this.game.tableauPiles[location.index];
      if (pile[pile.length - 1] !== card) {
        return; // Not the top card, so do nothing.
      }
    }

    this.selectedCard = card;
    this.selectedStack = null; // Stack is now inferred on move, not on selection.
    this.selectedSource = location;
    card.element.classList.add("selected");
  }

  async handleMove(cardElement, pileElement) {
    const selectedCard = this.selectedCard;
    const fromLocation = this.selectedSource;

    // Deselect visually
    selectedCard.element.classList.remove("selected");

    // Deselect if clicking the same card
    if (cardElement === selectedCard.element) {
      this.selectedCard = null;
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

    // Reset selection state now that we have all the info
    this.selectedCard = null;
    this.selectedStack = null;

    if (!destinationType) return;

    let moveDetails = null;

    if (destinationType === "tableau") {
      if (fromLocation.type === "tableau") {
        const fromPile = this.game.tableauPiles[fromLocation.index];
        const toPile = this.game.tableauPiles[destinationIndex];
        const stackToMove = this.game.getStackToMove(
          selectedCard,
          fromPile,
          toPile,
        );

        if (stackToMove) {
          if (toPile.length === 0 && stackToMove.length > 1) {
            this.promptForMoveType(
              stackToMove,
              selectedCard,
              fromLocation,
              destinationIndex,
            );
            return; // Stop further execution in handleMove
          }

          if (stackToMove.length > 1) {
            moveDetails = {
              type: "stack",
              payload: stackToMove,
              from: fromLocation.index,
              to: destinationIndex,
            };
          } else {
            moveDetails = {
              type: "card",
              payload: stackToMove[0],
              from: fromLocation,
              toType: "tableau",
              toIndex: destinationIndex,
            };
          }
        }
      } else {
        // Moving a single card from freecell to tableau
        const toPile = this.game.tableauPiles[destinationIndex];
        if (this.game.isTableauMoveValid(selectedCard, toPile)) {
          moveDetails = {
            type: "card",
            payload: selectedCard,
            from: fromLocation,
            toType: "tableau",
            toIndex: destinationIndex,
          };
        }
      }
    } else if (destinationType === "freecell") {
      if (this.game.freeCells[destinationIndex] === null) {
        moveDetails = {
          type: "card",
          payload: selectedCard,
          from: fromLocation,
          toType: "freecell",
          toIndex: destinationIndex,
        };
      }
    } else if (destinationType === "foundation") {
      const toPile = this.game.foundationPiles[destinationIndex];
      if (this.game.isFoundationMoveValid(selectedCard, toPile)) {
        moveDetails = {
          type: "card",
          payload: selectedCard,
          from: fromLocation,
          toType: "foundation",
          toIndex: destinationIndex,
        };
      }
    }

    if (moveDetails) {
      if (moveDetails.type === "stack") {
        const plan = this.game.getSupermovePlan(
          moveDetails.payload,
          moveDetails.from,
          moveDetails.to,
        );
        moveDetails.payload.forEach((c) => (c.element.style.opacity = "0"));
        await this.animateSupermove(plan);
        this.game.moveStack(
          moveDetails.payload,
          moveDetails.from,
          moveDetails.to,
        );
      } else {
        const animatingCards = [moveDetails.payload];
        animatingCards.forEach((c) => (c.element.style.opacity = "0"));
        await this.animateMove(
          animatingCards,
          moveDetails.toType,
          moveDetails.toIndex,
        );
        this.game.moveCard(
          moveDetails.payload,
          fromLocation,
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
            const plan = this.game.getSupermovePlan(
              stack,
              fromLocation.index,
              toIndex,
            );
            stack.forEach((c) => (c.element.style.opacity = "0"));
            await this.animateSupermove(plan);
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

  async animateSupermove(plan) {
    this.isAnimating = true;

    const containerRect = this.container.getBoundingClientRect();
    const animationLayer = document.createElement("div");
    animationLayer.className = "animation-layer";
    this.container.appendChild(animationLayer);

    const cardElements = new Map();

    for (const move of plan) {
      await new Promise((resolve) => {
        const card = move.card;
        const from = move.from;
        const to = move.to;

        let cardEl = cardElements.get(card);
        if (!cardEl) {
          cardEl = card.element.cloneNode(true);
          cardEl.style.opacity = "1"; // Make the clone visible
          const startRect = card.element.getBoundingClientRect();
          cardEl.style.position = "absolute";
          cardEl.style.left = `${startRect.left - containerRect.left}px`;
          cardEl.style.top = `${startRect.top - containerRect.top}px`;
          cardEl.style.zIndex = 100; // a base z-index
          animationLayer.appendChild(cardEl);
          cardElements.set(card, cardEl);
        }

        const toPileEl = this.container.querySelector(
          `[data-type="${to.type}"][data-index="${to.index}"]`,
        );
        const toPileRect = toPileEl.getBoundingClientRect();

        let destTop = toPileRect.top;
        if (to.type === "tableau") {
          // To stack cards correctly during the animation, we need to calculate
          // the visual offset based on how many cards are already in the target pile *in the animation's context*.
          // This requires iterating through the plan up to the current move to simulate the pile's state.
          let cardsInPile = 0;
          for (const otherMove of plan.slice(0, plan.indexOf(move))) {
            if (
              otherMove.to.type === "tableau" &&
              otherMove.to.index === to.index
            ) {
              cardsInPile++;
            }
            if (
              otherMove.from.type === "tableau" &&
              otherMove.from.index === to.index
            ) {
              cardsInPile--;
            }
          }
          destTop +=
            (this.game.tableauPiles[to.index].length + cardsInPile) * 25;
        }

        setTimeout(() => {
          cardEl.style.transition = "left 0.1s linear, top 0.1s linear";
          cardEl.style.left = `${toPileRect.left - containerRect.left}px`;
          cardEl.style.top = `${destTop - containerRect.top}px`;

          cardEl.addEventListener("transitionend", resolve, { once: true });
        }, 10);
      });
    }

    animationLayer.remove();
    this.isAnimating = false;
  }

  animateMove(cardsToAnimate, toType, toIndex) {
    this.isAnimating = true;
    return new Promise(async (resolve) => {
      const containerRect = this.container.getBoundingClientRect();
      const animationLayer = document.createElement("div");
      animationLayer.className = "animation-layer";
      this.container.appendChild(animationLayer);

      const toPileEl = this.container.querySelector(
        `[data-type="${toType}"][data-index="${toIndex}"]`,
      );
      const toPileRect = toPileEl.getBoundingClientRect();

      // Determine the base top position for the destination
      let destBaseTop = toPileRect.top;
      if (toType === "tableau") {
        const pile = this.game.tableauPiles[toIndex];
        destBaseTop += pile.length * 25; // Offset by existing cards
      }

      const animationPromises = cardsToAnimate.map((card, i) => {
        return new Promise((animResolve) => {
          const cardEl = card.element.cloneNode(true);
          const startRect = card.element.getBoundingClientRect();

          // Make sure the clone is visible, as the original is hidden
          cardEl.style.opacity = "1";
          cardEl.style.position = "absolute";
          cardEl.style.left = `${startRect.left - containerRect.left}px`;
          cardEl.style.top = `${startRect.top - containerRect.top}px`;
          cardEl.style.zIndex = 100 + i;
          animationLayer.appendChild(cardEl);

          setTimeout(() => {
            cardEl.style.transition = "left 0.1s linear, top 0.1s linear";
            cardEl.style.left = `${toPileRect.left - containerRect.left}px`;
            cardEl.style.top = `${destBaseTop - containerRect.top + i * 25}px`;

            cardEl.addEventListener("transitionend", animResolve, {
              once: true,
            });
          }, 10);
        });
      });

      await Promise.all(animationPromises);
      animationLayer.remove();
      this.isAnimating = false;
      resolve();
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
