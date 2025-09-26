# azOS, Second Edition

This project is a web-based operating system interface designed to emulate a classic desktop environment. This README provides instructions on how to add new applications to the system.

## Adding Applications

Applications are defined in the `src/config/apps.js` file. Each application is represented by an object in the `apps` array. There are two types of applications you can add: **windowed** and **function-based**.

### Windowed Applications

Windowed applications open in a new window on the desktop. They are defined with an `action.type` of `"window"`.

To add a windowed application, follow these steps:

1.  **Open `src/config/apps.js`:** This file contains the array of application configurations.
2.  **Add a new application object:** Add a new object to the `apps` array with the following properties:
    *   `id`: A unique identifier for the application (e.g., `"notepad"`).
    *   `title`: The name of the application that will be displayed on the desktop and in the window's title bar (e.g., `"Notepad"`).
    *   `icon`: The path to the application's icon. You can use an existing icon or add a new one to the `src/assets/icons` directory.
    *   `action`: An object with the following properties:
        *   `type`: Set to `"window"`.
        *   `window`: An object that defines the window's properties:
            *   `width`: The initial width of the window.
            *   `height`: The initial height of the window.
            *   `resizable`: A boolean indicating whether the window can be resized.
            *   `menuBar`: (Optional) An object defining the window's menu bar.
            *   `content`: The HTML content to be displayed within the window.

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
    *   `id`: A unique identifier for the application (e.g., `"shutdown"`).
    *   `title`: The name of the application that will be displayed on the desktop.
    *   `icon`: The path to the application's icon.
    *   `action`: An object with the following properties:
        *   `type`: Set to `"function"`.
        *   `handler`: The function to be executed when the application is launched.

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