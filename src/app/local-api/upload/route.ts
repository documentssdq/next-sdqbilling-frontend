import { NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import { saveUploadedFile, deleteUploadedFile } from "@/utils/uploadStorage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase();
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".gif"];

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only PNG, JPG, JPEG, WEBP, SVG, and GIF are allowed." },
        { status: 400 }
      );
    }
    const uniqueFilename = `${crypto.randomUUID()}${ext}`;

    const folder = formData.get("folder") as string | null;

    if (folder && (folder.includes("..") || folder.startsWith("/") || folder.startsWith("\\"))) {
      return NextResponse.json(
        { success: false, message: "Invalid folder name" },
        { status: 400 }
      );
    }

    const cleanFolder =
      folder && typeof folder === "string"
        ? folder.replace(/^[/\\]+/, "").replace(/[/\\]+$/, "")
        : "";

    const relativePath = cleanFolder ? `${cleanFolder}/${uniqueFilename}` : uniqueFilename;

    // Save across both persistent and standalone directories
    saveUploadedFile(relativePath, buffer);

    const url = `/uploads/${relativePath}`;

    return NextResponse.json(
      { success: true, url, data: { url }, message: "File uploaded successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json({ success: false, message: "No file URL provided" }, { status: 400 });
    }

    const urlObj = new URL(fileUrl, "http://localhost");
    const pathname = urlObj.pathname;

    if (!pathname.startsWith("/uploads/")) {
      return NextResponse.json({ success: false, message: "Invalid file path" }, { status: 400 });
    }

    const filename = pathname.replace(/^\/uploads\//, "");
    if (filename.includes("..")) {
      return NextResponse.json({ success: false, message: "Invalid filename" }, { status: 400 });
    }

    const deleted = deleteUploadedFile(filename);

    if (deleted) {
      return NextResponse.json({ success: true, message: "File deleted successfully" });
    } else {
      // Return success so UI state can still be cleared
      return NextResponse.json({ success: true, message: "File not found locally, cleared from form" });
    }
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
