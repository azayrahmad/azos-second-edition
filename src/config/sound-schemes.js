// Default sounds
import chimes from "../assets/audio/CHIMES.WAV";
import chord from "../assets/audio/CHORD.WAV";
import ding from "../assets/audio/DING.WAV";
import logoff from "../assets/audio/LOGOFF.WAV";
import notify from "../assets/audio/NOTIFY.WAV";
import recycle from "../assets/audio/RECYCLE.WAV";
import start from "../assets/audio/START.WAV";
import tada from "../assets/audio/TADA.WAV";
import theMicrosoftSound from "../assets/audio/The Microsoft Sound.wav";

// 60's USA sounds
import the60sUsaAsterisk from "../assets/audio/the 60's usa asterisk.wav";
import the60sUsaBeep from "../assets/audio/the 60's usa beep.wav";
import the60sUsaCriticalStop from "../assets/audio/the 60's usa critical stop.wav";
import the60sUsaEmptyRecycleBin from "../assets/audio/the 60's usa empty recycle bin.wav";
import the60sUsaExclamation from "../assets/audio/the 60's usa exclamation.wav";
import the60sUsaExitWindows from "../assets/audio/the 60's usa exit windows.wav";
import the60sUsaMaximize from "../assets/audio/the 60's usa maximize.wav";
import the60sUsaMenuCommand from "../assets/audio/the 60's usa menu command.wav";
import the60sUsaMenuPopup from "../assets/audio/the 60's usa menu popup.wav";
import the60sUsaMinimize from "../assets/audio/the 60's usa minimize.wav";
import the60sUsaProgramError from "../assets/audio/the 60's usa program error.wav";
import the60sUsaQuestion from "../assets/audio/the 60's usa question.wav";
import the60sUsaRestoreDown from "../assets/audio/the 60's usa restore down.wav";
import the60sUsaRestoreUp from "../assets/audio/the 60's usa restore up.wav";
import the60sUsaStartup from "../assets/audio/the 60's usa startup.wav";

// Dangerous Creatures sounds
import dangerousCreaturesAsterisk from "../assets/audio/Dangerous Creatures asterisk.wav";
import dangerousCreaturesBeep from "../assets/audio/Dangerous Creatures beep.wav";
import dangerousCreaturesCriticalStop from "../assets/audio/Dangerous Creatures critical stop.wav";
import dangerousCreaturesDefaultSound from "../assets/audio/Dangerous Creatures default sound.wav";
import dangerousCreaturesEmptyRecycleBin from "../assets/audio/Dangerous Creatures empty recycle bin.wav";
import dangerousCreaturesExclamation from "../assets/audio/Dangerous Creatures exclamation.wav";
import dangerousCreaturesMaximize from "../assets/audio/Dangerous Creatures maximize.wav";
import dangerousCreaturesMenuCommand from "../assets/audio/Dangerous Creatures menu command.wav";
import dangerousCreaturesMenuPopup from "../assets/audio/Dangerous Creatures menu popup.wav";
import dangerousCreaturesMinimize from "../assets/audio/Dangerous Creatures minimize.wav";
import dangerousCreaturesProgramError from "../assets/audio/Dangerous Creatures program error.wav";
import dangerousCreaturesQuestion from "../assets/audio/Dangerous Creatures question.wav";
import dangerousCreaturesStartup from "../assets/audio/Dangerous Creatures startup.wav";

// Inside your Computer sounds
import insideYourComputerAsterisk from "../assets/audio/Inside your Computer asterisk.wav";
import insideYourComputerBeep from "../assets/audio/Inside your Computer beep.wav";
import insideYourComputerCriticalStop from "../assets/audio/Inside your Computer critical stop.wav";
import insideYourComputerDefaultSound from "../assets/audio/Inside your Computer default sound.wav";
import insideYourComputerEmptyRecycleBin from "../assets/audio/Inside your Computer empty recycle bin.wav";
import insideYourComputerExclamation from "../assets/audio/Inside your Computer exclamation.wav";
import insideYourComputerExitWindows from "../assets/audio/Inside your Computer exit windows.wav";
import insideYourComputerMaximize from "../assets/audio/Inside your Computer maximize.wav";
import insideYourComputerMenuCommand from "../assets/audio/Inside your Computer menu command.wav";
import insideYourComputerMenuPopup from "../assets/audio/Inside your Computer menu popup.wav";
import insideYourComputerMinimize from "../assets/audio/Inside your Computer minimize.wav";
import insideYourComputerProgramError from "../assets/audio/Inside your Computer program error.wav";
import insideYourComputerQuestion from "../assets/audio/Inside your Computer question.wav";
import insideYourComputerRestoreDown from "../assets/audio/Inside your Computer restore down.wav";
import insideYourComputerRestoreUp from "../assets/audio/Inside your Computer restore up.wav";
import insideYourComputerStartup from "../assets/audio/Inside your Computer startup.wav";

