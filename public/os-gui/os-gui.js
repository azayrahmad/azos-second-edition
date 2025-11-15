((exports) => {
    const OSGUI = {
        config: {
            playSound: () => {},
            inheritTheme: () => {},
            getDirection: () => 'ltr',
            desktopArea: null,
        },
        init: function(options) {
            Object.assign(this.config, options);
        }
    };

    exports.OSGUI = OSGUI;
})(window);
