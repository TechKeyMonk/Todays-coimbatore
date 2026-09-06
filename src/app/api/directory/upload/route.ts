import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const listingId = (formData.get('listingId') as string) || 'temp';
    const slotIndex = (formData.get('slotIndex') as string) || '0';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed formats: PNG, JPG, JPEG, WEBP, AVIF`,
        },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        },
        { status: 400 }
      );
    }

    // Derive clean extension
    let ext = 'jpg';
    if (file.type.includes('png')) ext = 'png';
    else if (file.type.includes('webp')) ext = 'webp';
    else if (file.type.includes('avif')) ext = 'avif';
    else if (file.name.includes('.')) {
      ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    }

    const sanitizedListingId = listingId.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const timestamp = Date.now();
    const filePath = `listings/${sanitizedListingId}/${timestamp}_${slotIndex}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('directory-gallery')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[directory/upload] Supabase upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('directory-gallery')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (err: any) {
    console.error('[directory/upload] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
