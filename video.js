// ===== MINDS EYE - VIDEO PLAYER =====

// Video Player Variables
// Note: These variables are defined in main.js to avoid conflicts
let videoTitles = [];
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
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=0`;
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe) {
      videoIframe.src = embedUrl;
      videoIframe.style.display = 'block';
      videoIframe.style.zIndex = '1';
      videoIsPlaying = true;
      updateVideoPlaylistDisplay();
      console.log('🎵 Video Playing video:', index + 1, 'of', videoPlaylist.length, 'Video ID:', videoId);
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
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return data.title;
    }
  } catch (error) {
    console.error('❌ Error fetching video title for', videoId, ':', error);
  }
  return null;
}

// ===== VIDEO CONTROL FUNCTIONS =====
// Note: Video control functions are defined in media.js

function videoTogglePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  videoPlaylistVisible = !videoPlaylistVisible;
  
  if (videoPlaylistVisible) {
    playlist.style.display = 'block';
    playlist.style.opacity = '1';
    startVideoPlaylistFadeOut();
    console.log('📋 Video playlist shown');
  } else {
    playlist.style.display = 'none';
    playlist.style.opacity = '1'; // Reset opacity
    if (videoPlaylistTimeout) {
      clearTimeout(videoPlaylistTimeout);
      videoPlaylistTimeout = null;
    }
    console.log('📋 Video playlist hidden');
  }
}

function videoToggleFullscreen() {
  const videoPlayer = document.getElementById('videoPlayer');
  if (!videoPlayer) return;
  
  if (videoPlayerMode === 'fullscreen') {
    // Switch to centered mode
    videoPlayer.className = 'centered';
    videoPlayerMode = 'centered';
    console.log('📺 Video player switched to centered mode');
  } else {
    // Switch to fullscreen mode
    videoPlayer.className = 'fullscreen';
    videoPlayerMode = 'fullscreen';
    console.log('🖥️ Video player switched to fullscreen mode');
  }
  
  // Show controls when toggling
  showVideoControls();
}

// ===== VIDEO DISPLAY FUNCTIONS =====

function startVideoControlsFadeOut() {
  // Clear existing timeout
  if (videoControlsTimeout) {
    clearTimeout(videoControlsTimeout);
  }
  
  // Set new timeout for 10 seconds
  videoControlsTimeout = setTimeout(() => {
    const videoControls = document.getElementById('videoControls');
    if (videoControls && videoControls.style.display !== 'none') {
      videoControls.style.opacity = '0';
      console.log('⏰ Video controls faded out');
    }
  }, 10000);
}

function startVideoPlaylistFadeOut() {
  // Clear existing timeout
  if (videoPlaylistTimeout) {
    clearTimeout(videoPlaylistTimeout);
  }
  
  // Set new timeout for 10 seconds
  videoPlaylistTimeout = setTimeout(() => {
    const videoPlaylist = document.getElementById('videoPlaylist');
    if (videoPlaylist && videoPlaylist.style.display !== 'none') {
      videoPlaylist.style.opacity = '0';
      console.log('⏰ Video playlist faded out');
    }
  }, 10000);
}

function showVideoControls() {
  const videoControls = document.getElementById('videoControls');
  if (videoControls) {
    videoControls.style.opacity = '1';
    // Restart fade-out timer
    startVideoControlsFadeOut();
  }
}

function showVideoPlaylist() {
  const videoPlaylist = document.getElementById('videoPlaylist');
  if (videoPlaylist) {
    videoPlaylist.style.opacity = '1';
    // Restart fade-out timer
    startVideoPlaylistFadeOut();
  }
}

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