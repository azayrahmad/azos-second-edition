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

    /** @type {AccessKeys} */
    const AccessKeys = {
        escape: function (label) {
            return label.replace(/&/g, "&&");
        },
        unescape: function (label) {
            return label.replace(/&&/g, "&");
        },
        indexOf: function (label) {
            return ` ${label}`.search(/[^&]&[^&\s]/);
        },
        has: function (label) {
            return this.indexOf(label) >= 0;
        },
        get: function (label) {
            const index = this.indexOf(label);
            if (index >= 0) {
                return label.charAt(index + 1).toUpperCase();
            }
            return null;
        },
        remove: function (label) {
            const parentheticalRegex = /\s?\(&[^&]\)/;
            if (parentheticalRegex.test(label)) {
                return this.unescape(label.replace(parentheticalRegex, ""));
            }
            return this.toText(label);
        },
        toText: function (label) {
            const index = this.indexOf(label);
            if (index >= 0) {
                return this.unescape(label.substring(0, index)) + this.unescape(label.substring(index + 1));
            }
            return this.unescape(label);
        },
        toHTML: function (label) {
            const fragment = this.toFragment(label);
            const dummy = document.createElement("div");
            dummy.appendChild(fragment);
            return dummy.innerHTML;
        },
        toFragment: function (label) {
            const fragment = document.createDocumentFragment();
            const index = this.indexOf(label);
            if (index >= 0) {
                fragment.appendChild(document.createTextNode(this.unescape(label.substring(0, index))));
                const span = E("span", { class: "menu-hotkey" });
                span.appendChild(document.createTextNode(label.charAt(index + 1)));
                fragment.appendChild(span);
                fragment.appendChild(document.createTextNode(this.unescape(label.substring(index + 2))));
            } else {
                fragment.appendChild(document.createTextNode(this.unescape(label)));
            }
            return fragment;
        },
    };

    const MENU_DIVIDER = "MENU_DIVIDER";

    exports.AccessKeys = AccessKeys;
    exports.MENU_DIVIDER = MENU_DIVIDER;

})(typeof module !== "undefined" ? module.exports : window);
