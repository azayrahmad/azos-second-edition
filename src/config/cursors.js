// src/cursors/cursor.js

// Dangerous Creatures theme
import dcArrow from '../assets/cursor/Dangerous Creatures arrow.cur';
import dcBeam from '../assets/cursor/Dangerous Creatures beam.cur';
import dcBusy from '../assets/cursor/Dangerous Creatures busy.ani';
import dcHelp from '../assets/cursor/Dangerous Creatures help.cur';
import dcMove from '../assets/cursor/Dangerous Creatures move.cur';
import dcNo from '../assets/cursor/Dangerous Creatures no.cur';
import dcCross from '../assets/cursor/Dangerous Creatures cross.cur';
import dcNESW from '../assets/cursor/Dangerous Creatures Size NESW.cur';
import dcNS from '../assets/cursor/Dangerous Creatures Size NS.cur';
import dcNWSE from '../assets/cursor/Dangerous Creatures Size NWSE.cur';
import dcWE from '../assets/cursor/Dangerous Creatures Size WE.cur';

// 60's USA theme
import usaArrow from '../assets/cursor/The 60s USA arrow.cur';
import usaBeam from '../assets/cursor/The 60s USA beam.cur';
import usaBusy from '../assets/cursor/The 60s USA busy.ani';
import usaHelp from '../assets/cursor/The 60s USA help.cur';
import usaMove from '../assets/cursor/The 60s USA move.cur';
import usaNo from '../assets/cursor/The 60s USA no.cur';
import usaCross from '../assets/cursor/The 60s USA cross.cur';
import usaNESW from '../assets/cursor/The 60s USA Size NESW.cur';
import usaNS from '../assets/cursor/The 60s USA Size NS.cur';
import usaNWSE from '../assets/cursor/The 60s USA Size NWSE.cur';
import usaWE from '../assets/cursor/The 60s USA Size WE.cur';

export const cursors = {
    dangerousCreatures: {
        arrow: dcArrow,
        beam: dcBeam,
        busy: dcBusy,
        help: dcHelp,
        move: dcMove,
        no: dcNo,
        cross: dcCross,
        sizeNESW: dcNESW,
        sizeNS: dcNS,
        sizeNWSE: dcNWSE,
        sizeWE: dcWE,
    },
    usa60s: {
        arrow: usaArrow,
        beam: usaBeam,
        busy: usaBusy,
        help: usaHelp,
        move: usaMove,
        no: usaNo,
        cross: usaCross,
        sizeNESW: usaNESW,
        sizeNS: usaNS,
        sizeNWSE: usaNWSE,
        sizeWE: usaWE,
    },
};

export const cursorThemes = {
    'dangerous-creatures': {
        '--cursor-default': { value: `url(${cursors.dangerousCreatures.arrow}), auto` },
        '--cursor-pointer': { value: `url(${cursors.dangerousCreatures.arrow}), pointer` },
        '--cursor-text': { value: `url(${cursors.dangerousCreatures.beam}), text` },
        '--cursor-wait': { value: 'wait', animated: true, type: 'busy' },
        '--cursor-help': { value: `url(${cursors.dangerousCreatures.help}), help` },
        '--cursor-move': { value: `url(${cursors.dangerousCreatures.move}), move` },
        '--cursor-not-allowed': { value: `url(${cursors.dangerousCreatures.no}), not-allowed` },
        '--cursor-crosshair': { value: `url(${cursors.dangerousCreatures.cross}), crosshair` },
        '--cursor-nesw-resize': { value: `url(${cursors.dangerousCreatures.sizeNESW}), nesw-resize` },
        '--cursor-ns-resize': { value: `url(${cursors.dangerousCreatures.sizeNS}), ns-resize` },
        '--cursor-nwse-resize': { value: `url(${cursors.dangerousCreatures.sizeNWSE}), nwse-resize` },
        '--cursor-we-resize': { value: `url(${cursors.dangerousCreatures.sizeWE}), ew-resize` },
    },
    '60s-usa': {
        '--cursor-default': { value: `url(${cursors.usa60s.arrow}), auto` },
        '--cursor-pointer': { value: `url(${cursors.usa60s.arrow}), pointer` },
        '--cursor-text': { value: `url(${cursors.usa60s.beam}), text` },
        '--cursor-wait': { value: 'wait', animated: true, type: 'busy' },
        '--cursor-help': { value: `url(${cursors.usa60s.help}), help` },
        '--cursor-move': { value: `url(${cursors.usa60s.move}), move` },
        '--cursor-not-allowed': { value: `url(${cursors.usa60s.no}), not-allowed` },
        '--cursor-crosshair': { value: `url(${cursors.usa60s.cross}), crosshair` },
        '--cursor-nesw-resize': { value: `url(${cursors.usa60s.sizeNESW}), nesw-resize` },
        '--cursor-ns-resize': { value: `url(${cursors.usa60s.sizeNS}), ns-resize` },
        '--cursor-nwse-resize': { value: `url(${cursors.usa60s.sizeNWSE}), nwse-resize` },
        '--cursor-we-resize': { value: `url(${cursors.usa60s.sizeWE}), ew-resize` },
    },
};
