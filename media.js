// ===== MINDS EYE - MEDIA HANDLING =====

// ===== VIDEO PLAYLIST VARIABLES =====
let uploadedPlaylists = [];
let currentPlaylistIndex = -1;

// ===== UTILITY FUNCTIONS =====
function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== YOUTUBE FUNCTIONS =====

function loadYouTubeVideo() {
  const url = document.getElementById("youtubeLink").value;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/);
  const video = document.getElementById("bgVideo");
  const iframe = document.getElementById("ytFrame");
  
  if (match) {
    const videoId = match[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`;
    backgroundImage = null;
    video.style.display = "none";
    video.pause();
    iframe.src = embedUrl;
    iframe.style.display = "block";
  } else {
    alert("Invalid YouTube URL.");
  }
}

// ===== MUSIC FUNCTIONS =====

function toggleMusicPanel() {
  const musicPanel = document.getElementById('musicPanel');
  if (musicPanel.style.display === 'none' || musicPanel.style.display === '') {
    musicPanel.style.display = 'block';
    loadMusicList();
    
    // Auto-hide after 20 seconds
    setTimeout(() => {
      musicPanel.style.display = 'none';
    }, 20000);
  } else {
    musicPanel.style.display = 'none';
  }
}

function loadMusicList() {
  const musicList = document.getElementById('musicList');
  
  // Get actual MP3 files from the mp3 folder
  const musicFiles = [
    'mp3/track1.mp3',
    'mp3/Track1NGE.mp3',
    'mp3/Stereotype Anomaly - HEMPHILL (2025).mp3',
    'mp3/Track2D+B.mp3',
    'mp3/track2.mp3',
    'mp3/track3.mp3',
    'mp3/track4.mp3',
    'mp3/track5.mp3',
    'mp3/track6.mp3',
    'mp3/track7.mp3',
    'mp3/track8.mp3'
  ];
  
  musicList.innerHTML = '';
  
  // Check browser audio support
  const audio = new Audio();
  const canPlayMp3 = audio.canPlayType('audio/mpeg');
  const canPlayOpus = audio.canPlayType('audio/opus');
  
  console.log('🎵 Browser audio support:');
  console.log('   MP3:', canPlayMp3);
  console.log('   OPUS:', canPlayOpus);
  
  musicFiles.forEach(file => {
    const musicItem = document.createElement('div');
    musicItem.className = 'music-item';
    
    // Show filename with format indicator
    const filename = file.split('/').pop();
    const isOpus = filename.toLowerCase().endsWith('.opus');
    const displayName = isOpus ? `${filename} 🎵` : filename;
    musicItem.textContent = displayName;
    
    // Add visual indicator for OPUS files
    if (isOpus) {
      musicItem.style.borderLeft = '3px solid #ff6b6b';
      musicItem.title = 'OPUS format - may not work in all browsers';
    }
    
    musicItem.onclick = (event) => playMusic(file, event);
    musicList.appendChild(musicItem);
  });
  
  // Add seeking bar
  const seekingBar = document.createElement('div');
  seekingBar.style.cssText = 'margin-top: 10px; padding: 10px;';
  seekingBar.innerHTML = `
    <input type="range" id="musicSeekBar" min="0" max="100" value="0" style="width: 100%; height: 6px; background: rgba(0, 0, 0, 0.6); border: 2px solid darkgreen; border-radius: 5px; outline: none;">
    <div id="musicTime" style="text-align: center; font-size: 12px; color: #888; margin-top: 5px;">00:00 / 00:00</div>
  `;
  musicList.appendChild(seekingBar);
  
  // Set up seeking bar functionality
  const seekBar = document.getElementById('musicSeekBar');
  const timeDisplay = document.getElementById('musicTime');
  
  if (seekBar && timeDisplay) {
    seekBar.addEventListener('input', function() {
      if (window.currentAudio) {
        const seekTime = (seekBar.value / 100) * window.currentAudio.duration;
        window.currentAudio.currentTime = seekTime;
      }
    });
    
    // Update seeking bar during playback
    setInterval(() => {
      if (window.currentAudio && !window.currentAudio.paused) {
        const progress = (window.currentAudio.currentTime / window.currentAudio.duration) * 100;
        seekBar.value = progress;
        
        const currentTime = formatTime(window.currentAudio.currentTime);
        const totalTime = formatTime(window.currentAudio.duration);
        timeDisplay.textContent = `${currentTime} / ${totalTime}`;
      }
    }, 100);
  }
}

function playMusic(filename, event) {
  // Remove playing class from all items
  document.querySelectorAll('.music-item').forEach(item => {
    item.classList.remove('playing');
  });

  // Add playing class to clicked item
  if (event && event.target) {
    event.target.classList.add('playing');
  }

  console.log(`🎵 Playing: ${filename}`);

  // Check if it's an OPUS file
  const isOpus = filename.toLowerCase().endsWith('.opus');
  
  if (isOpus) {
    console.log('🎵 OPUS file detected, checking browser support...');
    
    // Check if browser supports OPUS
    const audio = new Audio();
    const canPlayOpus = audio.canPlayType('audio/opus');
    
    if (canPlayOpus === 'probably' || canPlayOpus === 'maybe') {
      console.log('✅ Browser supports OPUS natively');
    } else {
      console.warn('⚠️ Browser may not support OPUS natively, trying anyway...');
    }
  }

  // Create audio element and play
  const audio = new Audio(filename);
  audio.volume = 0.5; // Set volume to 50%

  // Stop any currently playing audio
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio = null;
  }

  window.currentAudio = audio;

  audio.play().then(() => {
    console.log(`🎵 Successfully started playing: ${filename}`);
  }).catch(err => {
    console.error(`❌ Error playing audio: ${err}`);
    
    // If OPUS fails, try to provide helpful error message
    if (filename.toLowerCase().endsWith('.opus')) {
      console.error('❌ OPUS playback failed. This might be due to:');
      console.error('   - Browser not supporting OPUS format');
      console.error('   - Missing OPUS codec');
      console.error('   - File corruption');
      console.error('   - CORS issues');
    }
    
    if (event && event.target) {
      event.target.classList.remove('playing');
    }
  });
}

function stopMusic() {
  // Toggle play/pause for currently playing audio
  if (window.currentAudio) {
    if (window.currentAudio.paused) {
      window.currentAudio.play();
      console.log("▶️ Music resumed");
    } else {
      window.currentAudio.pause();
      console.log("⏸️ Music paused");
    }
  } else {
    console.log("🔇 No music currently loaded");
  }
}

// ===== MEDIA TOOLBAR FUNCTIONS =====

function toggleMediaToolbar() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    const currentDisplay = bar.style.display || getComputedStyle(bar).display;
    bar.style.display = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    console.log("📺 Media toolbar toggled:", bar.style.display);
  }
}

// ===== BACKGROUND UPLOAD FUNCTIONS =====

function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (PNG, JPG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      backgroundImage = img;
      // Hide video and iframe
      const video = document.getElementById("bgVideo");
      const iframe = document.getElementById("ytFrame");
      if (video) {
        video.style.display = "none";
        video.pause();
      }
      if (iframe) {
        iframe.style.display = "none";
        iframe.src = "";
      }
      console.log("🖼️ Background image uploaded successfully");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== VIDEO UPLOAD FUNCTIONS =====

function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('video/')) {
    alert('Please select a video file (MP4, WebM, etc.)');
    return;
  }
  
  const video = document.getElementById("bgVideo");
  const iframe = document.getElementById("ytFrame");
  
  if (video) {
    // Hide iframe
    if (iframe) {
      iframe.style.display = "none";
      iframe.src = "";
    }
    
    // Create object URL for video
    const videoURL = URL.createObjectURL(file);
    video.src = videoURL;
    video.style.display = "block";
    video.play().then(() => {
      console.log("📀 Video uploaded and playing successfully");
    }).catch(err => {
      console.error("❌ Error playing uploaded video:", err);
    });
    
    // Clear background image
    backgroundImage = null;
  }
}

// ===== SNAPSHOT FUNCTIONS =====

function captureCanvas() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas not found");
    return;
  }
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions");
    return;
  }
  
  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
  
  try {
    const dataURL = canvas.toDataURL("image/png");
    console.log("Data URL length:", dataURL.length);
    
    const link = document.createElement("a");
    link.download = "snapshot.png";
    link.href = dataURL.replace("image/png", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Snapshot download initiated");
  } catch (error) {
    console.error("Error capturing snapshot:", error);
  }
}

function captureCanvasOnly() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas not found");
    return;
  }
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions");
    return;
  }
  
  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
  
  try {
    const dataURL = canvas.toDataURL("image/png");
    console.log("Data URL length:", dataURL.length);
    
    const link = document.createElement("a");
    link.download = "canvas_snapshot.png";
    link.href = dataURL.replace("image/png", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Canvas snapshot download initiated");
  } catch (error) {
    console.error("Error capturing canvas snapshot:", error);
  }
}

// ===== DICE FUNCTION =====

// Global dice settings
let diceMaxValue = 6;
let diceSliderTimeout = null;

function rollDice() {
  const result = Math.floor(Math.random() * diceMaxValue) + 1;
  const diceOverlay = document.getElementById('diceOverlay');
  const diceResult = document.getElementById('diceResult');
  
  // Show the dice result in overlay
  diceOverlay.textContent = result;
  diceOverlay.style.display = 'block';
  
  // Show the dice result in toolbar
  diceResult.textContent = `🎲 ${result}`;
  
  console.log("🎲 Dice roll result:", result, "(max:", diceMaxValue, ")");
  
  // Hide overlay after 5 seconds
  setTimeout(() => {
    diceOverlay.style.display = 'none';
  }, 5000);
}

function showDiceSlider() {
  // Remove existing slider if present
  const existingSlider = document.getElementById('diceSlider');
  if (existingSlider) {
    existingSlider.remove();
  }
  
  // Create slider overlay
  const sliderOverlay = document.createElement('div');
  sliderOverlay.id = 'diceSlider';
  sliderOverlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: gold;
    padding: 20px;
    border-radius: 10px;
    border: 2px solid darkgreen;
    z-index: 10000;
    text-align: center;
    min-width: 200px;
  `;
  
  sliderOverlay.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold;">🎲 Dice Max: ${diceMaxValue}</div>
    <input type="range" id="diceMaxSlider" min="2" max="24" value="${diceMaxValue}" 
           style="width: 100%; height: 8px; background: rgba(0, 0, 0, 0.6); border: 2px solid darkgreen; border-radius: 5px; outline: none; margin: 10px 0;">
    <div style="font-size: 12px; color: #888; margin-top: 10px;">Drag to change max dice value (2-24)</div>
    <button onclick="hideDiceSlider()" style="margin-top: 15px; padding: 8px 16px; background: rgba(0, 0, 0, 0.7); color: gold; border: 2px solid darkgreen; border-radius: 6px; cursor: pointer;">Close</button>
  `;
  
  document.body.appendChild(sliderOverlay);
  
  // Set up slider functionality
  const slider = document.getElementById('diceMaxSlider');
  const valueDisplay = sliderOverlay.querySelector('div');
  
  slider.addEventListener('input', function() {
    diceMaxValue = parseInt(this.value);
    valueDisplay.textContent = `🎲 Dice Max: ${diceMaxValue}`;
  });
  
  // Auto-hide after 10 seconds
  diceSliderTimeout = setTimeout(() => {
    hideDiceSlider();
  }, 10000);
}

function hideDiceSlider() {
  const slider = document.getElementById('diceSlider');
  if (slider) {
    slider.remove();
  }
  if (diceSliderTimeout) {
    clearTimeout(diceSliderTimeout);
    diceSliderTimeout = null;
  }
}

// ===== PLAYLIST FUNCTIONS =====

// Initialize video player
function initVideoPlayer() {
  console.log('🎥 Initializing video player...');
  
  // Ensure video elements are properly hidden initially
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  
  if (player) {
    player.style.display = 'none';
    player.style.pointerEvents = 'none';
    player.style.zIndex = '-1';
    player.style.visibility = 'hidden';
    console.log('🎥 Video player element properly initialized');
  }
  
  if (controls) {
    controls.style.display = 'none';
    controls.style.pointerEvents = 'none';
    controls.style.zIndex = '-1';
    controls.style.visibility = 'hidden';
  }
  
  if (playlist) {
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
  }
  
  // Load default playlist if not already loaded
  if (videoPlaylist.length === 0) {
    loadVideoPlaylist().then(() => {
      console.log('🎥 Video player initialized with default playlist');
    });
  } else {
    console.log('🎥 Video player initialized with existing playlist');
  }
}

// Video Playlist loading function
async function loadVideoPlaylist() {
  try {
    const response = await fetch('s25_playlist.txt');
    const content = await response.text();
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Filter for YouTube URLs
    videoPlaylist = lines.filter(line => {
      return line.includes('youtube.com') || line.includes('youtu.be');
    });
    
    console.log(`📋 Video Loaded ${videoPlaylist.length} videos from playlist`);
    
    // Update display after loading
    await updateVideoPlaylistDisplay();
    
    return videoPlaylist;
  } catch (error) {
    console.error('❌ Error loading video playlist:', error);
    videoPlaylist = [];
    return [];
  }
}

async function uploadPlaylist() {
  const fileInput = document.getElementById('playlistUpload');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a .txt file');
    return;
  }
  
  if (!file.name.toLowerCase().endsWith('.txt')) {
    alert('Please select a .txt file');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Extract YouTube URLs from lines
    const youtubeUrls = lines.filter(line => {
      return line.includes('youtube.com') || line.includes('youtu.be');
    });
    
    if (youtubeUrls.length === 0) {
      alert('No YouTube URLs found in the file. Please include YouTube links (one per line).');
      return;
    }
    
    // Replace current playlist with uploaded one
    videoPlaylist = youtubeUrls;
    videoCurrentIndex = 0;
    videoTitles = []; // Clear cached titles
    
    // Add to uploaded playlists for cycling
    const playlistName = file.name.replace('.txt', '');
    uploadedPlaylists.push({
      name: playlistName,
      urls: youtubeUrls
    });
    
    // Update display to show the new playlist
    if (typeof updateVideoPlaylistDisplay === 'function') {
      updateVideoPlaylistDisplay();
    }
    
    // Clear the file input
    fileInput.value = '';
    
    console.log(`📋 Uploaded playlist "${playlistName}" with ${youtubeUrls.length} videos`);
    alert(`✅ Uploaded playlist "${playlistName}" with ${youtubeUrls.length} videos`);
  };
  
  reader.readAsText(file);
}

async function cyclePlaylists() {
  if (uploadedPlaylists.length === 0) {
    alert('No uploaded playlists available. Please upload a .txt file first.');
    return;
  }
  
  currentPlaylistIndex = (currentPlaylistIndex + 1) % uploadedPlaylists.length;
  loadUploadedPlaylist(currentPlaylistIndex);
  
  // Update display to show the switched playlist
  if (typeof updateVideoPlaylistDisplay === 'function') {
    updateVideoPlaylistDisplay();
  }
  
  const playlist = uploadedPlaylists[currentPlaylistIndex];
  console.log(`🔄 Switched to playlist: ${playlist.name} (${playlist.urls.length} videos)`);
}

function loadUploadedPlaylist(index) {
  if (index < 0 || index >= uploadedPlaylists.length) return;
  
  const playlist = uploadedPlaylists[index];
  
  // Update global playlist variables
  videoPlaylist = playlist.urls;
  videoCurrentIndex = 0;
  videoTitles = []; // Clear cached titles for new playlist
  
  // Update display
  if (typeof updateVideoPlaylistDisplay === 'function') {
    updateVideoPlaylistDisplay();
  }
  
  // Play first video
  if (typeof videoPlayVideo === 'function') {
    videoPlayVideo(0);
  }
  
  console.log(`🔄 Loaded uploaded playlist: ${playlist.name} with ${playlist.urls.length} videos`);
}

// ===== VIDEO PLAYER FUNCTIONS =====

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/);
  return match ? match[1] : null;
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

function videoPlayVideo(index) {
  if (index < 0 || index >= videoPlaylist.length) return;
  
  videoCurrentIndex = index;
  const url = videoPlaylist[index];
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    console.error('❌ Invalid YouTube URL:', url);
    return;
  }
  
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}`;
    iframe.src = embedUrl;
    console.log('🎵 Video Playing video:', index + 1, 'of', videoPlaylist.length, 'Video ID:', videoId);
  }
  
  updateVideoPlaylistDisplay();
}

