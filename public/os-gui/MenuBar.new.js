((exports) => {
    const { MenuList } = require('./MenuList');

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

    function uid() {
        return Math.random().toString(36).substring(2);
    }

    let last_focus_outside_menus = null;
    function track_focus() {
        if (
            document.activeElement &&
            document.activeElement.tagName !== "BODY" &&
            document.activeElement.tagName !== "HTML" &&
            !document.activeElement.closest(".menus, .menu-popup")
        ) {
            last_focus_outside_menus = document.activeElement;
        }
    }

    if (typeof window !== "undefined") {
        window.addEventListener("focusin", track_focus);
        window.addEventListener("focusout", track_focus);
    }

    /**
     * @param {Object} menus The menu structure
     * @constructor
     */
    function MenuBar(menus) {
        if (!(this instanceof MenuBar)) {
            return new MenuBar(menus);
        }

        // Create the menu bar element
        const menus_el = E("div", {
            class: "menus",
            role: "menubar",
            "aria-label": "Application Menu",
        });
        menus_el.style.touchAction = "none";

        /**
         * @returns {"ltr" | "rtl"} writing/layout direction
         */
        function get_direction() {
            return window.get_direction ? window.get_direction() : getComputedStyle(menus_el).direction;
        }

        let selecting_menus = false;
        const top_level_menus = [];
        let top_level_menu_index = -1;
        let active_menu_list = null;

        const close_menus = () => {
            top_level_menus.forEach(({ menu_button_el, menuList }) => {
                menu_button_el.setAttribute("aria-expanded", "false");
                menu_button_el.classList.remove("active");
                menuList.hide();
            });
            selecting_menus = false;
        };

        const refocus_outside_menus = () => {
            if (last_focus_outside_menus) {
                last_focus_outside_menus.focus();
                if (document.activeElement === last_focus_outside_menus) {
                    return;
                }
            }
            const window_el = menus_el.closest(".window");
            if (window_el) {
                window_el.dispatchEvent(new CustomEvent("refocus-window"));
            }
        };

        const top_level_highlight = (new_index_or_menu_key) => {
            const new_index = typeof new_index_or_menu_key === "string" ?
                Object.keys(menus).indexOf(new_index_or_menu_key) :
                new_index_or_menu_key;

            if (top_level_menu_index !== -1 && top_level_menu_index !== new_index) {
                top_level_menus[top_level_menu_index].menu_button_el.classList.remove("highlight");
            }
            if (new_index !== -1) {
                top_level_menus[new_index].menu_button_el.classList.add("highlight");
            }
            top_level_menu_index = new_index;
        };

        // Initialize top-level menu items
        Object.keys(menus).forEach((menu_key) => {
            const menu_items = menus[menu_key];

            // Create menu button
            const menu_button_el = E("div", {
                class: "menu-button",
                role: "menuitem",
                "aria-haspopup": "true",
                "aria-expanded": "false",
                id: `menu-button-${uid()}`
            });

            const menu_button_label = E("span", { class: "menu-button-label" });
            menu_button_label.textContent = menu_key.replace(/&/g, '');  // Basic text for now
            menu_button_el.appendChild(menu_button_label);

            // Create menu list
            const menuList = new MenuList(menu_items, {
                parentEl: menu_button_el,
                isSubmenu: false
            });
            document.body.appendChild(menuList.element);

            const menu_entry = {
                menu_button_el,
                menuList,
                menu_key
            };

            top_level_menus.push(menu_entry);
            menus_el.appendChild(menu_button_el);

            // Event handlers
            menu_button_el.addEventListener("click", (e) => {
                e.preventDefault();
                if (menu_button_el.getAttribute("aria-expanded") === "true") {
                    close_menus();
                } else {
                    close_menus();
                    menu_button_el.setAttribute("aria-expanded", "true");
                    menu_button_el.classList.add("active");
                    menuList.show();
                    selecting_menus = true;
                    active_menu_list = menuList;
                }
            });

            menu_button_el.addEventListener("pointerenter", () => {
                top_level_highlight(menu_key);
                if (selecting_menus) {
                    close_menus();
                    menu_button_el.setAttribute("aria-expanded", "true");
                    menu_button_el.classList.add("active");
                    menuList.show();
                    active_menu_list = menuList;
                }
            });
        });

        menus_el.addEventListener("pointerleave", () => {
            if (!selecting_menus) {
                top_level_highlight(-1);
            }
        });

        // Keyboard navigation
        menus_el.addEventListener("keydown", (e) => {
            const current_menu = top_level_menus[top_level_menu_index];

            switch (e.key) {
                case "ArrowLeft":
                case "ArrowRight":
                    const direction = get_direction();
                    const next_index = (top_level_menu_index + (
                        (e.key === "ArrowRight" && direction === "ltr") ||
                            (e.key === "ArrowLeft" && direction === "rtl") ? 1 : -1
                    ) + top_level_menus.length) % top_level_menus.length;

                    if (selecting_menus) {
                        close_menus();
                        top_level_menus[next_index].menu_button_el.click();
                    } else {
                        top_level_highlight(next_index);
                        top_level_menus[next_index].menu_button_el.focus();
                    }
                    e.preventDefault();
                    break;

                case "Enter":
                case "Space":
                    if (current_menu) {
                        current_menu.menu_button_el.click();
                        e.preventDefault();
                    }
                    break;

                case "Escape":
                    close_menus();
                    refocus_outside_menus();
                    e.preventDefault();
                    break;
            }
        });

        // Handle clicks outside
        document.addEventListener("pointerdown", (e) => {
            if (!menus_el.contains(e.target) && !e.target.closest('.menu-popup')) {
                close_menus();
            }
        });

        this.element = menus_el;
        this.closeMenus = close_menus;
    }

    exports.MenuBar = MenuBar;

})(typeof exports !== 'undefined' ? exports : (window.OS = window.OS || {}));
