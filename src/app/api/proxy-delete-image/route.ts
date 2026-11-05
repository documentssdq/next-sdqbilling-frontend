import { NextResponse } from 'next/server';
import { deleteUploadedFile } from '@/utils/uploadStorage';

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ success: false, message: 'Image URL is required' }, { status: 400 });
    }

    // Extract relative path from URL (e.g. /uploads/profile/123.png -> profile/123.png)
    let relativePath = imageUrl;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      try {
        const u = new URL(relativePath);
        relativePath = u.pathname;
      } catch {}
    }
    relativePath = relativePath.replace(/^\/uploads\//, '').replace(/^\/+/, '');

    if (!relativePath || relativePath.includes('..')) {
      return NextResponse.json({ success: false, message: 'Invalid image URL' }, { status: 400 });
    }

    const deleted = deleteUploadedFile(relativePath);

    if (deleted) {
      return NextResponse.json({ success: true, message: 'Image removed from directory' });
    } else {
      return NextResponse.json({ success: true, message: 'Image path not found, but removed from form' });
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
