((exports) => {

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

            this.menuPopup = new MenuPopup(items, {
                parentMenuPopup: this.parentMenu ? this.parentMenu.menuPopup : null,
            });

            this.element = this.menuPopup.element;
            if (options.className) {
                this.element.classList.add(options.className);
            }
        }

        show(x, y) {
            this.element.style.display = 'block';
            this.element.style.zIndex = MenuPopup.getNewZIndex();
            void this.element.offsetHeight;
            this.element.dispatchEvent(new CustomEvent("update", {}));
            this.element.focus({preventScroll: true});

            if (x !== undefined && y !== undefined) {
                this.positionAt(x, y);
            } else if (this.parentEl) {
                this.position();
            }
        }

        positionAt(x, y) {
            const menuRect = this.element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const positions = [
                { x: x, y: y },
                { x: x - menuRect.width, y: y },
                { x: x, y: y - menuRect.height },
                { x: x - menuRect.width, y: y - menuRect.height },
                { x: x + 10, y: y + 10 },
            ];

            let bestPosition = positions[0];
            let maxVisibleArea = 0;

            for (const pos of positions) {
                const visibleWidth = Math.min(pos.x + menuRect.width, viewportWidth) - Math.max(pos.x, 0);
                const visibleHeight = Math.min(pos.y + menuRect.height, viewportHeight) - Math.max(pos.y, 0);
                const visibleArea = visibleWidth * visibleHeight;

                if (visibleWidth >= menuRect.width && visibleHeight >= menuRect.height) {
                    bestPosition = pos;
                    break;
                }

                if (visibleArea > maxVisibleArea) {
                    maxVisibleArea = visibleArea;
                    bestPosition = pos;
                }
            }

            let finalX = Math.max(0, Math.min(bestPosition.x, viewportWidth - menuRect.width));
            let finalY = Math.max(0, Math.min(bestPosition.y, viewportHeight - menuRect.height));

            this.element.style.left = `${finalX}px`;
            this.element.style.top = `${finalY}px`;
        }

        hide() {
            this.element.style.display = 'none';
            this.menuPopup.close(false);
        }

        close() {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.menuPopup.close(false);
        }

        position() {
            if (!this.parentEl) return;

            const parentRect = this.parentEl.getBoundingClientRect();
            const menuWidth = this.element.offsetWidth;
            const menuHeight = this.element.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let x, y;

            if (this.isSubmenu) {
                x = parentRect.right;
                y = parentRect.top;
                if (x + menuWidth > viewportWidth) x = parentRect.left - menuWidth;
                if (y + menuHeight > viewportHeight) y = viewportHeight - menuHeight;
            } else {
                x = parentRect.left;
                y = parentRect.bottom;
                if (x + menuWidth > viewportWidth) x = parentRect.right - menuWidth;
                if (y + menuHeight > viewportHeight) y = parentRect.top - menuHeight;
            }

            this.element.style.left = `${Math.max(0, x)}px`;
            this.element.style.top = `${Math.max(0, y)}px`;
        }
    }

    exports.MenuList = MenuList;

})(typeof exports !== 'undefined' ? exports : window);
