# Application Development Guide

This guide provides instructions on how to add new applications to azOS Second Edition. For a high-level overview of the available applications, see the "Applications" section below.

## Applications

### Games & Entertainment
*For applications that are primarily for fun and leisure.*
| Application | Description | README | Source |
| :--- | :--- | :--- | :--- |
| [Commander Keen](./keen/) | Play the classic game Commander Keen. | missing | |
| [Diablo](./diablo/) | Play the classic game Diablo. | missing | |
| [DOS Game](./dosgame/) | A generic launcher for various DOS games. | missing | |
| [eSheep](./esheep/) | A classic desktop pet. | missing | |
| [Media Player](./media-player/) | Play audio and video files. | missing | |
| [Minesweeper](./minesweeper/) | Play the classic game of Minesweeper. | [link](./minesweeper/README.md) | |
| [Pinball](./pinball/) | A classic "Space Cadet" pinball game. | [link](./pinball/README.md) | |
| [Webamp](./webamp/) | A faithful recreation of the classic Winamp music player. | [link](./webamp/README.md) | |

### System Utilities
*For tools that help manage, configure, or provide information about the OS.*
| Application | Description | README | Source |
| :--- | :--- | :--- | :--- |
| [About](./about/) | A simple utility that displays information about the azOS Second Edition operating system. | [link](./about/README.md) | |
| [Cursor Explorer](./cursorexplorer/) | Explore and preview cursor schemes. | missing | |
| [Desktop Themes](./desktopthemes/) | A utility for managing and previewing desktop visual themes. | [link](./desktopthemes/README.md) | |
| [Display Properties](./displayproperties/) | A tool for customizing wallpaper, screen savers, and display settings. | [link](./displayproperties/README.md) | |
| [Explorer](./explorer/) | A file and folder navigation tool for the virtual file system. | [link](./explorer/README.md) | |
| [Sound Scheme Explorer](./soundschemeexplorer/) | A utility to browse and preview system sound schemes. | [link](./soundschemeexplorer/README.md) | |
| [Task Manager](./taskmanager/) | A utility to view and close running applications. | [link](./taskmanager/README.md) | |
| [Tip of the Day](./tipOfTheDay/) | A helpful utility that displays useful hints and tricks to the user upon startup. | [link](./tipOfTheDay/README.md) | |

### Accessories & Tools
*For general-purpose productivity, creative, or developer tools.*
| Application | Description | README | Source |
| :--- | :--- | :--- | :--- |
| [App Maker](./appmaker/) | A tool to create custom, windowed applications using HTML. | [link](./appmaker/README.md) | |
| [Clippy](./clippy/) | An interactive AI assistant. | [link](./clippy/README.md) | |
| [Image Resizer](./image-resizer/) | A utility to enlarge images using nearest-neighbor scaling. | [link](./image-resizer/README.md) | |
| [Image Viewer](./imageviewer/) | A simple application for viewing and editing image files. | [link](./imageviewer/README.md) | |
| [Internet Explorer](./internet-explorer/) | A web browser with a "Retro Mode" for viewing websites from 1998. | [link](./internet-explorer/README.md) | |
| [Notepad](./notepad/) | A powerful text editor with syntax highlighting, code formatting, and Markdown preview. | [link](./notepad/README.md) | |
| [Paint](./paint/) | A classic drawing and image editing application. | [link](./paint/README.md) | |
| [PDF Viewer](./pdfviewer/) | A simple application for viewing PDF documents. | [link](./pdfviewer/README.md) | |
| [Theme to CSS](./themetocss/) | A developer utility to convert `.theme` INI files into CSS. | [link](./themetocss/README.md) | |

### Community & Support
*For applications related to supporting the project or its developer.*
| Application | Description | README | Source |
| :--- | :--- | :--- | :--- |
| [Buy me a coffee](./buy-me-a-coffee/) | Support the developer. | missing | |

## Adding New Applications

Applications are defined in the `src/config/apps.js` file. Each application is represented by an object in the `apps` array. There are two types of applications you can add: **windowed** and **function-based**.

### Windowed Applications

Windowed applications open in a new window on the desktop. They are defined with an `action.type` of `"window"`.

To add a windowed application, follow these steps:

