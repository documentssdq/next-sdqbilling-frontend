import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    
    // Ensure filename is unique
    const safeFilename = (filename || 'file.png').replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeFilename}`;
    
    // Locate the Next.js public/uploads directory
    // In Hostinger's standalone mode, process.cwd() is often .next/standalone
    const cwd = process.cwd();
    const isStandalone = cwd.includes('.next') && cwd.includes('standalone');
    const rootDir = isStandalone ? path.join(cwd, '../../') : cwd;
    const uploadDir = path.join(rootDir, 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Save file locally to Next.js
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: `/uploads/${uniqueFilename}`
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
