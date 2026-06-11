import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      disable: mode !== "production",
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      includeAssets: [
        "favicon.ico",
        "favicon.png",
        "apple-touch-icon.png",
        "robots.txt",
      ],
      manifest: {
        name: "GLF — Good Life Furnitures",
        short_name: "GLF",
        description:
          "GLF ERP system for sales, inventory, HR, and operations",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#1D9E75",
        background_color: "#ffffff",
        categories: ["business", "productivity"],
        icons: [
          { src: "/icon-72.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/icon-96.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/icon-128.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icon-152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Clock In/Out", short_name: "Clock", url: "/attendance/clock-in", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Sales Orders", short_name: "Orders", url: "/sales/orders", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Chat", short_name: "Chat", url: "/chat", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
          { name: "Inventory", short_name: "Inventory", url: "/inventory", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith("supabase.co") && url.pathname.startsWith("/rest/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith("supabase.co") &&
              (url.pathname.startsWith("/realtime/") ||
                url.pathname.startsWith("/auth/") ||
                url.pathname.startsWith("/storage/v1/object/sign")),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "image" ||
              request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "app-shell" },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
