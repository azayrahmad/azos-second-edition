((exports) => {
  const { E, uid, get_new_menu_z_index, get_direction, is_disabled } =
    window.os_gui_utils;

  const MENU_DIVIDER = "MENU_DIVIDER";

  /**
   * A floating menu popup.
   * @param {OSGUIMenuFragment[]} menu_items
   * @param {{ parentMenuPopup?: MenuPopup, handleKeyDown: (e: KeyboardEvent) => void, closeMenus: () => void, refocus_outside_menus: () => void, send_info_event: (item?: OSGUIMenuItem) => void, setActiveMenuPopup: (menu: MenuPopup) => void }} options
   */
  function MenuPopup(menu_items, options) {
    this.parentMenuPopup = options.parentMenuPopup;
    this.menuItems = menu_items;
    this.itemElements = [];

    const menu_popup_el = E("div", {
      class: "menu-popup",
      id: `menu-popup-${uid()}`,
      tabIndex: "-1",
      role: "menu",
    });
    menu_popup_el.style.touchAction = "pan-y";
    menu_popup_el.style.outline = "none";
    const menu_popup_table_el = E("table", {
      class: "menu-popup-table",
      role: "presentation",
    });
    menu_popup_el.appendChild(menu_popup_table_el);

    this.element = menu_popup_el;
    let submenus = [];

    menu_popup_el.addEventListener("keydown", options.handleKeyDown);

    menu_popup_el.addEventListener("pointerleave", () => {
      for (const submenu of submenus) {
        if (submenu.submenu_popup_el.style.display !== "none") {
          this.highlight(submenu.item_el);
          return;
        }
      }
      this.highlight(-1);
    });

    menu_popup_el.addEventListener("focusin", () => {
      menu_popup_el.focus({ preventScroll: true });
    });

    menu_popup_el.addEventListener("focusout", (event) => {
      if (event.relatedTarget && !menu_popup_el.contains(event.relatedTarget)) {
        if (
          !event.relatedTarget.closest || // for documentElement, etc.
          !event.relatedTarget.closest(".menu-popup, .menus")
        ) {
          options.closeMenus();
        }
      }
    });

    let last_item_el;
    this.highlight = (index_or_element) => {
      let item_el;
      if (typeof index_or_element === "number") {
        item_el = this.itemElements[index_or_element];
      } else {
        item_el = index_or_element;
      }
      if (last_item_el && last_item_el !== item_el) {
        last_item_el.classList.remove("highlight");
      }
      if (item_el) {
        item_el.classList.add("highlight");
        menu_popup_el.setAttribute("aria-activedescendant", item_el.id);
        last_item_el = item_el;
      } else {
        menu_popup_el.removeAttribute("aria-activedescendant");
        last_item_el = null;
      }
    };

    this.close = (focus_parent_menu_popup = true) => {
      for (const submenu of submenus) {
        submenu.submenu_popup.close(false);
      }
      if (focus_parent_menu_popup) {
        this.parentMenuPopup?.element.focus({ preventScroll: true });
      }
      menu_popup_el.style.display = "none";
      this.highlight(-1);
      options.setActiveMenuPopup(this.parentMenuPopup);
    };

    const add_menu_item = (parent_element, item, item_index) => {
      const row_el = E("tr", { class: "menu-row" });
      this.itemElements.push(row_el);
      parent_element.appendChild(row_el);
      if (item === MENU_DIVIDER) {
        const td_el = E("td", { colspan: "4" });
        const hr_el = E("hr", { class: "menu-hr" });
        td_el.appendChild(hr_el);
        row_el.appendChild(td_el);
        hr_el.addEventListener("pointerenter", () => {
          this.highlight(-1);
        });
      } else {
        const item_el = row_el;
        item_el.classList.add("menu-item");
        item_el.id = `menu-item-${uid()}`;
        item_el.tabIndex = -1;
        item_el.setAttribute(
          "role",
          item.checkbox
            ? item.checkbox.type === "radio"
              ? "menuitemradio"
              : "menuitemcheckbox"
            : "menuitem",
        );
        if (item.label || item.item) {
          item_el.setAttribute(
            "aria-label",
            AccessKeys.toText(item.label || item.item),
          );
        }
        item_el.setAttribute("aria-keyshortcuts", item.ariaKeyShortcuts || "");
        if (item.description) {
          item_el.setAttribute("aria-description", item.description);
        }
        const checkbox_area_el = E("td", { class: "menu-item-checkbox-area" });
        const label_el = E("td", { class: "menu-item-label" });
        const shortcut_el = E("td", { class: "menu-item-shortcut" });
        const submenu_area_el = E("td", { class: "menu-item-submenu-area" });

        if (item.icon) {
          const icon_el = E("img", {
            src: item.icon,
            width: 16,
            height: 16,
            style: "margin-right: 4px; margin-left: 2px;",
          });
          item_el.appendChild(icon_el);
        } else {
          item_el.appendChild(checkbox_area_el);
        }
        item_el.appendChild(label_el);
        item_el.appendChild(shortcut_el);
        item_el.appendChild(submenu_area_el);
        if (item.label) {
          label_el.appendChild(AccessKeys.toFragment(item.label));
        } else if (item.item) {
          label_el.appendChild(AccessKeys.toFragment(item.item));
        }
        if (item.default) {
          label_el.classList.add("menu-item-default");
        }
        if (item.shortcutLabel) {
          shortcut_el.textContent = item.shortcutLabel;
        } else if (item.shortcut) {
          shortcut_el.textContent = item.shortcut;
        }
        menu_popup_el.addEventListener("update", () => {
          if (is_disabled(item)) {
            item_el.setAttribute("disabled", "");
            item_el.setAttribute("aria-disabled", "true");
          } else {
            item_el.removeAttribute("disabled");
            item_el.removeAttribute("aria-disabled");
          }
          if (item.checkbox && item.checkbox.check) {
            const checked = item.checkbox.check();
            item_el.setAttribute("aria-checked", checked ? "true" : "false");
          }
        });
        item_el.addEventListener("pointerenter", () => {
          this.highlight(item_index);
          options.send_info_event(item);
        });
        item_el.addEventListener("pointerleave", (event) => {
          if (
            menu_popup_el.style.display !== "none" &&
            event.pointerType !== "touch"
          ) {
            options.send_info_event();
          }
        });
        if (item.checkbox?.type === "radio") {
          checkbox_area_el.classList.add("radio");
        } else if (item.checkbox) {
          checkbox_area_el.classList.add("checkbox");
        }
        if (item.submenu) {
          item_el.classList.add("has-submenu");
          submenu_area_el.classList.toggle("point-right", get_direction() === "rtl");

          const { submenu_popup } = window.makeSubmenu(item_el, item.submenu, {
            ...options,
            parentMenuPopup: this,
            closeSubmenusAtThisLevel: () => {
              for (const { submenu_popup, item_el } of submenus) {
                submenu_popup.close(false);
                item_el.setAttribute("aria-expanded", "false");
              }
              menu_popup_el.focus({ preventScroll: true });
            },
          });

          submenus.push({
            item_el,
            submenu_popup_el: submenu_popup.element,
            submenu_popup,
          });
        }
        let just_activated = false;
        const item_action = () => {
          if (just_activated) {
            return;
          }
          just_activated = true;
          setTimeout(() => {
            just_activated = false;
          }, 10);
          if (typeof window.playSound === "function") {
            window.playSound("MenuCommand");
          }
          if (item.checkbox) {
            if (item.checkbox.toggle) {
              item.checkbox.toggle();
            }
            menu_popup_el.dispatchEvent(new CustomEvent("update", {}));
            // Radio buttons should close the menu, but checkboxes shouldn't.
            if (item.checkbox.type === "radio") {
              options.closeMenus();
              options.refocus_outside_menus();
            }
          } else if (item.action) {
            options.closeMenus();
            options.refocus_outside_menus();
            item.action();
          }
        };
        item_el.addEventListener("pointerup", (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) {
            return;
          }
          if (e.pointerType === "touch") {
            return;
          }
          item_el.click();
        });
        item_el.addEventListener("click", (e) => {
          if (item.submenu) {
            open_submenu(true);
          } else {
            item_action();
          }
        });
      }
    };

    if (menu_items.length === 0) {
      menu_items = [
        {
          label: "(Empty)",
          enabled: false,
        },
      ];
    }
    let init_index = 0;
    for (const item of menu_items) {
      if (typeof item === "object" && "radioItems" in item) {
        const tbody = E("tbody", { role: "group" });
        if (item.ariaLabel) {
          tbody.setAttribute("aria-label", item.ariaLabel);
        }
        for (const radio_item of item.radioItems) {
          radio_item.checkbox = {
            type: "radio",
            check: () => radio_item.value === item.getValue(),
            toggle: () => {
              item.setValue(radio_item.value);
            },
          };
          add_menu_item(tbody, radio_item, init_index++);
        }
        menu_popup_table_el.appendChild(tbody);
      } else {
        add_menu_item(menu_popup_table_el, item, init_index++);
      }
    }
  }

  exports.MenuPopup = MenuPopup;
  exports.MENU_DIVIDER = MENU_DIVIDER;
})(typeof module !== "undefined" ? module.exports : window);
