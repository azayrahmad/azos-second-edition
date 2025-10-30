
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

        document.body.appendChild(menuPopup.element);

        menuPopup.element.style.display = "block";
        void menuPopup.element.offsetHeight; // force reflow

        const positionAt = (x, y) => {
            const menuRect = menuPopup.element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            let finalX = x,
                finalY = y;
            if (x + menuRect.width > viewportWidth) {
                finalX = x - menuRect.width;
            }
            if (y + menuRect.height > viewportHeight) {
                finalY = y - menuRect.height;
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
})(typeof exports !== 'undefined' ? exports : window);
