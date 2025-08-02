// ===== MINDS EYE - VIDEO PLAYER =====

// Video Player Variables
let videoPlaylist = [];
let videoTitles = [];
let videoCurrentIndex = 0;
let videoIsPlaying = false;
let videoPlaylistVisible = false;
let videoControlsTimeout = null;
let videoPlaylistTimeout = null;
let videoPlayerMode = 'centered';

// ===== VIDEO PLAYLIST FUNCTIONS =====

async function loadVideoPlaylist() {
  try {
    console.log('📋 Video Loading playlist from s25_playlist.txt...');
    const response = await fetch('s25_playlist.txt');
    console.log('📋 Video Response status:', response.status);
    console.log('📋 Video Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('📋 Video Raw text (first 200 chars):', text.substring(0, 200));
    
    // Filter out empty lines and HTML content
    videoPlaylist = text.split('\n')
      .filter(line => line.trim() !== '')
      .filter(line => line.includes('youtube.com/watch'))
      .map(line => line.trim());
    
    console.log('📋 Video Filtered playlist:', videoPlaylist);
    console.log('📋 Video Playlist loaded:', videoPlaylist.length, 'videos');
    
    if (videoPlaylist.length === 0) {
      throw new Error('No valid YouTube URLs found in playlist');
    }
    
    // Fetch video titles
    videoTitles = [];
    for (let i = 0; i < videoPlaylist.length; i++) {
      const videoId = extractYouTubeId(videoPlaylist[i]);
      if (videoId) {
        const title = await fetchVideoTitle(videoId);
        videoTitles[i] = title || `Video ${i + 1}`;
      } else {
        videoTitles[i] = `Video ${i + 1}`;
      }
    }
    
    console.log('📋 Video Video titles loaded:', videoTitles);
    updateVideoPlaylistDisplay();
  } catch (error) {
    console.error('❌ Error loading Video playlist:', error);
    // Fallback to default playlist
    videoPlaylist = [
      'https://www.youtube.com/watch?v=36YnV9STBqc',
      'https://www.youtube.com/watch?v=Ihm9OQWmibA',
      'https://www.youtube.com/watch?v=WsDyRAPFBC8'
    ];
    console.log('📋 Video Using fallback playlist:', videoPlaylist);
    updateVideoPlaylistDisplay();
  }
}

function updateVideoPlaylistDisplay() {
  const playlistContainer = document.getElementById('videoPlaylistItems');
  if (!playlistContainer) {
    console.error('❌ Video Playlist container not found');
    return;
  }
  
  console.log('📋 Video Updating playlist display with', videoPlaylist.length, 'videos');
  playlistContainer.innerHTML = '';
  
  videoPlaylist.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    
    // Use video title if available, otherwise fall back to ID
    const videoId = extractYouTubeId(url);
    const title = videoTitles[index] || `Video ${index + 1}`;
    const displayText = videoId ? `${title} (${videoId})` : `${title} (Invalid URL)`;
    item.textContent = displayText;
    
    item.onclick = () => {
      console.log('📋 Video Clicked playlist item:', index, 'Title:', title, 'URL:', url);
      videoPlayVideo(index);
      showVideoPlaylist(); // Show playlist when clicking
    };
    
    if (index === videoCurrentIndex) {
      item.classList.add('playing');
    }
    playlistContainer.appendChild(item);
  });
  
  console.log('📋 Video Playlist display updated');
}

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

function videoPlay() {
  if (videoPlaylist.length > 0) {
    videoPlayVideo(videoCurrentIndex);
    showVideoControls();
    console.log('▶️ Video Play requested for video:', videoCurrentIndex + 1);
  } else {
    console.log('❌ No videos in playlist');
  }
}

function videoPause() {
  // YouTube iframe doesn't support pause via JavaScript
  // This would require YouTube API integration
  console.log('⏸️ Video Pause requested (requires YouTube API)');
  showVideoControls();
}

function videoNext() {
  if (videoPlaylist.length > 0) {
    videoCurrentIndex = (videoCurrentIndex + 1) % videoPlaylist.length;
    videoPlayVideo(videoCurrentIndex);
    showVideoControls();
    console.log('⏭️ Video Next video:', videoCurrentIndex + 1);
  } else {
    console.log('❌ No videos in playlist');
  }
}

