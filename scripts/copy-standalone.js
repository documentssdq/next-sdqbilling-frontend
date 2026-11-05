const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const standaloneDir = path.join(rootDir, '.next', 'standalone');

  if (!fs.existsSync(standaloneDir)) {
    console.log('[standalone-copy] No .next/standalone directory found. Skipping static asset copy.');
    return;
  }

  console.log('[standalone-copy] Copying public and static assets into .next/standalone for production...');

  // 1. Copy public directory -> .next/standalone/public
  const publicSrc = path.join(rootDir, 'public');
  const publicDest = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicSrc)) {
    copyDirRecursive(publicSrc, publicDest);
    console.log(' -> Copied public/ to .next/standalone/public/');
  }

  // 2. Copy .next/static directory -> .next/standalone/.next/static
  const staticSrc = path.join(rootDir, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    copyDirRecursive(staticSrc, staticDest);
    console.log(' -> Copied .next/static/ to .next/standalone/.next/static/');
  }

  console.log('[standalone-copy] Assets successfully prepared for production.');
}

main();

