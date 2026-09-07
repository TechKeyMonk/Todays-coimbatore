/**
 * Video Detection Utilities
 * Ensures 'Watch Video' triggers only appear if an article genuinely possesses a playable video stream/file.
 */

export function isValidVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'none' ||
    trimmed === 'false'
  ) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  // Reject static images masquerading as video URLs
  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.avif') ||
    (lower.includes('unsplash.com') && !lower.includes('video'))
  ) {
    return false;
  }

  // Recognizable video streaming platforms & extensions
  if (
    lower.includes('youtube.com/watch') ||
    lower.includes('youtube.com/embed') ||
    lower.includes('youtube.com/shorts') ||
    lower.includes('youtu.be/') ||
    lower.includes('vimeo.com/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m3u8') ||
    lower.startsWith('local-video://')
  ) {
    return true;
  }

  // Generic http/https stream check (must have video indicators in URL path/query)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return (
      lower.includes('video') ||
      lower.includes('stream') ||
      lower.includes('player') ||
      lower.includes('.mp4') ||
      lower.includes('.webm')
    );
  }

  return false;
}

export function hasActualVideo(item?: {
  mediaType?: string | null;
  videoUrl?: string | null;
  mediaUrl?: string | null;
} | null): boolean {
  if (!item) return false;

  // 1. Check explicit videoUrl
  if (isValidVideoUrl(item.videoUrl)) {
    return true;
  }

  // 2. Check mediaUrl if mediaType is video
  if (item.mediaType === 'video' && isValidVideoUrl(item.mediaUrl)) {
    return true;
  }

  return false;
}