function videoPlay() {
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
  }
}

function videoPause() {
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  }
}

function videoNext() {
  if (videoPlaylist.length > 0) {
    videoCurrentIndex = (videoCurrentIndex + 1) % videoPlaylist.length;
    videoPlayVideo(videoCurrentIndex);
  }
}

function videoPrev() {
  if (videoPlaylist.length > 0) {
    videoCurrentIndex = videoCurrentIndex === 0 ? videoPlaylist.length - 1 : videoCurrentIndex - 1;
    videoPlayVideo(videoCurrentIndex);
  }
}

function videoTogglePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  videoPlaylistVisible = !videoPlaylistVisible;
  
  if (videoPlaylistVisible) {
    playlist.style.display = 'block';
    playlist.style.pointerEvents = 'auto';
    startVideoPlaylistFadeOut();
  } else {
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
  }
}

function videoToggleFullscreen() {
  const player = document.getElementById('videoPlayer');
  if (player) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }
}

function videoClose() {
  const elements = ['videoPlayer', 'videoControls', 'videoPlaylist'];
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });
  videoPlaylistVisible = false;
}

function showVideoControls() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  
  // Only show controls if video player is visible
  if (controls && player && player.style.display !== 'none') {
    controls.style.display = 'block';
    controls.style.pointerEvents = 'auto';
    setTimeout(() => {
      controls.style.display = 'none';
      controls.style.pointerEvents = 'none';
    }, 3000);
  }
}

