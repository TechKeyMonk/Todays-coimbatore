'use client';

import React from 'react';

interface VideoPlayerProps {
  url?: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  className?: string;
}

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  // Match standard, short, embed, or shorts YouTube URLs
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title = 'Coimbatore Video Stream',
  poster,
  autoplay = true,
  className = 'w-full h-full aspect-video',
}) => {
  const youtubeId = extractYouTubeId(url);

  // If YouTube ID recognized, embed responsive YouTube player
  if (youtubeId) {
    return (
      <div className={`relative overflow-hidden bg-black rounded-lg ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // Fallback to default featured high-definition Covai stream or HTML5 video
  const defaultYouTubeId = '8V-2Z0m2c0s'; // Coimbatore Smart City & Western Ghats Aerial 4K

  if (url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('blob:') || url.startsWith('data:'))) {
    return (
      <div className={`relative overflow-hidden bg-black rounded-lg ${className}`}>
        <video
          src={url}
          poster={poster}
          controls
          autoPlay={autoplay}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black rounded-lg ${className}`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${defaultYouTubeId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};

export default VideoPlayer;
