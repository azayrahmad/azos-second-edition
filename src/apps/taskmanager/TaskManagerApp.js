import { Application } from '../Application.js';
import { ShowComingSoonDialog } from '../../components/DialogWindow.js';

export class TaskManagerApp extends Application {
    async _onLaunch() {
        this.win.el.style.zIndex = $Window.Z_INDEX++; // Bring to front on launch
        this._updateTaskList();
        this._setupEventDelegation();

        this.observer = new MutationObserver(() => this._updateTaskList());
        this.observer.observe(document.body, { childList: true, subtree: true });

        this.win.onClosed(() => {
            if (this.observer) {
                this.observer.disconnect();
            }
        });
    }

    _updateTaskList() {
        const taskList = this.win.$content.find('.task-list');
        const selectedWin = this.win.$content.find('.task-list li.selected').data('win');
        taskList.empty();

        const openWindows = $w.all.filter(win => win.id !== 'taskmanager' && win.el.style.display !== 'none' && !win.el.classList.contains('os-window-dialog'));

        openWindows.forEach(appWin => {
            const listItem = $(`<li>${appWin.title}</li>`);
            listItem.data('win', appWin);
            if (selectedWin && appWin.id === selectedWin.id) {
                listItem.addClass('selected');
            }
            taskList.append(listItem);
        });

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
                const winToClose = selectedItem.data('win');
                winToClose.close(true); // Force close
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
