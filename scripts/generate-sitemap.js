import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routerPath = path.resolve(__dirname, '../src/router.js');
const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
const packageJsonPath = path.resolve(__dirname, '../package.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const baseUrl = packageJson.homepage || 'http://localhost:5173';


fs.readFile(routerPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading router.js:', err);
        return;
    }

    const routesRegex = /const routes = {((.|\n)*?)};/;
    const routesMatch = data.match(routesRegex);

    if (!routesMatch || !routesMatch[1]) {
        console.error('Could not find routes in router.js');
        return;
    }

    const routesString = routesMatch[1];
    const routeKeysRegex = /'(\/[^']*)': {/g;
    let match;
    const routeKeys = [];
    while ((match = routeKeysRegex.exec(routesString)) !== null) {
        routeKeys.push(match[1]);
    }

    if (!routeKeys.length) {
        console.error('Could not extract route keys from router.js');
        return;
    }

    const urls = routeKeys
        .filter(route => !route.includes(':')) // Exclude dynamic routes
        .map(route => {
            const loc = `${baseUrl}${route === '/' ? '' : route}`;
            return `
    <url>
        <loc>${loc}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>${route === '/' ? '1.00' : '0.80'}</priority>
    </url>`;
        });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join('')}
</urlset>`;

    fs.writeFile(sitemapPath, sitemapContent.trim(), (err) => {
        if (err) {
            console.error('Error writing sitemap.xml:', err);
            return;
        }
        console.log('Sitemap generated successfully!');
    });
});