function showVideoPlaylist() {
  const player = document.getElementById('videoPlayer');
  const playlist = document.getElementById('videoPlaylist');
  
  // Only show playlist if video player is visible
  if (playlist && player && player.style.display !== 'none') {
    playlist.style.opacity = '1';
    playlist.style.display = 'block';
    playlist.style.pointerEvents = 'auto';
    startVideoPlaylistFadeOut();
  }
}

function startVideoPlaylistFadeOut() {
  if (videoPlaylistTimeout) {
    clearTimeout(videoPlaylistTimeout);
  }
  
  videoPlaylistTimeout = setTimeout(() => {
    const playlist = document.getElementById('videoPlaylist');
    if (playlist && playlist.style.display !== 'none') {
      playlist.style.opacity = '0';
      setTimeout(() => {
        playlist.style.display = 'none';
        playlist.style.pointerEvents = 'none';
        playlist.style.opacity = '1'; // Reset opacity
      }, 500);
    }
    videoPlaylistVisible = false;
  }, 5000);
}

async function updateVideoPlaylistDisplay() {
  const playlistContainer = document.getElementById('videoPlaylistItems');
  if (!playlistContainer) {
    console.error('❌ Video Playlist container not found');
    return;
  }
  
  console.log('📋 Video Updating playlist display with', videoPlaylist.length, 'videos');
  playlistContainer.innerHTML = '';
  
  for (let index = 0; index < videoPlaylist.length; index++) {
    const url = videoPlaylist[index];
    const item = document.createElement('div');
    item.className = 'playlist-item';
    
    // Get video ID and title
    const videoId = extractYouTubeId(url);
    let title = videoTitles[index];
    
    // If title not cached, fetch it
    if (!title && videoId) {
      try {
        title = await fetchVideoTitle(videoId);
        if (title) {
          videoTitles[index] = title;
        }
      } catch (error) {
        console.error('❌ Error fetching video title:', error);
      }
    }
    
    // Use title if available, otherwise fall back to ID
    const displayText = title ? title : (videoId ? `Video ${index + 1} (${videoId})` : `Video ${index + 1} (Invalid URL)`);
    item.textContent = displayText;
    
    item.onclick = () => {
      console.log('📋 Video Clicked playlist item:', index, 'Title:', title || 'Unknown', 'URL:', url);
      videoPlayVideo(index);
      showVideoPlaylist(); // Show playlist when clicking
    };
    
    if (index === videoCurrentIndex) {
      item.classList.add('playing');
    }
    playlistContainer.appendChild(item);
  }
  
  console.log('📋 Video Playlist display updated');
}

