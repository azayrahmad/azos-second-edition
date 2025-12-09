import {
  getThemes,
  getColorSchemeId,
  setColorScheme,
} from "../../../utils/themeManager.js";
import { applyThemeToPreview } from "../../../utils/themePreview.js";
import previewHtml from "./AppearancePreview.html?raw";
import "./appearance.css";

export const appearanceTab = {
  init: (win, app) => {
    const $tab = win.$content.find("#appearance");
    const $schemeSelect = $tab.find(".scheme-select");
    const $previewContainer = $tab.find(".preview-container");
    $previewContainer.html(previewHtml);

    // Inject a style block to map preview variables to os-gui variables
    const styleBlock = `
      <style>
        #appearance-preview-wrapper {
          --ActiveTitle: var(--preview-active-title-bar-bg);
          --GradientActiveTitle: var(--preview-gradient-active-title-bar-bg);
          --TitleText: var(--preview-active-title-bar-text);
          --InactiveTitle: var(--preview-inactive-title-bar-bg);
          --GradientInactiveTitle: var(--preview-gradient-inactive-title-bar-bg);
          --InactiveTitleText: var(--preview-inactive-title-bar-text);
          --Window: var(--preview-window-bg);
          --WindowText: var(--preview-window-text);
          --ButtonFace: var(--preview-button-face);
          --ButtonText: var(--preview-button-text);
          --ButtonHilight: var(--preview-button-highlight);
          --ButtonShadow: var(--preview-button-shadow);
          --ButtonDkShadow: var(--preview-button-dk-shadow);
          --HilightText: var(--preview-hilight-text);

          --font-family-title: var(--preview-font-family-title);
          --font-size-title: var(--preview-font-size-title);
          --font-family-menu: var(--preview-font-family-menu);
          --font-size-menu: var(--preview-font-size-menu);
          --font-family-base: var(--preview-font-family-base);
          --font-size-base: var(--preview-font-size-base);
        }
      </style>
    `;
    $previewContainer.prepend(styleBlock);

    const themes = getThemes();
    const currentSchemeId = getColorSchemeId();

    Object.values(themes).forEach((theme) => {
      const $option = $("<option>").val(theme.id).text(theme.name);
      if (theme.id === currentSchemeId) {
        $option.prop("selected", true);
      }
      $schemeSelect.append($option);
    });

    $schemeSelect.on("change", () => {
      app._enableApplyButton(win);
      // Pass the wrapper element for applying styles
      applyThemeToPreview(
        $schemeSelect.val(),
        $previewContainer.find("#appearance-preview-wrapper")[0],
      );
    });

    // Pass the wrapper element for applying styles on initial load
    applyThemeToPreview(
      $schemeSelect.val(),
      $previewContainer.find("#appearance-preview-wrapper")[0],
    );
  },

  applyChanges: (app) => {
    const $schemeSelect = app.win.$content.find("#appearance .scheme-select");
    const newSchemeId = $schemeSelect.val();
    setColorScheme(newSchemeId);
  },
};
