((exports) => {
  function ContextMenu(menuItems, event) {
    const existingMenus = document.querySelectorAll(".menu-popup");
    existingMenus.forEach((menu) => menu.remove());

    let menuPopup;

    const closeMenu = () => {
      if (menuPopup && menuPopup.element.parentNode) {
        menuPopup.close(false);
        menuPopup.element.remove();
      }
      document.removeEventListener("pointerdown", closeMenuOnClickOutside);
    };

    const closeMenuOnClickOutside = (e) => {
      if (
        !menuPopup.element.contains(e.target) &&
        !e.target.closest(".menu-popup")
      ) {
        closeMenu();
      }
    };

    menuPopup = new window.MenuPopup(menuItems, {
      closeMenus: closeMenu,
      handleKeyDown: (e) => {
        if (e.key === "Escape") closeMenu();
      },
      // Stubs for the rest
      setActiveMenuPopup: () => {},
      refocus_outside_menus: () => {},
      send_info_event: () => {},
    });

    const screen = document.getElementById('screen');
    const wrapper = document.createElement("div");
    wrapper.className = "menu-wrapper";
    wrapper.appendChild(menuPopup.element);
    screen.appendChild(wrapper);

    menuPopup.element.style.zIndex = `${window.os_gui_utils.get_new_menu_z_index()}`;

    if (typeof window.playSound === "function") {
      window.playSound("MenuPopup");
    }

    const positionAt = (x, y) => {
        const screenRect = screen.getBoundingClientRect();
        const menuRect = menuPopup.element.getBoundingClientRect();

        const relX = x - screenRect.left;
        const relY = y - screenRect.top;

        let finalX = relX;
        let finalY = relY;

        const willShiftLeft = relX + menuRect.width > screenRect.width;
        const willShiftUp = relY + menuRect.height > screenRect.height;

        if (willShiftLeft) {
            finalX = relX - menuRect.width;
        }
        if (willShiftUp) {
            finalY = relY - menuRect.height;
        }

        // Farthest corner logic:
        // If the menu does NOT shift left, it opens to the right of the cursor.
        // The farthest horizontal point is therefore the right edge (100%).
        const fromX = willShiftLeft ? -100 : 100;
        // If the menu does NOT shift up, it opens below the cursor.
        // The farthest vertical point is therefore the bottom edge (100%).
        const fromY = willShiftUp ? -100 : 100;

        finalX = Math.max(0, finalX);
        finalY = Math.max(0, finalY);

        wrapper.style.left = `${finalX}px`;
        wrapper.style.top = `${finalY}px`;
        wrapper.style.width = `${menuRect.width}px`;
        wrapper.style.height = `${menuRect.height}px`;

        menuPopup.element.style.animation = "none";
        menuPopup.element.style.transform = `translate(${fromX}%, ${fromY}%)`;
        void menuPopup.element.offsetHeight; // force reflow
        menuPopup.element.style.animationName = `diag${fromX}${fromY}`;
    };

    positionAt(event.pageX, event.pageY);
    menuPopup.element.focus({ preventScroll: true });

    setTimeout(() => {
      document.addEventListener("pointerdown", closeMenuOnClickOutside);
    }, 0);

    return menuPopup;
  }

  exports.ContextMenu = ContextMenu;
})(typeof exports !== "undefined" ? exports : window);
