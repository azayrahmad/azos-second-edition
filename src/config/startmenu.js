import { apps } from './apps.js';
import { launchApp } from '../utils/appManager.js';
import { ShowComingSoonDialog } from '../components/DialogWindow.js';
import { ICONS } from './icons.js';

const startMenuAppIds = [
  "about",
  "resume",
  "tipOfTheDay",
  "notepad",
  "image-resizer",
  "clippy",
  "webamp",
  "image-viewer",
  "themetocss",
  "themeinstaller"
];

const programApps = apps
  .filter(app => startMenuAppIds.includes(app.id))
  .map(app => ({
    label: app.title,
    icon: app.icon[16],
    action: () => launchApp(app.id),
  }));

const startMenuConfig = [
  {
    label: 'Programs',
    icon: ICONS.programs[16],
    submenu: programApps,
  },
  {
    label: 'Favorites',
    icon: ICONS.favorites[16],
    submenu: [
      {
        label: '(Empty)',
        disabled: true,
      },
    ],
  },
  {
    label: 'Documents',
    icon: ICONS.documents[16],
    submenu: [
      {
        label: '(Empty)',
        disabled: true,
      },
    ],
  },
  {
    label: 'Settings',
    icon: ICONS.settings[16],
    submenu: [
      {
        label: '(Empty)',
        disabled: true,
      },
    ],
  },
  {
    label: 'Find',
    icon: ICONS.find[16],
    submenu: [
      {
        label: '(Empty)',
        disabled: true,
      },
    ],
  },
  {
    label: 'Help',
    icon: ICONS.help[16],
    action: () => ShowComingSoonDialog('Help'),
  },
  {
    label: 'Run',
    icon: ICONS.run[16],
    action: () => ShowComingSoonDialog('Run'),
  },
];

export default startMenuConfig;
