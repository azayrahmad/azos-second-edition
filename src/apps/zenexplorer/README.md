# ZenExplorer (File Manager)

**ZenExplorer** is the next-generation file manager for win98-web, built on top of [ZenFS](https://zenfs.dev/). Unlike the legacy Explorer (which relies on a static, synchronous `directory.js` object tree), ZenExplorer interacts with a real, asynchronous file system that supports persistence via IndexedDB.

## How It Works

### Architecture
- **Backend**: Uses `@zenfs/core` and `@zenfs/dom`.
- **Storage**:
    - `/`: **InMemory** (Volatile, resets on reload).
    - `/c`: **IndexedDB** (Persistent, emulates a hard drive).
- **Async-First**: All file operations (`readdir`, `mkdir`, `stat`) use `fs.promises`. This prevents UI blocking and enables proper error handling.

### Key Components
- **`ZenExplorerApp.js`**: The main application logic. It handles the window life-cycle, navigation state, and rendering.
- **`zenfs-init.js`**: A utility that initializes the ZenFS backends and mounts. It ensures the file system is ready before the app launches.
- **UI Components**: Reuses existing `IconManager`, `MenuBar`, and `DialogWindow` for a consistent look and feel.

## Roadmap to Parity

The goal is to eventually replace `src/apps/explorer` with `ZenExplorer`. To do that, we need to implement the following features:

### Phase 1: Core File Operations (Current Focus)
- [x] **Navigation**: Browsing directories.
- [x] **Folder Creation**: Creating new directories via Menu.
- [ ] **File Deletion**: Right-click -> Delete.
- [ ] **Renaming**: Right-click -> Rename.
- [ ] **File Opening**: Double-click to launch associated apps (Notepad, Image Viewer) with the ZenFS file content.

### Phase 2: User Experience
- [ ] **Context Menus**: Full right-click support for items and background.
- [ ] **Navigation History**: Back, Forward, and Up buttons in the toolbar.
- [ ] **Drag & Drop**:
    - Move files within ZenFS.
    - **Import**: Drag files from the user's *real* OS into the browser window to save them to `/c`.
- [ ] **Clipboard**: Cut/Copy/Paste files.

### Phase 3: System Integration
- [ ] **"My Documents" Sync**: Map the system "My Documents" shortcut to `/c/My Documents`.
- [ ] **Recycle Bin**: Implement a persistent trash can (e.g., specific hidden folder or metadata).
- [ ] **Properties**: Show file size, creation date, and type in a dialog.

## Technical Debt to Address
- **IconManager**: Currently assumes static objects. Needs to be fully adapted for async data sources.
- **Sorting**: Implement sorting by Name, Date, and Size for ZenFS entries.
