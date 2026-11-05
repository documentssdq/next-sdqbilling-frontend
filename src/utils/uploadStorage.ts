import fs from 'fs';
import path from 'path';

/**
 * Returns all potential upload base directories across both standard
 * and standalone production environments.
 */
export function getUploadDirectories() {
  const cwd = process.cwd();
  const isStandalone = cwd.includes('.next') && cwd.includes('standalone');

  // Permanent project root directory (survives `next build`)
  const rootDir = isStandalone ? path.resolve(cwd, '../../') : path.resolve(cwd);

  // Primary permanent uploads directory
  const primaryUploadDir = path.join(rootDir, 'public', 'uploads');

  // Candidate directories for standalone server and runtime lookups
  const candidateDirs: string[] = [
    primaryUploadDir,
    path.join(cwd, 'public', 'uploads'),
    path.join(rootDir, '.next', 'standalone', 'public', 'uploads'),
  ];

  // Remove duplicates
  const uniqueDirs = Array.from(new Set(candidateDirs));

  return {
    rootDir,
    primaryUploadDir,
    candidateDirs: uniqueDirs,
  };
}

/**
 * Save an uploaded buffer to the primary uploads directory,
 * and mirror it to standalone directories if they exist.
 */
export function saveUploadedFile(relativePath: string, buffer: Buffer): void {
  const { primaryUploadDir, candidateDirs } = getUploadDirectories();

  // Normalize relative path
  const safeRelative = relativePath.replace(/^[/\\]+/, '').replace(/\.\.[/\\]/g, '');

  // 1. Always save to the primary persistent directory
  const primaryPath = path.join(primaryUploadDir, safeRelative);
  const primaryDir = path.dirname(primaryPath);
  if (!fs.existsSync(primaryDir)) {
    fs.mkdirSync(primaryDir, { recursive: true });
  }
  fs.writeFileSync(primaryPath, buffer);

  // 2. Also mirror to standalone directories if they exist
  for (const dir of candidateDirs) {
    if (dir !== primaryUploadDir) {
      if (fs.existsSync(path.dirname(dir))) {
        const mirrorPath = path.join(dir, safeRelative);
        const mirrorDir = path.dirname(mirrorPath);
        if (!fs.existsSync(mirrorDir)) {
          fs.mkdirSync(mirrorDir, { recursive: true });
        }
        try {
          fs.writeFileSync(mirrorPath, buffer);
        } catch {
          // ignore mirror write errors if standalone is read-only
        }
      }
    }
  }
}

/**
 * Finds an uploaded file by searching across all candidate upload directories,
 * with fallbacks for subfolder mismatches and public/images.
 */
export function findUploadedFile(relativePath: string): string | null {
  const { rootDir, candidateDirs } = getUploadDirectories();

  // Normalize path and prevent directory traversal
  const safeRelative = relativePath.replace(/^[/\\]+/, '').replace(/\.\.[/\\]/g, '');

  // 1. Direct match in candidate upload dirs
  for (const dir of candidateDirs) {
    const fullPath = path.join(dir, safeRelative);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  // 2. Fallback: if safeRelative has subfolder (e.g. "profile/avatar.png"),
  // check directly in the root of uploads (e.g. "avatar.png")
  const basename = path.basename(safeRelative);
  if (basename && basename !== safeRelative) {
    for (const dir of candidateDirs) {
      const flatPath = path.join(dir, basename);
      if (fs.existsSync(flatPath) && fs.statSync(flatPath).isFile()) {
        return flatPath;
      }
    }
  }

  // 3. Fallback: check public/images (for default logos, favicons, etc.)
  const imageDirs = [
    path.join(rootDir, 'public', 'images'),
    path.join(process.cwd(), 'public', 'images'),
    path.join(rootDir, '.next', 'standalone', 'public', 'images'),
  ];
  for (const dir of imageDirs) {
    const imgPath = path.join(dir, basename);
    if (fs.existsSync(imgPath) && fs.statSync(imgPath).isFile()) {
      return imgPath;
    }
  }

  return null;
}

/**
 * Deletes an uploaded file across all candidate upload directories.
 */
export function deleteUploadedFile(relativePath: string): boolean {
  const { candidateDirs } = getUploadDirectories();
  const safeRelative = relativePath.replace(/^[/\\]+/, '').replace(/\.\.[/\\]/g, '');
  const basename = path.basename(safeRelative);

  let deleted = false;
  for (const dir of candidateDirs) {
    const fullPath = path.join(dir, safeRelative);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      try {
        fs.unlinkSync(fullPath);
        deleted = true;
      } catch {}
    }
    // Also check flat basename if different
    if (basename && basename !== safeRelative) {
      const flatPath = path.join(dir, basename);
      if (fs.existsSync(flatPath) && fs.statSync(flatPath).isFile()) {
        try {
          fs.unlinkSync(flatPath);
          deleted = true;
        } catch {}
      }
    }
  }
  return deleted;
}

/**
 * Resolves content type from filename extension.
 */
export function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.ico':
      return 'image/x-icon';
    case '.avif':
      return 'image/avif';
    case '.bmp':
      return 'image/bmp';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

