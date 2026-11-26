import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes every asset path relative, so the built `dist/` folder
// works on GitHub Pages (https://<user>.github.io/<repo>/) or any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
});
