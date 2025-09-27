((exports) => {
    /**
     * @typedef {import('./types').OSGUIMenuItem} OSGUIMenuItem
     */

    class MenuList {
        /**
         * @param {OSGUIMenuItem[]} items
         * @param {Object} options
         * @param {HTMLElement} [options.parentEl] - Parent element for context positioning
         * @param {boolean} [options.isSubmenu=false] - Whether this is a submenu
         */
        constructor(items, options = {}) {
            this.items = items;
            this.parentEl = options.parentEl;
            this.isSubmenu = options.isSubmenu || false;

            this.element = document.createElement('div');
            this.element.className = 'menu-popup';
            this.element.setAttribute('role', 'menu');
            this.element.style.touchAction = 'none';
            this.element.style.display = 'none';

            this.itemElements = [];
            this.buildMenu();
        }

        buildMenu() {
            this.items.forEach((item, index) => {
                if (item === "MENU_DIVIDER") {
                    const divider = document.createElement('hr');
                    divider.className = 'menu-divider';
                    this.element.appendChild(divider);
                    return;
                }

                const itemEl = document.createElement('div');
                itemEl.className = 'menu-item';
                itemEl.setAttribute('role', 'menuitem');

                if (item.checkbox) {
                    itemEl.classList.add('menu-item-checkbox');
                }
                if (item.submenu) {
                    itemEl.classList.add('has-submenu');
                }

                if (typeof item.enabled === 'boolean' && !item.enabled) {
                    itemEl.setAttribute('aria-disabled', 'true');
                }

                // Handle item label
                const labelSpan = document.createElement('span');
                labelSpan.className = 'menu-item-label';
                if (item.label) {
                    labelSpan.appendChild(this.createAccessKeyLabel(item.label));
                }
                itemEl.appendChild(labelSpan);

                // Handle shortcut text if any
                if (item.shortcut) {
                    const shortcutSpan = document.createElement('span');
                    shortcutSpan.className = 'menu-item-shortcut';
                    shortcutSpan.textContent = item.shortcut;
                    itemEl.appendChild(shortcutSpan);
                }

                this.itemElements.push(itemEl);
                this.element.appendChild(itemEl);

                this.attachItemEvents(itemEl, item);
            });
        }

        /**
         * @param {HTMLElement} itemEl 
         * @param {OSGUIMenuItem} item 
         */
        attachItemEvents(itemEl, item) {
            if (item.click) {
                itemEl.addEventListener('click', (e) => {
                    if (!this.isDisabled(item)) {
                        item.click(e);
                        this.close();
                    }
                });
            }

            itemEl.addEventListener('pointerenter', () => {
                this.highlight(itemEl);
                this.sendInfoEvent(item);
            });

            itemEl.addEventListener('pointerleave', () => {
                itemEl.classList.remove('highlight');
            });
        }

        /**
         * @param {HTMLElement} itemEl 
         */
        highlight(itemEl) {
            this.itemElements.forEach(el => el.classList.remove('highlight'));
            itemEl.classList.add('highlight');
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

            if (x !== undefined && y !== undefined) {
                this.positionAt(x, y);
            } else if (this.parentEl) {
                this.position();
            }
        }

        /**
         * Position the menu at specific coordinates, ensuring it stays within the viewport.
         * @param {number} x - The horizontal coordinate.
         * @param {number} y - The vertical coordinate.
         */
        positionAt(x, y) {
            const menuRect = this.element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newX = x;
            let newY = y;

            // Adjust horizontal position if it overflows
            if (x + menuRect.width > viewportWidth) {
                newX = viewportWidth - menuRect.width - 2; // Add a small buffer
            }

            // Adjust vertical position if it overflows
            if (y + menuRect.height > viewportHeight) {
                newY = y - menuRect.height;
            }

            // Ensure it's not off-screen on the top or left
            if (newX < 0) {
                newX = 0;
            }
            if (newY < 0) {
                newY = 0;
            }

            this.element.style.left = `${newX}px`;
            this.element.style.top = `${newY}px`;
        }

        hide() {
            this.element.style.display = 'none';
        }

        close() {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            // If this is a submenu, also close parent menus
            if (this.isSubmenu && this.parentMenu) {
                this.parentMenu.close();
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

})(typeof exports !== 'undefined' ? exports : (window.OS = window.OS || {}));
