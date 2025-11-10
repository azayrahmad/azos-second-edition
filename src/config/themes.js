import dangerousCreaturesWallpaper from "../assets/img/wallpapers/Dangerous Creatures wallpaper.jpg";
import the60sUSAWallpaper from "../assets/img/wallpapers/The 60s USA wallpaper.jpg";
import insideYourComputerWallpaper from "../assets/img/wallpapers/Inside your Computer wallpaper.jpg";
import sportsWallpaper from "../assets/img/wallpapers/Sports wallpaper.jpg";
import leonardoDaVinciWallpaper from "../assets/img/wallpapers/Leonardo da Vinci wallpaper.jpg";
import moreWindowsWallpaper from "../assets/img/wallpapers/More Windows wallpaper.jpg";
import mysteryWallpaper from "../assets/img/wallpapers/Mystery wallpaper.jpg";
import natureWallpaper from "../assets/img/wallpapers/Nature wallpaper.jpg";
import scienceWallpaper from "../assets/img/wallpapers/Science wallpaper.jpg";
import theGoldenEraWallpaper from "../assets/img/wallpapers/The Golden Era wallpaper.jpg";
import travelWallpaper from "../assets/img/wallpapers/Travel wallpaper.jpg";
import windows98Wallpaper from "../assets/img/wallpapers/Windows 98 wallpaper.jpg";
import baseballWallpaper from "../assets/img/wallpapers/Baseball wallpaper.jpg";
import jungleWallpaper from "../assets/img/wallpapers/Jungle wallpaper.jpg";
import spaceWallpaper from "../assets/img/wallpapers/Space wallpaper.jpg";
import underwaterWallpaper from "../assets/img/wallpapers/Underwater wallpaper.jpg";

export const themes = {
  default: {
    id: "default",
    name: "Default",
    stylesheet: "windows-default.css",
    wallpaper: null,
    soundScheme: "Default",
    iconScheme: "default",
    cursorScheme: "windows-98",
  },
  "peggys-pastels": {
    id: "peggys-pastels",
    name: "Peggy's Pastels",
    stylesheet: "peggys-pastels.css",
    wallpaper: null,
    soundScheme: "Default",
    iconScheme: "default",
    cursorScheme: "windows-98",
  },
  blue: {
    id: "blue",
    name: "Blue",
    stylesheet: "blue.css",
    wallpaper: null,
    soundScheme: "Default",
    iconScheme: "default",
    cursorScheme: "windows-98",
  },
  "60s-usa": {
    id: "60s-usa",
    name: "60s USA",
    stylesheet: "60s-usa.css",
    wallpaper: the60sUSAWallpaper,
    soundScheme: "60s USA",
    iconScheme: "60s-usa",
    cursorScheme: "60s-usa",
  },
  "dangerous-creatures": {
    id: "dangerous-creatures",
    name: "Dangerous Creatures",
    stylesheet: "dangerous-creatures.css",
    wallpaper: dangerousCreaturesWallpaper,
    soundScheme: "Dangerous Creatures",
    iconScheme: "dangerous-creatures",
    cursorScheme: "dangerous-creatures",
  },
  baseball: {
    id: "baseball",
    name: "Baseball",
    stylesheet: "baseball.css",
    wallpaper: baseballWallpaper,
    soundScheme: "Baseball",
    iconScheme: "default",
    cursorScheme: "baseball",
  },
  jungle: {
    id: "jungle",
    name: "Jungle",
    stylesheet: "jungle.css",
    wallpaper: jungleWallpaper,
    soundScheme: "Jungle",
    iconScheme: "default",
    cursorScheme: "jungle",
  },
  space: {
    id: "space",
    name: "Space",
    stylesheet: "space.css",
    wallpaper: spaceWallpaper,
    soundScheme: "Space",
    iconScheme: "default",
    cursorScheme: "space",
  },
  underwater: {
    id: "underwater",
    name: "Underwater",
    stylesheet: "underwater.css",
    wallpaper: underwaterWallpaper,
    soundScheme: "Underwater",
    iconScheme: "default",
    cursorScheme: "underwater",
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
    iconScheme: "inside-your-computer",
    cursorScheme: "inside-your-computer",
  },
  sports: {
    id: "sports",
    name: "Sports",
    stylesheet: "sports.css",
    wallpaper: sportsWallpaper,
    soundScheme: "Sports",
    iconScheme: "sports",
    cursorScheme: "sports",
  },
  "leonardo-da-vinci": {
    id: "leonardo-da-vinci",
    name: "Leonardo da Vinci",
    stylesheet: "leonardo-da-vinci.css",
    wallpaper: leonardoDaVinciWallpaper,
    soundScheme: "Leonardo da Vinci",
    iconScheme: "leonardo-da-vinci",
    cursorScheme: "leonardo-da-vinci",
  },
  "more-windows": {
    id: "more-windows",
    name: "More Windows",
    stylesheet: "more-windows.css",
    wallpaper: moreWindowsWallpaper,
    soundScheme: "Default", // Or create a new sound scheme if one exists
    iconScheme: "more-windows",
    cursorScheme: "more-windows",
  },
  mystery: {
    id: "mystery",
    name: "Mystery",
    stylesheet: "mystery.css",
    wallpaper: mysteryWallpaper,
    soundScheme: "Mystery",
    iconScheme: "mystery",
    cursorScheme: "mystery",
  },
  nature: {
    id: "nature",
    name: "Nature",
    stylesheet: "nature.css",
    wallpaper: natureWallpaper,
    soundScheme: "Nature",
    iconScheme: "nature",
    cursorScheme: "nature",
  },
  science: {
    id: "science",
    name: "Science",
    stylesheet: "science.css",
    wallpaper: scienceWallpaper,
    soundScheme: "Science",
    iconScheme: "science",
    cursorScheme: "science",
  },
  "the-golden-era": {
    id: "the-golden-era",
    name: "The Golden Era",
    stylesheet: "the-golden-era.css",
    wallpaper: theGoldenEraWallpaper,
    soundScheme: "The Golden Era",
    iconScheme: "the-golden-era",
    cursorScheme: "the-golden-era",
  },
  travel: {
    id: "travel",
    name: "Travel",
    stylesheet: "travel.css",
    wallpaper: travelWallpaper,
    soundScheme: "Travel",
    iconScheme: "travel",
    cursorScheme: "travel",
  },
  "windows-98": {
    id: "windows-98",
    name: "Windows 98",
    stylesheet: "win-98.css",
    wallpaper: windows98Wallpaper,
    soundScheme: "Windows 98",
    iconScheme: "windows-98",
    cursorScheme: "windows-98",
  },
};
