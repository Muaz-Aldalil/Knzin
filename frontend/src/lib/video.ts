export type VideoProvider = 'youtube' | 'vimeo' | 'direct';

export interface ParsedVideo {
  provider: VideoProvider;
  id: string;
  embedUrl: string;
}

/**
 * Parses video URL into provider, ID, and safe embed URL with timestamp support
 */
export function parseVideoUrl(url: string, startSeconds = 0): ParsedVideo {
  if (!url) {
    return {
      provider: 'youtube',
      id: '',
      embedUrl: '',
    };
  }

  // YouTube match: watch?v=ID, youtu.be/ID, embed/ID
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);

  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      enablejsapi: '1',
    });
    if (startSeconds > 0) {
      params.set('start', Math.floor(startSeconds).toString());
    }
    return {
      provider: 'youtube',
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
    };
  }

  // Vimeo match: vimeo.com/ID
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);

  if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[1])) {
    const id = vimeoMatch[3] || vimeoMatch[1];
    let embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1`;
    if (startSeconds > 0) {
      embedUrl += `#t=${Math.floor(startSeconds)}s`;
    }
    return {
      provider: 'vimeo',
      id,
      embedUrl,
    };
  }

  // Direct video URL or fallback
  return {
    provider: 'direct',
    id: url,
    embedUrl: url,
  };
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats minutes or seconds into a localized human readable duration
 */
export function formatDurationLabel(minutes: number, locale = 'ar'): string {
  if (locale === 'ar') {
    return `${minutes} دقيقة`;
  }
  return `${minutes} min`;
}
