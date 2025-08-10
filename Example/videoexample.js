// ===== MINDS EYE - VIDEO PLAYER =====

// Video Player Variables
// Note: These variables are defined in main.js to avoid conflicts
let videoIsPlaying = false;
let videoControlsTimeout = null;
let videoPlayerMode = 'centered';

// ===== VIDEO PLAYLIST FUNCTIONS =====
// Note: Main video playlist functions are in media.js
// This file contains only the basic video player functionality

// Note: updateVideoPlaylistDisplay is defined in media.js

function videoPlayVideo(index) {
  if (index < 0 || index >= videoPlaylist.length) return;
  
  videoCurrentIndex = index;
  const url = videoPlaylist[index];
  const videoId = extractYouTubeId(url);
  
  if (videoId) {
    // Try different autoplay settings to work around restrictions
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=0&enablejsapi=1&origin=${window.location.origin}`;
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe) {
      videoIframe.src = embedUrl;
      videoIframe.style.display = 'block';
      videoIframe.style.zIndex = '1';
      videoIsPlaying = true;
      updateVideoPlaylistDisplay();
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Video Playing video:', { index: index + 1, total: videoPlaylist.length, videoId: videoId }, 'VIDEO');
      
      // Add event listener for iframe load to handle autoplay restrictions
      videoIframe.onload = function() {
        // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug('Video iframe loaded', null, 'VIDEO');
        // Try to force play after load
        setTimeout(() => {
          try {
            videoIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            // Note: This file is an example - in production, use logger.debug() instead
            // logger.debug('Attempted to force play video', null, 'VIDEO');
          } catch (error) {
            // Note: This file is an example - in production, use logger.warn() instead
            // logger.warn('Could not force play video (autoplay restriction)', null, 'VIDEO');
          }
        }, 1000);
      };
    }
  } else {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error('Invalid YouTube URL', { url: url }, 'VIDEO');
  }
}

function extractYouTubeId(url) {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&?]+)/,
    /youtube\.com\/embed\/([^\s&?]+)/,
    /youtube\.com\/v\/([^\s&?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Note: This file is an example - in production, use logger.error() instead
  // logger.error('Could not extract YouTube ID from URL', { url: url }, 'VIDEO');
  return null;
}

async function fetchVideoTitle(videoId) {
  try {
    // Use YouTube oEmbed API to get video title
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return data.title;
    }
  } catch (error) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error('Error fetching video title', { videoId: videoId, error: error.message }, 'VIDEO');
  }
  return null;
}

// ===== VIDEO CONTROL FUNCTIONS =====
// Note: Video control functions are defined in media.js

// Note: videoTogglePlaylist is defined in media.js

// Note: videoToggleFullscreen is defined in media.js

// ===== VIDEO DISPLAY FUNCTIONS =====

// Auto-hide functionality removed - video controls now stay visible

// Note: startVideoPlaylistFadeOut is defined in media.js

// Note: showVideoControls is defined in media.js

// Note: showVideoPlaylist is defined in media.js

// ===== VIDEO LIFECYCLE FUNCTIONS =====

// Note: videoClose is defined in media.js

function forceCloseVideo() {
  // Note: This file is an example - in production, use logger.info() instead
  // logger.info('Force closing Video', null, 'VIDEO');
  const elements = ['videoPlayer', 'videoControls', 'videoPlaylist', 'videoIframe'];
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '-1';
    }
  });
  videoIsPlaying = false;
  videoPlaylistVisible = false;
}

// Note: toggleVideoPlayer is defined in media.js

// ===== VIDEO.JS LOADED =====
// Note: This file is an example - in production, use logger.info() instead
// logger.info('Video.js loaded successfully', null, 'SYSTEM'); 