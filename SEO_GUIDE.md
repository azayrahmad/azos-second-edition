# SEO & Routing Guide

This guide explains how the new SEO-friendly routing system works in this project and how to configure it for development and production.

## How it Works

The project now uses a client-side router to create unique, indexable URLs for different parts of the application. This is essential for making the web-based OS friendly to search engines like Google.

The core logic is in `src/router.js`. This file defines a `routes` object where each entry corresponds to a specific URL path.

### Key Features:

*   **Dynamic Metadata:** For each route, the router dynamically updates the page's `<title>` and `<meta name="description">` tags. This provides unique, relevant information to search engines for each "page."
*   **App Launching:** Routes can trigger actions, such as launching one or more applications using the existing `launchApp` function.
*   **404 Handling:** If a user visits a URL that doesn't match any defined routes, a "404 Not Found" dialog is displayed.

## Configuration

### 1. Set Your Homepage URL

Before deploying your site, you **must** set the `homepage` URL in your `package.json` file. This is crucial for the sitemap to be generated with the correct URLs for your domain.

Open `package.json` and replace the placeholder value with your site's full URL:

```json
"homepage": "https://your-username.github.io/azos-second-edition",
```

### 2. How to Add a New Route

To add a new SEO-friendly URL, you need to edit the `routes` object in `src/router.js`.

**Example:** Let's say you want to add a new page at `/about` that opens the `notepad` app with a file called `about.txt`.

1.  **Open `src/router.js`**.
2.  **Add a new entry to the `routes` object:**

    ```javascript
    '/about': {
        title: 'About Us - azOS',
        description: 'Learn more about the azOS project.',
        action: () => {
            launchApp('notepad', { filePath: 'about.txt' });
        }
    },
    ```

The router will automatically handle the rest.

## Sitemap Generation

The project includes a script to automatically generate a `sitemap.xml` file, which helps search engines discover all the available pages.

**Important:** You should run this command as part of your build or deployment process to ensure the sitemap is always up-to-date.

To generate the sitemap, run the following command:

```bash
npm run generate-sitemap
```

This will create an updated `public/sitemap.xml` file. This file is excluded from version control, so it will not be committed.

## Production Server Configuration

For the client-side routing to work in a production environment, you need to configure your web server to redirect all requests to your `index.html` file. This is a standard practice for Single-Page Applications (SPAs).

Here are example configurations for common servers:

### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache

If you are using Apache, create a `.htaccess` file in your `dist` directory with the following content:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### Netlify

If you are deploying to Netlify, create a `_redirects` file in your `public` directory (or a `netlify.toml` file in your root) with the following rule:

**`_redirects` file:**

```
/*    /index.html   200
```

**`netlify.toml` file:**

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

For Vercel, create a `vercel.json` file in your project's root with the following configuration to handle rewrites:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
