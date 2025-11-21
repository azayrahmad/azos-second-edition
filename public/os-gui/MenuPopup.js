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
        let open_submenu;
        let submenu_popup_el;
        if (item.submenu) {
          item_el.classList.add("has-submenu");
          submenu_area_el.classList.toggle(
            "point-right",
            get_direction() === "rtl",
          );
          const submenu_popup = new MenuPopup(item.submenu, {
            ...options,
            parentMenuPopup: this,
          });
          submenu_popup_el = submenu_popup.element;
          const wrapper = E("div", { class: "menu-wrapper" });
          wrapper.appendChild(submenu_popup_el);
          document.body?.appendChild(wrapper);
          wrapper.style.display = "none";
          item_el.setAttribute("aria-haspopup", "true");
          item_el.setAttribute("aria-expanded", "false");
          item_el.setAttribute("aria-controls", submenu_popup_el.id);

          submenu_popup_el.dataset.semanticParent = menu_popup_el.id;
          menu_popup_el.setAttribute(
            "aria-owns",
            `${menu_popup_el.getAttribute("aria-owns") || ""} ${submenu_popup_el.id}`,
          );
          submenu_popup_el.setAttribute("aria-labelledby", item_el.id);
          open_submenu = (highlight_first = true) => {
            if (typeof window.playSound === "function") {
              window.playSound("MenuPopup");
            }
            if (wrapper.style.display !== "none") {
              return;
            }
            if (item_el.getAttribute("aria-disabled") === "true") {
              return;
            }
            close_submenus_at_this_level();
            item_el.setAttribute("aria-expanded", "true");
            submenu_popup_el.style.display = "block";
            wrapper.style.display = "block";
            wrapper.style.visibility = "hidden";
            wrapper.style.left = "-9999px";
            wrapper.style.top = "-9999px";

            wrapper.style.zIndex = `${get_new_menu_z_index()}`;
            submenu_popup_el.setAttribute("dir", get_direction());
            if (window.inheritTheme) {
              window.inheritTheme(submenu_popup_el, menu_popup_el);
            }
            if (!wrapper.parentElement) {
              document.body.appendChild(wrapper);
            }
            submenu_popup_el.dispatchEvent(new CustomEvent("update", {}));
            if (highlight_first) {
              submenu_popup.highlight(0);
              options.send_info_event(submenu_popup.menuItems[0]);
            } else {
              submenu_popup.highlight(-1);
            }

            const rect = item_el.getBoundingClientRect();
            let submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
            wrapper.style.visibility = "visible";
            let x, y;
            let fromX;

            y = rect.top + window.scrollY;

            if (get_direction() === "rtl") {
              x = rect.left - submenu_popup_rect.width + window.scrollX;
              fromX = 100;
              if (x < 0) {
                x = rect.right + window.scrollX;
                fromX = -100;
              }
            } else {
              x = rect.right + window.scrollX;
              fromX = -100;
              if (x + submenu_popup_rect.width > innerWidth) {
                x = rect.left - submenu_popup_rect.width + window.scrollX;
                fromX = 100;
              }
            }

            if (y + submenu_popup_rect.height > innerHeight) {
              y = Math.max(0, innerHeight - submenu_popup_rect.height) + window.scrollY;
            }

            wrapper.style.left = `${x}px`;
            wrapper.style.top = `${y}px`;
            wrapper.style.width = `${submenu_popup_rect.width}px`;
            wrapper.style.height = `${submenu_popup_rect.height}px`;

            submenu_popup_el.style.animation = "none";
            submenu_popup_el.style.transform = `translate(${fromX}%, 0)`;
            void submenu_popup_el.offsetHeight; // force reflow
            submenu_popup_el.style.animationName = fromX === -100 ? "slide-left" : "slide-right";
            submenu_popup_el.focus({ preventScroll: true });
            options.setActiveMenuPopup(submenu_popup);
          };
          submenus.push({
            item_el,
            submenu_popup_el: wrapper, // Use wrapper here
            submenu_popup,
          });
          function close_submenus_at_this_level() {
            for (const { submenu_popup, item_el } of submenus) {
              submenu_popup.close(false);
              item_el.setAttribute("aria-expanded", "false");
            }
            menu_popup_el.focus({ preventScroll: true });
          }
          let open_tid;
          let close_tid;
          wrapper.addEventListener("pointerenter", () => {
            if (open_tid) {
              clearTimeout(open_tid);
              open_tid = null;
            }
            if (close_tid) {
              clearTimeout(close_tid);
              close_tid = null;
            }
          });
          item_el.addEventListener("pointerenter", () => {
            if (open_tid) {
              clearTimeout(open_tid);
              open_tid = null;
            }
            if (close_tid) {
              clearTimeout(close_tid);
              close_tid = null;
            }
            open_tid = setTimeout(() => {
              open_submenu(false);
            }, 501);
          });
          item_el.addEventListener("pointerleave", () => {
            if (open_tid) {
              clearTimeout(open_tid);
              open_tid = null;
            }
          });
          menu_popup_el.addEventListener("pointerenter", (event) => {
            if (event.target.closest(".menu-item") === item_el) {
              return;
            }
            if (!close_tid) {
              if (submenu_popup_el.style.display !== "none") {
                close_tid = setTimeout(() => {
                  if (!window.debugKeepMenusOpen) {
                    close_submenus_at_this_level();
                  }
                }, 500);
              }
            }
          });
          menu_popup_el.addEventListener("pointerleave", () => {
            if (close_tid) {
              clearTimeout(close_tid);
              close_tid = null;
            }
          });
          item_el.addEventListener("pointerdown", () => {
            open_submenu(false);
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
