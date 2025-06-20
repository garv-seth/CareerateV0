import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';
import react from '@vitejs/plugin-react';

const outDir = resolve(__dirname, 'dist');

// Function to prepare manifest.json for different environments
function prepareManifest(mode: string) {
  const manifestPath = resolve(__dirname, 'src/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Adjust manifest for Vite's build output
  manifest.background.service_worker = 'background/index.js';
  manifest.content_scripts[0].js = ['content/index.js'];
  // CSS for content script might be injected by Vite, or handled separately
  // For now, assume Vite handles CSS injection if imported in TS, or remove if not bundled by Vite this way.
  // manifest.content_scripts[0].css = ['content/style.css']; 
  manifest.action.default_popup = 'popup/index.html';
  manifest.options_page = 'options/index.html';
  manifest.icons = {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  };
  manifest.action.default_icon = manifest.icons;

  // Example: Adjust host_permissions for development vs production
  if (mode === 'development') {
    manifest.host_permissions = ["<all_urls>"]; // More permissive for local dev
  } else {
    manifest.host_permissions = ["https://careerate.com/*", "https://*.azurewebsites.net/*"]; // TODO: Finalize production URLs
  }
  
  // Ensure web_accessible_resources paths are correct if moved to assets
  manifest.web_accessible_resources = [
    {
      "resources": ["assets/icons/*", "assets/some_other_resource_if_needed/*"],
      "matches": ["<all_urls>"]
    }
  ];

  fs.ensureDirSync(outDir);
  fs.writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Manifest prepared for mode:', mode);
}

export default defineConfig({
  plugins: [react(),
    {
      name: 'prepare-manifest',
      buildStart() {
        prepareManifest('production');
      },
      watchChange(id, change) {
        // Watch the source manifest for changes
        if (id.endsWith('src/manifest.json')) {
          prepareManifest('production');
        }
      }
    },
  ],
  root: resolve(__dirname, 'src'), // Set project root to src/
  publicDir: resolve(__dirname, 'src/public'), // Static assets like icons are in src/public/
  build: {
    outDir,
    emptyOutDir: true, // Clears the dist directory before each build
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: `src/[name]/index.js`,
        chunkFileNames: `src/[name]/[name].js`,
        assetFileNames: `src/[name]/[name].[ext]`,
      },
    },
    minify: true, // Minify only in production
    sourcemap: false, // Sourcemaps for dev
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}); 