import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://anattasati.org',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