1.  **Open `src/config/apps.js`:** This file contains the array of application configurations.
2.  **Add a new application object:** Add a new object to the `apps` array with the following properties:
    - `id`: A unique identifier for the application (e.g., `"notepad"`).
    - `title`: The name of the application that will be displayed on the desktop and in the window's title bar (e.g., `"Notepad"`).
    - `icon`: The path to the application's icon. You can use an existing icon or add a new one to the `src/assets/icons` directory.
    - `action`: An object with the following properties:
      - `type`: Set to `"window"`.
      - `window`: An object that defines the window's properties:
        - `width`: The initial width of the window.
        - `height`: The initial height of the window.
        - `resizable`: A boolean indicating whether the window can be resized.
        - `menuBar`: (Optional) An object defining the window's menu bar.
        - `content`: The HTML content to be displayed within the window.

**Example: A Simple "About" Application**

```javascript
{
  id: "about",
  title: "About",
  icon: new URL('../assets/icons/COMCTL32_20481.ico', import.meta.url).href,
  action: {
    type: "window",
    window: {
      width: 400,
      height: 300,
      resizable: true,
      menuBar: {
        File: [
          {
            label: "&Close",
            action: (win) => win.close(),
            shortcutLabel: "Alt+F4",
          },
        ],
        Help: [
          {
            label: "&About",
            action: () => alert("About this app"),
          },
        ],
      },
      content: `
        <div class="about-content" style="padding: 16px;">
          <h1>About azOS</h1>
          <p>azOS Second Edition is a web-based operating system interface.</p>
        </div>
      `,
    },
  },
}
```

### Non-Windowed (Function-Based) Applications

Function-based applications execute a JavaScript function when launched. These are useful for actions that don't require a window, such as showing a confirmation dialog or performing a system action.

To add a function-based application, follow these steps:

1.  **Open `src/config/apps.js`:** This file contains the array of application configurations.
2.  **Add a new application object:** Add a new object to the `apps` array with the following properties:
    - `id`: A unique identifier for the application (e.g., `"shutdown"`).
    - `title`: The name of the application that will be displayed on the desktop.
    - `icon`: The path to the application's icon.
    - `action`: An object with the following properties:
      - `type`: Set to `"function"`.
      - `handler`: The function to be executed when the application is launched.

**Example: A "Shut Down" Application**

```javascript
{
  id: "shutdown",
  title: "Shut Down",
  icon: "./src/assets/icons/shutdown.ico",
  action: {
    type: "function",
    handler: () => {
      if (confirm("Are you sure you want to shut down the system?")) {
        document.body.innerHTML =
          '<div style="text-align: center; padding-top: 40vh;">It is now safe to turn off your computer.</div>';
      }
    },
  },
}
```

After adding your application to `src/config/apps.js`, it will automatically appear on the desktop the next time you load the application.

### Adding Context Menus to Desktop Icons

You can customize the right-click context menu for each application icon. Add a `contextMenu` property to your application configuration to define custom menu items.

Each menu item can be either a regular item with a label and action, a submenu, or a separator (using the string "MENU_DIVIDER").

**Example: Adding a Custom Context Menu**

```javascript
{
  id: "myapp",
  title: "My App",
  icon: new URL('../assets/icons/myapp.ico', import.meta.url).href,
  action: {
    type: "window",
    // ... window configuration
  },
  contextMenu: [
    {
      label: "&Open",
      action: "open" // Special action that launches the app
    },
    "MENU_DIVIDER",
    {
      label: "Cu&t",
      enabled: false // Disabled menu item
    },
    {
      label: "&Properties",
      action: "properties" // Special action that shows properties
    },
    {
      label: "Custom Action",
      action: () => alert("Custom action clicked!") // Custom function
    }
  ]
}
```

Menu Item Properties:

- `label`: The text to display (use & before a character to create a keyboard shortcut)
- `action`: Can be one of:
  - `"open"`: Opens/launches the application
  - `"properties"`: Shows the properties dialog
  - A custom function to execute when clicked
- `enabled`: (Optional) Boolean to enable/disable the item
- `submenu`: (Optional) Array of nested menu items for dropdowns

If no `contextMenu` is specified, the icon will have a default context menu with just an "Open" option.
