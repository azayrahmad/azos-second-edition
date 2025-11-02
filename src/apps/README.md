# Application Development Guide

This guide provides instructions on how to add new applications to azOS Second Edition. For a high-level overview of the available applications, see the "Applications" section below.

## Applications

- **[About](./about/README.md)**: A simple utility that displays information about the azOS Second Edition operating system.
- **[Clippy](./clippy/README.md)**: An interactive AI assistant that can answer questions about Aziz Rahmad's resume and professional background.
- **[Notepad](./notepad/README.md)**: A powerful text editor with syntax highlighting, code formatting, and Markdown preview.
- **[PDF Viewer](./pdfviewer/README.md)**: A simple application for viewing PDF documents.
- **[Theme to CSS](./themetocss/README.md)**: A developer utility to convert `.theme` INI files into CSS.
- **[Tip of the Day](./tipOfTheDay/README.md)**: A helpful utility that displays useful hints and tricks to the user upon startup.
- **[Webamp](./webamp/README.md)**: A faithful recreation of the classic Winamp music player that runs directly on the desktop.

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
