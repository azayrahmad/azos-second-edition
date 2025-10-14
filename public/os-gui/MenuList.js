((exports) => {
    /**
     * @typedef {import('./types').OSGUIMenuItem} OSGUIMenuItem
     */

    const MENU_DIVIDER = "MENU_DIVIDER";

    class MenuList {
        /**
         * @param {OSGUIMenuItem[]} items
         * @param {Object} options
         * @param {HTMLElement} [options.parentEl] - Parent element for context positioning
         * @param {boolean} [options.isSubmenu=false] - Whether this is a submenu
         * @param {MenuList} [options.parentMenu] - Parent menu instance
         */
        constructor(items, options = {}) {
            this.items = items;
            this.parentEl = options.parentEl;
            this.isSubmenu = options.isSubmenu || false;
            this.parentMenu = options.parentMenu;
            this.defaultLabel = options.defaultLabel || 'Open';
            this.activeSubmenu = null;
            this.submenuOpenTimer = null;

            this.element = document.createElement('div');
            this.element.className = 'menu-popup';
            if (options.className) {
                this.element.classList.add(options.className);
            }
            this.element.setAttribute('role', 'menu');
            this.element.style.touchAction = 'pan-y'; // allow for scrolling overflowing menus
            this.element.style.display = 'none';

            // Create table structure like MenuBar
            const menu_popup_table_el = document.createElement('table');
            menu_popup_table_el.className = 'menu-popup-table';
            menu_popup_table_el.setAttribute('role', 'presentation');
            this.element.appendChild(menu_popup_table_el);
            this.tableElement = menu_popup_table_el;

            this.itemElements = [];
            this.buildMenu();
        }

        buildMenu() {
            this.items.forEach((item, index) => {
                if (item === MENU_DIVIDER) {
                    const row_el = document.createElement("tr");
                    row_el.className = "menu-row";
                    const td_el = document.createElement("td");
                    td_el.setAttribute("colspan", "4");
                    const hr_el = document.createElement("hr");
                    hr_el.className = "menu-hr";
                    // Normal menu behavior: clear highlight when hovering over divider
                    hr_el.addEventListener("pointerenter", () => {
                        this.highlight(-1);
                    });
                    td_el.appendChild(hr_el);
                    row_el.appendChild(td_el);
                    this.tableElement.appendChild(row_el);
                    this.itemElements.push(row_el);
                    return;
                }

                const row_el = document.createElement("tr");
                row_el.className = "menu-row";
                this.itemElements.push(row_el);

                const item_el = row_el;
                item_el.classList.add("menu-item");
                item_el.id = `menu-item-${Math.random().toString(36).substring(2)}`;
                item_el.tabIndex = -1;
                item_el.setAttribute("role", item.checkbox ? (item.checkbox.type === "radio" ? "menuitemradio" : "menuitemcheckbox") : "menuitem");

                if (item.checkbox) {
                    item_el.classList.add('menu-item-checkbox');
                }
                if (item.submenu) {
                    item_el.classList.add('has-submenu');
                }

                // Set default item styling
                if (item.label && item.label.replace(/&/g, '') === this.defaultLabel) {
                    item_el.classList.add('menu-item-default');
                    item_el.style.fontWeight = 'bold';
                }

                if (typeof item.enabled === 'boolean' && !item.enabled) {
                    item_el.setAttribute('aria-disabled', 'true');
                }

                // Create table cells
                const checkbox_area_el = document.createElement("td");
                checkbox_area_el.className = "menu-item-checkbox-area";
                if (item.icon) {
                    const icon_el = document.createElement('img');
                    icon_el.src = item.icon;
                    icon_el.className = 'menu-item-icon';
                    checkbox_area_el.appendChild(icon_el);
                } else if (item.checkbox?.type === "radio") {
                    checkbox_area_el.classList.add("radio");
                } else if (item.checkbox) {
                    checkbox_area_el.classList.add("checkbox");
                }

                const label_el = document.createElement("td");
                label_el.className = "menu-item-label";
                if (item.label) {
                    label_el.appendChild(this.createAccessKeyLabel(item.label));
                }

                const shortcut_el = document.createElement("td");
                shortcut_el.className = "menu-item-shortcut";
                if (item.shortcut) {
                    shortcut_el.textContent = item.shortcut;
                }

                const submenu_area_el = document.createElement("td");
                submenu_area_el.className = "menu-item-submenu-area";
                if (item.submenu) {
                    item_el.setAttribute("aria-haspopup", "true");
                    item_el.setAttribute("aria-expanded", "false");
                    submenu_area_el.classList.toggle("point-right", false); // RTL support could be added later
                }

                // Append cells to row
                item_el.appendChild(checkbox_area_el);
                item_el.appendChild(label_el);
                item_el.appendChild(shortcut_el);
                item_el.appendChild(submenu_area_el);

                this.tableElement.appendChild(row_el);

                this.attachItemEvents(item_el, item);
            });
        }

        /**
         * @param {HTMLElement} itemEl 
         * @param {OSGUIMenuItem} item 
         */
        attachItemEvents(itemEl, item) {
            const item_action = () => {
                if (item.checkbox) {
                    if (item.checkbox.toggle) {
                        item.checkbox.toggle();
                    }
                    this.updateMenuItem(itemEl, item);
                    // Do not close menu for checkbox items, allowing for dynamic updates.
                } else if (item.action) {
                    this.closeAll();
                    item.action();
                }
            };

            if (item.click) {
                itemEl.addEventListener('click', (e) => {
                    if (!this.isDisabled(item)) {
                        item.click(e);
                        // Only close if it's not a checkbox.
                        if (!item.checkbox) {
                            this.closeAll();
                        }
                    }
                });
            } else {
                itemEl.addEventListener('click', (e) => {
                    if (!this.isDisabled(item) && !item.submenu) {
                        item_action();
                    }
                });
            }

            itemEl.addEventListener('pointerenter', () => {
                this.highlight(itemEl);
                this.sendInfoEvent(item);
                this.closeActiveSubmenu();

                if (item.submenu) {
                    this.submenuOpenTimer = setTimeout(() => {
                        this.openSubmenu(item, itemEl);
                    }, 200); // A slight delay
                }
            });

            itemEl.addEventListener('pointerleave', (e) => {
                clearTimeout(this.submenuOpenTimer);
                // Don't remove highlight if moving into a submenu
                if (!this.activeSubmenu || !this.activeSubmenu.element.contains(e.relatedTarget)) {
                     itemEl.classList.remove('highlight');
                }
            });

            // Add update listener for dynamic state changes
            this.element.addEventListener("update", () => {
                this.updateMenuItem(itemEl, item);
            });

            // Initial update
            this.updateMenuItem(itemEl, item);
        }

        /**
         * @param {HTMLElement} itemEl
         * @param {OSGUIMenuItem} item
         */
        updateMenuItem(itemEl, item) {
            // Update disabled state
            if (this.isDisabled(item)) {
                itemEl.setAttribute("disabled", "");
                itemEl.setAttribute("aria-disabled", "true");
            } else {
                itemEl.removeAttribute("disabled");
                itemEl.removeAttribute("aria-disabled");
            }

            // Update checkbox state
            if (item.checkbox && item.checkbox.check) {
                const checked = item.checkbox.check();
                itemEl.setAttribute("aria-checked", checked ? "true" : "false");
            }
        }

        /**
         * @param {HTMLElement | number} itemElOrIndex
         */
        highlight(itemElOrIndex) {
            let itemEl;
            if (typeof itemElOrIndex === "number") {
                itemEl = this.itemElements[itemElOrIndex];
            } else {
                itemEl = itemElOrIndex;
            }

            this.itemElements.forEach(el => {
                if (el !== itemEl) {
                    el.classList.remove('highlight');
                }
            });

            if (itemEl) {
                itemEl.classList.add('highlight');
            }
        }

        /**
         * @param {OSGUIMenuItem} item 
         */
        isDisabled(item) {
            if (typeof item.enabled === 'function') {
                return !item.enabled();
            }
            return typeof item.enabled === 'boolean' && !item.enabled;
        }

        /**
         * @param {string} label 
         */
        createAccessKeyLabel(label) {
            const fragment = document.createDocumentFragment();
            const accessKeyIndex = label.indexOf('&');

            if (accessKeyIndex === -1) {
                fragment.appendChild(document.createTextNode(label));
                return fragment;
            }

            if (accessKeyIndex > 0) {
                fragment.appendChild(document.createTextNode(label.substring(0, accessKeyIndex)));
            }

            const hotkeySpan = document.createElement('span');
            hotkeySpan.className = 'menu-hotkey';
            hotkeySpan.textContent = label.charAt(accessKeyIndex + 1);
            fragment.appendChild(hotkeySpan);

            if (accessKeyIndex < label.length - 2) {
                fragment.appendChild(document.createTextNode(label.substring(accessKeyIndex + 2)));
            }

            return fragment;
        }

        /**
         * @param {OSGUIMenuItem} [item] 
         */
        sendInfoEvent(item) {
            const description = item?.description || '';
            this.element.dispatchEvent(new CustomEvent('info', {
                bubbles: true,
                detail: { description }
            }));
        }

        /**
         * @param {number} [x]
         * @param {number} [y]
         */
        show(x, y) {
            this.element.style.display = 'block';

            // Force a reflow to ensure the element is rendered and has dimensions
            // before we try to position it. This is crucial for testability.
            void this.element.offsetHeight;

            // Update all menu items when showing
            this.element.dispatchEvent(new CustomEvent("update", {}));

            if (x !== undefined && y !== undefined) {
                this.positionAt(x, y);
            } else if (this.parentEl) {
                this.position();
            }
        }

        /**
         * Position the menu at specific coordinates, ensuring it stays within the viewport.
         * Uses smart positioning to try multiple placements and choose the best fit.
         * @param {number} x - The horizontal coordinate.
         * @param {number} y - The vertical coordinate.
         */
        positionAt(x, y) {
            const menuRect = this.element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Define possible positioning options, ordered by preference
            const positions = [
                { x: x, y: y, name: 'bottom-right' },                    // Preferred: below and to the right
                { x: x - menuRect.width, y: y, name: 'bottom-left' },     // Alternative: below and to the left
                { x: x, y: y - menuRect.height, name: 'top-right' },      // Alternative: above and to the right
                { x: x - menuRect.width, y: y - menuRect.height, name: 'top-left' }, // Alternative: above and to the left
                { x: x + 10, y: y + 10, name: 'offset-bottom-right' },   // Offset version as fallback
            ];

            // Find the best position that fits completely within viewport
            let bestPosition = positions[0]; // Default to first preference
            let maxVisibleArea = 0;

            for (const pos of positions) {
                const visibleWidth = Math.min(pos.x + menuRect.width, viewportWidth) - Math.max(pos.x, 0);
                const visibleHeight = Math.min(pos.y + menuRect.height, viewportHeight) - Math.max(pos.y, 0);
                const visibleArea = visibleWidth * visibleHeight;

                // If this position shows the entire menu, use it immediately
                if (visibleWidth >= menuRect.width && visibleHeight >= menuRect.height) {
                    bestPosition = pos;
                    break;
                }

                // Otherwise, track the position with the most visible area
                if (visibleArea > maxVisibleArea) {
                    maxVisibleArea = visibleArea;
                    bestPosition = pos;
                }
            }

            // Apply the best position, ensuring it stays within bounds
            let finalX = Math.max(0, Math.min(bestPosition.x, viewportWidth - menuRect.width));
            let finalY = Math.max(0, Math.min(bestPosition.y, viewportHeight - menuRect.height));

            this.element.style.left = `${finalX}px`;
            this.element.style.top = `${finalY}px`;
        }

        hide() {
            this.element.style.display = 'none';
            this.closeActiveSubmenu();
        }

        close() {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.closeActiveSubmenu();
        }

        closeAll() {
            let menu = this;
            while (menu.parentMenu) {
                menu = menu.parentMenu;
            }
            menu.close();
        }

        openSubmenu(item, itemEl) {
            if (this.activeSubmenu) {
                this.closeActiveSubmenu();
            }

            const submenu = new MenuList(item.submenu, {
                isSubmenu: true,
                parentMenu: this,
                parentEl: itemEl,
            });

            this.activeSubmenu = submenu;
            document.body.appendChild(submenu.element);
            submenu.show();
        }

        closeActiveSubmenu() {
            if (this.activeSubmenu) {
                this.activeSubmenu.close();
                this.activeSubmenu = null;
            }
        }

        position() {
            if (!this.parentEl) return;

            const parentRect = this.parentEl.getBoundingClientRect();
            const menuRect = this.element.getBoundingClientRect();

            if (this.isSubmenu) {
                // Position submenu to the right of the parent
                this.element.style.left = `${parentRect.right}px`;
                this.element.style.top = `${parentRect.top}px`;
            } else {
                // Position dropdown below the parent
                this.element.style.left = `${parentRect.left}px`;
                this.element.style.top = `${parentRect.bottom}px`;
            }

            // Adjust if menu goes off screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (menuRect.right > viewportWidth) {
                if (this.isSubmenu) {
                    // Show submenu to the left of parent
                    this.element.style.left = `${parentRect.left - menuRect.width}px`;
                } else {
                    // Align with right edge of parent
                    this.element.style.left = `${parentRect.right - menuRect.width}px`;
                }
            }

            if (menuRect.bottom > viewportHeight) {
                if (this.isSubmenu) {
                    this.element.style.top = `${Math.max(0, viewportHeight - menuRect.height)}px`;
                } else {
                    this.element.style.top = `${parentRect.top - menuRect.height}px`;
                }
            }
        }
    }

    exports.MenuList = MenuList;
    exports.MENU_DIVIDER = MENU_DIVIDER;

})(typeof exports !== 'undefined' ? exports : (window.OS = window.OS || {}));
