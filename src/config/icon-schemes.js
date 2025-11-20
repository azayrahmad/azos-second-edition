import { ICONS } from "./icons.js";

// A helper function to create the icon object, pointing to both 16 and 32 sizes
const createIcon = (path) => {
  const name = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf("."));
  const dir = path.substring(0, path.lastIndexOf("/") + 1);
  return {
    16: new URL(`${dir}${name}-16.png`, import.meta.url).href,
    32: new URL(`${dir}${name}-32.png`, import.meta.url).href,
  };
};

export const iconSchemes = {
  default: {
    myComputer: ICONS.computer,
    recycleBinFull: ICONS.recycleBinFull,
    recycleBinEmpty: ICONS.recycleBinEmpty,
    networkNeighborhood: ICONS.networkNeighborhood,
  },
  "dangerous-creatures": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Dangerous Creatures My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Dangerous Creatures Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Dangerous Creatures Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Dangerous Creatures Network Neighborhood.ico",
    ),
  },
  "inside-your-computer": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Inside your Computer My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Inside your Computer Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Inside your Computer Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Inside your Computer Network Neighborhood.ico",
    ),
  },
  "leonardo-da-vinci": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Leonardo da Vinci My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Leonardo da Vinci Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Leonardo da Vinci Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Leonardo da Vinci Network Neighborhood.ico",
    ),
  },
  "more-windows": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/More Windows My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/More Windows Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/More Windows Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/More Windows Network Neighborhood.ico",
    ),
  },
  mystery: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Mystery My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Mystery Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Mystery Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Mystery Network Neighborhood.ico",
    ),
  },
  nature: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Nature My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Nature Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Nature Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Nature Network Neighborhood.ico",
    ),
  },
  science: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Science My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Science Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Science Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Science Network Neighborhood.ico",
    ),
  },
  sports: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Sports My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Sports Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Sports Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Sports Network Neighborhood.ico",
    ),
  },
  "60s-usa": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/The 60's USA My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/The 60's USA Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/The 60's USA Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/The 60's USA Network Neighborhood.ico",
    ),
  },
  "the-golden-era": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/The Golden Era My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/The Golden Era Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/The Golden Era Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/The Golden Era Network Neighborhood.ico",
    ),
  },
  travel: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Travel My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Travel Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Travel Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Travel Network Neighborhood.ico",
    ),
  },
  "windows-98": {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Windows 98 My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Windows 98 Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Windows 98 Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Windows 98 Network Neighborhood.ico",
    ),
  },
  baseball: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Baseball My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Baseball Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Baseball Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Baseball Network Neighborhood.ico",
    ),
  },
  jungle: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Jungle My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Jungle Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Jungle Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Jungle Network Neighborhood.ico",
    ),
  },
  space: {
    myComputer: createIcon("../assets/icons/theme-icons/Space My Computer.ico"),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Space Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Space Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Space Network Neighborhood.ico",
    ),
  },
  underwater: {
    myComputer: createIcon(
      "../assets/icons/theme-icons/Underwater My Computer.ico",
    ),
    recycleBinEmpty: createIcon(
      "../assets/icons/theme-icons/Underwater Recycle Empty.ico",
    ),
    recycleBinFull: createIcon(
      "../assets/icons/theme-icons/Underwater Recycle Full.ico",
    ),
    networkNeighborhood: createIcon(
      "../assets/icons/theme-icons/Underwater Network Neighborhood.ico",
    ),
  },
};
