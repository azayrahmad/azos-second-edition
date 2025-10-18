import "../../styles/explorer.css";

export class Explorer {
  constructor(container, win) {
    this.container = container;
    this.win = win;
    this.container.innerHTML = this.getHTML();
    this.init();
  }

  getHTML() {
    // The container will be populated by the Toolbar component
    return `
      <div class="explorer-toolbar-container"></div>
      <div class="explorer-address-bar">
        <label for="address">Address</label>
        <input type="text" id="address" value="My Computer" />
      </div>
      <div class="explorer-content">
        <!-- File and folder icons will go here -->
      </div>
    `;
  }

  init() {
    this.win.explorer = this;
    const toolbarContainer = this.container.querySelector('.explorer-toolbar-container');

    const placeholderIcon = new URL("../../assets/icons/computer_explorer-0.png", import.meta.url).href;

    const toolbarItems = [
      { label: 'Back', icon: placeholderIcon, action: () => console.log('Back') },
      { label: 'Forward', icon: placeholderIcon, action: () => console.log('Forward'), enabled: false },
      { label: 'Up', icon: placeholderIcon, action: () => console.log('Up') },
      { label: 'Cut', icon: placeholderIcon, action: () => console.log('Cut'), enabled: false },
      { label: 'Copy', icon: placeholderIcon, action: () => console.log('Copy'), enabled: false },
      { label: 'Paste', icon: placeholderIcon, action: () => console.log('Paste'), enabled: false },
      { label: 'Undo', icon: placeholderIcon, action: () => console.log('Undo'), enabled: false },
      { label: 'Delete', icon: placeholderIcon, action: () => console.log('Delete'), enabled: false },
      { label: 'Properties', icon: placeholderIcon, action: () => console.log('Properties'), enabled: false },
      {
        label: 'Views',
        icon: placeholderIcon,
        submenu: [
            { label: 'Large Icons' },
            { label: 'Small Icons' },
            { label: 'List' },
            { label: 'Details' },
        ]
      },
    ];

    const toolbar = new Toolbar(toolbarItems);
    toolbarContainer.appendChild(toolbar.element);
  }
}

// For use in appManager
export const explorerContent = `
    <div class="explorer-container">
    </div>
`;