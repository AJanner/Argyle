// ===== MINDS EYE - VIDEO PLAYER =====

// Video Player Variables
// Note: These variables are defined in main.js to avoid conflicts
let videoIsPlaying = false;
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
    // Use the working approach from the example
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=0&enablejsapi=1&origin=${window.location.origin}`;
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe) {
      videoIframe.src = embedUrl;
      videoIframe.style.display = 'block';
      videoIframe.style.zIndex = '1';
      videoIsPlaying = true;
      updateVideoPlaylistDisplay();
      console.log('🎵 Video Playing video:', index + 1, 'of', videoPlaylist.length, 'Video ID:', videoId);
      
      // Add event listener for iframe load to handle autoplay restrictions
      videoIframe.onload = function() {
        console.log('🎥 Video iframe loaded');
        // Try to force play after load
        setTimeout(() => {
          try {
            videoIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            console.log('🎥 Attempted to force play video');
          } catch (error) {
            console.log('⚠️ Could not force play video (autoplay restriction)');
          }
        }, 1000);
      };
    }
  } else {
    console.error('❌ Invalid YouTube URL:', url);
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
  
  console.error('❌ Could not extract YouTube ID from URL:', url);
  return null;
}

async function fetchVideoTitle(videoId) {
  try {
    // Use YouTube oEmbed API to get video title
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors' // Explicitly set CORS mode
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully fetched video title for', videoId, ':', data.title);
      return data.title;
    } else {
      console.warn('⚠️ YouTube API returned status:', response.status, 'for video', videoId);
    }
  } catch (error) {
    console.warn('⚠️ Network error fetching video title for', videoId, ':', error.message);
    // Don't log the full error to avoid console spam
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
  console.log('🚨 Force closing Video');
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
console.log('🔧 Video.js loaded successfully'); 