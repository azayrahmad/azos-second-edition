import { Application } from '../Application.js';
import { themes } from '../../config/themes.js';
import { setItem, getItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';

class DisplayPropertiesApp extends Application {
  constructor(data) {
    super({
      id: 'display-properties',
      title: 'Display Properties',
      width: 480,
      height: 420,
      resizable: false,
      ...data,
    });
  }

  _createWindow() {
    return new window.$Window({
      title: this.title,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      id: this.id, // Pass the id here
    });
  }

  async _onLaunch() {
    this.selectedWallpaper = null;
    this.selectedWallpaperMode = getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || 'stretch';

    const { win } = this;
    win.content.innerHTML = `
      <div class="display-properties-tabs">
        <menu role="tablist">
          <li role="tab" aria-selected="true"><a href="#background">Background</a></li>
          <li role="tab"><a href="#screensaver">Screen Saver</a></li>
          <li role="tab"><a href="#appearance">Appearance</a></li>
          <li role="tab"><a href="#effects">Effects</a></li>
          <li role="tab"><a href="#web">Web</a></li>
          <li role="tab"><a href="#settings">Settings</a></li>
        </menu>
        <div class="window" role="tabpanel">
          <div class="window-body">
            <div id="background" class="tab-content">
              <fieldset>
                <legend>Wallpaper</legend>
                <div class="wallpaper-preview" style="width: 80px; height: 60px; border: 1px solid #000; margin: 0 auto;"></div>
                <p>Select an HTML Document or a picture:</p>
                <ul class="tree-view wallpaper-list" style="height: 100px;">
                  <!-- Wallpaper list will be populated here -->
                </ul>
                <div class="wallpaper-controls">
                  <button class="browse-button">Browse...</button>
                  <button class="pattern-button" disabled>Pattern...</button>
                  <div class="field-row">
                    <label for="display-mode">Display:</label>
                    <select id="display-mode">
                      <option value="stretch">Stretch</option>
                      <option value="center">Center</option>
                      <option value="tile">Tile</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            </div>
            <div id="screensaver" class="tab-content" hidden>
              <p>Coming soon!</p>
            </div>
            <div id="appearance" class="tab-content" hidden>
              <p>Coming soon!</p>
            </div>
            <div id="effects" class="tab-content" hidden>
              <p>Coming soon!</p>
            </div>
            <div id="web" class="tab-content" hidden>
              <p>Coming soon!</p>
            </div>
            <div id="settings" class="tab-content" hidden>
              <p>Coming soon!</p>
            </div>
          </div>
        </div>
      </div>
      <div class="buttons" style="text-align: right; padding: 5px;">
        <button class="ok-button">OK</button>
        <button class="cancel-button">Cancel</button>
        <button class="apply-button">Apply</button>
      </div>
    `;

    this._setupTabs(win);
    this._populateWallpaperList(win);
    this._setupButtons(win);

    // Set initial state
    const currentWallpaper = getItem(LOCAL_STORAGE_KEYS.WALLPAPER);
    const currentMode = getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || 'stretch';
    this.selectedWallpaper = currentWallpaper;
    this.selectedWallpaperMode = currentMode;

    this._updatePreview(win);
    win.content.querySelector('#display-mode').value = currentMode;
  }

  _setupTabs(win) {
    const tabs = win.content.querySelectorAll('[role="tab"]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');
        const tabPanels = win.content.querySelectorAll('.tab-content');
        tabPanels.forEach(panel => {
          panel.hidden = true;
        });
        const activePanel = win.content.querySelector(tab.querySelector('a').hash);
        if (activePanel) {
          activePanel.hidden = false;
        }
      });
    });
  }

  _populateWallpaperList(win) {
    const wallpaperList = win.content.querySelector('.wallpaper-list');
    const wallpapers = Object.values(themes)
      .filter(theme => theme.wallpaper)
      .map(theme => ({ name: theme.name, path: theme.wallpaper }));

    // Add a "None" option
    const noneOption = document.createElement('li');
    noneOption.textContent = '(None)';
    noneOption.dataset.path = 'none';
    wallpaperList.appendChild(noneOption);

    wallpapers.forEach(({ name, path }) => {
      const li = document.createElement('li');
      li.textContent = name;
      li.dataset.path = path;
      wallpaperList.appendChild(li);
    });

    wallpaperList.addEventListener('click', (e) => {
      if (e.target.tagName === 'LI') {
        this.selectedWallpaper = e.target.dataset.path;
        this._updatePreview(win);
        this._enableApplyButton(win);

        // Highlight selection
        const currentlySelected = wallpaperList.querySelector('.highlighted');
        if (currentlySelected) {
          currentlySelected.classList.remove('highlighted');
        }
        e.target.classList.add('highlighted');
      }
    });
  }

  _updatePreview(win) {
    const preview = win.content.querySelector('.wallpaper-preview');
    if (this.selectedWallpaper && this.selectedWallpaper !== 'none') {
      preview.style.backgroundImage = `url(${this.selectedWallpaper})`;
      preview.style.backgroundSize = 'cover';
    } else {
      preview.style.backgroundImage = 'none';
    }
  }

  _setupButtons(win) {
    const okButton = win.content.querySelector('.ok-button');
    const cancelButton = win.content.querySelector('.cancel-button');
    const applyButton = win.content.querySelector('.apply-button');
    const browseButton = win.content.querySelector('.browse-button');
    const displayMode = win.content.querySelector('#display-mode');

    applyButton.disabled = true;

    okButton.addEventListener('click', () => {
      this._applyChanges();
      this.win.close();
    });

    cancelButton.addEventListener('click', () => {
      this.win.close();
    });

    applyButton.addEventListener('click', () => {
      this._applyChanges();
      applyButton.disabled = true;
    });

    browseButton.addEventListener('click', () => this._browseForWallpaper(win));

    displayMode.addEventListener('change', (e) => {
      this.selectedWallpaperMode = e.target.value;
      this._enableApplyButton(win);
    });
  }

  _browseForWallpaper(win) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          this.selectedWallpaper = readerEvent.target.result;
          this._updatePreview(win);
          this._enableApplyButton(win);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  _enableApplyButton(win) {
    win.content.querySelector('.apply-button').disabled = false;
  }

  _applyChanges() {
    if (this.selectedWallpaper === 'none') {
        setItem(LOCAL_STORAGE_KEYS.WALLPAPER, null);
    } else {
        setItem(LOCAL_STORAGE_KEYS.WALLPAPER, this.selectedWallpaper);
    }
    setItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE, this.selectedWallpaperMode);
    document.dispatchEvent(new CustomEvent('wallpaper-changed'));
  }
}

export default DisplayPropertiesApp;
