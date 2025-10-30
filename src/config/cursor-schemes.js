// src/config/cursor-schemes.js
// Default theme
import defaultBusy from "../assets/cursor/HOURGLASS.ani";
import defaultWait from "../assets/cursor/APPSTARTS.ani";

// Dangerous Creatures theme
import dcArrow from "../assets/cursor/Dangerous Creatures arrow.cur";
import dcBeam from "../assets/cursor/Dangerous Creatures beam.cur";
import dcBusy from "../assets/cursor/Dangerous Creatures busy.ani";
import dcWait from "../assets/cursor/Dangerous Creatures wait.ani";
import dcHelp from "../assets/cursor/Dangerous Creatures help.cur";
import dcMove from "../assets/cursor/Dangerous Creatures move.cur";
import dcNo from "../assets/cursor/Dangerous Creatures no.cur";
import dcCross from "../assets/cursor/Dangerous Creatures cross.cur";
import dcNESW from "../assets/cursor/Dangerous Creatures Size NESW.cur";
import dcNS from "../assets/cursor/Dangerous Creatures Size NS.cur";
import dcNWSE from "../assets/cursor/Dangerous Creatures Size NWSE.cur";
import dcWE from "../assets/cursor/Dangerous Creatures Size WE.cur";

// 60's USA theme
import usaArrow from "../assets/cursor/The 60s USA arrow.cur";
import usaBeam from "../assets/cursor/The 60s USA beam.cur";
import usaBusy from "../assets/cursor/The 60s USA busy.ani";
import usaWait from "../assets/cursor/The 60s USA wait.ani";
import usaHelp from "../assets/cursor/The 60s USA help.cur";
import usaMove from "../assets/cursor/The 60s USA move.cur";
import usaNo from "../assets/cursor/The 60s USA no.cur";
import usaCross from "../assets/cursor/The 60s USA cross.cur";
import usaNESW from "../assets/cursor/The 60s USA Size NESW.cur";
import usaNS from "../assets/cursor/The 60s USA Size NS.cur";
import usaNWSE from "../assets/cursor/The 60s USA Size NWSE.cur";
import usaWE from "../assets/cursor/The 60s USA Size WE.cur";

// Inside your Computer theme
import computerArrow from "../assets/cursor/Inside your Computer arrow.cur";
import computerBeam from "../assets/cursor/Inside your Computer beam.cur";
import computerBusy from "../assets/cursor/Inside your Computer busy.ani";
import computerWait from "../assets/cursor/Inside your Computer wait.ani";
import computerHelp from "../assets/cursor/Inside your Computer help.cur";
import computerMove from "../assets/cursor/Inside your Computer move.cur";
import computerNo from "../assets/cursor/Inside your Computer no.cur";
import computerCross from "../assets/cursor/Inside your Computer cross.cur";
import computerNESW from "../assets/cursor/Inside your Computer Size NESW.cur";
import computerNS from "../assets/cursor/Inside your Computer Size NS.cur";
import computerNWSE from "../assets/cursor/Inside your Computer Size NWSE.cur";
import computerWE from "../assets/cursor/Inside your Computer Size WE.cur";

// Sports theme
import sportsArrow from "../assets/cursor/Sports arrow.cur";
import sportsBeam from "../assets/cursor/Sports beam.cur";
import sportsBusy from "../assets/cursor/Sports busy.ani";
import sportsWait from "../assets/cursor/Sports wait.ani";
import sportsHelp from "../assets/cursor/Sports help.cur";
import sportsMove from "../assets/cursor/Sports move.cur";
import sportsNo from "../assets/cursor/Sports no.cur";
import sportsCross from "../assets/cursor/Sports cross.cur";
import sportsNESW from "../assets/cursor/Sports Size NESW.cur";
import sportsNS from "../assets/cursor/Sports Size NS.cur";
import sportsNWSE from "../assets/cursor/Sports Size NWSE.cur";
import sportsWE from "../assets/cursor/Sports Size WE.cur";

export const cursorSchemes = {
  Default: {
    busy: defaultBusy,
    wait: defaultWait,
  },
  "Dangerous Creatures": {
    arrow: dcArrow,
    beam: dcBeam,
    busy: dcBusy,
    wait: dcWait,
    help: dcHelp,
    move: dcMove,
    no: dcNo,
    cross: dcCross,
    sizeNESW: dcNESW,
    sizeNS: dcNS,
    sizeNWSE: dcNWSE,
    sizeWE: dcWE,
  },
  "60s USA": {
    arrow: usaArrow,
    beam: usaBeam,
    busy: usaBusy,
    wait: usaWait,
    help: usaHelp,
    move: usaMove,
    no: usaNo,
    cross: usaCross,
    sizeNESW: usaNESW,
    sizeNS: usaNS,
    sizeNWSE: usaNWSE,
    sizeWE: usaWE,
  },
  "Inside Your Computer": {
    arrow: computerArrow,
    beam: computerBeam,
    busy: computerBusy,
    wait: computerWait,
    help: computerHelp,
    move: computerMove,
    no: computerNo,
    cross: computerCross,
    sizeNESW: computerNESW,
    sizeNS: computerNS,
    sizeNWSE: computerNWSE,
    sizeWE: computerWE,
  },
  Sports: {
    arrow: sportsArrow,
    beam: sportsBeam,
    busy: sportsBusy,
    wait: sportsWait,
    help: sportsHelp,
    move: sportsMove,
    no: sportsNo,
    cross: sportsCross,
    sizeNESW: sportsNESW,
    sizeNS: sportsNS,
    sizeNWSE: sportsNWSE,
    sizeWE: sportsWE,
  },
};
