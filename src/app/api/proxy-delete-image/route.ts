import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ success: false, message: 'Image URL is required' }, { status: 400 });
    }

    // Extract filename from URL (e.g. /uploads/123.png -> 123.png)
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json({ success: false, message: 'Invalid image URL' }, { status: 400 });
    }

    // Locate the Next.js public/uploads directory
    // In Hostinger's standalone mode, process.cwd() is often .next/standalone
    const cwd = process.cwd();
    const isStandalone = cwd.includes('.next') && cwd.includes('standalone');
    const rootDir = isStandalone ? path.join(cwd, '../../') : cwd;
    const uploadDir = path.join(rootDir, 'public', 'uploads');
    const imagePath = path.join(uploadDir, filename);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      return NextResponse.json({ success: true, message: 'Image removed from directory' });
    } else {
      // If we can't find it locally, we just return success anyway so the UI can clear it.
      return NextResponse.json({ success: true, message: 'Image path not found, but removed from form' });
    }
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete image' }, { status: 500 });
  }
}
