// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'

import mdx from '@astrojs/mdx'

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), mdx()],
  site: 'https://logos.github.io',
  base: '/logos',

  adapter: node({
    mode: 'standalone'
  })
})