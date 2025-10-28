((exports) => {

    let uid_counter = 0;
    function uid() {
        return (uid_counter++).toString(36) + Math.random().toString(36).slice(2);
    }

    let internal_z_counter = 1;

    /**
     * A floating menu popup.
     * @param {OSGUIMenuFragment[]} menu_items
     * @param {object} options
     * @param {MenuPopup} [options.parentMenuPopup]
     * @param {() => ("ltr" | "rtl")} [options.getDirection]
     * @param {(item: OSGUIMenuItem | undefined) => void} [options.sendInfoEvent]
     * @param {() => void} [options.closeMenus]
     * @param {() => void} [options.refocusOutsideMenus]
     */
    function MenuPopup(menu_items, options = {}) {
        this.parentMenuPopup = options.parentMenuPopup;
        this.getDirection = options.getDirection || (() => "ltr");
        this.sendInfoEvent = options.sendInfoEvent || (() => {});
        this.closeMenus = options.closeMenus || (() => {
            // This default implementation is for context menus, so they can close themselves.
            let menu = this;
            while (menu.parentMenuPopup) {
                menu = menu.parentMenuPopup;
            }
            menu.close(false); // hide all menus in tree
            // and remove the root menu from the DOM
            if (menu.element.parentElement) {
                menu.element.parentElement.removeChild(menu.element);
            }
        });
        this.refocusOutsideMenus = options.refocusOutsideMenus || (() => {});

        this.menuItems = menu_items;
        this.itemElements = [];
        this.submenus = [];

        const menu_popup_el = document.createElement("div");
        menu_popup_el.className = "menu-popup";
        menu_popup_el.id = `menu-popup-${uid()}`;
        menu_popup_el.tabIndex = -1;
        menu_popup_el.setAttribute("role", "menu");
        menu_popup_el.style.touchAction = "pan-y";
        menu_popup_el.style.outline = "none";

        const menu_popup_table_el = document.createElement("table");
        menu_popup_table_el.className = "menu-popup-table";
        menu_popup_table_el.setAttribute("role", "presentation");
        menu_popup_el.appendChild(menu_popup_table_el);

        this.element = menu_popup_el;

        this.buildMenu(menu_popup_table_el);

        menu_popup_el.addEventListener("pointerleave", () => {
            for (const submenu of this.submenus) {
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

        menu_popup_el.addEventListener("focusout", (e) => {
            // If focus moves to something that is not a menu popup, close.
            // e.relatedTarget can be null if the window loses focus.
            if (
                !e.relatedTarget ||
                (!e.relatedTarget.closest(".menu-popup") && !e.relatedTarget.closest(".menu-button"))
            ) {
                this.closeMenus();
            }
        });
    }

    MenuPopup.getNewZIndex = function() {
        if (typeof $Window !== "undefined") {
            return ($Window.Z_INDEX++) + 1000; // MAX_MENU_NESTING
        }
        return (++internal_z_counter) + 1000;
    };

    MenuPopup.prototype.highlight = function (index_or_element) {
        let item_el;
        if (typeof index_or_element === "number") {
            item_el = this.itemElements[index_or_element];
        } else {
            item_el = index_or_element;
        }

        if (this.last_item_el && this.last_item_el !== item_el) {
            this.last_item_el.classList.remove("highlight");
        }

        if (item_el) {
            item_el.classList.add("highlight");
            this.element.setAttribute("aria-activedescendant", item_el.id);
            this.last_item_el = item_el;
        } else {
            this.element.removeAttribute("aria-activedescendant");
            this.last_item_el = null;
        }
    };

    MenuPopup.prototype.close = function (focus_parent_menu_popup = true) {
        for (const submenu of this.submenus) {
            submenu.submenu_popup.close(false);
        }
        if (focus_parent_menu_popup) {
            this.parentMenuPopup?.element.focus({ preventScroll: true });
        }
        this.element.style.display = "none";
        this.highlight(-1);
        if (window.active_menu_popup === this) {
            window.active_menu_popup = this.parentMenuPopup;
        }
        this.element.dispatchEvent(new CustomEvent("close", { bubbles: true }));
    };

    MenuPopup.prototype.buildMenu = function(parent_element) {
        if (this.menuItems.length === 0) {
            this.menuItems = [{
                label: "(Empty)",
                enabled: false,
            }];
        }

        let item_index = 0;
        for (const item of this.menuItems) {
            if (typeof item === "object" && "radioItems" in item) {
                const tbody = document.createElement("tbody");
                tbody.setAttribute("role", "group");
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
                    this.add_menu_item(tbody, radio_item, item_index++);
                }
                parent_element.appendChild(tbody);
            } else {
                this.add_menu_item(parent_element, item, item_index++);
            }
        }
    };

    MenuPopup.prototype.is_disabled = function(item) {
        if (typeof item.enabled === "function") {
            return !item.enabled();
        } else if (typeof item.enabled === "boolean") {
            return !item.enabled;
        } else {
            return false;
        }
    };

    MenuPopup.prototype.add_menu_item = function(parent_element, item, item_index) {
        const row_el = document.createElement("tr");
        row_el.className = "menu-row";
        this.itemElements.push(row_el);
        parent_element.appendChild(row_el);

        if (item === MENU_DIVIDER) {
            const td_el = document.createElement("td");
            td_el.colSpan = "4";
            const hr_el = document.createElement("hr");
            hr_el.className = "menu-hr";
            td_el.appendChild(hr_el);
            row_el.appendChild(td_el);
            hr_el.addEventListener("pointerenter", () => {
                this.highlight(-1);
            });
            return;
        }

        const item_el = row_el;
        item_el.classList.add("menu-item");
        item_el.id = `menu-item-${uid()}`;
        item_el.tabIndex = -1;
        item_el.setAttribute("role", item.checkbox ? (item.checkbox.type === "radio" ? "menuitemradio" : "menuitemcheckbox") : "menuitem");

        if (item.label) {
            item_el.setAttribute("aria-label", AccessKeys.toText(item.label));
        }
        if (item.ariaKeyShortcuts) {
            item_el.setAttribute("aria-keyshortcuts", item.ariaKeyShortcuts);
        }
        if (item.description) {
            item_el.setAttribute("aria-description", item.description);
        }

        const checkbox_area_el = document.createElement("td");
        checkbox_area_el.className = "menu-item-checkbox-area";
        const label_el = document.createElement("td");
        label_el.className = "menu-item-label";
        const shortcut_el = document.createElement("td");
        shortcut_el.className = "menu-item-shortcut";
        const submenu_area_el = document.createElement("td");
        submenu_area_el.className = "menu-item-submenu-area";

        item_el.appendChild(checkbox_area_el);
        item_el.appendChild(label_el);
        item_el.appendChild(shortcut_el);
        item_el.appendChild(submenu_area_el);

        if (item.label) {
            label_el.appendChild(AccessKeys.toFragment(item.label));
        }
        if (item.shortcutLabel) {
            shortcut_el.textContent = item.shortcutLabel;
        }

        this.element.addEventListener("update", () => {
            if (this.is_disabled(item)) {
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
            this.sendInfoEvent(item);
        });

        item_el.addEventListener("pointerleave", (event) => {
            if (this.element.style.display !== "none" && event.pointerType !== "touch") {
                this.sendInfoEvent();
            }
        });

        if (item.checkbox?.type === "radio") {
            checkbox_area_el.classList.add("radio");
        } else if (item.checkbox) {
            checkbox_area_el.classList.add("checkbox");
        }

        if (item.submenu) {
            item_el.classList.add("has-submenu");
            submenu_area_el.classList.toggle("point-right", this.getDirection() === "rtl");

            const submenu_popup = new MenuPopup(item.submenu, {
                parentMenuPopup: this,
                getDirection: this.getDirection,
                sendInfoEvent: this.sendInfoEvent,
                closeMenus: this.closeMenus,
                refocusOutsideMenus: this.refocusOutsideMenus,
            });
            const submenu_popup_el = submenu_popup.element;
            document.body?.appendChild(submenu_popup_el);
            submenu_popup_el.style.display = "none";

            item_el.setAttribute("aria-haspopup", "true");
            item_el.setAttribute("aria-expanded", "false");
            item_el.setAttribute("aria-controls", submenu_popup_el.id);

            // This is for exiting submenus.
            if(!window.parent_item_el_by_popup_el){
                window.parent_item_el_by_popup_el = new WeakMap();
            }
            window.parent_item_el_by_popup_el.set(submenu_popup_el, item_el);

            submenu_popup_el.dataset.semanticParent = this.element.id;
            this.element.setAttribute("aria-owns", `${this.element.getAttribute("aria-owns") || ""} ${submenu_popup_el.id}`);
            submenu_popup_el.setAttribute("aria-labelledby", item_el.id);

            const open_submenu = (highlight_first = true) => {
                if (submenu_popup_el.style.display !== "none" || item_el.getAttribute("aria-disabled") === "true") {
                    return;
                }
                close_submenus_at_this_level();

                item_el.setAttribute("aria-expanded", "true");
                submenu_popup_el.style.display = "";
                submenu_popup_el.style.zIndex = `${MenuPopup.getNewZIndex()}`;
                submenu_popup_el.setAttribute("dir", this.getDirection());

                if (window.inheritTheme) {
                    window.inheritTheme(submenu_popup_el, this.element);
                }
                if (!submenu_popup_el.parentElement) {
                    document.body.appendChild(submenu_popup_el);
                }

                submenu_popup_el.dispatchEvent(new CustomEvent("update", {}));
                if (highlight_first) {
                    submenu_popup.highlight(0);
                    this.sendInfoEvent(submenu_popup.menuItems[0]);
                } else {
                    submenu_popup.highlight(-1);
                }

                const rect = item_el.getBoundingClientRect();
                let submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
                submenu_popup_el.style.position = "absolute";
                submenu_popup_el.style.left = `${(this.getDirection() === "rtl" ? rect.left - submenu_popup_rect.width : rect.right) + window.scrollX}px`;
                submenu_popup_el.style.top = `${rect.top + window.scrollY}px`;

                submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
                if (this.getDirection() === "rtl") {
                    if (submenu_popup_rect.left < 0) {
                        submenu_popup_el.style.left = `${rect.right}px`;
                        submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
                        if (submenu_popup_rect.right > innerWidth) {
                            submenu_popup_el.style.left = `${innerWidth - submenu_popup_rect.width}px`;
                        }
                    }
                } else {
                    if (submenu_popup_rect.right > innerWidth) {
                        submenu_popup_el.style.left = `${rect.left - submenu_popup_rect.width}px`;
                        submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
                        if (submenu_popup_rect.left < 0) {
                            submenu_popup_el.style.left = "0";
                        }
                    }
                }

                submenu_popup_el.focus({ preventScroll: true });
                window.active_menu_popup = submenu_popup;
            };

            this.submenus.push({
                item_el,
                submenu_popup_el,
                submenu_popup,
            });

            const close_submenus_at_this_level = () => {
                for (const { submenu_popup, item_el } of this.submenus) {
                    submenu_popup.close(false);
                    item_el.setAttribute("aria-expanded", "false");
                }
                this.element.focus({ preventScroll: true });
            };

            let open_tid, close_tid;
            submenu_popup_el.addEventListener("pointerenter", () => {
                if (open_tid) clearTimeout(open_tid);
                if (close_tid) clearTimeout(close_tid);
            });
            item_el.addEventListener("pointerenter", () => {
                if (open_tid) clearTimeout(open_tid);
                if (close_tid) clearTimeout(close_tid);
                open_tid = setTimeout(() => open_submenu(false), 501);
            });
            item_el.addEventListener("pointerleave", () => {
                if (open_tid) clearTimeout(open_tid);
            });
            this.element.addEventListener("pointerenter", (event) => {
                if (event.target.closest(".menu-item") === item_el) return;
                if (!close_tid && submenu_popup_el.style.display !== "none") {
                    close_tid = setTimeout(() => {
                        if (!window.debugKeepMenusOpen) close_submenus_at_this_level();
                    }, 500);
                }
            });
            this.element.addEventListener("pointerleave", () => {
                if (close_tid) clearTimeout(close_tid);
            });

            item_el.addEventListener("pointerdown", () => open_submenu(false));
        }

        let just_activated = false;
        const item_action = () => {
            if (just_activated) return;
            just_activated = true;
            setTimeout(() => { just_activated = false; }, 10);

            if (item.checkbox) {
                if (item.checkbox.toggle) item.checkbox.toggle();
                this.element.dispatchEvent(new CustomEvent("update", {}));
            } else if (item.action) {
                this.closeMenus();
                this.refocusOutsideMenus();
                item.action();
            }
        };

        item_el.addEventListener("pointerup", e => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (e.pointerType === "touch") return; // Use click instead
            item_el.click();
        });

        item_el.addEventListener("click", () => {
            if (item.submenu) {
                open_submenu(true);
            } else {
                item_action();
            }
        });
    };

    exports.MenuPopup = MenuPopup;

})(typeof module !== "undefined" ? module.exports : window);
