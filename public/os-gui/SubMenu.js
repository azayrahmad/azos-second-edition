
((exports) => {
  const { E, uid, get_new_menu_z_index, get_direction } = window.os_gui_utils;

  /**
   * Attaches submenu functionality to a menu item.
   * @param {HTMLElement} item_el - The parent menu item element.
   * @param {OSGUIMenuFragment} submenu_items - The items for the submenu.
   * @param {object} options - Options for the MenuPopup.
   */
  function makeSubmenu(item_el, submenu_items, options) {
    const submenu_popup = new window.MenuPopup(submenu_items, {
      ...options,
      parentMenuPopup: this,
    });
    const submenu_popup_el = submenu_popup.element;
    document.body?.appendChild(submenu_popup_el);
    submenu_popup_el.style.display = "none";

    item_el.setAttribute("aria-haspopup", "true");
    item_el.setAttribute("aria-expanded", "false");
    item_el.setAttribute("aria-controls", submenu_popup_el.id);

    const open_submenu = (highlight_first = true) => {
      if (typeof window.playSound === "function") {
        window.playSound("MenuPopup");
      }
      if (submenu_popup_el.style.display !== "none") {
        return;
      }
      if (item_el.getAttribute("aria-disabled") === "true") {
        return;
      }
      // Assuming a method to close other submenus at the same level exists
      options.closeSubmenusAtThisLevel?.();

      item_el.setAttribute("aria-expanded", "true");
      submenu_popup_el.style.display = "";
      submenu_popup_el.style.zIndex = `${get_new_menu_z_index()}`;
      submenu_popup_el.setAttribute("dir", get_direction());

      if (window.inheritTheme) {
        window.inheritTheme(submenu_popup_el, item_el.closest(".menu-popup, .menus"));
      }

      submenu_popup_el.dispatchEvent(new CustomEvent("update", {}));

      if (highlight_first) {
        submenu_popup.highlight(0);
        options.send_info_event?.(submenu_popup.menuItems[0]);
      } else {
        submenu_popup.highlight(-1);
      }

      const rect = item_el.getBoundingClientRect();
      let submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
      submenu_popup_el.style.position = "absolute";
      submenu_popup_el.style.left = `${(get_direction() === "rtl" ? rect.left - submenu_popup_rect.width : rect.right) + window.scrollX}px`;
      submenu_popup_el.style.top = `${rect.top + window.scrollY}px`;

      // Adjust position to fit within the viewport
      submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
      if (get_direction() === "rtl") {
        if (submenu_popup_rect.left < 0) {
          submenu_popup_el.style.left = `${rect.right}px`;
        }
      } else {
        if (submenu_popup_rect.right > innerWidth) {
          submenu_popup_el.style.left = `${rect.left - submenu_popup_rect.width}px`;
        }
      }
      submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
      if (submenu_popup_rect.left < 0) {
        submenu_popup_el.style.left = "0";
      }

      if (submenu_popup_rect.bottom > innerHeight) {
        submenu_popup_el.style.top = `${Math.max(0, innerHeight - submenu_popup_rect.height) + window.scrollY}px`;
      }

      submenu_popup_el.focus({ preventScroll: true });
      options.setActiveMenuPopup?.(submenu_popup);
    };

    let open_tid;
    item_el.addEventListener("pointerenter", () => {
      clearTimeout(open_tid);
      open_tid = setTimeout(() => {
        open_submenu(false);
      }, 501);
    });

    item_el.addEventListener("pointerleave", () => {
      clearTimeout(open_tid);
    });

    item_el.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent parent menus from closing
        clearTimeout(open_tid);
        open_submenu(true);
    });

    return { submenu_popup, open_submenu };
  }

  exports.makeSubmenu = makeSubmenu;
})(typeof module !== "undefined" ? module.exports : window);
