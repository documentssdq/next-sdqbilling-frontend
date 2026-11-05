import { NextResponse } from 'next/server';
import { saveUploadedFile } from '@/utils/uploadStorage';

export async function POST(req: Request) {
  try {
    const { base64, filename, folder } = await req.json();
    if (!base64) {
      return NextResponse.json({ success: false, message: 'Base64 image data is required' }, { status: 400 });
    }

    // Extract base64 data safely regardless of mime type (supports svg, ico, png, etc.)
    const commaIndex = base64.indexOf(',');
    if (commaIndex === -1 || !base64.startsWith('data:')) {
      return NextResponse.json({ success: false, message: 'Invalid base64 image data' }, { status: 400 });
    }

    const base64Data = base64.substring(commaIndex + 1);
    const buffer = Buffer.from(base64Data, 'base64');

    // Ensure filename is safe and unique
    const safeFilename = (filename || 'file.png').replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeFilename}`;

    const cleanFolder =
      folder && typeof folder === 'string' && !folder.includes('..')
        ? folder.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '')
        : '';

    const relativePath = cleanFolder ? `${cleanFolder}/${uniqueFilename}` : uniqueFilename;

    // Persist file across both permanent and standalone directories
    saveUploadedFile(relativePath, buffer);

    const url = `/uploads/${relativePath}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url,
      data: { url },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
