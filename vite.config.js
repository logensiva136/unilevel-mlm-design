import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' makes every asset reference relative, so the same build works at
// a user site (username.github.io) AND at a project subpath
// (username.github.io/ledgerline/) without reconfiguring. This app has no
// client-side router, so relative base is safe — it's the usual cause of a
// blank page with 404s on /assets/* after a GitHub Pages deploy.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
