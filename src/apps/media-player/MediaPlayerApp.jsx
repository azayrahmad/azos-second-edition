import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { render, h } from "preact";
import { MediaPlayer } from "win95-media-player";

export class MediaPlayerApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: "Media Player",
      width: 350,
      height: 200,
      icons: ICONS.mediaPlayer,
    });

    const playlist = [
      {
        url: "https://archive.org/download/CC1301_windows_95/CC1301_windows_95_512kb.mp4",
        title: "Computer Chronicles - Windows 95",
      },
    ];

    const container = win.$content[0];
    this.renderPlayer(container, playlist);

    this.setupMenu(win, container);

    return win;
  }

  renderPlayer(container, playlist) {
    render(
      <MediaPlayer
        playlist={playlist}
        showVideo
        fullscreenEnabled
      />,
      container
    );
  }

  setupMenu(win, container) {
    const menuBar = new MenuBar({
      menus: [
        {
          label: "File",
          submenu: [
            {
              label: "Open...",
              action: () => this.openFile(container),
            },
          ],
        },
      ],
    });
    win.setMenuBar(menuBar);
  }

  openFile(container) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const newPlaylist = [{ url, title: file.name }];
        this.renderPlayer(container, newPlaylist);
      }
    };
    input.click();
  }
}
