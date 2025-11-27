import { getThemes, getColorSchemeId, setColorScheme } from "../../../utils/themeManager.js";

export const appearanceTab = {
  init: (win, app) => {
    const $tab = win.$content.find("#appearance");
    const $schemeSelect = $tab.find(".scheme-select");

    const themes = getThemes();
    const currentSchemeId = getColorSchemeId();

    Object.values(themes).forEach(theme => {
      const $option = $("<option>")
        .val(theme.id)
        .text(theme.name);
      if (theme.id === currentSchemeId) {
        $option.prop("selected", true);
      }
      $schemeSelect.append($option);
    });

    $schemeSelect.on("change", () => {
      app._enableApplyButton(win);
    });
  },

  applyChanges: (app) => {
    const $schemeSelect = app.win.$content.find("#appearance .scheme-select");
    const newSchemeId = $schemeSelect.val();
    setColorScheme(newSchemeId);
  },
};
