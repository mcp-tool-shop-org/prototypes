// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://mcp-tool-shop-org.github.io',
  base: '/npm-escape-the-valley',
  integrations: [
    starlight({
      title: 'Escape the Valley',
      description: 'Oregon Trail-style survival game — handbook & reference',
      disable404Route: true,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/mcp-tool-shop-org/npm-escape-the-valley' },
      ],
      sidebar: [
        {
          label: 'Handbook',
          items: [
            { label: 'Welcome', slug: 'handbook' },
            { label: 'Getting Started', slug: 'handbook/getting-started' },
            { label: 'Gameplay', slug: 'handbook/gameplay' },
            { label: 'Platforms & Troubleshooting', slug: 'handbook/platforms' },
            { label: "Beginner's Survival Guide", slug: 'handbook/beginners' },
          ],
        },
      ],
      customCss: ['./src/styles/starlight-custom.css'],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
