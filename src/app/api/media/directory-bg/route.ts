import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Same-Origin & Referer Guard
    const referer = request.headers.get('referer') || '';
    const host = request.headers.get('host') || '';
    const secFetchSite = request.headers.get('sec-fetch-site') || '';

    // If request comes from an external domain or direct hotlinking without referer
    if (referer && !referer.includes(host) && secFetchSite === 'cross-site') {
      return new NextResponse('Forbidden - Hotlinking Prohibited', { status: 403 });
    }

    const videoFilePath = path.join(process.cwd(), 'public', 'directory-bg.mp4');

    if (!fs.existsSync(videoFilePath)) {
      return new NextResponse('Video not found', { status: 404 });
    }

    const stat = await fs.promises.stat(videoFilePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // 2. HTTP 206 Partial Content Support (Essential for smooth streaming on Safari / Chrome)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileStream = fs.createReadStream(videoFilePath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'video/mp4',
          'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-transform, max-age=3600',
        },
      });
    }

    // 3. Full Stream with Security Headers
    const fileStream = fs.createReadStream(videoFilePath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-transform, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Secure video stream error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
