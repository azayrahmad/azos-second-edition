(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', './MenuBar'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'), require('./MenuBar'));
    } else {
        // Browser globals (root is window)
        const osGui = factory(root.jQuery, root.MenuBar);
        root.$Window = osGui.$Window;
        root.$FormWindow = osGui.$FormWindow;
    }
}(typeof self !== 'undefined' ? self : this, function ($, MenuBar) {
    'use strict';

    const E = document.createElement.bind(document);

    function element_to_string(element) {
        if (element && typeof element === "object" && "tagName" in element) {
            return (
                element.tagName.toLowerCase() +
                (element.id ? "#" + element.id : "") +
                (element.className ? "." + element.className.split(" ").join(".") : "") +
                (element.src ? `[src="${element.src}"]` : "") +
                (element.srcdoc ? "[srcdoc]" : "") +
                (element.href ? `[href="${element.href}"]` : "")
            );
        } else if (element) {
            return element.constructor.name;
        } else {
            return `${element}`;
        }
    }

    function find_tabstops(container_el) {
        const $el = $(container_el);
        let $controls = $el
            .find(
                `
		input:enabled,
		textarea:enabled,
		select:enabled,
		button:enabled,
		a[href],
		[tabIndex='0'],
		details summary,
		iframe,
		object,
		embed,
		video[controls],
		audio[controls],
		[contenteditable]:not([contenteditable='false'])
	`,
            )
            .filter(":visible");

        const radios = {};
        const to_skip = [];
        for (const el of $controls.toArray()) {
            if (el.nodeName.toLowerCase() === "input" && el.type === "radio") {
                if (radios[el.name]) {
                    if (el.checked) {
                        to_skip.push(radios[el.name]);
                        radios[el.name] = el;
                    } else {
                        to_skip.push(el);
                    }
                } else {
                    radios[el.name] = el;
                }
            }
        }
        const $tabstops = $controls.not(to_skip);
        return $tabstops;
    }
    const $G = $(window);

    let Z_INDEX = 5;
    let minimize_slots = [];

    function $Window(options = {}, config = {}) {
        const { playSound, get_direction: get_direction_config } = config;

        var $w = $(E("div"))
            .addClass("window os-window")
            .appendTo("#screen");

        $w[0].$window = $w;
        $w.element = $w[0];
        $w.child_$windows = [];
        $w[0].id = `os-window-${Math.random().toString(36).substr(2, 9)}`;
        $w.$titlebar = $(E("div")).addClass("window-titlebar").appendTo($w);
        $w.$title_area = $(E("div"))
            .addClass("window-title-area")
            .appendTo($w.$titlebar);
        $w.$title = $(E("span")).addClass("window-title").appendTo($w.$title_area);
        if (options.toolWindow) {
            options.minimizeButton = false;
            options.maximizeButton = false;
        }
        if (options.minimizeButton !== false) {
            $w.$minimize = $(E("button"))
                .addClass("window-minimize-button window-action-minimize window-button")
                .appendTo($w.$titlebar);
            $w.$minimize.attr("aria-label", "Minimize window");
            $w.$minimize.append("<span class='window-button-icon'></span>");
        }
        if (options.maximizeButton !== false) {
            $w.$maximize = $(E("button"))
                .addClass("window-maximize-button window-action-maximize window-button")
                .appendTo($w.$titlebar);
            $w.$maximize.attr("aria-label", "Maximize or restore window");
            if (!options.resizable) {
                $w.$maximize.prop("disabled", true);
            }
            $w.$maximize.append("<span class='window-button-icon'></span>");
        }
        if (options.closeButton !== false) {
            $w.$x = $(E("button"))
                .addClass("window-close-button window-action-close window-button")
                .appendTo($w.$titlebar);
            $w.$x.attr("aria-label", "Close window");
            $w.$x.append("<span class='window-button-icon'></span>");
        }
        $w.$content = $(E("div")).addClass("window-content").appendTo($w);
        $w.$content.attr("tabIndex", "-1");
        $w.$content.css("outline", "none");
        if (options.toolWindow) {
            $w.addClass("tool-window");
        }
        if (options.parentWindow) {
            options.parentWindow.addChildWindow($w);
            if (options.toolWindow) {
                $w[0].dataset.semanticParent = options.parentWindow[0].id;
            }
        }

        var $component = options.$component;
        if (options.icons) {
            $w.icons = options.icons;
        } else if (typeof options.icon === "object" && "tagName" in options.icon) {
            $w.icons = { any: options.icon };
        } else {
            $w.icons = {};
        }
        let iconSize = 16;
        $w.setTitlebarIconSize = function (target_icon_size) {
            if ($w.icons) {
                $w.$icon?.remove();
                const iconNode = $w.getIconAtSize(target_icon_size);
                $w.$icon = iconNode ? $(iconNode) : $();
                $w.$icon.prependTo($w.$titlebar);
            }
            iconSize = target_icon_size;
            $w.trigger("icon-change");
        };
        $w.getTitlebarIconSize = function () {
            return iconSize;
        };
        $w.getIconAtSize = function (target_icon_size) {
            let icon_size;
            if ($w.icons[target_icon_size]) {
                icon_size = target_icon_size;
            } else if ($w.icons["any"]) {
                icon_size = "any";
            } else {
                const sizes = Object.keys($w.icons).filter(
                    (size) => isFinite(size) && isFinite(parseFloat(size)),
                );
                sizes.sort(
                    (a, b) =>
                        Math.abs(parseFloat(a) - target_icon_size) -
                        Math.abs(parseFloat(b) - target_icon_size),
                );
                icon_size = sizes[0];
            }
            if (icon_size) {
                const icon = $w.icons[icon_size];
                let icon_element;
                if (typeof icon === "object" && "cloneNode" in icon) {
                    icon_element = icon.cloneNode(true);
                } else {
                    icon_element = E("img");
                    const $icon = $(icon_element);
                    if (typeof icon === "string") {
                        $icon.attr("src", icon);
                    } else if ("srcset" in icon) {
                        $icon.attr("srcset", icon.srcset);
                    } else {
                        $icon.attr("src", icon.src);
                    }
                    $icon.attr({
                        width: icon_size,
                        height: icon_size,
                        draggable: false,
                    });
                    $icon.css({
                        width: target_icon_size,
                        height: target_icon_size,
                    });
                }
                return icon_element;
            }
            return null;
        };
        $w.setTitlebarIconSize(iconSize);

        if ($component) {
            $w.addClass("component-window");
        }

        setTimeout(() => {
            if (get_direction() == "rtl") {
                $w.addClass("rtl");
            }
        }, 0);

        function get_direction() {
            return get_direction_config ? get_direction_config() : (getComputedStyle($w[0]).direction);
        }

        const $event_target = $({});
        const make_simple_listenable = (name) => {
            return (callback) => {
                const fn = () => {
                    callback();
                };
                $event_target.on(name, fn);
                const dispose = () => {
                    $event_target.off(name, fn);
                };
                return dispose;
            };
        };
        $w.onFocus = make_simple_listenable("focus");
        $w.onBlur = make_simple_listenable("blur");
        $w.onClosed = make_simple_listenable("closed");

        $w.setDimensions = ({
            innerWidth,
            innerHeight,
            outerWidth,
            outerHeight,
        }) => {
            let width_from_frame, height_from_frame;
            if (innerWidth) {
                width_from_frame = $w.outerWidth() - $w.$content.outerWidth();
            }
            if (innerHeight) {
                height_from_frame = $w.outerHeight() - $w.$content.outerHeight();
                const $menu_bar = $w.$content.find(".menus");
                if ($menu_bar.length) {
                    height_from_frame += $menu_bar.outerHeight();
                }
            }
            if (outerWidth) {
                $w.outerWidth(outerWidth);
            }
            if (outerHeight) {
                $w.outerHeight(outerHeight);
            }
            if (innerWidth) {
                $w.outerWidth(innerWidth + width_from_frame);
            }
            if (innerHeight) {
                $w.outerHeight(innerHeight + height_from_frame);
            }
        };
        $w.setDimensions(options);

        $w.addChildWindow = ($child_window) => {
            $w.child_$windows.push($child_window);
        };
        const showAsFocused = () => {
            if ($w.hasClass("focused")) {
                return;
            }
            $w.addClass("focused");
            $event_target.triggerHandler("focus");
        };
        const stopShowingAsFocused = () => {
            if (!$w.hasClass("focused")) {
                return;
            }
            $w.removeClass("focused");
            $event_target.triggerHandler("blur");
        };
        $w.focus = () => {
            showAsFocused();
            $w.bringToFront();
            refocus();
        };
        $w.blur = () => {
            stopShowingAsFocused();
            if (
                document.activeElement &&
                document.activeElement.closest(".window") == $w[0]
            ) {
                document.activeElement.blur();
            }
        };

        let minimize_target_el = null;
        $w.setMinimizeTarget = function (new_taskbar_button_el) {
            minimize_target_el = new_taskbar_button_el;
        };

        $w.minimize = () => {
            if ($w.is(":visible")) {
                $w.trigger("minimize");
                if (minimize_target_el) {
                    playSound?.("Minimize");
                    const before_rect = $w.$titlebar[0].getBoundingClientRect();
                    const after_rect = minimize_target_el.getBoundingClientRect();
                    $w.animateTitlebar(before_rect, after_rect, () => {
                        $w.hide();
                        $w.blur();
                    });
                }
            }
        };

        $w.unminimize = () => {
            if ($w.is(":hidden")) {
                $w.trigger("restore");
                playSound?.("RestoreUp");
                const before_rect = minimize_target_el.getBoundingClientRect();
                $w.show();
                const after_rect = $w.$titlebar[0].getBoundingClientRect();
                $w.hide();
                $w.animateTitlebar(before_rect, after_rect, () => {
                    $w.show();
                    $w.bringToFront();
                    $w.focus();
                });
            }
        };

        let before_maximize;
        $w.maximize = () => {
            if (!options.resizable) {
                return;
            }
            if ($w.hasClass("maximized")) {
                playSound?.("RestoreDown");
            } else {
                playSound?.("Maximize");
            }
            const instantly_maximize = () => {
                before_maximize = {
                    position: $w.css("position"),
                    left: $w.css("left"),
                    top: $w.css("top"),
                    width: $w.css("width"),
                    height: $w.css("height"),
                };
                $w.addClass("maximized");
                const screen = document.getElementById("desktop-area") || document.getElementById("screen");
                const screenRect = screen.getBoundingClientRect();
                $w.css({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: screenRect.width,
                    height: screenRect.height,
                });
            };
            const instantly_unmaximize = () => {
                $w.removeClass("maximized");
                $w.css({ width: "", height: "" });
                if (before_maximize) {
                    $w.css(before_maximize);
                }
            };

            const before_rect = $w.$titlebar[0].getBoundingClientRect();
            let after_rect;
            const restoring = $w.hasClass("maximized");
            if (restoring) {
                instantly_unmaximize();
                after_rect = $w.$titlebar[0].getBoundingClientRect();
                instantly_maximize();
            } else {
                instantly_maximize();
                after_rect = $w.$titlebar[0].getBoundingClientRect();
                instantly_unmaximize();
            }
            $w.animateTitlebar(before_rect, after_rect, () => {
                if (restoring) {
                    instantly_unmaximize();
                    $w.$maximize.removeClass("window-action-restore").addClass("window-action-maximize");
                } else {
                    instantly_maximize();
                    $w.$maximize.removeClass("window-action-maximize").addClass("window-action-restore");
                }
            });
        };

        $w.restore = () => {
            if ($w.is(".minimized")) {
                $w.unminimize();
            } else if ($w.is(".maximized")) {
                $w.maximize();
            }
        };

        $w.$minimize?.on("click", () => $w.minimize());
        $w.$maximize?.on("click", () => $w.maximize());
        $w.$x?.on("click", () => $w.close());
        $w.$title_area.on("dblclick", () => $w.maximize());

        $w.css({
            position: "absolute",
            zIndex: Z_INDEX++,
        });
        $w.bringToFront = () => {
            $w.css({ zIndex: Z_INDEX++ });
            for (const $childWindow of $w.child_$windows) {
                $childWindow.bringToFront();
            }
        };

        let current_menu_bar;
        $w.setMenuBar = (menu_bar) => {
            if (current_menu_bar) {
                current_menu_bar.element.remove();
            }
            if (menu_bar) {
                $w.$titlebar.after(menu_bar.element);
                menu_bar.setKeyboardScope($w[0]);
                current_menu_bar = menu_bar;
            }
        };

        $w.title = (title) => {
            if (typeof title !== "undefined") {
                $w.$title.text(title);
                $w.trigger("title-change");
                if ($w.task) {
                    $w.task.updateTitle();
                }
                return $w;
            } else {
                return $w.$title.text();
            }
        };

        $w.center = () => {
            const screen = document.getElementById("screen");
            const rect = screen.getBoundingClientRect();
            $w.css({
                left: (rect.width - $w.width()) / 2,
                top: (rect.height - $w.height()) / 2,
            });
        };

        if (options.title) {
            $w.title(options.title);
        }

        if (!$component) {
            $w.center();
        }

        return $w;
    }

    $Window.Z_INDEX = 5;

    function $FormWindow(title, config) {
        var $w = $Window({ title }, config);
        $w.$form = $(E("form")).appendTo($w.$content);
        $w.$main = $(E("div")).appendTo($w.$form);
        $w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");
        $w.$Button = (label, action) => {
            var $b = $(E("button")).appendTo($w.$buttons).text(label);
            $b.on("click", (e) => {
                e.preventDefault();
                action();
            });
            $b.on("pointerdown", () => {
                $b.focus();
            });
            return $b;
        };
        return $w;
    }

    return {
        $Window,
        $FormWindow,
    };
}));
