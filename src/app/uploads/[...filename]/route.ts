import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findUploadedFile, getContentType } from '@/utils/uploadStorage';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string[] | string }> }
) {
  try {
    const resolvedParams = await params;
    const rawFilename = resolvedParams.filename;

    // Normalizes segments into relative path
    const segments = Array.isArray(rawFilename)
      ? rawFilename
      : typeof rawFilename === 'string'
      ? [rawFilename]
      : [];

    if (segments.length === 0 || !segments[0]) {
      return new NextResponse('Image Not Found', { status: 404 });
    }

    const relativePath = path.join(...segments);
    const filePath = findUploadedFile(relativePath);

    if (!filePath) {
      return new NextResponse('Image Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getContentType(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
