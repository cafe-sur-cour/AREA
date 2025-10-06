import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    void request;
    const apkPath = path.join(process.cwd(), 'mobile', 'area.apk');

    try {
      await fs.access(apkPath);
    } catch (error) {
      void error;
      console.error('APK file not found:', apkPath);
      return new NextResponse('APK file not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(apkPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="area.apk"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving APK file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
