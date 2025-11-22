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
    constructor(items) {
      this.element = E("div", { class: "toolbar" });
      this.items = items;
      this.itemElements = [];
      this.activeMenu = null;

      this.buildToolbar();
    }

    buildToolbar() {
      this.items.forEach((item) => {
        const itemEl = this.createToolbarItem(item);
        this.element.appendChild(itemEl);
        this.itemElements.push(itemEl);
      });
    }

    createToolbarItem(item) {
      const groupEl = E("div", { class: "toolbar-button-group" });

      const mainButtonEl = E("button", { class: "toolbar-button lightweight" });
      mainButtonEl.disabled = this.isDisabled(item);

      const iconEl = E("div", { class: "toolbar-icon" });
      if (item.icon) {
        const img = E("img", { src: item.icon, width: "32", height: "32" });
        iconEl.appendChild(img);
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
  }

  exports.Toolbar = Toolbar;
})(typeof exports !== "undefined" ? exports : window);
