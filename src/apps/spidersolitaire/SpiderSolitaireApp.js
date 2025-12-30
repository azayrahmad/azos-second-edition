import { Application } from "../Application.js";

export class SpiderSolitaireApp extends Application {
    _createWindow() {
        const win = new $Window({
            title: "Spider Solitaire",
            width: 800,
            height: 600,
            id: 'spidersolitaire',
            icon: this.appInfo.icon,
        });

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.src = 'src/apps/spidersolitaire/game.html';
        win.$content.append(iframe);

        return win;
    }
}