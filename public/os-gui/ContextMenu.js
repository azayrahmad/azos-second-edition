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
    screen.appendChild(menuPopup.element);
    menuPopup.element.style.zIndex = `${window.os_gui_utils.get_new_menu_z_index()}`;

    menuPopup.element.style.display = "block";
    if (typeof window.playSound === "function") {
      window.playSound("MenuPopup");
    }
    void menuPopup.element.offsetHeight; // force reflow

    const positionAt = (x, y) => {
        const screenRect = screen.getBoundingClientRect();
        const menuRect = menuPopup.element.getBoundingClientRect();

        // Adjust event coordinates to be relative to the screen
        const relX = x - screenRect.left;
        const relY = y - screenRect.top;

        let finalX = relX;
        let finalY = relY;

        if (relX + menuRect.width > screenRect.width) {
            finalX = relX - menuRect.width;
        }
        if (relY + menuRect.height > screenRect.height) {
            finalY = relY - menuRect.height;
        }

        finalX = Math.max(0, finalX);
        finalY = Math.max(0, finalY);

        menuPopup.element.style.left = `${finalX}px`;
        menuPopup.element.style.top = `${finalY}px`;
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