function videoPrev() {
  if (videoPlaylist.length > 0) {
    videoCurrentIndex = videoCurrentIndex === 0 ? videoPlaylist.length - 1 : videoCurrentIndex - 1;
    videoPlayVideo(videoCurrentIndex);
    showVideoControls();
    console.log('⏮️ Video Previous video:', videoCurrentIndex + 1);
  } else {
    console.log('❌ No videos in playlist');
  }
}

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

function videoClose() {
  console.log('🔒 Video Close called');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoControls = document.getElementById('videoControls');
  const videoPlaylist = document.getElementById('videoPlaylist');
  const videoIframe = document.getElementById('videoIframe');
  
  // Clear fade-out timers
  if (videoControlsTimeout) {
    clearTimeout(videoControlsTimeout);
    videoControlsTimeout = null;
  }
  if (videoPlaylistTimeout) {
    clearTimeout(videoPlaylistTimeout);
    videoPlaylistTimeout = null;
  }
  
  if (videoPlayer) {
    videoPlayer.style.display = 'none';
    videoPlayer.style.pointerEvents = 'none';
    videoPlayer.className = 'centered'; // Reset to centered mode
  }
  if (videoControls) {
    videoControls.style.display = 'none';
    videoControls.style.pointerEvents = 'none';
    videoControls.style.opacity = '1'; // Reset opacity
  }
  if (videoPlaylist) {
    videoPlaylist.style.display = 'none';
    videoPlaylist.style.pointerEvents = 'none';
    videoPlaylist.style.opacity = '1'; // Reset opacity
  }
  if (videoIframe) {
    videoIframe.src = '';
    videoIframe.style.display = 'none';
  }
  
  videoIsPlaying = false;
  videoPlaylistVisible = false;
  videoPlayerMode = 'centered'; // Reset to centered mode
  console.log('✅ Video player closed');
}

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

function toggleVideoPlayer() {
  console.log('🎥 Toggle Video player');
  
  const videoPlayer = document.getElementById('videoPlayer');
  const videoIframe = document.getElementById('videoIframe');
  
  if (videoPlayer) {
    if (videoPlayer.style.display === 'none' || videoPlayer.style.display === '') {
      // Show player in centered mode
      videoPlayer.style.display = 'block';
      videoPlayer.style.pointerEvents = 'auto';
      videoPlayer.className = 'centered';
      videoPlayerMode = 'centered';
      
      // Ensure iframe is visible
      if (videoIframe) {
        videoIframe.style.display = 'block';
        videoIframe.style.zIndex = '1';
      }
      
      // Show controls
      const videoControls = document.getElementById('videoControls');
      if (videoControls) {
        videoControls.style.display = 'block';
        videoControls.style.pointerEvents = 'auto';
        videoControls.style.opacity = '1';
      }
      
      // Load playlist if not loaded
      if (videoPlaylist.length === 0) {
        loadVideoPlaylist();
      }
      
      // Start first video with a small delay to ensure proper loading
      if (videoPlaylist.length > 0) {
        setTimeout(() => {
          videoPlayVideo(0);
        }, 100);
      }
      
      startVideoControlsFadeOut();
      console.log('🎥 Video player opened');
      
      // Debug: Check if elements are visible
      setTimeout(() => {
        const player = document.getElementById('videoPlayer');
        const iframe = document.getElementById('videoIframe');
        console.log('🔍 Debug - Player visible:', player?.style.display);
        console.log('🔍 Debug - Iframe visible:', iframe?.style.display);
        console.log('🔍 Debug - Player z-index:', player?.style.zIndex);
        console.log('🔍 Debug - Iframe z-index:', iframe?.style.zIndex);
      }, 500);
    } else {
      // Hide player
      videoClose();
      console.log('🎥 Video player closed');
    }
  }
}

// ===== EXPORTS =====

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadVideoPlaylist,
    updateVideoPlaylistDisplay,
    videoPlayVideo,
    extractYouTubeId,
    fetchVideoTitle,
    videoPlay,
    videoPause,
    videoNext,
    videoPrev,
    videoTogglePlaylist,
    videoToggleFullscreen,
    startVideoControlsFadeOut,
    startVideoPlaylistFadeOut,
    showVideoControls,
    showVideoPlaylist,
    videoClose,
    forceCloseVideo,
    toggleVideoPlayer
  };
} 