import { Application } from "../Application.js";
import helpTopics from "../../config/help-topics.json";

export class HelpApp extends Application {
  constructor(options) {
    super(options);
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
    content.style.display = "flex";
    content.style.height = "100%";

    const topicsList = helpTopics.topics.map(topic =>
      `<li data-topic-id="${topic.id}">${topic.title}</li>`
    ).join('');

    content.innerHTML = `
      <div class="topics" style="width: 150px; border-right: 1px solid #ccc; padding: 10px; overflow-y: auto;">
        <ul>
          ${topicsList}
        </ul>
      </div>
      <div class="content" style="flex-grow: 1; padding: 10px; overflow-y: auto;">
        <h2>Welcome to Help Topics</h2>
        <p>Select a topic from the left to get started.</p>
      </div>
    `;

    win.$content.append(content);

    const topicElements = content.querySelectorAll(".topics li");
    const contentElement = content.querySelector(".content");

    topicElements.forEach(topicElement => {
      topicElement.addEventListener("click", () => {
        const topicId = topicElement.dataset.topicId;
        const topic = helpTopics.topics.find(t => t.id === topicId);
        if (topic) {
          contentElement.innerHTML = topic.content;
        }
      });
    });

    return win;
  }
}
