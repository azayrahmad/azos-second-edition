((exports) => {
  function ContextMenu(menuItems, event) {
    // Remove existing menus
    const existingMenus = document.querySelectorAll(".menu-popup-wrap");
    existingMenus.forEach((menu) => menu.remove());

    let menuPopup;

    // ──────────────────────────────────────────────
    // 1. Create wrapper for clipping + animation
    // ──────────────────────────────────────────────
    const wrap = document.createElement("div");
    wrap.className = "menu-popup-wrap";
    wrap.style.position = "absolute";
    wrap.style.overflow = "hidden";
    wrap.style.width = "0px";
    wrap.style.height = "0px";

    // ──────────────────────────────────────────────
    // 2. Closing logic
    // ──────────────────────────────────────────────
    const closeMenu = () => {
      if (menuPopup && menuPopup.element.parentNode) {
        menuPopup.close(false);
        wrap.remove();
      }
      document.removeEventListener("pointerdown", closeMenuOnClickOutside);
    };

    const closeMenuOnClickOutside = (e) => {
      if (!wrap.contains(e.target) && !e.target.closest(".menu-popup")) {
        closeMenu();
      }
    };

    // ──────────────────────────────────────────────
    // 3. Create actual menu DOM using your MenuPopup
    // ──────────────────────────────────────────────
    menuPopup = new window.MenuPopup(menuItems, {
      closeMenus: closeMenu,
      handleKeyDown: (e) => {
        if (e.key === "Escape") closeMenu();
      },
      setActiveMenuPopup: () => {},
      refocus_outside_menus: () => {},
      send_info_event: () => {},
    });

    // Set z-index for the main context menu
    menuPopup.element.style.zIndex =
      window.os_gui_utils.get_new_menu_z_index();

    // Append menu into wrapper
    wrap.appendChild(menuPopup.element);

    // Add wrapper to screen
    const screen = document.getElementById("screen");
    screen.appendChild(wrap);

    menuPopup.element.style.display = "block";
    menuPopup.element.style.position = "absolute";
    menuPopup.element.style.left = "0";
    menuPopup.element.style.top = "0";
    menuPopup.element.style.transformOrigin = "top left";

    // Sound
    if (typeof window.playSound === "function") {
      window.playSound("MenuPopup");
    }

    // Force reflow
    void menuPopup.element.offsetHeight;

    // ──────────────────────────────────────────────
    // 4. Quadrant detection + animation
    // ──────────────────────────────────────────────
    const ANIMATIONS = {
      "-100,-100": "diag-100-100", // slide from top-left → down-right
      "100,-100": "diag100-100", // slide from top-right → down-left
      "-100,100": "diag-100100", // slide from bottom-left → up-right
      "100,100": "diag100100", // slide from bottom-right → up-left
    };

    // Inject keyframes if not already added
    if (!document.getElementById("context-menu-anim")) {
      const st = document.createElement("style");
      st.id = "context-menu-anim";
      st.textContent = `
@keyframes diag-100-100 { from { transform: translate(-100%, -100%);} to { transform: translate(0,0);} }
@keyframes diag100-100  { from { transform: translate(100%, -100%);} to { transform: translate(0,0);} }
@keyframes diag-100100  { from { transform: translate(-100%, 100%);} to { transform: translate(0,0);} }
@keyframes diag100100   { from { transform: translate(100%, 100%);} to { transform: translate(0,0);} }
      `;
      document.head.appendChild(st);
    }

    // ──────────────────────────────────────────────
    // 5. Position wrapper based on boundaries
    // ──────────────────────────────────────────────
    const positionAt = (x, y) => {
      const screenRect = screen.getBoundingClientRect();
      const menuRect = menuPopup.element.getBoundingClientRect();

      const relX = x - screenRect.left;
      const relY = y - screenRect.top;

      let finalX = relX;
      let finalY = relY;

      let fromX = -100; // default slide in down-right
      let fromY = -100;

      // Flip horizontally if needed
      if (relX + menuRect.width > screenRect.width) {
        finalX = relX - menuRect.width;
        fromX = 100; // slide in from right
      }

      // Flip vertically if needed
      if (relY + menuRect.height > screenRect.height) {
        finalY = relY - menuRect.height;
        fromY = 100; // slide in from bottom
      }

      finalX = Math.max(0, finalX);
      finalY = Math.max(0, finalY);

      // Resize wrapper
      wrap.style.width = menuRect.width + "px";
      wrap.style.height = menuRect.height + "px";

      wrap.style.left = `${finalX}px`;
      wrap.style.top = `${finalY}px`;

      // Apply animation
      menuPopup.element.style.animation =
        ANIMATIONS[`${fromX},${fromY}`] + " 130ms linear forwards";

      menuPopup.element.style.transform = `translate(${fromX}%, ${fromY}%)`;
    };

    // Position at pointer
    positionAt(event.pageX, event.pageY);

    menuPopup.element.focus({ preventScroll: true });

    // Enable click-outside
    setTimeout(() => {
      document.addEventListener("pointerdown", closeMenuOnClickOutside);
    }, 0);

    return menuPopup;
  }

  exports.ContextMenu = ContextMenu;
})(typeof exports !== "undefined" ? exports : window);
