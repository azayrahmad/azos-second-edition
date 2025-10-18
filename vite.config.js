import { VitePWA } from 'vite-plugin-pwa';

export default {
    "base": "/azos-second-edition/",
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'azOS Second Edition',
                short_name: 'azOS',
                description: 'A web-based OS simulation.',
                theme_color: '#008080',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ]
}