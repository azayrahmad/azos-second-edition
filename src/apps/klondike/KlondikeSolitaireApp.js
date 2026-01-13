import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { Game } from "./Game.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import {
  getItem,
  setItem,
  LOCAL_STORAGE_KEYS,
} from "../../utils/localStorage.js";
import "./klondike.css";
import "./options.css";
import "../../styles/solitaire.css";

const animatedCardBacks = {
  "cardback-robot1": { frames: 3, prefix: "cardback-robot" },
  "cardback-hand1": { frames: 3, prefix: "cardback-hand" },
  "cardback-castle1": { frames: 2, prefix: "cardback-castle" },
  "cardback-beach1": { frames: 3, prefix: "cardback-beach" },
};

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
            <div class="waste-pile-container">
              <div class="waste-pile"></div>
              <div class="drawn-card-pile"></div>
            </div>
            <div class="spacer"></div>
            <div class="foundation-piles"></div>
          </div>
          <div class="tableau-piles"></div>
        </div>
        <div class="status-bar">
          <span id="klondike-timer">Time: 0</span>
          <span id="klondike-score">Score: 0</span>
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

    this.animationTimer = null;

    this.addEventListeners();

    this.startNewGame();

    win.on("close", () => {
      clearInterval(this.animationTimer);
      if (this.game) {
        this.game.stopTimer();
      }
    });

    win.on("minimize", () => {
      if (this.game) {
        this.game.pauseTimer();
      }
    });

    win.on("restore", () => {
      if (this.game) {
        this.game.resumeTimer();
      }
    });

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
    if (this.game) {
      this.game.destroy();
    }
    this.game = new Game();
    this.game.onScoreUpdate = (scores) => this.updateScoreDisplay(scores);

    const timerElement = this.win.element.querySelector("#klondike-timer");
    if (this.game.isTimedGame) {
      timerElement.style.display = "inline";
      timerElement.textContent = "Time: 0";
      this.game.onTimerUpdate = (time) => {
        timerElement.textContent = `Time: ${time}`;
      };
    } else {
      timerElement.style.display = "none";
    }

    this.updateScoreDisplay({
      standard: this.game.score,
      vegas: this.game.vegasScore,
    });
    this.render();
    this._updateMenuBar(this.win);
    this._updateCardBackAnimation();
  }

  updateScoreDisplay(scores) {
    const scoreElement = this.win.element.querySelector("#klondike-score");
    if (!scoreElement) return;

    const scoringOption =
      getItem(LOCAL_STORAGE_KEYS.KLONDIKE_SCORING) || "standard";

    switch (scoringOption) {
      case "standard":
        scoreElement.textContent = `Score: ${scores.standard}`;
        scoreElement.style.display = "inline";
        break;
      case "vegas":
        scoreElement.textContent = `Score: $${scores.vegas}`;
        scoreElement.style.display = "inline";
        break;
      case "none":
        scoreElement.style.display = "none";
        break;
    }
  }

  _updateCardBackAnimation() {
    clearInterval(this.animationTimer);
    const stockCard = this.container.querySelector(".stock-top-card");

    if (stockCard) {
      // Remove all possible animation classes
      for (const key in animatedCardBacks) {
        const info = animatedCardBacks[key];
        for (let i = 1; i <= info.frames; i++) {
          stockCard.classList.remove(`${info.prefix}${i}`);
        }
      }
    }

    const animationInfo = animatedCardBacks[this.game.cardBack];
    if (!animationInfo) return;

    let currentFrame = 1;
    let animationDirection = 1; // 1 for increasing, -1 for decreasing

    this.animationTimer = setInterval(() => {
      const stockCard = this.container.querySelector(".stock-top-card");
      if (stockCard) {
        // Remove all frames for the current animation before adding the new one
        for (let i = 1; i <= animationInfo.frames; i++) {
          stockCard.classList.remove(`${animationInfo.prefix}${i}`);
        }
        stockCard.classList.add(`${animationInfo.prefix}${currentFrame}`);

        currentFrame += animationDirection;

        if (currentFrame > animationInfo.frames) {
          currentFrame = animationInfo.frames - 1; // Go back from the last frame
          animationDirection = -1;
        } else if (currentFrame < 1) {
          currentFrame = 2; // Go forward from the second frame
          animationDirection = 1;
        }
      }
    }, 500);
  }

  _showDeckSelectionDialog() {
    const cardBacks = [
      "cardback1",
      "cardback2",
      "cardback-fish1",
      "cardback-fish2",
      "cardback3",
      "cardback4",
      "cardback-robot1",
      "cardback-rose",
      "cardback-shell",
      "cardback-castle1",
      "cardback-beach1",
      "cardback-hand1",
    ];

    let selectedCardBack = this.game.cardBack;

    const dialogContent = document.createElement("div");
    dialogContent.className = "deck-selection-container";

    cardBacks.forEach((cardBack) => {
      const cardDiv = document.createElement("div");
      cardDiv.className = `card-back-preview card ${cardBack}`;
      if (cardBack === selectedCardBack) {
        cardDiv.classList.add("selected");
      }
      cardDiv.dataset.cardBack = cardBack;
      cardDiv.addEventListener("click", () => {
        selectedCardBack = cardBack;
        dialogContent.querySelectorAll(".card-back-preview").forEach((div) => {
          div.classList.remove("selected");
        });
        cardDiv.classList.add("selected");
      });
      dialogContent.appendChild(cardDiv);
    });

    ShowDialogWindow({
      title: "Select Card Back",
      content: dialogContent,
      buttons: [
        {
          label: "OK",
          action: () => {
            if (this.game.cardBack !== selectedCardBack) {
              this.game.setCardBack(selectedCardBack);
              this.render();
              this._updateCardBackAnimation();
            }
          },
        },
        {
          label: "Cancel",
        },
      ],
      parentWindow: this.win,
      modal: true,
      width: 550,
      height: 300,
    });
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
          label: "Undo",
          enabled: () => !!this.game?.previousState,
          action: () => {
            this.game.undo();
            this.render();
            this._updateMenuBar(this.win);
          },
        },
        "MENU_DIVIDER",
        {
          label: "Deck...",
          action: () => this._showDeckSelectionDialog(),
        },
        {
          label: "Options...",
          action: () => this._showOptionsDialog(),
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
    this.renderDrawnCards();
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
      this.game.stockPile.cards.forEach((card, cardIndex) => {
        const cardDiv = card.element;
        // cardDiv.style.position = "absolute";
        cardDiv.style.left = `${Math.floor(cardIndex / 8) * 3}px`;
        cardDiv.style.top = `${Math.floor(cardIndex / 8) * 1}px`;
        cardDiv.dataset.pileType = "stock";
        cardDiv.dataset.pileIndex = 0;
        cardDiv.dataset.cardIndex = cardIndex;

        // Reset class for all cards
        cardDiv.classList.remove("stock-top-card");

        // Add class only to the top card
        if (cardIndex === this.game.stockPile.cards.length - 1) {
          cardDiv.classList.add("stock-top-card");
        }

        stockContainer.appendChild(cardDiv);
      });
    } else {
      const placeholderDiv = document.createElement("div");
      placeholderDiv.className = "stock-placeholder";
      if (this.game.stockRecyclingDepleted) {
        placeholderDiv.classList.add("recycling-depleted");
      }
      stockContainer.appendChild(placeholderDiv);
    }
  }

  renderWaste() {
    const wasteContainer = this.container.querySelector(".waste-pile");
    wasteContainer.innerHTML = "";
    wasteContainer.dataset.pileType = "waste";

    if (this.game.wastePile.cards.length > 0) {
      this.game.wastePile.cards.forEach((card, cardIndex) => {
        const cardDiv = card.element;
        cardDiv.style.left = `${Math.floor(cardIndex / 8) * 3}px`;
        cardDiv.style.top = `${Math.floor(cardIndex / 8) * 1}px`;
        cardDiv.dataset.pileType = "waste"; // Purely visual, not for interaction
        cardDiv.dataset.cardIndex = cardIndex;
        cardDiv.dataset.pileIndex = 0;
        wasteContainer.appendChild(cardDiv);
      });
    }
  }

  renderDrawnCards() {
    const drawnContainer = this.container.querySelector(".drawn-card-pile");
    drawnContainer.innerHTML = "";
    drawnContainer.dataset.pileType = "drawn";

    // Calculate the starting offset from the waste pile for seamless fanning
    const wasteCardCount = this.game.wastePile.cards.length;
    let baseOffsetLeft = 0;
    let baseOffsetTop = 0;
    if (wasteCardCount > 0) {
      const lastWasteCardIndex = wasteCardCount - 1;
      baseOffsetLeft = Math.floor(lastWasteCardIndex / 8) * 3;
      baseOffsetTop = Math.floor(lastWasteCardIndex / 8) * 1;
    }

    if (this.game.drawnCards.length > 0) {
      if (this.game.drawOption === "three") {
        let additionalOffsetLeft = 0;
        let additionalOffsetTop = 0;
        this.game.drawnCards.forEach((card, cardIndex) => {
          const cardDiv = card.element;
          cardDiv.style.left = `${baseOffsetLeft + additionalOffsetLeft}px`;
          cardDiv.style.top = `${baseOffsetTop + additionalOffsetTop}px`;
          cardDiv.dataset.pileType = "drawn";
          cardDiv.dataset.cardIndex = cardIndex;
          cardDiv.dataset.pileIndex = 0;
          drawnContainer.appendChild(cardDiv);
          additionalOffsetLeft += 15;
          additionalOffsetTop += 1;
        });
      } else {
        // "Draw one" logic
        const card = this.game.drawnCards[0];
        const cardDiv = card.element;
        cardDiv.style.left = `${baseOffsetLeft}px`;
        cardDiv.style.top = `${baseOffsetTop}px`;
        cardDiv.dataset.pileType = "drawn";
        cardDiv.dataset.cardIndex = 0;
        cardDiv.dataset.pileIndex = 0;
        drawnContainer.appendChild(cardDiv);
      }
    }
  }

  renderFoundations() {
    const foundationContainer =
      this.container.querySelector(".foundation-piles");
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
      this._updateMenuBar(this.win);
      return;
    }

    const cardDiv = event.target.closest(".card");
    if (cardDiv) {
      const pileType = cardDiv.dataset.pileType;
      if (pileType === "tableau") {
        const pileIndex = parseInt(cardDiv.dataset.pileIndex, 10);
        const cardIndex = parseInt(cardDiv.dataset.cardIndex, 10);
        this.game.flipTableauCard(pileIndex, cardIndex);
        this.render();
        this._updateMenuBar(this.win);
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
    if (pileType === "tableau") fromPile = this.game.tableauPiles[pileIndex];
    else if (pileType === "waste") fromPile = this.game.wastePile;
    else if (pileType === "drawn") fromPile = { cards: this.game.drawnCards };
    else if (pileType === "foundation")
      fromPile = this.game.foundationPiles[pileIndex];
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
      const originalElement = this.container.querySelector(
        `.card[data-uid='${card.uid}']`,
      );
      if (originalElement) {
        const clone = originalElement.cloneNode(true);
        clone.style.position = "absolute";
        clone.style.left = "0px"; // Reset fanning offset from original element
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
      const {
        pileType: fromPileType,
        pileIndex: fromPileIndex,
        cardIndex,
      } = this.draggedCardsInfo;
      const toPileType = toPileDiv.dataset.pileType;
      const toPileIndex = parseInt(toPileDiv.dataset.pileIndex, 10);

      if (
        this.game.moveCards(
          fromPileType,
          fromPileIndex,
          cardIndex,
          toPileType,
          toPileIndex,
        )
      ) {
        if (this.game.checkForWin()) {
          this.showWinDialog();
        }
      }
      // Always re-render to reflect any state changes (like refilling drawn cards)
      this.render();
      this._updateMenuBar(this.win);
    }

    this.draggedCardsInfo = null;
  }

  async showWinDialog() {
    if (this.game.isTimedGame && this.game.elapsedTime > 30) {
      this.game.stopTimer();
      const bonus = Math.round(700000 / this.game.elapsedTime);
      this.game.updateScore(bonus);
    }

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

  _showOptionsDialog() {
    const dialogContent = document.createElement("div");
    dialogContent.className = "klondike-options-container";

    const drawOption = this.game.drawOption || "one";
    const isTimedGame = getItem(LOCAL_STORAGE_KEYS.KLONDIKE_TIMED_GAME) === true;
    const scoringOption =
      getItem(LOCAL_STORAGE_KEYS.KLONDIKE_SCORING) || "standard";

    dialogContent.innerHTML = `
      <div class="options-row">
        <fieldset>
          <legend>Draw</legend>
          <div class="options-column">
            <div class="field-row">
              <input type="radio" id="drawOne" name="draw" value="one" ${
                drawOption === "one" ? "checked" : ""
              }>
              <label for="drawOne">Draw one</label>
            </div>
            <div class="field-row">
              <input type="radio" id="drawThree" name="draw" value="three" ${
                drawOption === "three" ? "checked" : ""
              }>
              <label for="drawThree">Draw three</label>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Scoring</legend>
          <div class="options-column">
            <div class="field-row">
              <input type="radio" id="standard" name="scoring" value="standard" ${
                scoringOption === "standard" ? "checked" : ""
              }>
              <label for="standard">Standard</label>
            </div>
            <div class="field-row">
              <input type="radio" id="vegas" name="scoring" value="vegas" ${
                scoringOption === "vegas" ? "checked" : ""
              }>
              <label for="vegas">Vegas</label>
            </div>
            <div class="field-row">
              <input type="radio" id="none" name="scoring" value="none" ${
                scoringOption === "none" ? "checked" : ""
              }>
              <label for="none">None</label>
            </div>
          </div>
        </fieldset>
      </div>
      <div class="options-row">
          <div class="options-column">
            <div class="field-row">
                <input type="checkbox" id="timedGame" ${
                  isTimedGame ? "checked" : ""
                }>
                <label for="timedGame">Timed game</label>
            </div>
            <div class="field-row">
                <input type="checkbox" id="statusBar" checked>
                <label for="statusBar">Status bar</label>
            </div>
          </div>
          <div class="options-column">
            <div class="field-row">
                <input type="checkbox" id="outlineDragging">
                <label for="outlineDragging">Outline dragging</label>
            </div>
            <div class="field-row">
                <input type="checkbox" id="keepScore">
                <label for="keepScore">Keep score</label>
            </div>
          </div>
      </div>
    `;

    ShowDialogWindow({
      title: "Options",
      content: dialogContent,
      buttons: [
        {
          label: "OK",
          action: () => {
            const selectedDrawOption = dialogContent.querySelector(
              'input[name="draw"]:checked',
            ).value;
            const selectedScoringOption = dialogContent.querySelector(
              'input[name="scoring"]:checked',
            ).value;
            const timedGameCheckbox =
              dialogContent.querySelector("#timedGame");
            const newTimedGameState = timedGameCheckbox.checked;

            let gameNeedsRestart = false;

            if (this.game.drawOption !== selectedDrawOption) {
              setItem(
                LOCAL_STORAGE_KEYS.KLONDIKE_DRAW_OPTION,
                selectedDrawOption,
              );
              gameNeedsRestart = true;
            }

            if (scoringOption !== selectedScoringOption) {
              setItem(
                LOCAL_STORAGE_KEYS.KLONDIKE_SCORING,
                selectedScoringOption,
              );
              gameNeedsRestart = true;
            }

            if (isTimedGame !== newTimedGameState) {
              setItem(
                LOCAL_STORAGE_KEYS.KLONDIKE_TIMED_GAME,
                newTimedGameState,
              );
              gameNeedsRestart = true;
            }

            if (gameNeedsRestart) {
              this.startNewGame();
            }
          },
        },
        {
          label: "Cancel",
        },
      ],
      parentWindow: this.win,
      modal: true,
    });
  }
}
