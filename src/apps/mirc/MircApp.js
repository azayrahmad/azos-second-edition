import { Application } from '../Application.js';
import './mirc.css';

export class MircApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        const container = `
            <div class="mirc-container">
                <div class="mirc-status-window sunken-panel"></div>
                <div class="mirc-channel-window">
                    <div class="mirc-chat-area sunken-panel"></div>
                    <div class="mirc-user-list sunken-panel"></div>
                </div>
                <div class="mirc-input-box">
                    <input type="text" class="mirc-input" />
                </div>
            </div>
        `;
        win.$content.append(container);
        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&Help": [
                {
                    label: "&About mIRC",
                    action: () => alert("A mIRC simulation."),
                },
            ],
        });
    }

    _onLaunch() {
        const statusWindow = this.win.$content.find('.mirc-status-window')[0];
        const chatArea = this.win.$content.find('.mirc-chat-area')[0];
        const userList = this.win.$content.find('.mirc-user-list')[0];

        // Placeholder for API call to get server messages
        statusWindow.innerHTML = `
            <p>* Connecting to EFnet...</p>
            <p>* Connected! Welcome to the Internet Relay Chat Network.</p>
        `;

        // Placeholder for API call to get channel messages
        chatArea.innerHTML = `
            <p>*** Now talking in #windows95</p>
            <p>&lt;CoolGuy98&gt; anyone know where i can find a cracked version of paint shop pro?</p>
            <p>&lt;WarezGodd&gt; check #warez</p>
            <p>*** Guest1234 has joined #windows95</p>
        `;

        // Placeholder for API call to get user list
        userList.innerHTML = `
            <p>@OpDude</p>
            <p>CoolGuy98</p>
            <p>WarezGodd</p>
            <p>Guest1234</p>
        `;
    }
}
