((exports) => {
  function E(tagName, attrs) {
    const el = document.createElement(tagName);
    if (attrs) {
      for (const key in attrs) {
        if (key === "class") {
          el.className = attrs[key];
        } else {
          el.setAttribute(key, attrs[key]);
        }
      }
    }
    return el;
  }

  class Toolbar {
    constructor(items, options = {}) {
      this.element = E("div", { class: "toolbar" });
      this.items = items;
      this.options = options;
      this.itemElements = [];
      this.activeMenu = null;

      if (this.options.icons) {
        this.element.style.setProperty(
          "--toolbar-icons",
          `url(${this.options.icons})`,
        );
      }
      if (this.options.iconsGrayscale) {
        this.element.style.setProperty(
          "--toolbar-icons-grayscale",
          `url(${this.options.iconsGrayscale})`,
        );
      }

      this.buildToolbar();
      this.setupResizeObserver();
    }

    buildToolbar() {
      this.items.forEach((item) => {
        const itemEl = this.createToolbarItem(item);
        this.element.appendChild(itemEl);
        this.itemElements.push(itemEl);
      });

      // Add the "More" button for overflow
      this.moreButtonGroup = this.createMoreButton();
      this.element.appendChild(this.moreButtonGroup);
    }

    createToolbarItem(item) {
      const groupEl = E("div", { class: "toolbar-button-group" });

      const mainButtonEl = E("button", { class: "toolbar-button lightweight" });
      mainButtonEl.disabled = this.isDisabled(item);

      const iconEl = E("div", { class: "toolbar-icon" });
      if (typeof item.iconId !== "undefined") {
        iconEl.setAttribute("data-icon-id", item.iconId);
      }

      const labelEl = E("div", { class: "toolbar-label" });
      labelEl.textContent = item.label;

      mainButtonEl.appendChild(iconEl);
      mainButtonEl.appendChild(labelEl);
      groupEl.appendChild(mainButtonEl);

      if (item.action) {
        mainButtonEl.addEventListener("click", () => {
          if (!this.isDisabled(item)) {
            item.action();
          }
        });
      }

      if (item.submenu) {
        mainButtonEl.classList.add("has-submenu-main");

        const arrowButtonEl = E("button", {
          class: "toolbar-arrow-button lightweight",
        });
        arrowButtonEl.disabled = this.isDisabled(item);
        arrowButtonEl.innerHTML = "&#9662;"; // Down arrow
        groupEl.appendChild(arrowButtonEl);

        arrowButtonEl.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.activeMenu) {
            this.closeActiveMenu();
          } else {
            // Pass the group element for positioning
            this.openSubmenu(item, groupEl);
          }
        });

        // If there's no primary action, the main button can also open the menu
        if (!item.action) {
          mainButtonEl.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.activeMenu) {
              this.closeActiveMenu();
            } else {
              this.openSubmenu(item, groupEl);
            }
          });
        }
      }

      // Add update listener for dynamic state changes
      this.element.addEventListener("update", () => {
        mainButtonEl.disabled = this.isDisabled(item);
        const arrowButtonEl = groupEl.querySelector(".toolbar-arrow-button");
        if (arrowButtonEl) {
          arrowButtonEl.disabled = this.isDisabled(item);
        }
      });

      return groupEl;
    }

    isDisabled(item) {
      if (typeof item.enabled === "function") {
        return !item.enabled();
      }
      return typeof item.enabled === "boolean" && !item.enabled;
    }

    openSubmenu(item, parentEl) {
      if (this.activeMenu) {
        this.closeActiveMenu();
      }

      const parentRect = parentEl.getBoundingClientRect();
      const event = { pageX: parentRect.left, pageY: parentRect.bottom };
      this.activeMenu = new window.ContextMenu(item.submenu, event);
    }

    closeActiveMenu() {
      if (this.activeMenu) {
        this.activeMenu.close();
        this.activeMenu = null;
      }
    }

    createMoreButton() {
      const groupEl = E("div", {
        class: "toolbar-button-group",
        style: "display: none;",
      });
      const buttonEl = E("button", { class: "toolbar-button lightweight" });
      buttonEl.innerHTML = ">>";
      groupEl.appendChild(buttonEl);

      buttonEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showOverflowMenu(groupEl);
      });

      return groupEl;
    }

    setupResizeObserver() {
      this.observer = new ResizeObserver(() => {
        this.handleResize();
      });
      this.observer.observe(this.element);
    }

    handleResize() {
      const toolbarWidth = this.element.getBoundingClientRect().width;
      let itemsWidth = 0;
      let visibleItems = 0;

      for (const itemEl of this.itemElements) {
        itemEl.style.display = ""; // Reset to visible to measure
        itemsWidth += itemEl.getBoundingClientRect().width;
        if (itemsWidth < toolbarWidth) {
          visibleItems++;
        }
      }

      if (this.items.length > visibleItems) {
        this.moreButtonGroup.style.display = "";
        const moreButtonWidth =
          this.moreButtonGroup.getBoundingClientRect().width;
        let currentWidth = moreButtonWidth;
        let overflow = false;

        this.itemElements.forEach((itemEl, index) => {
          currentWidth += itemEl.getBoundingClientRect().width;
          if (currentWidth > toolbarWidth) {
            itemEl.style.display = "none";
            overflow = true;
          } else {
            itemEl.style.display = "";
          }
        });

        this.moreButtonGroup.style.display = overflow ? "" : "none";
      } else {
        this.moreButtonGroup.style.display = "none";
        this.itemElements.forEach((itemEl) => {
          itemEl.style.display = "";
        });
      }
    }

    showOverflowMenu(parentEl) {
      if (this.activeMenu) {
        this.closeActiveMenu();
      }
      const overflowItems = [];
      this.itemElements.forEach((itemEl, index) => {
        if (itemEl.style.display === "none") {
          const originalItem = this.items[index];
          // Create a new object for the menu to avoid modifying the original
          const menuItem = {
            ...originalItem,
            action: () => {
              if (originalItem.action) {
                originalItem.action();
              }
              this.closeActiveMenu();
            },
          };
          overflowItems.push(menuItem);
        }
      });

      if (overflowItems.length > 0) {
        const parentRect = parentEl.getBoundingClientRect();
        const event = { pageX: parentRect.left, pageY: parentRect.bottom };
        this.activeMenu = new window.ContextMenu(overflowItems, event);
        // Add a custom class for styling
        this.activeMenu.element.classList.add("toolbar-overflow-menu");
      }
    }
  }

  exports.Toolbar = Toolbar;
})(typeof exports !== "undefined" ? exports : window);
