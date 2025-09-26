# azOS Development Guidelines

This document provides essential knowledge for AI agents to effectively contribute to the azOS project, a web-based operating system interface emulating a classic desktop environment.

## Project Architecture

### Core Components

- **Desktop System** (`src/components/desktop.js`): Manages desktop icons and interactions
- **Window Management** (`src/main.js`): Handles window lifecycle, z-index, and minimization
- **Taskbar** (`src/components/taskbar.js`): Manages application switching and system tray
- **Application Registry** (`src/config/apps.js`): Central configuration for all applications
- **App Manager** (`src/utils/appManager.js`): Handles application launching and lifecycle

### Key Dependencies

- Built with Vite.js for modern web development
- Uses `os-gui` package for Windows 98-style UI components
- Relies heavily on jQuery for DOM manipulation and window management

## Development Patterns

### Application Integration

1. Applications are defined in `src/config/apps.js` with two supported types:

   - **Windowed Apps**: Opens in desktop windows (`action.type: "window"`)
   - **Function-based Apps**: Executes custom JavaScript (`action.type: "function"`)

2. Required app properties:
   ```javascript
   {
     id: "unique-id",
     title: "Display Name",
     icon: "path/to/icon.ico",
     action: {
       type: "window",
       window: {
         width: 400,
         height: 300,
         resizable: true,
         // Optional menuBar configuration
       }
     }
   }
   ```

### Window Management

- Windows are created using the `$Window` component from `os-gui`
- Use `WindowManagerSystem.incrementZIndex()` for proper window stacking
- Window states (minimize/restore) are managed through jQuery data objects

### Desktop Icons

- Icons should be placed in `src/assets/icons/`
- Use `.ico` format for best compatibility
- Reference icons using `new URL()` with `import.meta.url` for proper Vite bundling

## Development Workflow

### Local Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

### Adding New Features

1. For new applications:
   - Add configuration to `src/config/apps.js`
   - Place icons in `src/assets/icons/`
   - Implement window content or function handler
2. For system components:
   - Follow the event-driven architecture in `main.js`
   - Use the `WindowManagerSystem` for window-related operations
   - Update taskbar state when modifying window visibility