import sportsAsterisk from "../assets/audio/Sports asterisk.wav";
import sportsBeep from "../assets/audio/Sports beep.wav";
import sportsCriticalStop from "../assets/audio/Sports critical stop.wav";
import sportsDefaultSound from "../assets/audio/Sports default sound.wav";
import sportsEmptyRecycleBin from "../assets/audio/Sports empty recycle bin.wav";
import sportsExclamation from "../assets/audio/Sports exclamation.wav";
import sportsExitWindows from "../assets/audio/Sports exit windows.wav";
import sportsMaximize from "../assets/audio/Sports maximize.wav";
import sportsMenuCommand from "../assets/audio/Sports menu command.wav";
import sportsMenuPopup from "../assets/audio/Sports menu popup.wav";
import sportsMinimize from "../assets/audio/Sports minimize.wav";
import sportsProgramError from "../assets/audio/Sports program error.wav";
import sportsQuestion from "../assets/audio/Sports question.wav";
import sportsStartup from "../assets/audio/Sports startup.wav";

export const soundSchemes = {
  Default: {
    Default: ding,
    AppGPFault: "",
    Maximize: "",
    MenuCommand: "",
    MenuPopup: "",
    Minimize: "",
    RestoreDown: "",
    RestoreUp: "",
    SystemAsterisk: chord,
    SystemExclamation: chord,
    SystemExit: tada,
    SystemHand: chord,
    SystemQuestion: chord,
    WindowsLogon: theMicrosoftSound,
    EmptyRecycleBin: ding,
    ChangeTheme: "",
    DeviceConnect: "",
    DeviceDisconnect: "",
    DeviceFail: "",
    LowBatteryAlarm: ding,
    MailBeep: chimes,
    SystemNotification: "",
    WindowsLogoff: "",
    StartNavigation: start,
  },
  "60s USA": {
    Default: the60sUsaBeep,
    AppGPFault: the60sUsaProgramError,
    Maximize: the60sUsaMaximize,
    MenuCommand: the60sUsaMenuCommand,
    MenuPopup: the60sUsaMenuPopup,
    Minimize: the60sUsaMinimize,
    RestoreDown: the60sUsaRestoreDown,
    RestoreUp: the60sUsaRestoreUp,
    SystemAsterisk: the60sUsaAsterisk,
    SystemExclamation: the60sUsaExclamation,
    SystemExit: the60sUsaExitWindows,
    SystemHand: the60sUsaCriticalStop,
    SystemQuestion: the60sUsaQuestion,
    WindowsLogon: the60sUsaStartup,
    EmptyRecycleBin: the60sUsaEmptyRecycleBin,
    ChangeTheme: "",
    DeviceConnect: "",
    DeviceDisconnect: "",
    DeviceFail: "",
    LowBatteryAlarm: "",
    MailBeep: "",
    SystemNotification: "",
    WindowsLogoff: "",
  },
  "Dangerous Creatures": {
    Default: dangerousCreaturesDefaultSound,
    AppGPFault: dangerousCreaturesProgramError,
    Maximize: dangerousCreaturesMaximize,
    MenuCommand: dangerousCreaturesMenuCommand,
    MenuPopup: dangerousCreaturesMenuPopup,
    Minimize: dangerousCreaturesMinimize,
    Open: "",
    Close: "",
    RestoreDown: dangerousCreaturesMinimize,
    RestoreUp: dangerousCreaturesMaximize,
    RingIn: "",
    Ringout: "",
    SystemAsterisk: dangerousCreaturesAsterisk,
    SystemDefault: dangerousCreaturesBeep,
    SystemExclamation: dangerousCreaturesExclamation,
    SystemExit: dangerousCreaturesStartup,
    SystemHand: dangerousCreaturesCriticalStop,
    SystemQuestion: dangerousCreaturesQuestion,
    WindowsLogon: dangerousCreaturesStartup,
    EmptyRecycleBin: dangerousCreaturesEmptyRecycleBin,
    ChangeTheme: "",
    DeviceConnect: "",
    DeviceDisconnect: "",
    DeviceFail: "",
    LowBatteryAlarm: "",
    MailBeep: "",
    SystemNotification: "",
    WindowsLogoff: "",
    StartNavigation: "",
  },
  "Inside Your Computer": {
    Default: insideYourComputerDefaultSound,
    AppGPFault: insideYourComputerProgramError,
    Maximize: insideYourComputerMaximize,
    MenuCommand: insideYourComputerMenuCommand,
    MenuPopup: insideYourComputerMenuPopup,
    Minimize: insideYourComputerMinimize,
    RestoreDown: insideYourComputerRestoreDown,
    RestoreUp: insideYourComputerRestoreUp,
    SystemAsterisk: insideYourComputerAsterisk,
    SystemExclamation: insideYourComputerExclamation,
    SystemExit: insideYourComputerStartup,
    SystemHand: insideYourComputerCriticalStop,
    SystemQuestion: insideYourComputerQuestion,
    WindowsLogon: insideYourComputerStartup,
    EmptyRecycleBin: insideYourComputerEmptyRecycleBin,
  },
  Sports: {
    Default: sportsDefaultSound,
    AppGPFault: sportsProgramError,
    Maximize: sportsMaximize,
    MenuCommand: sportsMenuCommand,
    MenuPopup: sportsMenuPopup,
    Minimize: sportsMinimize,
    RestoreDown: sportsMinimize,
    RestoreUp: sportsMaximize,
    SystemAsterisk: sportsAsterisk,
    SystemExclamation: sportsExclamation,
    SystemExit: sportsStartup,
    SystemHand: sportsCriticalStop,
    SystemQuestion: sportsQuestion,
    WindowsLogon: sportsStartup,
    EmptyRecycleBin: sportsEmptyRecycleBin,
  },
};
