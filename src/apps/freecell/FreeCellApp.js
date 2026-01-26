import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./freecell.css";
import "../../styles/solitaire.css";
import freecellTable from "./assets/freecell-table.png";
import kingLeft from "./assets/king-left.png";
import kingRight from "./assets/king-right.png";
import kingWin from "./assets/king-win.png";

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
          <img class="king-image" src="${kingLeft}" alt="King" />
          <img class="king-win-image" src="${kingWin}" alt="Winning King" />
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
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleFreeCellsMouseOver =
      this.handleFreeCellsMouseOver.bind(this);
    this.boundHandleFoundationsMouseOver =
      this.handleFoundationsMouseOver.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);

    this.addEventListeners();
    this.render();

    win.on("close", () => {
      this.removeEventListeners();
    });

    return win;
  }

  startNewGame(gameNumber) {
    const kingWinImage = this.container.querySelector(".king-win-image");
    kingWinImage.classList.remove("visible");

    this.game = new Game(gameNumber);
    this.selectedCard = null;
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
          shortcut: "F3",
        },
        {
          label: "Restart Game",
          action: () => this._restartGame(),
        },
        "MENU_DIVIDER",
        {
          label: "Statistics...",
          shortcut: "F4",
          enabled: false,
        },
        {
          label: "Options...",
          shortcut: "F5",
          enabled: false,
        },
        "MENU_DIVIDER",
        {
          label: "Undo",
          action: () => this._undoMove(),
          shortcut: "F10",
          enabled: () =>
            this.game && this.game.lastMove !== null && !this.isAnimating,
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

  _restartGame() {
    if (this.game) {
      this.startNewGame(this.game.gameNumber);
    }
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

  async _undoMove() {
    if (this.isAnimating || !this.game?.lastMove) return;

    const lastMove = this.game.lastMove;
    const { type, payload } = lastMove;

    this.isAnimating = true;
    this._updateMenuBar(this.win); // Disable Undo menu item during animation

    if (type === "card") {
      const card = payload;
      // Hide the original card element before starting the animation.
      card.element.style.opacity = "0";
      // Animate the card moving back to its original position.
      await this.animateMove([card], lastMove.from.type, lastMove.from.index);
    } else if (type === "stack") {
      const stack = payload;
      const fromTableauIndex = lastMove.to; // The source for the undo is the last move's destination
      const toTableauIndex = lastMove.from; // The destination for the undo is the last move's source

      // Generate the animation plan for moving the stack back.
      const reversePlan = this.game.getSupermovePlan(
        stack,
        fromTableauIndex,
        toTableauIndex,
      );

      // Hide the original card elements before starting the animation.
      stack.forEach((c) => (c.element.style.opacity = "0"));

      // Execute the reverse animation.
      await this.animateSupermove(reversePlan);
    }

    // After the animation is complete, update the game's data model.
    this.game.undo();
    // Re-render the entire board to reflect the final, correct state.
    this.render();

    this.isAnimating = false;
    this._updateMenuBar(this.win); // Re-enable relevant menu items.
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
    this.win.element.addEventListener("keydown", this.boundHandleKeyDown);

    const freeCells = this.container.querySelector(".free-cells");
    const foundations = this.container.querySelector(".foundations");

    freeCells.addEventListener("mouseover", this.boundHandleFreeCellsMouseOver);
    foundations.addEventListener(
      "mouseover",
      this.boundHandleFoundationsMouseOver,
    );

    this.container.addEventListener("mousemove", this.boundHandleMouseMove);
    this.container.addEventListener("mouseout", this.boundHandleMouseOut);
  }

  removeEventListeners() {
    this.container.removeEventListener("click", this.boundOnClick);
    this.win.element.removeEventListener("keydown", this.boundHandleKeyDown);

    const freeCells = this.container.querySelector(".free-cells");
    const foundations = this.container.querySelector(".foundations");

    if (freeCells) {
      freeCells.removeEventListener(
        "mouseover",
        this.boundHandleFreeCellsMouseOver,
      );
    }
    if (foundations) {
      foundations.removeEventListener(
        "mouseover",
        this.boundHandleFoundationsMouseOver,
      );
    }

    this.container.removeEventListener("mousemove", this.boundHandleMouseMove);
    this.container.removeEventListener("mouseout", this.boundHandleMouseOut);
  }

  handleFreeCellsMouseOver() {
    const kingImage = this.container.querySelector(".king-image");
    kingImage.src = kingLeft;
  }

  handleFoundationsMouseOver() {
    const kingImage = this.container.querySelector(".king-image");
    kingImage.src = kingRight;
  }

  handleMouseMove(event) {
    if (!this.selectedCard) return;

    const pileElement = event.target.closest(
      ".free-cell-pile, .foundation-pile, .tableau-pile",
    );

    // Remove cursor from any previously targeted element
    const priorCursorElement = this.container.querySelector(
      ".legal-top-cursor, .legal-tableau-cursor",
    );
    if (priorCursorElement && priorCursorElement !== pileElement) {
      priorCursorElement.classList.remove(
        "legal-top-cursor",
        "legal-tableau-cursor",
      );
    }

    if (!pileElement) return;

    const destinationType = pileElement.dataset.type;
    const destinationIndex = parseInt(pileElement.dataset.index, 10);
    let isLegal = false;
    let cursorClass = "";

    if (destinationType === "freecell") {
      if (this.game.freeCells[destinationIndex] === null) {
        isLegal = true;
        cursorClass = "legal-top-cursor";
      }
    } else if (destinationType === "foundation") {
      const toPile = this.game.foundationPiles[destinationIndex];
      if (this.game.isFoundationMoveValid(this.selectedCard, toPile)) {
        isLegal = true;
        cursorClass = "legal-top-cursor";
      }
    } else if (destinationType === "tableau") {
      const toPile = this.game.tableauPiles[destinationIndex];
      let moveIsValid = false;

      if (this.selectedSource.type === "tableau") {
        const fromPile = this.game.tableauPiles[this.selectedSource.index];
        const stackToMove = this.game.getStackToMove(
          this.selectedCard,
          fromPile,
          toPile,
        );
        if (stackToMove) {
          moveIsValid = true;
        }
      } else if (this.selectedSource.type === "freecell") {
        if (this.game.isTableauMoveValid(this.selectedCard, toPile)) {
          moveIsValid = true;
        }
      }

      if (moveIsValid) {
        isLegal = true;
        if (toPile.length === 0) {
          cursorClass = "legal-top-cursor";
        } else {
          cursorClass = "legal-tableau-cursor";
        }
      }
    }

    if (isLegal) {
      pileElement.classList.add(cursorClass);
    } else {
      pileElement.classList.remove("legal-top-cursor", "legal-tableau-cursor");
    }
  }

  handleMouseOut(event) {
    if (!this.selectedCard) return;

    const pileElement = event.target.closest(
      ".free-cell-pile, .foundation-pile, .tableau-pile",
    );
    if (pileElement) {
      pileElement.classList.remove("legal-top-cursor", "legal-tableau-cursor");
    }
  }

  handleKeyDown(event) {
    if (event.key === "F2") {
      event.preventDefault();
      this._showNewGameDialog();
    } else if (event.key === "F3") {
      event.preventDefault();
      this._showSelectGameDialog();
    } else if (event.key === "F4" || event.key === "F5") {
      // Corresponding menu items are disabled
      event.preventDefault();
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
      await this.startAutoMove();
    } else {
      // If no move was made, it was an invalid move

      ShowDialogWindow({
        title: "Invalid Move",
        text: "That move is not allowed.",
        buttons: [{ label: "OK" }],
        soundEvent: "SystemExclamation",
        parentWindow: this.win,
      });
    }

    // Clean up any lingering cursor classes after a move attempt
    const priorCursorElement = this.container.querySelector(
      ".legal-top-cursor, .legal-tableau-cursor",
    );
    if (priorCursorElement) {
      priorCursorElement.classList.remove(
        "legal-top-cursor",
        "legal-tableau-cursor",
      );
    }
  }

  async startAutoMove() {
    this.isAnimating = true;
    let moves;
    while ((moves = this.game.findAllFoundationMoves()).length > 0) {
      for (const move of moves) {
        // Hide the original card
        move.card.element.style.opacity = "0";

        // Animate the move
        await this.animateMove([move.card], move.toType, move.toIndex);

        // Update the game state
        this.game.moveCard(move.card, move.from, move.toType, move.toIndex);

        // Re-render the board to reflect the move
        this.render();
      }
    }
    this.isAnimating = false;

    if (this.game.checkForWin()) {
      this.showWinDialog();
    } else if (!this.game.hasLegalMoves()) {
      this._showGameOverDialog();
    }
  }

  _showGameOverDialog() {
    const dialog = new window.$Window({
      title: "Game Over",
      width: 280,
      height: 150,
      resizable: false,
      minimizeButton: false,
      maximizeButton: false,
      parentWindow: this.win,
    });

    const content = `
      <div class="game-over-dialog" style="text-align: center; padding: 10px;">
        <p>Sorry, you lose.</p>
        <p>There are no more legal moves.</p>
        <p>Do you want to play again?</p>
        <div class="field-row" style="justify-content: center; margin-top: 10px;">
          <input type="checkbox" id="same-game-checkbox" checked>
          <label for="same-game-checkbox">Same game</label>
        </div>
        <div class="field-row" style="justify-content: center; margin-top: 10px;">
          <button class="button-default-size" id="yes-button">Yes</button>
          <button class="button-default-size" id="no-button">No</button>
        </div>
      </div>
    `;

    dialog.element.querySelector(".window-content").innerHTML = content;
    dialog.center();

    const checkbox = dialog.element.querySelector("#same-game-checkbox");
    const yesButton = dialog.element.querySelector("#yes-button");
    const noButton = dialog.element.querySelector("#no-button");

    yesButton.addEventListener("click", () => {
      const sameGame = checkbox.checked;
      if (sameGame) {
        this.startNewGame(this.game.gameNumber);
      } else {
        this._showNewGameDialog();
      }
      dialog.close();
    });

    noButton.addEventListener("click", () => {
      dialog.close();
    });
  }

  promptForMoveType(stack, card, fromLocation, toIndex) {
    ShowDialogWindow({
      title: "Move to Empty Column...",
      text: "Do you want to move the entire column or just the single card?",
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
          label: "Move single card",
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
    const kingWinImage = this.container.querySelector(".king-win-image");
    kingWinImage.classList.add("visible");

    ShowDialogWindow({
      title: "Game Over",
      text: "Congratulations, you win! Do you want to play again?",
      buttons: [
        { label: "Yes", action: () => this.startNewGame() },
        { label: "No" },
      ],
      parentWindow: this.win,
    });
  }
}
