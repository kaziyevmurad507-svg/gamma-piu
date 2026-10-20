import { defineConfig } from "@playwright/test";

// Tests open the real site on port 3000 (data comes from your Supabase in .env.local)
export default defineConfig({
  testDir: "./tests",
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    colorScheme: "light", // the theme test expects the light theme at start
    viewport: { width: 1280, height: 800 }, // desktop: the theme button is in the header here
    trace: "retain-on-failure",
  },
  // Starts the site if it is not running yet. If you already run it on port 3000, that one is used
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000/az",
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
