import { Application } from "../Application.js";
import helpTopics from "../../config/help-topics.json";
import "./HelpApp.css";

export class HelpApp extends Application {
  constructor(options) {
    super(options);
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

  // Helper function to recursively build the HTML for the topics tree view
  _buildTopicsHtml(topics) {
    return topics.map(topic => {
      if (topic.children && topic.children.length > 0) {
        return `
          <li>
            <details>
              <summary data-topic-id="${topic.id}">${topic.title}</summary>
              <ul>
                ${this._buildTopicsHtml(topic.children)}
              </ul>
            </details>
          </li>
        `;
      } else {
        return `<li data-topic-id="${topic.id}">${topic.title}</li>`;
      }
    }).join('');
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      minimizeButton: this.minimizeButton,
      maximizeButton: this.maximizeButton,
      icons: this.icon,
    });

    const content = document.createElement("div");
    content.className = "help-app-content";

    const topicsHtml = this._buildTopicsHtml(helpTopics.topics);

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

    // Add event listeners to all clickable topic elements (li and summary)
    content.querySelectorAll(".topics [data-topic-id]").forEach(topicElement => {
      topicElement.addEventListener("click", () => {
        const topicId = topicElement.dataset.topicId;
        const topic = this._findTopicById(helpTopics.topics, topicId);

        if (topic && topic.content) {
          contentElement.innerHTML = topic.content;
        }
      });
    });

    return win;
  }
}
