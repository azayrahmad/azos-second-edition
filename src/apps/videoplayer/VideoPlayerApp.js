import { Application } from '../Application';
import { ShowDialogWindow } from '../../components/DialogWindow';
import MenuBar from '../../../public/os-gui/MenuBar';

export class VideoPlayerApp extends Application {
  async _onLaunch(file) {
    const win = this._createWindow();
    this.win = win;

    const menuBar = new MenuBar();
    win.setMenuBar(menuBar);

    menuBar.setMenu([
      {
        label: 'File',
        items: [
          {
            label: 'Open',
            action: () => this.openFile(),
          },
          {
            label: 'Open URL',
            action: () => this.openUrl(),
          },
        ],
      },
    ]);

    win.$content.innerHTML = '<div class="video-player-container"></div>';
    this.videoPlayerContainer = win.$content.querySelector('.video-player-container');

    if (file) {
      this.loadFile(file);
    }
  }

  _createWindow() {
    return this.desktop.createWindow({
      title: 'Video Player',
      width: 640,
      height: 480,
      icon: this.appInfo.icon,
      id: this.appInfo.id,
    });
  }

  openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadFile(file);
      }
    };
    input.click();
  }

  loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const video = document.createElement('video');
      video.src = e.target.result;
      video.controls = true;
      this.videoPlayerContainer.innerHTML = '';
      this.videoPlayerContainer.appendChild(video);
      this.win.setTitle(`${file.name} - Video Player`);
    };
    reader.readAsDataURL(file);
  }

  openUrl() {
    ShowDialogWindow({
      title: 'Open URL',
      text: 'Enter a YouTube URL:',
      input: true,
      onOk: (url) => {
        if (url) {
          this.loadYouTubeUrl(url);
        }
      },
    });
  }

  loadYouTubeUrl(url) {
    const videoId = this.getYouTubeVideoId(url);
    if (videoId) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      this.videoPlayerContainer.innerHTML = '';
      this.videoPlayerContainer.appendChild(iframe);
      this.win.setTitle('YouTube - Video Player');
    } else {
      ShowDialogWindow({
        title: 'Error',
        text: 'Invalid YouTube URL.',
        soundEvent: 'SystemHand',
      });
    }
  }

  getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
