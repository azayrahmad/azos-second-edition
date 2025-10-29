import dangerousCreaturesWallpaper from "../assets/img/wallpapers/Dangerous Creatures wallpaper.jpg";
import the60sUSAWallpaper from "../assets/img/wallpapers/The 60s USA wallpaper.jpg";
import insideYourComputerWallpaper from "../assets/img/wallpapers/Inside your Computer wallpaper.jpg";

export const themes = {
  default: {
    id: "default",
    name: "Default",
    stylesheet: "windows-default.css",
    wallpaper: null,
    soundScheme: "Default",
  },
  "peggys-pastels": {
    id: "peggys-pastels",
    name: "Peggy's Pastels",
    stylesheet: "peggys-pastels.css",
    wallpaper: null,
    soundScheme: "Default",
  },
  blue: {
    id: "blue",
    name: "Blue",
    stylesheet: "blue.css",
    wallpaper: null,
    soundScheme: "Default",
  },
  "60s-usa": {
    id: "60s-usa",
    name: "60s USA",
    stylesheet: "60s-usa.css",
    wallpaper: the60sUSAWallpaper,
    soundScheme: "60s USA",
  },
  "dangerous-creatures": {
    id: "dangerous-creatures",
    name: "Dangerous Creatures",
    stylesheet: "dangerous-creatures.css",
    wallpaper: dangerousCreaturesWallpaper,
    soundScheme: "Dangerous Creatures",
  },
  //'memphis-milano': {
  //  id: 'memphis-milano',
  //  name: 'Memphis Milano',
  //  stylesheet: 'memphis-milano.css',
  //  wallpaper: null,
  //  soundScheme: 'Default',
  //},
  "inside-your-computer": {
    id: "inside-your-computer",
    name: "Inside Your Computer",
    stylesheet: "inside-your-computer.css",
    wallpaper: insideYourComputerWallpaper,
    soundScheme: "Inside Your Computer",
  },
  sports: {
    id: "sports",
    name: "Sports",
    stylesheet: "sports.css",
    // wallpaper: null,
    //soundScheme: 'Sports',
  },
};
