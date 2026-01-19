(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.osGuiUtils = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

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
        // This is a bit of a hack, assuming $Window is a global.
        // This should be improved when all components are part of the UMD module.
        if (typeof $Window !== "undefined") {
            return ($Window.Z_INDEX++) + MAX_MENU_NESTING;
        }
        return (++internal_z_counter) + MAX_MENU_NESTING;
    }

    function get_direction() {
        // This is also a hack, assuming get_direction is a global.
        return window.get_direction ? window.get_direction() : "ltr";
    }

    /**
     * @param {object} item
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

    return {
        E: E,
        uid: uid,
        get_new_menu_z_index: get_new_menu_z_index,
        get_direction: get_direction,
        is_disabled: is_disabled,
    };
}));
