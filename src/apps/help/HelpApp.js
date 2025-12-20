import { Application } from "../Application.js";
import "./HelpApp.css";

export class HelpApp extends Application {
  constructor(options) {
    super(options);
    this.filePath = options.filePath || "/apps/help/help-topics.json";
  }

  // Helper function to recursively find a topic by its ID in the nested structure
  _findTopicById(topics, id) {
    for (const topic of topics) {
      if (topic.id === id) {
        return topic;
      }
      if (topic.children) {
        const found = this._findTopicById(topic.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  async _loadHelpTopics() {
    try {
      const response = await fetch(this.filePath);
      if (!response.ok) {
        throw new Error(`Failed to load help file: ${response.statusText}`);
      }
      this.helpTopics = await response.json();
    } catch (error) {
      console.error(error);
      this.helpTopics = { title: "Error", topics: [] };
      // Optionally, display an error message in the UI
    }
  }

  // Helper function to recursively build the HTML for the topics tree view
  _buildTopicsHtml(topics) {
    return topics
      .map((topic) => {
        const hasChildren = topic.children && topic.children.length > 0;
        const iconClass = hasChildren ? "book-icon" : "page-icon"; // CSS classes for icons
        const titleHtml = `<span class="${iconClass}"></span><span class="title-text">${topic.title}</span>`;

        if (hasChildren) {
          return `
          <li>
            <details>
              <summary data-topic-id="${topic.id}">${titleHtml}</summary>
              <ul>
                ${this._buildTopicsHtml(topic.children)}
              </ul>
            </details>
          </li>
        `;
        } else {
          return `<li><span data-topic-id="${
            topic.id
          }">${titleHtml}</span></li>`;
        }
      })
      .join("");
  }

  async _createWindow() {
    await this._loadHelpTopics();

    const win = new $Window({
      title: this.helpTopics.title || this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      minimizeButton: this.minimizeButton,
      maximizeButton: this.maximizeButton,
      icons: this.icon,
    });

    const content = document.createElement("div");
    content.className = "help-app-content";

    const topicsHtml = this._buildTopicsHtml(this.helpTopics.topics);

    content.innerHTML = `
      <div class="topics">
        <ul class="tree-view">
          ${topicsHtml}
        </ul>
      </div>
      <div class="content">
        <h2>Welcome to Help Topics</h2>
        <p>Select a topic from the left to get started.</p>
      </div>
    `;

    win.$content.append(content);

    const contentElement = content.querySelector(".content");

    // Add event listeners to all clickable topic elements
    content
      .querySelectorAll(".topics [data-topic-id]")
      .forEach((topicElement) => {
        topicElement.addEventListener("click", async () => {
          const topicId = topicElement.dataset.topicId;
          const topic = this._findTopicById(this.helpTopics.topics, topicId);

          if (topic) {
            if (topic.content) {
              contentElement.innerHTML = topic.content;
            } else if (topic.link) {
              try {
                const response = await fetch(topic.link);
                if (!response.ok) {
                  throw new Error(
                    `Failed to load content from: ${topic.link}`
                  );
                }
                contentElement.innerHTML = await response.text();
              } catch (error) {
                console.error(error);
                contentElement.innerHTML = `<p>Error loading content.</p>`;
              }
            }
          }
        });
      });

    return win;
  }
}
