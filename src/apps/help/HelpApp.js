import { Application } from "../Application.js";
import TreeView from "./TreeView.js";
import helpData from "../../config/help.json";
import "./help.css";
import contentHtml from "./help.html?raw";

class HelpApp extends Application {
  constructor(data) {
    super({
      id: "help",
      title: "Windows Help",
      width: 550,
      height: 450,
      resizable: true,
      ...data,
    });

    this.history = [];
    this.historyIndex = -1;
    this.treeView = null;
  }

  _createWindow() {
    return new window.$Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
      id: this.id,
    });
  }

  async _onLaunch(filePath) {
    const { win } = this;
    win.$content.html(contentHtml);

    let currentHelpData = helpData; // Default help data

    if (typeof filePath === "string") {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentHelpData = await response.json();
      } catch (error) {
        console.error(`Failed to load help content from ${filePath}:`, error);
        // Optionally show a dialog to the user
        this.win.close(); // Close the app if content fails to load
        return;
      }
    }

    // Set the window title from the loaded data
    if (currentHelpData.title) {
      win.title(currentHelpData.title);
    }

    const treeContainer = win.$content.find("#contents")[0];
    this.treeView = new TreeView(treeContainer, currentHelpData);
    this.treeView.render();

    // Event listener for topic selection
    treeContainer.addEventListener("topic-selected", async (e) => {
      await this._showTopic(e.detail, true);
    });

    // Setup toolbar
    this._setupToolbar(win);
    this._setupTabs(win);

    // Show the default topic by default
    const defaultTopic = {
      file: "help/content/default.htm",
      title: "Welcome",
    };
    await this._showTopic(defaultTopic, true);
  }

  async _showTopic(topic, addToHistory = false) {
    const contentPanel = this.win.$content.find(".content-panel");
    contentPanel.html(""); // Clear content first

    if (topic.file) {
      try {
        // The path in topic.file is relative to the `src/apps` directory
        const module = await import(/* @vite-ignore */ `../${topic.file}?raw`);
        const htmlContent = module.default;

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        contentPanel.append(iframe);

        // Write content to iframe
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(htmlContent);
        iframe.contentWindow.document.close();
      } catch (error) {
        console.error(`Failed to load help content from ${topic.file}:`, error);
        contentPanel.html(`<h2 class="help-topic-title">Error</h2><div class="help-topic-content">Content not found.</div>`);
      }
    } else if (topic.content) {
      contentPanel.html(`
        <h2 class="help-topic-title">${topic.title}</h2>
        <div class="help-topic-content">${topic.content}</div>
      `);
    }

    if (addToHistory) {
      // If we select a new topic after going back, clear the "forward" history
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }
      this.history.push(topic);
      this.historyIndex = this.history.length - 1;
    }
    this._updateHistoryButtons();
  }

  _updateHistoryButtons() {
    const backButton = this.win.$content.find(".back-button")[0];
    const forwardButton = this.win.$content.find(".forward-button")[0];
    backButton.disabled = this.historyIndex <= 0;
    forwardButton.disabled = this.historyIndex >= this.history.length - 1;
  }

  _setupToolbar(win) {
    const hideButton = win.$content.find(".hide-button")[0];
    const backButton = win.$content.find(".back-button")[0];
    const forwardButton = win.$content.find(".forward-button")[0];
    const sidebar = win.$content.find(".sidebar")[0];

    hideButton.addEventListener("click", () => {
      const isHidden = sidebar.classList.toggle("hidden");
      hideButton.innerHTML = `<span class="icon"></span>${isHidden ? "Show" : "Hide"}`;
    });

    backButton.addEventListener("click", async () => {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        await this._showTopic(this.history[this.historyIndex], false);
      }
    });

    forwardButton.addEventListener("click", async () => {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        await this._showTopic(this.history[this.historyIndex], false);
      }
    });
  }

  _setupTabs(win) {
    const $tabs = win.$content.find('[role="tab"]');
    $tabs.on("click", (e) => {
      e.preventDefault();
      const $clickedTab = $(e.currentTarget);
      const targetId = $clickedTab.find("a").attr("data-target");

      // For now, only the Contents tab is functional
      if (targetId !== "#contents") {
        // Optionally, show a message that this feature is not implemented
        return;
      }

      $tabs.attr("aria-selected", "false");
      $clickedTab.attr("aria-selected", "true");

      win.$content.find(".tab-content").hide();
      win.$content.find(targetId).show();
    });

    // Disable Index and Search tabs visually and functionally for now
    win.$content.find('[data-target="#index"]').parent().addClass('disabled');
    win.$content.find('[data-target="#search"]').parent().addClass('disabled');
  }
}

export default HelpApp;
