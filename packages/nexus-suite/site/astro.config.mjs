// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mcp-tool-shop-org.github.io',
  base: '/nexus-suite',
  integrations: [
    starlight({
      title: 'Nexus Suite',
      description: 'Nexus Suite handbook',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mcp-tool-shop-org/nexus-suite' }],
      sidebar: [{ label: 'Handbook', autogenerate: { directory: 'handbook' } }],
      customCss: ['./src/styles/starlight-custom.css'],
      disable404Route: true,
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
