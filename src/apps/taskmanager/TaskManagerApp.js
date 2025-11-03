import { Application } from '../Application.js';
import { ShowComingSoonDialog } from '../../components/DialogWindow.js';
import { appManager } from '../../utils/appManager.js';

export class TaskManagerApp extends Application {
    async _onLaunch() {
        this.win.element.style.zIndex = $Window.Z_INDEX++; // Bring to front on launch
        this._updateTaskList();
        this._setupEventDelegation();

        // Custom event listener for app changes
        document.addEventListener('app-launched', () => this._updateTaskList());
        document.addEventListener('app-closed', () => this._updateTaskList());
    }

    _updateTaskList() {
        const taskList = this.win.$content.find('.task-list');
        const selectedAppId = this.win.$content.find('.task-list li.selected').data('appId');
        taskList.empty();

        const runningApps = appManager.getRunningApps();

        for (const [appId, appInstance] of Object.entries(runningApps)) {
            if (appId === 'taskmanager') continue;

            const appConfig = appManager.getAppConfig(appId);
            const title = appInstance.win ? appInstance.win.title() : appConfig.title;

            const listItem = $(`<li>${title}</li>`);
            listItem.data('appId', appId);
            if (selectedAppId && appId === selectedAppId) {
                listItem.addClass('selected');
            }
            taskList.append(listItem);
        }

        const isItemSelected = taskList.find('li.selected').length > 0;
        this.win.$content.find('.end-task-btn').prop('disabled', !isItemSelected);
        this.win.$content.find('.switch-to-btn').prop('disabled', !isItemSelected);
    }

    _setupEventDelegation() {
        const content = this.win.$content;

        // List item selection
        content.on('click', '.task-list li', (e) => {
            const selectedItem = $(e.currentTarget);
            content.find('.task-list li').removeClass('selected');
            selectedItem.addClass('selected');
            content.find('.end-task-btn').prop('disabled', false);
            content.find('.switch-to-btn').prop('disabled', false);
        });

        // Button actions
        content.on('click', '.end-task-btn', () => {
            const selectedItem = content.find('.task-list li.selected');
            if (selectedItem.length) {
                const appId = selectedItem.data('appId');
                appManager.closeApp(appId);
            }
        });

        content.on('click', '.switch-to-btn', () => {
             ShowComingSoonDialog('Switch To');
        });

        content.on('click', '.new-task-btn', () => {
            ShowComingSoonDialog('Create New Task');
        });
    }

    _createWindow() {
        const win = new $Window({
            title: 'Task Manager',
            width: 300,
            height: 400,
            resizable: false,
            id: 'taskmanager'
        });

        const content = `
            <div class="task-manager-content">
                <ul class="task-list sunken-panel"></ul>
                <div class="button-bar">
                    <button class="end-task-btn" disabled>End Task</button>
                    <button class="switch-to-btn" disabled>Switch To</button>
                    <button class="new-task-btn">New Task...</button>
                </div>
            </div>
        `;

        win.$content.html(content);
        this.win = win; // Store reference to window instance
        return win;
    }
}