async function toggleVideoPlayer() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  
  if (!player) return;
  
  // Check if video player is currently visible by checking both inline style and computed style
  const isVisible = player.style.display !== 'none' && 
                   getComputedStyle(player).display !== 'none' &&
                   player.style.visibility !== 'hidden' &&
                   getComputedStyle(player).visibility !== 'hidden';
  
  console.log('🎥 Toggle video player - Current state:', {
    display: player.style.display,
    computedDisplay: getComputedStyle(player).display,
    visibility: player.style.visibility,
    computedVisibility: getComputedStyle(player).visibility,
    isVisible: isVisible
  });
  
  if (isVisible) {
    // Stop video playback and hide video elements
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe) {
      videoIframe.src = ''; // Stop video by clearing src
      console.log('⏹️ Video stopped and cleared');
    }
    
    // Completely remove video elements from DOM when hiding
    if (player) {
      player.style.display = 'none';
      player.style.pointerEvents = 'none';
      player.style.zIndex = '-1';
      player.style.visibility = 'hidden';
    }
    if (controls) {
      controls.style.display = 'none';
      controls.style.pointerEvents = 'none';
      controls.style.zIndex = '-1';
      controls.style.visibility = 'hidden';
    }
    if (playlist) {
      playlist.style.display = 'none';
      playlist.style.pointerEvents = 'none';
      playlist.style.zIndex = '-1';
      playlist.style.visibility = 'hidden';
    }
    videoPlaylistVisible = false;
  } else {
    // Show video player with proper z-index
    if (player) {
      player.style.display = 'block';
      player.style.pointerEvents = 'auto';
      player.style.zIndex = '9998';
      player.style.visibility = 'visible';
    }
    
    // Show controls initially
    if (controls) {
      controls.style.display = 'block';
      controls.style.pointerEvents = 'auto';
      controls.style.zIndex = '9997';
      controls.style.visibility = 'visible';
    }
    
    // Initialize video player and load playlist if empty
    if (videoPlaylist.length === 0) {
      if (typeof loadVideoPlaylist === 'function') {
        loadVideoPlaylist().then(() => {
          // Play first video after playlist is loaded
          if (videoPlaylist.length > 0) {
            videoPlayVideo(0);
          }
        });
      }
      if (typeof updateVideoPlaylistDisplay === 'function') {
        updateVideoPlaylistDisplay();
      }
    } else {
      // Play first video if playlist is already loaded
      if (videoPlaylist.length > 0) {
        videoPlayVideo(0);
      }
    }
    
    // Show playlist panel
    if (playlist) {
      playlist.style.display = 'block';
      playlist.style.opacity = '1';
      playlist.style.pointerEvents = 'auto';
      playlist.style.zIndex = '9999';
      playlist.style.visibility = 'visible';
    }
  }
  
  console.log('🎥 Video player toggled:', isVisible ? 'hidden' : 'shown');
}

// ===== RECORDING FUNCTIONS =====

let recordingStartTime = null;
let recordingEndTime = null;

function recordState(type) {
  if (type === 'start') {
    recordingStartTime = Date.now();
    console.log('🎬 Recording start point marked');
  } else if (type === 'end') {
    recordingEndTime = Date.now();
    console.log('🏁 Recording end point marked');
  }
}

function startPlayback() {
  if (!recordingStartTime || !recordingEndTime) {
    alert('Please mark both start and end points first');
    return;
  }
  
  const duration = recordingEndTime - recordingStartTime;
  console.log('▶️ Playing back recording:', duration, 'ms');
  
  // For now, just log the playback
  // This could be expanded to actually replay the recorded actions
  alert(`Playback started: ${Math.round(duration / 1000)}s duration`);
}

// ===== MEDIA.JS LOADED =====
console.log('🔧 Media.js loaded successfully'); 