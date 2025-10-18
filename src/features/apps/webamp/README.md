# Webamp App

## Summary

The Webamp app integrates the popular, web-based "Webamp" — a faithful recreation of the classic Winamp music player — into the azOS desktop environment. Unlike other applications that run within standard windows, Webamp renders directly on the desktop, providing a unique, widget-like experience for playing music.

## Features

- **Classic Music Player UI**: Replicates the iconic look and feel of the Winamp media player, including its main window, equalizer, and playlist editor.
- **Direct Desktop Rendering**: Webamp is not confined to a typical application window. It is rendered directly onto the desktop, allowing it to be moved around freely like a desktop widget.
- **Taskbar Integration**:
    - A dedicated button on the taskbar represents the Webamp application.
    - The taskbar button can be used to minimize and restore the Webamp player.
    - The button's state updates to reflect whether the player is active, in focus, or minimized.
- **Playback Controls**:
    - Comes pre-loaded with a default track ("Llama Whippin' Intro").
    - Supports standard playback controls: play, pause, stop, next track, and previous track.
    - These controls can be accessed through a context menu, allowing for integration with other parts of the OS (like a system tray menu).
- **Window Management**:
    - Includes custom logic for minimizing, showing, and closing the player.
    - Integrates with the azOS z-index system to ensure it correctly layers with other windows and UI elements.
- **Dynamic Loading**: The Webamp library is loaded on-demand from a CDN (`unpkg.com`), which keeps the initial application size small and only fetches the player when the user decides to launch it.

## Technical Details

- **Integration Logic**: The `webamp.js` file acts as a bridge between the external Webamp library and the azOS environment. It handles the initialization, event listening, and UI integration.
- **Event Handling**: The app listens to Webamp's internal events (`onMinimize`, `onClose`) to trigger corresponding actions within the OS, such as hiding the player and cleaning up resources.
- **DOM Manipulation**: A container `div` is created and appended to the `document.body` to serve as the mounting point for the Webamp instance.
- **Taskbar API**: Utilizes the `createTaskbarButton`, `updateTaskbarButton`, and `removeTaskbarButton` functions from the taskbar component to manage its presence and state on the system taskbar.