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
    const contentHtml = `
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

    win.$content.html(contentHtml);

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
    const $tabs = win.$content.find('[role="tab"]');
    $tabs.on('click', (e) => {
        const $clickedTab = $(e.currentTarget);
        $tabs.attr('aria-selected', 'false');
        $clickedTab.attr('aria-selected', 'true');

        win.$content.find('.tab-content').hide();
        const activePanelId = $clickedTab.find('a').attr('href');
        win.$content.find(activePanelId).show();
    });
  }

  _populateWallpaperList(win) {
    const $wallpaperList = win.$content.find('.wallpaper-list');
    const wallpapers = Object.values(themes)
      .filter(theme => theme.wallpaper)
      .map(theme => ({ name: theme.name, path: theme.wallpaper }));

    // Add a "None" option
    $wallpaperList.append('<li data-path="none">(None)</li>');

    wallpapers.forEach(({ name, path }) => {
        $wallpaperList.append(`<li data-path="${path}">${name}</li>`);
    });

    $wallpaperList.on('click', 'li', (e) => {
        const $selectedLi = $(e.currentTarget);
        this.selectedWallpaper = $selectedLi.data('path');
        this._updatePreview(win);
        this._enableApplyButton(win);

        $wallpaperList.find('.highlighted').removeClass('highlighted');
        $selectedLi.addClass('highlighted');
    });
  }

  _updatePreview(win) {
    const $preview = win.$content.find('.wallpaper-preview');
    if (this.selectedWallpaper && this.selectedWallpaper !== 'none') {
        $preview.css({
            'background-image': `url(${this.selectedWallpaper})`,
            'background-size': 'cover'
        });
    } else {
        $preview.css('background-image', 'none');
    }
  }

  _setupButtons(win) {
    const $okButton = win.$content.find('.ok-button');
    const $cancelButton = win.$content.find('.cancel-button');
    const $applyButton = win.$content.find('.apply-button');
    const $browseButton = win.$content.find('.browse-button');
    const $displayMode = win.$content.find('#display-mode');

    $applyButton.prop('disabled', true);

    $okButton.on('click', () => {
      this._applyChanges();
      this.win.close();
    });

    $cancelButton.on('click', () => {
      this.win.close();
    });

    $applyButton.on('click', () => {
      this._applyChanges();
      $applyButton.prop('disabled', true);
    });

    $browseButton.on('click', () => this._browseForWallpaper(win));

    $displayMode.on('change', (e) => {
      this.selectedWallpaperMode = $(e.target).val();
      this._enableApplyButton(win);
    });
  }

  _browseForWallpaper(win) {
    const $input = $('<input type="file" accept="image/*" />');
    $input.on('change', (e) => {
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
    });
    $input.trigger('click');
  }

  _enableApplyButton(win) {
    win.$content.find('.apply-button').prop('disabled', false);
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
