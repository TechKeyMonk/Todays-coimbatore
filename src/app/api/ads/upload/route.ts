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
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed formats: PNG, JPG, JPEG, WEBP, AVIF, GIF`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        },
        { status: 400 }
      );
    }

    let ext = 'jpg';
    if (file.type.includes('png')) ext = 'png';
    else if (file.type.includes('webp')) ext = 'webp';
    else if (file.type.includes('avif')) ext = 'avif';
    else if (file.type.includes('gif')) ext = 'gif';
    else if (file.name && file.name.includes('.')) {
      ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `ad_${timestamp}_${randomStr}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Primary Upload: Upload to ad-creatives using supabaseAdmin (bypasses RLS)
    let uploadError: any = null;
    let targetBucket = 'ad-creatives';

    const { error: adErr } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    uploadError = adErr;

    // 2. Secondary Fallback: Upload to directory-gallery if ad-creatives encounters an issue
    if (uploadError) {
      console.warn('[ads/upload] ad-creatives bucket upload notice, trying directory-gallery fallback:', uploadError);
      targetBucket = 'directory-gallery';
      const fallbackUpload = await supabaseAdmin.storage
        .from(targetBucket)
        .upload(`ads/${fileName}`, buffer, {
          contentType: file.type,
          upsert: true,
        });
      uploadError = fallbackUpload.error;
    }

    // If storage upload succeeded
    if (!uploadError) {
      const filePath = targetBucket === 'directory-gallery' ? `ads/${fileName}` : fileName;
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: filePath,
      });
    }

    // 3. Tertiary Zero-Fail Fallback: Return Base64 data URL so user is never blocked
    console.warn('[ads/upload] Supabase storage upload failed, using Base64 Data URL fallback:', uploadError);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fallback: true,
    });
  } catch (err: any) {
    console.error('[ads/upload] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
