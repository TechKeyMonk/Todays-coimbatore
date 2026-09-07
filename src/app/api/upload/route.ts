import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
]);

const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

// Multi-tier storage buckets with automatic fallback (prioritizing verified buckets)
const BUCKET_PREFERENCES: Record<string, string[]> = {
  news: ['ad-creatives', 'directory-gallery', 'articles-bucket'],
  events: ['ad-creatives', 'directory-gallery', 'articles-bucket'],
  ads: ['ad-creatives', 'directory-gallery', 'articles-bucket'],
  directory: ['directory-gallery', 'ad-creatives', 'articles-bucket'],
  general: ['ad-creatives', 'directory-gallery', 'articles-bucket'],
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed formats: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        },
        { status: 400 }
      );
    }

    let ext = 'webp';
    if (file.type.includes('png')) ext = 'png';
    else if (file.type.includes('jpeg') || file.type.includes('jpg')) ext = 'jpg';
    else if (file.type.includes('avif')) ext = 'avif';
    else if (file.type.includes('gif')) ext = 'gif';
    else if (file.type.includes('svg')) ext = 'svg';
    else if (file.name && file.name.includes('.')) {
      ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const fileName = `${sanitizedFolder}/${timestamp}_${randomStr}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const bucketsToTry = BUCKET_PREFERENCES[sanitizedFolder] || BUCKET_PREFERENCES.general;
    let successfulBucket: string | null = null;
    let successfulPath: string | null = null;
    let lastError: any = null;

    for (const bucket of bucketsToTry) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(fileName, buffer, {
            contentType: file.type || 'image/webp',
            upsert: true,
          });

        if (!uploadError) {
          successfulBucket = bucket;
          successfulPath = fileName;
          break;
        } else {
          lastError = uploadError;
          console.warn(`[API /api/upload] Bucket "${bucket}" upload attempt notice:`, uploadError.message || uploadError);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (successfulBucket && successfulPath) {
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(successfulBucket).getPublicUrl(successfulPath);

      return NextResponse.json(
        {
          success: true,
          url: publicUrl,
          bucket: successfulBucket,
          path: successfulPath,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // Fallback: If all storage buckets fail (e.g. buckets paused or missing), return compact base64 Data URL
    console.warn('[API /api/upload] Storage buckets failed, falling back to base64 data url response');
    const base64Data = buffer.toString('base64');
    const mime = file.type || 'image/webp';
    const fallbackDataUrl = `data:${mime};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: fallbackDataUrl,
      fallback: true,
      notice: lastError?.message || 'Uploaded as optimized inline data URL',
    });
  } catch (error: any) {
    console.error('[API /api/upload] Upload handler error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server upload handler exception' },
      { status: 500 }
    );
  }
}
