import { getThemes, getColorSchemes } from "./themeManager.js";

const themeCssCache = {};

export async function fetchThemeCss(stylesheet) {
  if (!stylesheet) return null;
  const url = `./${stylesheet}`;
  if (themeCssCache[url]) return themeCssCache[url];
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch CSS: ${response.statusText}`);
    const cssText = await response.text();
    themeCssCache[url] = cssText;
    return cssText;
  } catch (error) {
    console.error("Error fetching theme CSS:", error);
    return null;
  }
}

export function parseCssVariables(cssText) {
  const variables = {};
  const rootBlockMatch = cssText.match(/:root\s*{([^}]+)}/);
  if (rootBlockMatch) {
    const variablesText = rootBlockMatch[1];
    const regex = /--([\w-]+):\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(variablesText)) !== null) {
      variables[match[1]] = match[2].trim();
    }
  }
  return variables;
}

function applyCssVariables(container, variables) {
  const styleProperties = {
    "--preview-active-title-bar-bg":
      variables["ActiveTitle"] || "rgb(0, 0, 128)",
    "--preview-gradient-active-title-bar-bg":
      variables["GradientActiveTitle"] || "rgb(16, 132, 208)",
    "--preview-active-title-bar-text":
      variables["TitleText"] || "rgb(255, 255, 255)",
    "--preview-inactive-title-bar-bg":
      variables["InactiveTitle"] || "rgb(128, 128, 128)",
    "--preview-gradient-inactive-title-bar-bg":
      variables["GradientInactiveTitle"] || "rgb(181, 181, 181)",
    "--preview-inactive-title-bar-text":
      variables["InactiveTitleText"] || "rgb(192, 192, 192)",
    "--preview-window-bg": variables["Window"] || "rgb(255, 255, 255)",
    "--preview-window-text": variables["WindowText"] || "rgb(0, 0, 0)",
    "--preview-button-face": variables["ButtonFace"] || "rgb(192, 192, 192)",
    "--preview-button-text": variables["ButtonText"] || "rgb(0, 0, 0)",
    "--preview-button-highlight":
      variables["ButtonHilight"] || "rgb(255, 255, 255)",
    "--preview-button-shadow":
      variables["ButtonShadow"] || "rgb(128, 128, 128)",
    "--preview-button-dk-shadow": variables["ButtonDkShadow"] || "rgb(0, 0, 0)",
    "--preview-hilight-text": variables["HilightText"] || "rgb(0, 0, 0)",

    // Font properties
    "--preview-font-family-title":
      variables["font-family-title"] ||
      variables["font-family-base"] ||
      '"MSW98UI", sans-serif',
    "--preview-font-size-title":
      variables["font-size-title"] || variables["font-size-base"] || "11px",
    "--preview-font-family-menu":
      variables["font-family-menu"] ||
      variables["font-family-base"] ||
      '"MSW98UI", sans-serif',
    "--preview-font-size-menu":
      variables["font-size-menu"] || variables["font-size-base"] || "11px",
    "--preview-font-family-base":
      variables["font-family-base"] || '"MSW98UI", sans-serif',
    "--preview-font-size-base": variables["font-size-base"] || "11px",
  };
  for (const [property, value] of Object.entries(styleProperties)) {
    container.style.setProperty(property, value);
  }
}

export async function applyThemeToPreview(schemeId, previewContainer) {
  const schemes = getColorSchemes();
  const themes = getThemes();
  const scheme = schemes[schemeId];
  const theme = themes[schemeId]; // For custom themes

  let variables = {};
  if (scheme) {
    const cssText = await fetchThemeCss(scheme.url);
    if (cssText) {
      variables = parseCssVariables(cssText);
    }
  } else if (theme?.isCustom && theme.colors) {
    for (const [key, value] of Object.entries(theme.colors)) {
      variables[key.replace(/^--/, "")] = value;
    }
  }

  applyCssVariables(previewContainer, variables);
  return variables;
}

export function applyPropertiesToPreview(properties, previewContainer) {
  applyCssVariables(previewContainer, properties);
}
