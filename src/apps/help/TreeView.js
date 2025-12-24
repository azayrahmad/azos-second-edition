import { ICONS } from '../../config/icons.js';

class TreeView {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.selectedNode = null;
  }

  render() {
    const ul = document.createElement('ul');
    ul.className = 'tree-view';
    this.data.topics.forEach(topic => {
      const li = this._createNode(topic);
      ul.appendChild(li);
    });
    this.container.innerHTML = '';
    this.container.appendChild(ul);
  }

  _createNode(topic) {
    const li = document.createElement('li');
    li.classList.add('tree-node');

    const label = document.createElement('div');
    label.className = 'node-label';

    const icon = document.createElement('span');
    icon.className = 'icon';

    label.appendChild(icon);
    label.appendChild(document.createTextNode(topic.title));
    li.appendChild(label);

    if (topic.children && topic.children.length > 0) {
      li.classList.add('branch');
      icon.style.backgroundImage = `url(${ICONS.helpBook[16]})`;

      const childrenUl = document.createElement('ul');
      childrenUl.style.display = 'none'; // Initially collapsed
      topic.children.forEach(child => {
        childrenUl.appendChild(this._createNode(child));
      });
      li.appendChild(childrenUl);

      label.addEventListener('click', () => {
        const isExpanded = childrenUl.style.display === 'block';
        childrenUl.style.display = isExpanded ? 'none' : 'block';
        icon.style.backgroundImage = `url(${isExpanded ? ICONS.helpBook[16] : ICONS.helpBookOpen[16]})`;
      });
    } else {
      li.classList.add('leaf');
      icon.style.backgroundImage = `url(${ICONS.helpPage[16]})`;
      label.addEventListener('click', () => {
        if (this.selectedNode) {
          this.selectedNode.classList.remove('selected');
        }
        label.classList.add('selected');
        this.selectedNode = label;
        this.container.dispatchEvent(new CustomEvent('topic-selected', { detail: topic }));
      });
    }

    return li;
  }
}

export default TreeView;
