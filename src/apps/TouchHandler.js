export class TouchHandler {
  constructor(app) {
    this.app = app;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.dragThreshold = 5; // pixels
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);
  }

  addEventListeners(container) {
    container.addEventListener("touchstart", this.boundOnTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", this.boundOnTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", this.boundOnTouchEnd);
  }

  removeEventListeners(container) {
    container.removeEventListener("touchstart", this.boundOnTouchStart);
    container.removeEventListener("touchmove", this.boundOnTouchMove);
    container.removeEventListener("touchend", this.boundOnTouchEnd);
  }

  onTouchStart(event) {
    if (event.touches.length > 1) return;
    event.preventDefault();
    const touch = event.touches[0];

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    const simulatedEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 1,
      relatedTarget: null,
    });
    touch.target.dispatchEvent(simulatedEvent);
  }

  onTouchMove(event) {
    if (event.touches.length > 1) return;
    event.preventDefault();
    const touch = event.touches[0];

    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);

    if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
      this.app.wasDragged = true;
    }

    const simulatedEvent = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 1,
      relatedTarget: null,
    });
    window.dispatchEvent(simulatedEvent);
  }

  onTouchEnd(event) {
    const touch = event.changedTouches[0];
    const simulatedUpEvent = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 0,
      relatedTarget: null,
    });
    window.dispatchEvent(simulatedUpEvent);

    if (!this.app.wasDragged) {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: touch.screenX,
        screenY: touch.screenY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        buttons: 0,
        relatedTarget: null,
      });
      touch.target.dispatchEvent(clickEvent);
    }
  }
}
