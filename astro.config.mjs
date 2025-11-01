// @ts-check
import { defineConfig, envField } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
const isDev = process.env.NODE_ENV === "development";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { host: "127.0.0.1", port: 3000 },
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret" }),
      E2E_USERNAME: envField.string({ context: "server", access: "secret", optional: true }),
      E2E_PASSWORD: envField.string({ context: "server", access: "secret", optional: true }),
      E2E_NORMAL_USERNAME: envField.string({ context: "server", access: "secret", optional: true }),
      E2E_NORMAL_PASSWORD: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: isDev
    ? node({
        mode: "standalone",
      })
    : cloudflare({
        imageService: "compile",
      }),
});
