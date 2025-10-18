/**
 * Bar Class
 *
 * Creates a flexible bar that can contain multiple items, including other bars.
 * Supports horizontal or vertical orientation, draggable items, and resizable dividers.
 */
export default class Bar {
  /**
   * @param {HTMLElement} parent - The parent element to append the bar to.
   * @param {object} options - Configuration options for the bar.
   * @param {string} [options.orientation='horizontal'] - 'horizontal' or 'vertical'.
   * @param {string} [options.className] - Custom CSS class for the bar element.
   */
  constructor(parent, options = {}) {
    this.parent = parent;
    this.options = {
      orientation: 'horizontal',
      fill: false,
      ...options,
    };
    this.items = [];
    this.element = document.createElement('div');
    this.element.className = `bar ${this.options.orientation} ${this.options.className || ''}`;
    if (this.options.fill) {
      this.element.classList.add('bar-fill');
    }
    this.parent.appendChild(this.element);
  }

  /**
   * Adds an item to the bar.
   * @param {Bar | HTMLElement} item - The item to add. Can be another Bar instance or a standard HTMLElement.
   * @param {object} options - Options for the item.
   * @param {boolean} [options.draggable=false] - Whether the item can be reordered.
   * @param {boolean} [options.resizable=false] - Whether the item (if it's a Bar) can be resized.
   */
  addItem(item, options = {}) {
    const itemConfig = {
      element: item instanceof Bar ? item.element : item,
      instance: item instanceof Bar ? item : null,
      draggable: options.draggable || false,
      resizable: options.resizable || false,
    };

    this.items.push(itemConfig);

    if (this.items.length > 1) {
      this._createDivider(itemConfig);
    }

    this.element.appendChild(itemConfig.element);

    if (itemConfig.draggable) {
      this._makeDraggable(itemConfig);
    }
  }

  /**
   * Creates a divider element between items.
   * @param {object} precedingItemConfig - The configuration of the item that the divider follows.
   * @private
   */
  _createDivider(precedingItemConfig) {
    const divider = document.createElement('div');
    divider.className = 'bar-divider';
    this.element.insertBefore(divider, precedingItemConfig.element);

    if (precedingItemConfig.resizable) {
      divider.classList.add('resizable');
      divider.addEventListener('mousedown', (e) => this._startResize(e, precedingItemConfig.element));
    }
  }

  /**
   * Makes a bar item draggable.
   * @param {object} itemConfig - The configuration of the item to make draggable.
   * @private
   */
  _makeDraggable(itemConfig) {
    const handle = document.createElement('div');
    handle.className = 'bar-drag-handle';
    itemConfig.element.insertBefore(handle, itemConfig.element.firstChild);

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this._startDrag(e, itemConfig.element);
    });
  }

  /**
   * Initializes the drag process for reordering items.
   * @param {MouseEvent} e - The mousedown event.
   * @param {HTMLElement} itemElement - The bar item element being dragged.
   * @private
   */
  _startDrag(e, itemElement) {
    e.preventDefault();
    const placeholder = document.createElement('div');
    placeholder.className = 'bar-item-placeholder';
    placeholder.style.width = `${itemElement.offsetWidth}px`;
    placeholder.style.height = `${itemElement.offsetHeight}px`;

    itemElement.classList.add('dragging');
    this.element.insertBefore(placeholder, itemElement);

    let draggedOverElement = null;

    const onMouseMove = (moveEvent) => {
      const target = this._getDropTarget(moveEvent, placeholder);
      if (target && target !== draggedOverElement) {
        draggedOverElement = target;
        if (moveEvent.clientX > target.getBoundingClientRect().left + target.offsetWidth / 2) {
          this.element.insertBefore(placeholder, target.nextSibling);
        } else {
          this.element.insertBefore(placeholder, target);
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      itemElement.classList.remove('dragging');
      if (placeholder.parentNode) {
        this.element.insertBefore(itemElement, placeholder);
        this.element.removeChild(placeholder);
      }
      this._updateDividers();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  _getDropTarget(e, draggedElement) {
    const children = Array.from(this.element.children).filter(child => child !== draggedElement && !child.classList.contains('bar-divider') && !child.classList.contains('bar-drag-handle'));
    return children.find(child => {
        const rect = child.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    });
  }

  /**
   * Initializes the resize process for a bar item.
   * @param {MouseEvent} e - The mousedown event.
   * @param {HTMLElement} itemElement - The bar item element being resized.
   * @private
   */
  _startResize(e, itemElement) {
    e.preventDefault();
    const prevSibling = itemElement.previousElementSibling?.previousElementSibling; // The bar before the divider
    if (!prevSibling || !prevSibling.classList.contains('bar')) return;

    const startX = e.clientX;
    const startWidthPrev = prevSibling.offsetWidth;
    const startWidthCurrent = itemElement.offsetWidth;
    const totalWidth = startWidthPrev + startWidthCurrent;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      let newWidthPrev = startWidthPrev + dx;
      let newWidthCurrent = startWidthCurrent - dx;

      // Constrain resizing
      if (newWidthPrev < 50) { // Minimum width
          newWidthPrev = 50;
          newWidthCurrent = totalWidth - 50;
      }
      if (newWidthCurrent < 50) { // Minimum width
          newWidthCurrent = 50;
          newWidthPrev = totalWidth - 50;
      }

      prevSibling.style.flex = `0 0 ${newWidthPrev}px`;
      itemElement.style.flex = `0 0 ${newWidthCurrent}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Updates dividers after a drag-and-drop operation.
   * @private
   */
  _updateDividers() {
      // Remove all dividers
      this.element.querySelectorAll('.bar-divider').forEach(d => d.remove());
      // Re-create dividers
      this.items.forEach((item, index) => {
          if (index > 0) {
              const prevItem = this.items[index - 1];
              this._createDivider(item);
          }
      });
  }
}