((exports) => {
    /**
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} tagName
     * @param {Record<string, string>} [attrs]
     * @returns {HTMLElementTagNameMap[K]}
     */
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

    let uid_counter = 0;
    function uid() {
        return (uid_counter++).toString(36) + Math.random().toString(36).slice(2);
    }

    let internal_z_counter = 1;
    const MAX_MENU_NESTING = 1000;
    function get_new_menu_z_index() {
        if (typeof $Window !== "undefined") {
            return ($Window.Z_INDEX++) + MAX_MENU_NESTING;
        }
        return (++internal_z_counter) + MAX_MENU_NESTING;
    }

    function get_direction() {
        return window.get_direction ? window.get_direction() : "ltr";
    }

    /**
     * @param {OSGUIMenuItem} item
     * @returns {boolean}
     */
    function is_disabled(item) {
        if (typeof item.enabled === "function") {
            return !item.enabled();
        } else if (typeof item.enabled === "boolean") {
            return !item.enabled;
        } else {
            return false;
        }
    }

    exports.E = E;
    exports.uid = uid;
    exports.get_new_menu_z_index = get_new_menu_z_index;
    exports.get_direction = get_direction;
    exports.is_disabled = is_disabled;
})(window.os_gui_utils = {});
