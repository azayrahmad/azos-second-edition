import { getItem, setItem } from "./localStorage.js";

const RESOLUTION_KEY = "desktopResolution";

const RESOLUTIONS = {
  "640x480": { width: 640, height: 480 },
  "800x600": { width: 800, height: 600 },
  "1024x768": { width: 1024, height: 768 },
  fit: { width: "100%", height: "100%" },
};

export function getAvailableResolutions() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const resolutionItems = [
    { label: "640x480", value: "640x480" },
    { label: "800x600", value: "800x600" },
    { label: "1024x768", value: "1024x768" },
    { label: "Fit Screen", value: "fit" },
  ];

  return resolutionItems.map((item) => {
    if (item.value === "fit") {
      return { ...item, disabled: false };
    }
    const resolution = RESOLUTIONS[item.value];
    const disabled =
      resolution.width > viewportWidth || resolution.height > viewportHeight;
    return { ...item, disabled };
  });
}

export function getCurrentResolution() {
  return getItem(RESOLUTION_KEY) || "fit";
}

export function setResolution(resolutionId) {
  setItem(RESOLUTION_KEY, resolutionId);
  applyResolution();
}

export function applyResolution() {
  const resolutionId = getCurrentResolution();
  const resolution = RESOLUTIONS[resolutionId];
  const body = document.body;
  const screenWrapper = document.getElementById("screen-wrapper");

  if (!screenWrapper) {
    console.error("Screen wrapper element not found!");
    return;
  }

  // Always reset styles first
  body.style.display = "";
  body.style.alignItems = "";
  body.style.justifyContent = "";
  body.style.backgroundColor = "";
  screenWrapper.style.width = "";
  screenWrapper.style.height = "";
  screenWrapper.style.border = "";
  screenWrapper.style.boxShadow = "";
  screenWrapper.style.overflow = "";
  screenWrapper.style.flexDirection = "";


  if (resolutionId !== "fit") {
    body.style.display = "flex";
    body.style.alignItems = "center";
    body.style.justifyContent = "center";
    body.style.backgroundColor = "var(--Background)";

    screenWrapper.style.width = `${resolution.width}px`;
    screenWrapper.style.height = `${resolution.height}px`;
    screenWrapper.style.border = "1px solid var(--border-black, black)";
    screenWrapper.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    screenWrapper.style.overflow = "hidden";
  } else {
    screenWrapper.style.width = "100%";
    screenWrapper.style.height = "100%";
  }

  document.dispatchEvent(new CustomEvent("resolution-changed"));
}
