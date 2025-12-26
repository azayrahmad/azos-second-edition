import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";
import { resolve } from "path";

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf-8"),
);
const appVersion = packageJson.version;

export default defineConfig({
  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(appVersion),
  },
  assetsInclude: ["**/*.ani"],
  base: "/azos-second-edition/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "azOS Second Edition",
        short_name: "azOS",
        description: "A web-based OS simulation.",
        theme_color: "#008080",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: [
          // Cache all core assets
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,woff,woff2,ttf,eot,wasm}',
          // Specifically include default theme assets
          'assets/img/wallpapers/default/*.{bmp,jpg,png}',
          'assets/audio/CHIMES.WAV',
          'assets/audio/CHORD.WAV',
          'assets/audio/DING.WAV',
          'assets/audio/LOGOFF.WAV',
          'assets/audio/NOTIFY.WAV',
          'assets/audio/RECYCLE.WAV',
          'assets/audio/START.WAV',
          'assets/audio/TADA.WAV',
          'assets/audio/The Microsoft Sound.wav',
          'assets/cursor/HOURGLASS.ani',
          'assets/cursor/APPSTARTS.ani',
        ],
        globIgnores: [
          // Exclude all non-default theme sounds
          'assets/audio/the 60s usa*.wav',
          'assets/audio/Dangerous Creatures*.wav',
          'assets/audio/Inside your Computer*.wav',
          'assets/audio/Sports*.wav',
          'assets/audio/Leonardo da Vinci*.wav',
          'assets/audio/Mystery*.wav',
          'assets/audio/Nature*.wav',
          'assets/audio/Science*.wav',
          'assets/audio/The Golden Era*.wav',
          'assets/audio/Travel*.wav',
          'assets/audio/Windows 98*.wav',
          'assets/audio/Baseball*.wav',
          'assets/audio/Jungle*.wav',
          'assets/audio/Space*.wav',
          'assets/audio/Underwater*.wav',
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Runtime cache for custom app icons (images)
            urlPattern: /\.(?:png|gif|jpg|jpeg|svg|bmp|ani|cur)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6MB
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
    }),
  ],
});
