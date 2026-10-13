import { defineConfig } from 'vite';

// Relative base so the build can be dropped on any static host (GitHub Pages, Netlify, S3…)
export default defineConfig({ base: './' });
