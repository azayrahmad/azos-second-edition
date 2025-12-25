import { launchApp } from './utils/appManager.js';
import { ShowDialogWindow } from './components/DialogWindow.js';
import { apps } from './config/apps.js';

const routes = {
    '/': {
        title: 'azOS - A Web-Based Operating System',
        description: 'A retro-style web-based operating system.',
        action: () => {
            // Default desktop, do nothing
        },
    },
    '/resume': {
        title: 'Resume - azOS',
        description: 'View my resume.',
        action: () => {
            launchApp('pdfviewer', { filePath: 'Resume.pdf' });
            launchApp('esheep');
        },
    },
    '/apps/:appId': {
        title: (appId) => {
            const app = apps.find((a) => a.id === appId);
            return app ? `${app.title} - azOS` : 'App Not Found - azOS';
        },
        description: (appId) => {
            const app = apps.find((a) => a.id === appId);
            return app ? `Launch the ${app.title} application.` : 'This application could not be found.';
        },
        action: (appId) => {
            const app = apps.find((a) => a.id === appId);
            if (app) {
                launchApp(appId);
            } else {
                notFound();
            }
        },
    },
    '/apps/:appId/:contentId': {
        title: (appId, contentId) => {
            const app = apps.find((a) => a.id === appId);
            return app ? `${contentId} - ${app.title} - azOS` : 'Content Not Found - azOS';
        },
        description: (appId, contentId) => {
            const app = apps.find((a) => a.id === appId);
            return app ? `View ${contentId} in the ${app.title} application.` : 'This content could not be found.';
        },
        action: (appId, contentId) => {
            const app = apps.find((a) => a.id === appId);
            // This is a placeholder for finding content.
            // In a real application, you would have a way to look up the content.
            const content = { id: contentId, name: contentId };
            if (app && content) {
                launchApp(appId, content);
            } else {
                notFound();
            }
        },
    },
};

const notFound = () => {
    ShowDialogWindow({
        title: 'Error',
        text: '404 - The page you are looking for does not exist.',
        buttons: {
            Ok: () => {},
        },
    });
};

const router = () => {
    const base = import.meta.env.BASE_URL;
    const path = window.location.pathname.startsWith(base)
        ? window.location.pathname.substring(base.length -1)
        : window.location.pathname;
    let match = null;

    for (const route in routes) {
        const routeParts = route.split('/').filter(p => p);
        const pathParts = path.split('/').filter(p => p);

        if (routeParts.length !== pathParts.length) {
            continue;
        }

        const params = {};
        const isMatch = routeParts.every((part, i) => {
            if (part.startsWith(':')) {
                params[part.substring(1)] = pathParts[i];
                return true;
            }
            return part === pathParts[i];
        });

        if (isMatch) {
            match = { ...routes[route], params };
            break;
        }
    }

    if (match) {
        const { title, description, action, params } = match;
        const titleValue = typeof title === 'function' ? title(...Object.values(params)) : title;
        const descriptionValue = typeof description === 'function' ? description(...Object.values(params)) : description;

        document.title = titleValue;
        document.querySelector('meta[name="description"]').setAttribute('content', descriptionValue);

        action(...Object.values(params));
    } else {
        notFound();
    }
};

export const initRouter = () => {
    // Call the router on initial page load
    router();

    // Reroute on back/forward navigation
    window.addEventListener('popstate', router);
};
