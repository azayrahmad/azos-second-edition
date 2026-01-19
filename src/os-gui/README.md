# OS-GUI Library

This is a simple UI library for creating Windows 98-style user interfaces.

## Usage

1.  **Include the CSS and JavaScript files in your HTML:**

    ```html
    <link rel="stylesheet" href="packages/os-gui/dist/os-gui.css" />
    <script src="path/to/jquery.js"></script>
    <script src="packages/os-gui/src/utils.js"></script>
    <script src="packages/os-gui/src/MenuBar.js"></script>
    <script src="packages/os-gui/src/MenuPopup.js"></script>
    <script src="packages/os-gui/src/ContextMenu.js"></script>
    <script src="packages/os-gui/src/$Window.js"></script>
    <script src="packages/os-gui/src/Toolbar.js"></script>
    <script src="packages/os-gui/src/AddressBar.js"></script>
    ```

2.  **Create a new window:**

    ```javascript
    const myWindow = new $Window({
      title: 'My Window',
      width: 400,
      height: 300,
    });
    ```

## Configuration

The library can be configured by passing a configuration object to the constructor of the components. For example, to provide a `playSound` function to the `$Window` component:

```javascript
const myWindow = new $Window(
  {
    title: 'My Window',
    width: 400,
    height: 300,
  },
  {
    playSound: (sound) => {
      console.log(`Playing sound: ${sound}`);
    },
  },
);
```
