// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Set to the band's real domain once live (used for canonical URLs + sitemaps).
  site: 'https://REPLACE_WITH_DOMAIN',
  adapter: cloudflare({
    // Expose the D1/KV/R2 bindings from wrangler.jsonc to `astro dev` so the API
    // endpoints work locally against emulated Cloudflare services.
    platformProxy: { enabled: true },
    // Optimize images with sharp at build time instead of via a runtime
    // Cloudflare Images binding — one less thing to provision.
    imageService: 'compile',
  }),
});