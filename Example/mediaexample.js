// ===== MINDS EYE - MEDIA HANDLING =====

// ===== VIDEO PLAYLIST VARIABLES =====
let uploadedPlaylists = [];
let currentPlaylistIndex = -1;

// ===== VIDEO CONTROLS AUTO-HIDE VARIABLES =====
let videoControlsTimeout = null;
let videoControlsVisible = true;

// ===== MUSIC VISUALIZER VARIABLES =====
let visualizerInterval = null;
let isMusicPlaying = false;
let currentVisualizerColors = [];

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
    
    // Highlight currently playing track if any
    highlightCurrentTrack();
    
    // Auto-hide after 20 seconds
    setTimeout(() => {
      musicPanel.style.display = 'none';
    }, 20000);
  } else {
    musicPanel.style.display = 'none';
  }
}

async function loadMusicList() {
  const musicList = document.getElementById('musicList');
  
  // Try to load tracks from tracklist.txt, fall back to default
  let musicFiles = [];
  const possiblePaths = [
    'tracklist.txt',
    './tracklist.txt',
    '/tracklist.txt'
  ];
  
  let loaded = false;
  for (const path of possiblePaths) {
    try {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info(`Attempting to load tracklist from ${path} for music panel`, null, 'AUDIO');
      const response = await fetch(path);
      if (response.ok) {
        const content = await response.text();
        musicFiles = content.split('\n').filter(line => line.trim() !== '');
        // Note: This file is an example - in production, use logger.info() instead
        // logger.info(`Loaded ${musicFiles.length} tracks from ${path} for music panel`, null, 'AUDIO');
        loaded = true;
        break;
      } else {
        // Note: This file is an example - in production, use logger.warn() instead
        // logger.warn(`Could not load ${path} for music panel`, { status: response.status }, 'AUDIO');
      }
    } catch (error) {
              // Note: This file is an example - in production, use logger.error() instead
        // logger.error(`Error loading ${path} for music panel`, { error: error.message, path: path }, 'AUDIO');
    }
  }
  
  if (!loaded) {
    // Note: This file is an example - in production, use logger.warn() instead
    // logger.warn('Could not load tracklist.txt from any path for music panel, using default tracks', null, 'AUDIO');
    musicFiles = getDefaultPlaylist();
  }
  
  // Parse tracks into the new object format
  const parsedTracks = musicFiles.map(track => {
    if (typeof track === 'object' && track.title && track.url) {
      // Already in correct format
      // Note: This file is an example - in production, use logger.debug() instead
      // logger.debug(`Parsed object track: ${track.title} -> ${track.url}`, null, 'AUDIO');
      return track;
    } else if (typeof track === 'string') {
      // Parse string format (Title|URL or just URL)
      const parts = track.split('|');
      if (parts.length === 2) {
        const parsedTrack = {
          title: parts[0].trim(),
          url: parts[1].trim()
        };
        // Note: This file is an example - in production, use logger.debug() instead
      // logger.debug(`Parsed string track: ${parsedTrack.title} -> ${parsedTrack.url}`, null, 'AUDIO');
        return parsedTrack;
      } else {
        // Fallback for old format - use filename as title
        const url = track.trim();
        const filename = url.split('/').pop() || url;
        const parsedTrack = {
          title: filename,
          url: url
        };
        // Note: This file is an example - in production, use logger.debug() instead
      // logger.debug(`Parsed fallback track: ${parsedTrack.title} -> ${parsedTrack.url}`, null, 'AUDIO');
        return parsedTrack;
      }
    }
    return track;
  });
  
  musicFiles = parsedTracks;
  
  musicList.innerHTML = '';
  
  // Check browser audio support
  const audio = new Audio();
  const canPlayMp3 = audio.canPlayType('audio/mpeg');
  const canPlayOpus = audio.canPlayType('audio/opus');
  
  // Note: This file is an example - in production, use logger.info() instead
  // logger.info('Browser audio support', { mp3: canPlayMp3, opus: canPlayOpus }, 'AUDIO');
  
  musicFiles.forEach(track => {
          // Note: This file is an example - in production, use logger.debug() instead
      // logger.debug(`Processing track: ${track.title} -> ${track.url}`, null, 'AUDIO');
    const musicItem = document.createElement('div');
    musicItem.className = 'music-item';
    
    // Check if it's a radio stream or local file
    if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
      // Radio stream
      const displayName = `📻 ${track.title}`;
      musicItem.textContent = displayName;
      musicItem.style.borderLeft = '3px solid #9C27B0';
      musicItem.title = `Radio Stream: ${track.url}`;
              // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Created radio item: ${displayName}`, null, 'AUDIO');
    } else {
      // Local file
      const filename = track.url.split('/').pop();
      const isOpus = filename.toLowerCase().endsWith('.opus');
      const displayName = isOpus ? `${track.title} 🎵` : track.title;
      musicItem.textContent = displayName;
      
      // Add visual indicator for OPUS files
      if (isOpus) {
        musicItem.style.borderLeft = '3px solid #ff6b6b';
        musicItem.title = 'OPUS format - may not work in all browsers';
      }
              // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Created music item: ${displayName}`, null, 'AUDIO');
    }
    
    musicItem.onclick = (event) => {
      if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
        playRadioStream(track.url);
      } else {
        playMusic(track.url, event);
      }
    };
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
  // Note: This file is an example - in production, use logger.debug() instead
  // logger.debug(`playMusic called with filename: ${filename}`, { event: event }, 'AUDIO');
  
  // Remove playing class from all items and reset background
  const musicItems = document.querySelectorAll('.music-item');
      // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug(`Found ${musicItems.length} music items to reset`, null, 'AUDIO');
  
  musicItems.forEach(item => {
    item.classList.remove('playing');
    item.style.background = 'rgba(0, 0, 0, 0.6)';
  });

  // Add playing class to clicked item
  if (event && event.target) {
    event.target.classList.add('playing');
    event.target.style.background = '#35CF3A';
          // Note: This file is an example - in production, use logger.debug() instead
      // logger.debug(`Highlighted clicked item: ${event.target.textContent}`, null, 'AUDIO');
  }

      // Note: This file is an example - in production, use logger.info() instead
    // logger.info(`Playing: ${filename}`, null, 'AUDIO');
  
  // Mark playlist as started when any music is played
  isPlaylistStarted = true;

  // Check if it's an OPUS file
  const isOpus = filename.toLowerCase().endsWith('.opus');
  
  if (isOpus) {
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info('OPUS file detected, checking browser support...', null, 'AUDIO');
    
    // Check if browser supports OPUS
    const audio = new Audio();
    const canPlayOpus = audio.canPlayType('audio/opus');
    
    if (canPlayOpus === 'probably' || canPlayOpus === 'maybe') {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Browser supports OPUS natively', null, 'AUDIO');
    } else {
              // Note: This file is an example - in production, use logger.warn() instead
        // logger.warn('Browser may not support OPUS natively, trying anyway...', null, 'AUDIO');
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

  // Add event listeners to detect when music ends naturally
  audio.addEventListener('ended', () => {
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info('Music track ended naturally', null, 'AUDIO');
    isMusicPlaying = false;
    stopMusicVisualizer();
    
    // Auto-advance to next track if we're in playlist mode
    if (musicPlaylist.length > 0 && isMusicLooping) {
      setTimeout(() => {
        nextMusicTrack();
      }, 1000); // 1 second delay before next track
    } else {
      // Update music button to show inactive state
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    }
  });

  audio.addEventListener('pause', () => {
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info('Music paused', null, 'AUDIO');
    isMusicPlaying = false;
    stopMusicVisualizer();
    // Update music button to show inactive state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music.png');
    }
  });

  audio.addEventListener('play', () => {
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info('Music started playing', null, 'AUDIO');
    isMusicPlaying = true;
    startMusicVisualizer();
    // Update music button to show active state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music2.png');
    }
  });

  audio.play().then(() => {
          // Note: This file is an example - in production, use logger.info() instead
      // logger.info(`Successfully started playing: ${filename}`, null, 'AUDIO');
    
    // Update music button to show active state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music2.png');
    }
      }).catch(err => {
      // Note: This file is an example - in production, use logger.error() instead
      // logger.error(`Error playing audio: ${err}`, { error: err.message, filename: filename }, 'AUDIO');
    
    // If OPUS fails, try to provide helpful error message
    if (filename.toLowerCase().endsWith('.opus')) {
      // Note: This file is an example - in production, use logger.error() instead
      // logger.error('OPUS playback failed', { 
      //   reasons: ['Browser not supporting OPUS format', 'Missing OPUS codec', 'File corruption', 'CORS issues'],
      //   filename: filename 
      // }, 'AUDIO');
    }
    
    if (event && event.target) {
      event.target.classList.remove('playing');
    }
  });
}

// Global music playlist variables
let musicPlaylist = [];
let currentMusicIndex = 0;
let isMusicLooping = true;
let isPlaylistStarted = false; // Track if playlist has been started
let isMediaToolbarMinimized = false; // Track if media toolbar is minimized
let isMediaToolbarVisible = false; // Track if media toolbar is visible

function stopMusic() {
  // Toggle play/pause for currently playing audio
  if (window.currentAudio) {
    if (window.currentAudio.paused) {
      window.currentAudio.play();
      // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Music resumed", null, 'AUDIO');
      isMusicPlaying = true;
      startMusicVisualizer();
      
      // Update music button to show active state
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
    } else {
      window.currentAudio.pause();
      // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Music paused", null, 'AUDIO');
      isMusicPlaying = false;
      stopMusicVisualizer();
      
      // Update music button to show inactive state
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    }
  } else {
    // Note: This file is an example - in production, use logger.warn() instead
    // logger.warn("No music currently loaded", null, 'AUDIO');
    isMusicPlaying = false;
    stopMusicVisualizer();
    
    // Update music button to show inactive state
    const musicButton = document.querySelector('[data-icon="music"]');
    if (musicButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(musicButton, 'music.png');
    }
  }
}

async function loadMusicPlaylist() {
  // Try different possible paths for the tracklist file
  const possiblePaths = [
    'tracklist.txt',
    './tracklist.txt',
    '/tracklist.txt'
  ];
  
  for (const path of possiblePaths) {
    try {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info(`Attempting to load tracklist from: ${path}`, null, 'AUDIO');
      const response = await fetch(path);
              // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Fetch response status for ${path}`, { status: response.status, statusText: response.statusText }, 'AUDIO');
      
      if (response.ok) {
        const content = await response.text();
        // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug('File content length', { length: content.length }, 'AUDIO');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Parse tracks with titles (format: "Title|URL" or just "URL")
        const tracks = lines.map(line => {
          const parts = line.split('|');
          if (parts.length === 2) {
            return {
              title: parts[0].trim(),
              url: parts[1].trim()
            };
          } else {
            // Fallback for old format - use filename as title
            const url = line.trim();
            const filename = url.split('/').pop() || url;
            return {
              title: filename,
              url: url
            };
          }
        });
        
        musicPlaylist = tracks;
        // Note: This file is an example - in production, use logger.info() instead
        // logger.info(`Loaded ${tracks.length} tracks from ${path}`, { tracks: tracks }, 'AUDIO');
        return true;
      } else {
                  // Note: This file is an example - in production, use logger.warn() instead
          // logger.warn(`Could not load ${path}`, { status: response.status }, 'AUDIO');
      }
    } catch (error) {
              // Note: This file is an example - in production, use logger.error() instead
        // logger.error(`Error loading ${path}`, { error: error.message, path: path }, 'AUDIO');
    }
  }
  
      // Note: This file is an example - in production, use logger.warn() instead
    // logger.warn('Could not load tracklist.txt from any path, using default tracks', null, 'AUDIO');
  return false;
}

function getDefaultPlaylist() {
  return [
    { title: 'Track 1', url: 'mp3/track1.mp3' },
    { title: 'Track 1 NGE', url: 'mp3/Track1NGE.mp3' },
    { title: 'Stereotype Anomaly - HEMPHILL (2025)', url: 'mp3/Stereotype Anomaly - HEMPHILL (2025).mp3' },
    { title: 'Track 2 D+B', url: 'mp3/Track2D+B.mp3' },
    { title: 'Track 2', url: 'mp3/track2.mp3' },
    { title: 'Track 3', url: 'mp3/track3.mp3' },
    { title: 'Track 4', url: 'mp3/track4.mp3' },
    { title: 'Track 5', url: 'mp3/track5.mp3' },
    { title: 'Track 6', url: 'mp3/track6.mp3' },
    { title: 'Track 7', url: 'mp3/track7.mp3' },
    { title: 'Track 8', url: 'mp3/track8.mp3' }
  ];
}

async function startMusicPlaylist() {
  // Load playlist from file if not already loaded
  if (musicPlaylist.length === 0) {
    const loaded = await loadMusicPlaylist();
    if (!loaded) {
      musicPlaylist = getDefaultPlaylist();
    }
  }
  
  // Start playing from the beginning
  if (musicPlaylist.length > 0) {
    currentMusicIndex = 0;
    isPlaylistStarted = true;
    playMusicFromPlaylist(currentMusicIndex);
  }
}

function playMusicFromPlaylist(index) {
  if (index >= 0 && index < musicPlaylist.length) {
    currentMusicIndex = index;
    const track = musicPlaylist[index];
    
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug(`playMusicFromPlaylist called with index: ${index}`, { track: track }, 'AUDIO');
    
    // Update visual indicators
    const musicItems = document.querySelectorAll('.music-item');
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug(`Found ${musicItems.length} music items`, null, 'AUDIO');
    
    musicItems.forEach((item, i) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      if (i === index) {
        item.classList.add('playing');
        item.style.background = '#35CF3A';
        // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Highlighted item ${i}: ${item.textContent}`, null, 'AUDIO');
      }
    });
    
    // Check if it's a radio stream (URL) or local file
    if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
      // For radio streams, we need to pass the index to maintain highlighting
      playRadioStreamFromPlaylist(track.url, index);
      // Note: This file is an example - in production, use logger.info() instead
    // logger.info(`Playing radio stream ${index + 1}/${musicPlaylist.length}: ${track.title}`, null, 'AUDIO');
      // Start visualizer for radio streams
      isMusicPlaying = true;
      startMusicVisualizer();
    } else {
      playMusic(track.url);
      logger.info(`Playing track ${index + 1}/${musicPlaylist.length}: ${track.title}`, null, 'AUDIO');
      // Start visualizer for any music playback
      isMusicPlaying = true;
      startMusicVisualizer();
    }
  }
}

function playRadioStream(radioUrl) {
  try {
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug(`playRadioStream called with URL: ${radioUrl}`, null, 'AUDIO');
    
    // Stop current music
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    // Mark playlist as started when radio is played
    isPlaylistStarted = true;
    
    // Find and highlight the radio item in the music panel
    const musicItems = document.querySelectorAll('.music-item');
            // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Found ${musicItems.length} music items to check for radio`, null, 'AUDIO');
    
    musicItems.forEach((item, index) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      
      // Check if this item contains the radio URL
      const itemText = item.textContent || '';
      if (itemText.includes(radioUrl) || item.getAttribute('onclick')?.includes(radioUrl)) {
        item.classList.add('playing');
        item.style.background = '#35CF3A';
        // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Highlighted radio item ${index}: ${itemText}`, null, 'AUDIO');
      }
    });
    
    // Create new audio element for radio
    const audio = new Audio(radioUrl);
    audio.volume = 0.5;
    
    // Add event listeners
    audio.addEventListener('ended', () => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio stream ended', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    });

    audio.addEventListener('pause', () => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio paused', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    });

    audio.addEventListener('play', () => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio started playing', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
    });
    
    window.currentAudio = audio;
    audio.play().then(() => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio station loaded and playing', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
    }).catch(err => {
      // Note: This file is an example - in production, use logger.error() instead
      // logger.error('Error loading radio station', { error: err.message }, 'AUDIO');
      alert('Failed to load radio station. Please check the URL.');
    });
  } catch (error) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error('Error creating radio audio', { error: error.message }, 'AUDIO');
    alert('Failed to load radio station. Please check the URL.');
  }
}

function playRadioStreamFromPlaylist(radioUrl, index) {
  try {
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug(`playRadioStreamFromPlaylist called with URL: ${radioUrl}, index: ${index}`, null, 'AUDIO');
    
    // Stop current music
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    
    // Mark playlist as started when radio is played
    isPlaylistStarted = true;
    
    // Update visual indicators using the index
    const musicItems = document.querySelectorAll('.music-item');
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug(`Found ${musicItems.length} music items to highlight`, null, 'AUDIO');
    
    musicItems.forEach((item, i) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      if (i === index) {
        item.classList.add('playing');
        item.style.background = '#35CF3A';
        // Note: This file is an example - in production, use logger.debug() instead
        // logger.debug(`Highlighted radio item ${i}: ${item.textContent}`, null, 'AUDIO');
      }
    });
    
    // Create new audio element for radio
    const audio = new Audio(radioUrl);
    audio.volume = 0.5;
    
    // Add event listeners
    audio.addEventListener('ended', () => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio stream ended', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    });

    audio.addEventListener('pause', () => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio paused', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music.png');
      }
    });

    audio.addEventListener('play', () => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio started playing', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
    });
    
    window.currentAudio = audio;
    audio.play().then(() => {
      // Note: This file is an example - in production, use logger.info() instead
      // logger.info('Radio station loaded and playing', null, 'AUDIO');
      const musicButton = document.querySelector('[data-icon="music"]');
      if (musicButton && typeof PNGLoader !== 'undefined') {
        PNGLoader.applyPNG(musicButton, 'music2.png');
      }
    }).catch(err => {
      // Note: This file is an example - in production, use logger.error() instead
      // logger.error('Error loading radio station', { error: err.message }, 'AUDIO');
      alert('Failed to load radio station. Please check the URL.');
    });
  } catch (error) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error('Error creating radio audio', { error: error.message }, 'AUDIO');
    alert('Failed to load radio station. Please check the URL.');
  }
}

function nextMusicTrack() {
  if (musicPlaylist.length > 0) {
    // Find the currently playing track index
    let currentIndex = currentMusicIndex;
    const playingItem = document.querySelector('.music-item.playing');
    if (playingItem) {
      // Find the index of the currently playing item
      const allItems = document.querySelectorAll('.music-item');
      for (let i = 0; i < allItems.length; i++) {
        if (allItems[i] === playingItem) {
          currentIndex = i;
          break;
        }
      }
    }
    
    // Go to next track
    const nextIndex = (currentIndex + 1) % musicPlaylist.length;
    playMusicFromPlaylist(nextIndex);
  }
}

function previousMusicTrack() {
  if (musicPlaylist.length > 0) {
    // Find the currently playing track index
    let currentIndex = currentMusicIndex;
    const playingItem = document.querySelector('.music-item.playing');
    if (playingItem) {
      // Find the index of the currently playing item
      const allItems = document.querySelectorAll('.music-item');
      for (let i = 0; i < allItems.length; i++) {
        if (allItems[i] === playingItem) {
          currentIndex = i;
          break;
        }
      }
    }
    
    // Go to previous track
    const prevIndex = (currentIndex - 1 + musicPlaylist.length) % musicPlaylist.length;
    playMusicFromPlaylist(prevIndex);
  }
}

async function handleMusicRightClick() {
  if (!isPlaylistStarted) {
    // First right-click: start the playlist
    await startMusicPlaylist();
  } else {
    // Subsequent right-clicks: toggle play/pause
    stopMusic();
  }
}

function handleVideoRightClick() {
  const player = document.getElementById('videoPlayer');
  if (player) {
    // Check if video player is currently visible
    const isVisible = player.style.display !== 'none' && 
                     getComputedStyle(player).display !== 'none' &&
                     player.style.visibility !== 'hidden' &&
                     getComputedStyle(player).visibility !== 'hidden';
    
    if (isVisible) {
      // Use the same logic as videoClose() to properly close the video
      videoClose();
      // Note: This file is an example - in production, use logger.info() instead
    // logger.info('Video player closed via right-click', null, 'VIDEO');
    } else {
      // If video player is closed, show read panel
      showReadPanel();
    }
  } else {
    // Fallback to read panel if player element not found
    showReadPanel();
  }
}

function showReadPanel() {
  const readPanel = document.getElementById('readPanel');
  if (readPanel) {
    readPanel.style.display = 'block';
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info('Read panel shown', null, 'SYSTEM');
  }
}

function hideReadPanel() {
  const readPanel = document.getElementById('readPanel');
  if (readPanel) {
    readPanel.style.display = 'none';
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info('Read panel hidden', null, 'SYSTEM');
  }
}

function loadRadioStation() {
  const radioUrl = prompt('Enter radio station URL (stream URL):');
  if (radioUrl && radioUrl.trim() !== '') {
    try {
      // Stop current music
      if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
      }
      
      // Create new audio element for radio
      const audio = new Audio(radioUrl);
      audio.volume = 0.5;
      
      // Add event listeners
      audio.addEventListener('ended', () => {
        logger.info('Radio stream ended', null, 'AUDIO');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music.png');
        }
      });

      audio.addEventListener('pause', () => {
        logger.info('Radio paused', null, 'AUDIO');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music.png');
        }
      });

      audio.addEventListener('play', () => {
        logger.info('Radio started playing', null, 'AUDIO');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music2.png');
        }
      });
      
      window.currentAudio = audio;
      audio.play().then(() => {
        logger.info('Radio station loaded and playing', null, 'AUDIO');
        const musicButton = document.querySelector('[data-icon="music"]');
        if (musicButton && typeof PNGLoader !== 'undefined') {
          PNGLoader.applyPNG(musicButton, 'music2.png');
        }
      }).catch(err => {
        logger.error('Error loading radio station', err, 'AUDIO');
        alert('Failed to load radio station. Please check the URL.');
      });
    } catch (error) {
              logger.error('Error creating radio audio', error, 'AUDIO');
      alert('Failed to load radio station. Please check the URL.');
    }
  }
}

// ===== MEDIA TOOLBAR FUNCTIONS =====

function toggleMediaToolbar() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    const currentDisplay = bar.style.display || getComputedStyle(bar).display;
    const newDisplay = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    bar.style.display = newDisplay;
    isMediaToolbarVisible = (newDisplay === "flex");
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Media toolbar toggled", { display: bar.style.display }, 'SYSTEM');
  }
}

function toggleMediaToolbarMinimize() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    isMediaToolbarMinimized = !isMediaToolbarMinimized;
    
    if (isMediaToolbarMinimized) {
      bar.classList.add('minimized');
      // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Media toolbar minimized", null, 'SYSTEM');
    } else {
      bar.classList.remove('minimized');
      // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Media toolbar expanded", null, 'SYSTEM');
    }
  }
}

function toggleMediaToolbarVisibility() {
  const bar = document.getElementById("mediaToolbar");
  if (bar) {
    const currentDisplay = bar.style.display || getComputedStyle(bar).display;
    const newDisplay = (currentDisplay === "none" || currentDisplay === "") ? "flex" : "none";
    bar.style.display = newDisplay;
    isMediaToolbarVisible = (newDisplay === "flex");
    logger.info(`Media toolbar visibility toggled: ${bar.style.display}`, null, 'VIDEO');
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
      // Note: This file is an example - in production, use logger.success() instead
    // logger.success("Background image uploaded successfully", null, 'UPLOAD');
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
      // Note: This file is an example - in production, use logger.success() instead
    // logger.success("Video uploaded and playing successfully", null, 'UPLOAD');
    }).catch(err => {
              // Note: This file is an example - in production, use logger.error() instead
        // logger.error("Error playing uploaded video", { error: err.message }, 'UPLOAD');
    });
    
    // Clear background image
    backgroundImage = null;
  }
}

// ===== SNAPSHOT FUNCTIONS =====

function captureCanvas() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error("Canvas not found", null, 'SYSTEM');
    return;
  }
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error("Canvas has zero dimensions", null, 'SYSTEM');
    return;
  }
  
  // Note: This file is an example - in production, use logger.debug() instead
  // logger.debug("Canvas dimensions", { width: canvas.width, height: canvas.height }, 'SYSTEM');
  
  try {
    const dataURL = canvas.toDataURL("image/png");
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug("Data URL length", { length: dataURL.length }, 'SYSTEM');
    
    const link = document.createElement("a");
    link.download = "snapshot.png";
    link.href = dataURL.replace("image/png", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Snapshot download initiated", null, 'SYSTEM');
  } catch (error) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error("Error capturing snapshot", { error: error.message }, 'SYSTEM');
  }
}

function captureCanvasOnly() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error("Canvas not found", null, 'SYSTEM');
    return;
  }
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error("Canvas has zero dimensions", null, 'SYSTEM');
    return;
  }
  
  // Note: This file is an example - in production, use logger.debug() instead
  // logger.debug("Canvas dimensions", { width: canvas.width, height: canvas.height }, 'SYSTEM');
  
  try {
    const dataURL = canvas.toDataURL("image/png");
    // Note: This file is an example - in production, use logger.debug() instead
    // logger.debug("Data URL length", { length: dataURL.length }, 'SYSTEM');
    
    const link = document.createElement("a");
    link.download = "canvas_snapshot.png";
    link.href = dataURL.replace("image/png", "image/octet-stream");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Note: This file is an example - in production, use logger.info() instead
    // logger.info("Canvas snapshot download initiated", null, 'SYSTEM');
  } catch (error) {
    // Note: This file is an example - in production, use logger.error() instead
    // logger.error("Error capturing canvas snapshot", { error: error.message }, 'SYSTEM');
  }
}

// ===== DICE FUNCTION =====

// Global dice settings
let diceMaxValue = 6;
let diceSliderTimeout = null;

function rollDice() {
  const result = Math.floor(Math.random() * diceMaxValue) + 1;
  const diceOverlay = document.getElementById('diceOverlay');
  const diceButton = document.getElementById('diceButton');
  
  // Show the dice result in overlay
  diceOverlay.textContent = result;
  diceOverlay.style.display = 'block';
  
  // Show the dice result on top of the button (even with PNG)
  if (diceButton) {
    diceButton.textContent = result;
    // Add CSS class to override PNG styles
    diceButton.classList.add('showing-number');
  }
  
      logger.info(`Dice roll result: ${result} (max: ${diceMaxValue})`, null, 'SYSTEM');
  
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
    z-index: 60000;
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
      logger.info('Initializing video player...', null, 'VIDEO');
  
  // Ensure video elements are properly hidden initially
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  
  if (player) {
    player.style.display = 'none';
    player.style.pointerEvents = 'none';
    player.style.zIndex = '-1';
    player.style.visibility = 'hidden';
          logger.info('Video player element properly initialized', null, 'VIDEO');
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
  
  // Pre-load playlists from root folder
  setTimeout(async () => {
    await preloadPlaylists();
    logger.info('Video player initialized with pre-loaded playlists', null, 'VIDEO');
  }, 100);
  
  // Load video control images
  loadVideoControlImages();
  
  // Set initial opacity
  const opacitySlider = document.getElementById('videoOpacitySlider');
  if (opacitySlider && player) {
    player.style.opacity = opacitySlider.value;
    logger.info(`Initial video opacity set to: ${opacitySlider.value}`, null, 'VIDEO');
  }
  
  // Set initial size
  const sizeSlider = document.getElementById('videoSizeSlider');
  if (sizeSlider && player) {
    player.style.transform = `translate(-50%, -50%) scale(${sizeSlider.value})`;
    logger.info(`Initial video size set to: ${sizeSlider.value}`, null, 'VIDEO');
  }
  
  // Debug video controls after a short delay
  setTimeout(() => {
    debugVideoControls();
    testPngAccess();
    loadToolbarButtonImages();
  }, 1000);
  
  // Add click handler for minimized playlist
  const playlistElement = document.getElementById('videoPlaylist');
  if (playlistElement) {
    playlistElement.addEventListener('click', function(e) {
      // Only restore if minimized and click is not on a button
      if (this.classList.contains('minimized') && !e.target.matches('button')) {
        restorePlaylist();
      }
    });
  }
}

// Video Playlist loading function
async function loadVideoPlaylist() {
  try {
    // Check if we're running from file:// protocol (local file)
    const isLocalFile = window.location.protocol === 'file:';
    
    if (isLocalFile) {
          logger.warn('Running from local file - playlist loading may be restricted by CORS', null, 'PLAYLIST');
    logger.info('You can upload your own playlist file using the upload button', null, 'PLAYLIST');
      videoPlaylist = [];
      
      // Update display with empty playlist
      if (typeof updateVideoPlaylistDisplay === 'function') {
        await updateVideoPlaylistDisplay();
      }
      
      return videoPlaylist;
    }
    
    // Try to load the playlist file
    const response = await fetch('s25_playlist.txt', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Filter for YouTube URLs
    videoPlaylist = lines.filter(line => {
      return line.includes('youtube.com') || line.includes('youtu.be');
    });
    
          logger.info(`Loaded ${videoPlaylist.length} videos from playlist`, null, 'PLAYLIST');
    
    // Update display after loading
    if (typeof updateVideoPlaylistDisplay === 'function') {
      await updateVideoPlaylistDisplay();
    }
    
    return videoPlaylist;
  } catch (error) {
          logger.error('Error loading video playlist', error, 'PLAYLIST');
      logger.info('Creating empty playlist - you can upload your own playlist file', null, 'PLAYLIST');
    
    // Create a default empty playlist
    videoPlaylist = [];
    
    // Update display with empty playlist
    if (typeof updateVideoPlaylistDisplay === 'function') {
      await updateVideoPlaylistDisplay();
    }
    
    return videoPlaylist;
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
    
    // Add to uploaded playlists for cycling (check for duplicates)
    const playlistName = file.name.replace('.txt', '');
    const existingIndex = uploadedPlaylists.findIndex(p => p.name === playlistName);
    
    if (existingIndex === -1) {
      uploadedPlaylists.push({
        name: playlistName,
        urls: youtubeUrls
      });
      currentPlaylistIndex = uploadedPlaylists.length - 1; // Set to the newly uploaded playlist
    } else {
      // Replace existing playlist
      uploadedPlaylists[existingIndex] = {
        name: playlistName,
        urls: youtubeUrls
      };
      currentPlaylistIndex = existingIndex;
    }
    
    // Update display to show the new playlist
    if (typeof updateVideoPlaylistDisplay === 'function') {
      updateVideoPlaylistDisplay();
    }
    
    // Clear the file input
    fileInput.value = '';
    
    logger.info(`Uploaded playlist "${playlistName}" with ${youtubeUrls.length} videos`, null, 'PLAYLIST');
    alert(`✅ Uploaded playlist "${playlistName}" with ${youtubeUrls.length} videos`);
  };
  
  reader.readAsText(file);
}

async function nextPlaylist() {
  if (uploadedPlaylists.length === 0) {
    logger.warn('No uploaded playlists available', null, 'PLAYLIST');
    return;
  }
  
  // Loop to first playlist if at the end
  currentPlaylistIndex = (currentPlaylistIndex + 1) % uploadedPlaylists.length;
  loadUploadedPlaylist(currentPlaylistIndex);
  
  const playlist = uploadedPlaylists[currentPlaylistIndex];
  logger.info(`Switched to next playlist: ${playlist.name} (${playlist.urls.length} videos)`, null, 'PLAYLIST');
}

async function previousPlaylist() {
  if (uploadedPlaylists.length === 0) {
    logger.warn('No uploaded playlists available', null, 'PLAYLIST');
    return;
  }
  
  // Loop to last playlist if at the beginning
  currentPlaylistIndex = currentPlaylistIndex === 0 ? uploadedPlaylists.length - 1 : currentPlaylistIndex - 1;
  loadUploadedPlaylist(currentPlaylistIndex);
  
  const playlist = uploadedPlaylists[currentPlaylistIndex];
  logger.info(`Switched to previous playlist: ${playlist.name} (${playlist.urls.length} videos)`, null, 'PLAYLIST');
}

async function playRandomVideo() {
  if (videoPlaylist.length === 0) {
    logger.warn('No videos in current playlist', null, 'PLAYLIST');
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * videoPlaylist.length);
  videoPlayVideo(randomIndex);
  logger.info(`Playing random video: ${randomIndex + 1} of ${videoPlaylist.length}`, null, 'PLAYLIST');
}

function loadUploadedPlaylist(index) {
  if (index < 0 || index >= uploadedPlaylists.length) return;
  
  const playlist = uploadedPlaylists[index];
  
  // Update global playlist variables
  videoPlaylist = playlist.urls;
  videoCurrentIndex = 0;
  videoTitles = []; // Clear cached titles for new playlist
  
  // Update display once
  if (typeof updateVideoPlaylistDisplay === 'function') {
    updateVideoPlaylistDisplay();
  }
  
  // Play first video
  if (typeof videoPlayVideo === 'function') {
    videoPlayVideo(0);
  }
  
  logger.info(`Loaded uploaded playlist: ${playlist.name} with ${playlist.urls.length} videos`, null, 'PLAYLIST');
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
    logger.error(`Error fetching video title for ${videoId}`, error, 'VIDEO');
  }
  return null;
}

function videoPlayVideo(index) {
  if (index < 0 || index >= videoPlaylist.length) return;
  
  videoCurrentIndex = index;
  const url = videoPlaylist[index];
  const videoId = extractYouTubeId(url);
  
  if (!videoId) {
    logger.error(`Invalid YouTube URL: ${url}`, null, 'VIDEO');
    return;
  }
  
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&enablejsapi=1&origin=${window.location.origin}`;
    iframe.src = embedUrl;
    videoIsPlaying = true;
    logger.info(`Video Playing video: ${index + 1} of ${videoPlaylist.length} Video ID: ${videoId}`, null, 'VIDEO');
    
    // Update the play button icon after a short delay to allow iframe to load
    setTimeout(() => {
      updateVideoPlayButtonIcon();
    }, 1000);
  }
  
  // Update display without triggering the flag system
  updateVideoPlaylistDisplaySilent();
}

function videoTogglePlay() {
  const iframe = document.getElementById('videoIframe');
  logger.debug('videoTogglePlay called', null, 'VIDEO');
  logger.debug(`iframe: ${iframe}`, null, 'VIDEO');
  logger.debug(`videoIsPlaying before: ${videoIsPlaying}`, null, 'VIDEO');
  
  if (iframe) {
    try {
      // Toggle between play and pause
      if (videoIsPlaying) {
        // Try multiple methods to pause the video
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
        videoIsPlaying = false;
        logger.info('Video paused', null, 'VIDEO');
      } else {
        // Try multiple methods to play the video
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
        videoIsPlaying = true;
        logger.info('Video playing', null, 'VIDEO');
      }
      
              logger.debug(`videoIsPlaying after: ${videoIsPlaying}`, null, 'VIDEO');
      
      // Update the play button icon
      updateVideoPlayButtonIcon();
      
      // Also try to reload the iframe if postMessage fails
      setTimeout(() => {
        if (videoIsPlaying && iframe.src) {
          logger.info('Attempting to force play by reloading iframe', null, 'VIDEO');
          const currentSrc = iframe.src;
          iframe.src = currentSrc.replace('autoplay=0', 'autoplay=1');
          setTimeout(() => {
            iframe.src = currentSrc;
          }, 100);
        }
      }, 500);
      
      // Alternative approach: try to click the play button inside the iframe
      setTimeout(() => {
        if (videoIsPlaying) {
          logger.info('Attempting alternative play method', null, 'VIDEO');
          try {
            // Try to find and click the play button inside the iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const playButton = iframeDoc.querySelector('.ytp-play-button');
            if (playButton) {
              playButton.click();
              logger.info('Clicked play button inside iframe', null, 'VIDEO');
            }
          } catch (error) {
                          logger.warn('Could not access iframe content (CORS restriction)', null, 'VIDEO');
          }
        }
      }, 1000);
      
    } catch (error) {
      logger.error('Error toggling video', error, 'VIDEO');
      // Fallback: just toggle the state and update button
      videoIsPlaying = !videoIsPlaying;
      updateVideoPlayButtonIcon();
    }
  } else {
    logger.error('No video iframe found', null, 'VIDEO');
  }
}

// Keep the old functions for backward compatibility
function videoPlay() {
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    videoIsPlaying = true;
  }
}

function videoPause() {
  const iframe = document.getElementById('videoIframe');
  if (iframe) {
    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    videoIsPlaying = false;
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
  const playlistButton = document.querySelector('#videoControls button[onclick="videoTogglePlaylist()"]');
  
  videoPlaylistVisible = !videoPlaylistVisible;
  
  if (videoPlaylistVisible) {
    // Show playlist
    playlist.style.display = 'block';
    playlist.style.pointerEvents = 'auto';
    playlist.style.zIndex = '9999';
    playlist.style.visibility = 'visible';
    playlist.style.opacity = '1';
    
    // Update button text to show it's ON
    if (playlistButton) {
      playlistButton.textContent = '📋';
      playlistButton.title = 'Hide Playlist';
    }
    
    // Removed auto-hide functionality
  } else {
    // Hide playlist
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
    playlist.style.opacity = '0';
    
    // Update button text to show it's OFF
    if (playlistButton) {
      playlistButton.textContent = '📋';
      playlistButton.title = 'Show Playlist';
    }
    
    // Clear any existing timeout
    if (videoPlaylistTimeout) {
      clearTimeout(videoPlaylistTimeout);
      videoPlaylistTimeout = null;
    }
  }
  
  logger.info(`Playlist toggled: ${videoPlaylistVisible ? 'ON' : 'OFF'}`, null, 'PLAYLIST');
}

function videoToggleFullscreen() {
  const player = document.getElementById('videoPlayer');
  if (player) {
    if (document.fullscreenElement) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      console.log('🖥️ Exiting fullscreen');
    } else {
      // Enter fullscreen
      if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else if (player.mozRequestFullScreen) {
        player.mozRequestFullScreen();
      } else if (player.msRequestFullscreen) {
        player.msRequestFullscreen();
      }
      console.log('🖥️ Entering fullscreen');
    }
  }
}

function updateVideoOpacity(value) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    player.style.opacity = value;
    console.log('🎥 Video opacity updated to:', value);
    
    // If opacity is 0, make sure the player is still functional
    if (parseFloat(value) === 0) {
      console.log('🎥 Video player is now invisible but still functional');
    }
  }
}

function updateVideoSize(value) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    const scale = parseFloat(value);
    // Get current vertical offset from transform
    const currentTransform = player.style.transform || '';
    const verticalMatch = currentTransform.match(/calc\(-50% \+ (-?\d+)px\)/);
    const verticalOffset = verticalMatch ? parseInt(verticalMatch[1]) : 0;
    
    // Apply scale with preserved vertical position
    player.style.transform = `translate(-50%, calc(-50% + ${verticalOffset}px)) scale(${scale})`;
    console.log('🎥 Video size updated to:', scale);
  }
}

function updateVideoVertical(value) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    const verticalOffset = parseInt(value);
    // Get current scale from transform
    const currentTransform = player.style.transform || '';
    const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
    const scale = scaleMatch ? scaleMatch[1] : '1';
    
    // Apply vertical position with preserved scale (inverted)
    player.style.transform = `translate(-50%, calc(-50% - ${verticalOffset}px)) scale(${scale})`;
    console.log('🎥 Video vertical position updated to:', -verticalOffset, 'px');
  }
}

function videoClose() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  const playlist = document.getElementById('videoPlaylist');
  const iframe = document.getElementById('videoIframe');
  
  // Stop the video by clearing the iframe src
  if (iframe) {
    iframe.src = '';
    videoIsPlaying = false;
    console.log('🎥 Video stopped');
  }
  
  // Hide all video elements
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
    videoPlaylistVisible = false;
  }
  
  videoPlaylistVisible = false;
  
  // Update video button to show inactive state
  const videoButton = document.querySelector('[data-icon="video"]');
  if (videoButton && typeof PNGLoader !== 'undefined') {
    PNGLoader.applyPNG(videoButton, 'video.png');
  }
  
  console.log('🎥 Video player closed and video stopped');
}

function showVideoControls() {
  const player = document.getElementById('videoPlayer');
  const controls = document.getElementById('videoControls');
  
  console.log('🎥 showVideoControls called');
  console.log('🎥 Player:', player);
  console.log('🎥 Controls:', controls);
  console.log('🎥 Player display:', player ? player.style.display : 'no player');
  
  // Only show controls if video player is visible
  if (controls && player && player.style.display !== 'none') {
    controls.style.display = 'block';
    controls.style.pointerEvents = 'auto';
    controls.style.zIndex = '20001';
    console.log('🎥 Video controls shown with z-index:', controls.style.zIndex);
    
    // Start auto-hide timer when controls are shown
    startVideoControlsAutoHide();
  } else {
    console.log('🎥 Video controls not shown - conditions not met');
  }
}

function showVideoPlaylist() {
  const player = document.getElementById('videoPlayer');
  const playlist = document.getElementById('videoPlaylist');
  
  // Only show playlist if video player is visible AND playlist toggle is ON
  if (playlist && player && player.style.display !== 'none' && videoPlaylistVisible) {
    playlist.style.opacity = '1';
    playlist.style.display = 'block';
    playlist.style.pointerEvents = 'auto';
    playlist.style.zIndex = '9999';
    playlist.style.visibility = 'visible';
  }
}

// ===== VIDEO CONTROLS AUTO-HIDE FUNCTIONS =====

function startVideoControlsAutoHide() {
  // Clear any existing timeout
  if (videoControlsTimeout) {
    clearTimeout(videoControlsTimeout);
  }
  
  // Set new timeout to hide controls after 30 seconds
  videoControlsTimeout = setTimeout(() => {
    hideVideoControls();
  }, 30000);
  
  console.log('⏰ Video controls auto-hide timer started (30s)');
}

function hideVideoControls() {
  const controls = document.getElementById('videoControls');
  if (controls && controls.style.display !== 'none') {
    controls.classList.add('fade-out');
    videoControlsVisible = false;
    console.log('👻 Video controls faded out');
  }
}

function showVideoControlsOnMouseMove() {
  const controls = document.getElementById('videoControls');
  if (controls && controls.style.display !== 'none') {
    // Clear existing timeout
    if (videoControlsTimeout) {
      clearTimeout(videoControlsTimeout);
    }
    
    // Show controls if they were hidden
    if (!videoControlsVisible) {
      controls.classList.remove('fade-out');
      videoControlsVisible = true;
      console.log('👁️ Video controls shown on mouse move');
    }
    
    // Restart auto-hide timer
    startVideoControlsAutoHide();
  }
}

// Auto-hide functionality removed - playlist now only toggles via button

// Flag to prevent multiple simultaneous updates
let isUpdatingPlaylistDisplay = false;
let videoPlayerInitialized = false;

async function updateVideoPlaylistDisplay() {
  // Prevent multiple simultaneous updates
  if (isUpdatingPlaylistDisplay) {
    console.log('📋 Playlist display update already in progress, skipping');
    return;
  }
  
  isUpdatingPlaylistDisplay = true;
  
  const playlistContainer = document.getElementById('videoPlaylistItems');
  if (!playlistContainer) {
    console.error('❌ Video Playlist container not found');
    isUpdatingPlaylistDisplay = false;
    return;
  }
  
  // Update playlist header to show current playlist name
  const playlistHeader = document.querySelector('#videoPlaylist h3');
  const currentPlaylistLabel = document.getElementById('currentPlaylistLabel');
  
  if (uploadedPlaylists.length > 0 && currentPlaylistIndex >= 0 && currentPlaylistIndex < uploadedPlaylists.length) {
    const currentPlaylist = uploadedPlaylists[currentPlaylistIndex];
    if (playlistHeader) {
      playlistHeader.textContent = `💚 ${currentPlaylist.name} (${currentPlaylist.urls.length} videos) ♻️`;
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = `Playing: ${currentPlaylist.name}`;
    }
  } else {
    if (playlistHeader) {
      playlistHeader.textContent = '💚 YouTube Playlist ♻️';
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = '📋 Upload Playlist (.txt):';
    }
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
    
    // If title not cached, fetch it (but only if we haven't already tried)
    if (!title && videoId && !videoTitles[index]) {
      try {
        title = await fetchVideoTitle(videoId);
        if (title) {
          videoTitles[index] = title;
        } else {
          // Mark as attempted to avoid repeated failed requests
          videoTitles[index] = null;
        }
      } catch (error) {
        console.error('❌ Error fetching video title:', error);
        // Mark as attempted to avoid repeated failed requests
        videoTitles[index] = null;
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
  isUpdatingPlaylistDisplay = false;
}

// Silent version that doesn't use the flag system
async function updateVideoPlaylistDisplaySilent() {
  const playlistContainer = document.getElementById('videoPlaylistItems');
  if (!playlistContainer) {
    console.error('❌ Video Playlist container not found');
    return;
  }
  
  // Update playlist header to show current playlist name
  const playlistHeader = document.querySelector('#videoPlaylist h3');
  const currentPlaylistLabel = document.getElementById('currentPlaylistLabel');
  
  if (uploadedPlaylists.length > 0 && currentPlaylistIndex >= 0 && currentPlaylistIndex < uploadedPlaylists.length) {
    const currentPlaylist = uploadedPlaylists[currentPlaylistIndex];
    if (playlistHeader) {
      playlistHeader.textContent = `💚 ${currentPlaylist.name} (${currentPlaylist.urls.length} videos) ♻️`;
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = `Playing: ${currentPlaylist.name}`;
    }
  } else {
    if (playlistHeader) {
      playlistHeader.textContent = '💚 YouTube Playlist ♻️';
    }
    if (currentPlaylistLabel) {
      currentPlaylistLabel.textContent = '📋 Upload Playlist (.txt):';
    }
  }
  
  // Update the playing indicator without rebuilding the entire list
  const items = playlistContainer.querySelectorAll('.playlist-item');
  items.forEach((item, index) => {
    if (index === videoCurrentIndex) {
      item.classList.add('playing');
    } else {
      item.classList.remove('playing');
    }
  });
  
  console.log('📋 Video Playlist display updated (silent)');
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
    // Just hide video elements without stopping playback
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
    console.log('🎥 Video player hidden (playback continues)');
    
    // Update video button to show inactive state
    const videoButton = document.querySelector('[data-icon="video"]');
    if (videoButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(videoButton, 'video.png');
    }
  } else {
    // Show video player with proper z-index and current opacity
    if (player) {
      player.style.display = 'block';
      player.style.pointerEvents = 'auto';
      player.style.zIndex = '9998';
      player.style.visibility = 'visible';
      
      // Apply current opacity setting
      const opacitySlider = document.getElementById('videoOpacitySlider');
      if (opacitySlider) {
        player.style.opacity = opacitySlider.value;
      }
    }
    
    // Show controls initially
    if (controls) {
      controls.style.display = 'block';
      controls.style.pointerEvents = 'auto';
      controls.style.zIndex = '9997';
      controls.style.visibility = 'visible';
    }
    
    // Initialize video player on first open
    if (!videoPlayerInitialized) {
      videoPlayerInitialized = true;
      console.log('🎥 Video player initialized for first time');
      
      // Try to load pre-loaded playlists first
      if (uploadedPlaylists.length > 0) {
        currentPlaylistIndex = 0;
        loadUploadedPlaylist(0);
        console.log('🎥 Video player opened with pre-loaded playlist');
      } else if (typeof loadVideoPlaylist === 'function') {
        // Try to load playlist, but don't block the UI
        setTimeout(() => {
          loadVideoPlaylist().then(() => {
            // Play first video after playlist is loaded
            if (videoPlaylist.length > 0) {
              videoPlayVideo(0);
            }
          }).catch(error => {
            console.log('🎥 Playlist loading failed, but video player is ready');
          });
        }, 100);
      }
      if (typeof updateVideoPlaylistDisplay === 'function') {
        updateVideoPlaylistDisplay();
      }
    } else {
      // If video player was previously closed, ensure a video is playing
      const iframe = document.getElementById('videoIframe');
      if (iframe && (!iframe.src || iframe.src === '')) {
        console.log('🎥 Video player reopened - ensuring video is playing');
        
        // Try to load and play a video if none is currently playing
        if (videoPlaylist.length > 0) {
          videoPlayVideo(videoCurrentIndex);
        } else if (typeof loadVideoPlaylist === 'function') {
          // Load playlist and play first video
          setTimeout(() => {
            loadVideoPlaylist().then(() => {
              if (videoPlaylist.length > 0) {
                videoPlayVideo(0);
              }
            }).catch(error => {
              console.log('🎥 Playlist loading failed on reopen');
            });
          }, 100);
        }
      }
    }
    
    // Video player already initialized, just play first video if needed
    const videoIframe = document.getElementById('videoIframe');
    if (videoIframe && videoIframe.src && videoIframe.src !== '' && videoIframe.src !== 'about:blank') {
      console.log('🎥 Video player shown (playback continues)');
    } else if (videoPlaylist.length > 0) {
      // Start playing the first video immediately
      setTimeout(() => {
        videoPlayVideo(0);
        console.log('🎥 Video player opened and started playing first video');
      }, 100);
    }
    
    // Start with playlist hidden and update button text
    if (playlist) {
      playlist.style.display = 'none';
      playlist.style.opacity = '0';
      playlist.style.pointerEvents = 'none';
      playlist.style.zIndex = '-1';
      playlist.style.visibility = 'hidden';
    }
    
    // Update playlist button text to show it's OFF initially
    const playlistButton = document.querySelector('#videoControls button[onclick="videoTogglePlaylist()"]');
    if (playlistButton) {
      playlistButton.textContent = '📋';
      playlistButton.title = 'Show Playlist';
    }
    
    // Reset playlist visibility state
    videoPlaylistVisible = false;
    
    // Update video button to show active state
    const videoButton = document.querySelector('[data-icon="video"]');
    if (videoButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(videoButton, 'video2.png');
    }
  }
  
  console.log('🎥 Video player toggled:', isVisible ? 'hidden' : 'shown');
}

// ===== MODULAR ANIMATION SYSTEM =====

// Animation Configuration
const ANIMATION_CONFIG = {
  defaultDuration: 10000, // 10 seconds
  minKeyframes: 2,
  timelineStep: 0.01
};

// Animation State Manager
const AnimationState = {
  data: {
    inPoint: null,
    outPoint: null,
    keyframes: [],
    duration: ANIMATION_CONFIG.defaultDuration,
    isRecording: false,
    isPlaying: false,
    currentTime: 0,
    startTime: 0
  },
  
  timelineMarkers: [],
  playbackStartTime: 0,
  playbackDuration: 0,
  currentPlaybackTime: 0,
  
  // Reset animation state
  reset() {
    this.data.keyframes = [];
    this.timelineMarkers = [];
    this.data.isRecording = false;
    this.data.isPlaying = false;
    console.log('🔄 Animation state reset');
  },
  
  // Get current state
  getState() {
    return { ...this.data };
  },
  
  // Update duration
  updateDuration(duration) {
    this.data.duration = duration;
    console.log(`⏱️ Animation duration updated: ${duration}ms`);
  }
};

function recordState(type) {
  // Get duration from dropdown
  const durationSelect = document.getElementById('mediaPlaybackDuration');
  const duration = parseInt(durationSelect.value);
  AnimationState.updateDuration(duration);
  
  if (type === 'start') {
    // Auto-pause if speed is not 0
    if (typeof speedMultiplier !== 'undefined' && speedMultiplier !== 0) {
      if (typeof togglePauseButton === 'function') {
        togglePauseButton();
      }
    }
    
    // Reset animation state
    AnimationState.reset();
    updateTimelineDisplay();
    
    // Set in point at 0 seconds and out point at full duration
    AnimationState.data.inPoint = 0;
    AnimationState.data.outPoint = duration / 1000;
    AnimationState.data.isRecording = true;
    
    console.log('🎬 In point set at 0s, Out point set at', (duration / 1000).toFixed(1), 's');
    
    // Capture current bubble positions
    const currentPositions = captureBubblePositions();
    
    // Create keyframes: in point (0s) and out point (full duration) with same positions
    AnimationState.data.keyframes = [
      {
        time: 0,
        positions: currentPositions
      },
      {
        time: duration / 1000,
        positions: currentPositions
      }
    ];
    
    // Add timeline markers
    addTimelineMarker('in', 0);
    addTimelineMarker('out', duration / 1000);
    
    // Update time display
    updatePlaybackTimeDisplay(0, duration / 1000);
    
    console.log('✅ Animation ready: In and Out points created with current positions');
    console.log('📊 Keyframes created:', AnimationState.data.keyframes.length);
    AnimationState.data.keyframes.forEach((kf, index) => {
      console.log(`  Keyframe ${index}: time=${kf.time}s, positions=${kf.positions.length}`);
    });
    
  } else if (type === 'end') {
    if (!AnimationState.data.isRecording) {
      alert('Please start recording first (mark in point)');
      return;
    }
    
    // Get current time from timeline slider
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    const progress = parseFloat(timelineSlider.value);
    const endTime = progress * (duration / 1000);
    
    AnimationState.data.outPoint = endTime;
    AnimationState.data.isRecording = false;
    console.log('🏁 Out point adjusted to', endTime.toFixed(1), 's');
    
    // Update out marker position
    updateTimelineMarkers();
    
    // Capture current bubble positions for out point
    const endPositions = captureBubblePositions();
    
    // Update the out keyframe with current positions
    const outKeyframeIndex = AnimationState.data.keyframes.findIndex(kf => kf.time === AnimationState.data.outPoint);
    if (outKeyframeIndex !== -1) {
      AnimationState.data.keyframes[outKeyframeIndex].positions = endPositions;
    } else {
      AnimationState.data.keyframes.push({
        time: endTime,
        positions: endPositions
      });
    }
    
    // Update time display
    updatePlaybackTimeDisplay(endTime, duration / 1000);
    
    console.log('✅ Animation complete: Out point updated with current positions');
    
  } else if (type === 'keyframe') {
    // Pause any current playback
    if (AnimationState.data.isPlaying) {
      stopPlayback();
      console.log('⏸️ Paused playback to add keyframe');
    }
    
    // Get current time from timeline slider
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    const progress = parseFloat(timelineSlider.value);
    const keyframeTime = progress * (duration / 1000);
    
    const maxTime = duration / 1000;
    
    if (keyframeTime <= 0 || keyframeTime >= maxTime) {
      alert('Keyframe must be between start and end of animation');
      return;
    }
    
    // Capture current bubble positions for keyframe
    const keyframePositions = captureBubblePositions();
    const keyframe = {
      time: keyframeTime,
      positions: keyframePositions
    };
    
    // If no animation is active, start one
    if (!AnimationState.data.isRecording) {
      AnimationState.data.isRecording = true;
      AnimationState.data.inPoint = 0;
      AnimationState.data.outPoint = maxTime;
      AnimationState.data.keyframes = [];
      console.log('🎬 Started new animation recording');
    }
    
    AnimationState.data.keyframes.push(keyframe);
    addTimelineMarker('keyframe', keyframeTime);
    
    console.log('📍 Keyframe added at:', keyframeTime.toFixed(1), 's with current positions');
  }
}

function deepCopyIdeas() {
  // Deep copy the ideas array (equivalent to the previous system)
  return ideas.map(idea => ({ ...idea }));
}

function captureBubblePositions() {
  // Use the ideas array instead of DOM elements
  console.log('🎬 Capturing bubble positions from ideas array...');
  console.log('🔍 Found ideas:', ideas.length);
  
  const positions = deepCopyIdeas();
  
  positions.forEach((idea, index) => {
    console.log(`  Idea ${index}: x=${idea.x.toFixed(1)}, y=${idea.y.toFixed(1)}, title="${idea.title}"`);
  });
  
  console.log('✅ Captured positions for', positions.length, 'ideas');
  return positions;
}

function addTimelineMarker(type, time) {
  const marker = {
    type: type,
    time: time,
    position: (time / (AnimationState.data.duration / 1000)) * 100 // Convert to percentage
  };
  
  // Remove existing marker of same type
  AnimationState.timelineMarkers = AnimationState.timelineMarkers.filter(m => m.type !== type);
  
  // Add new marker
  AnimationState.timelineMarkers.push(marker);
  updateTimelineDisplay();
}

function updateTimelineDisplay() {
  const timeline = document.getElementById('mediaPlaybackSlider');
  if (!timeline) return;
  
  // Clear existing markers
  const existingMarkers = timeline.parentNode.querySelectorAll('.timeline-marker');
  existingMarkers.forEach(marker => marker.remove());
  
  // Add new markers
  AnimationState.timelineMarkers.forEach(marker => {
    const markerElement = document.createElement('div');
    markerElement.className = 'timeline-marker';
    markerElement.style.left = `${marker.position}%`;
    markerElement.style.backgroundColor = marker.type === 'in' ? '#4CAF50' : 
                                       marker.type === 'out' ? '#f44336' : '#FF9800';
    markerElement.title = `${marker.type} point at ${marker.time.toFixed(1)}s`;
    
    timeline.parentNode.appendChild(markerElement);
  });
}

function updateTimelineMarkers() {
  // Clear and rebuild all markers
  AnimationState.timelineMarkers = [];
  
  // Add in marker
  addTimelineMarker('in', 0);
  
  // Add out marker
  addTimelineMarker('out', AnimationState.data.outPoint);
  
  // Add keyframe markers
  AnimationState.data.keyframes.forEach(keyframe => {
    if (keyframe.time > 0 && keyframe.time < AnimationState.data.outPoint) {
      addTimelineMarker('keyframe', keyframe.time);
    }
  });
}

function updatePlaybackTimeDisplay(currentTime, totalTime) {
  const timeDisplay = document.getElementById('playbackTimeDisplay');
  if (timeDisplay) {
    const currentFormatted = formatTime(currentTime);
    const totalFormatted = formatTime(totalTime);
    timeDisplay.textContent = `${currentFormatted} / ${totalFormatted}`;
  }
}

function startPlayback() {
  console.log('🎬 Playback check:', {
    inPoint: AnimationState.data.inPoint,
    outPoint: AnimationState.data.outPoint,
    keyframes: AnimationState.data.keyframes.length,
    isRecording: AnimationState.data.isRecording
  });
  
  // Check if we have at least 2 keyframes (in and out points)
  if (AnimationState.data.keyframes.length < 2) {
    console.log('❌ Not enough keyframes for playback:', AnimationState.data.keyframes.length);
    alert('Please set in point first to create animation (need at least 2 keyframes)');
    return;
  }
  
  console.log('✅ Sufficient keyframes for playback:', AnimationState.data.keyframes.length);
  
  if (AnimationState.data.isPlaying) {
    stopPlayback();
    return;
  }
  
  AnimationState.data.isPlaying = true;
  AnimationState.playbackStartTime = Date.now();
  
  // Calculate duration from in and out points
  AnimationState.playbackDuration = (AnimationState.data.outPoint - AnimationState.data.inPoint) * 1000; // Convert to milliseconds
  
  console.log('▶️ Starting animation playback:', AnimationState.playbackDuration, 'ms');
  
  // Start the animation
  animateBubbles(AnimationState.playbackDuration);
}

function stopPlayback() {
  AnimationState.data.isPlaying = false;
  console.log('⏹️ Animation playback stopped');
}

function animateBubbles(duration) {
  if (!AnimationState.data.isPlaying) return;
  
  function animate() {
    if (!AnimationState.data.isPlaying) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - AnimationState.playbackStartTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Calculate current playback time in seconds
    AnimationState.currentPlaybackTime = AnimationState.data.inPoint + (progress * (AnimationState.data.outPoint - AnimationState.data.inPoint));
    
    // Update timeline slider
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    if (timelineSlider) {
      timelineSlider.value = progress;
    }
    
    // Update time display
    updatePlaybackTimeDisplay(AnimationState.currentPlaybackTime, AnimationState.data.duration / 1000);
    
    // Interpolate bubble positions
    interpolateBubblePositions(progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete
      AnimationState.data.isPlaying = false;
      console.log('✅ Animation playback complete');
    }
  }
  
  animate();
}

function interpolateBubblePositions(progress) {
  if (AnimationState.data.keyframes.length < 2) {
    console.log('❌ Not enough keyframes for interpolation:', AnimationState.data.keyframes.length);
    return;
  }
  
  // Convert progress to time in seconds
  const currentTime = progress * (AnimationState.data.duration / 1000);
  
  console.log('🎬 Interpolating at progress:', progress, 'time:', currentTime.toFixed(1), 's');
  
  // Find the two keyframes to interpolate between
  let startKeyframe = AnimationState.data.keyframes[0];
  let endKeyframe = AnimationState.data.keyframes[AnimationState.data.keyframes.length - 1];
  
  for (let i = 0; i < AnimationState.data.keyframes.length - 1; i++) {
    if (currentTime >= AnimationState.data.keyframes[i].time && currentTime <= AnimationState.data.keyframes[i + 1].time) {
      startKeyframe = AnimationState.data.keyframes[i];
      endKeyframe = AnimationState.data.keyframes[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const segmentProgress = (currentTime - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);
  
  console.log('🎬 Interpolating between keyframes:', startKeyframe.time.toFixed(1), 's and', endKeyframe.time.toFixed(1), 's, factor:', segmentProgress.toFixed(2));
  
  // Apply interpolated positions to ideas array (which drives the rendering)
  const startPositions = startKeyframe.positions;
  const endPositions = endKeyframe.positions;
  
  if (startPositions && endPositions) {
    // Update the ideas array with interpolated positions
    ideas.forEach((idea, index) => {
      const startPos = startPositions[index];
      const endPos = endPositions[index];
      
      if (startPos && endPos) {
        // Interpolate position
        idea.x = startPos.x + (endPos.x - startPos.x) * segmentProgress;
        idea.y = startPos.y + (endPos.y - startPos.y) * segmentProgress;
        
        // Interpolate velocity (optional)
        if (startPos.vx !== undefined && endPos.vx !== undefined) {
          idea.vx = startPos.vx + (endPos.vx - startPos.vx) * segmentProgress;
          idea.vy = startPos.vy + (endPos.vy - startPos.vy) * segmentProgress;
        }
        
        // Interpolate other properties if they exist
        if (startPos.radius !== undefined && endPos.radius !== undefined) {
          idea.radius = startPos.radius + (endPos.radius - startPos.radius) * segmentProgress;
        }
      }
    });
    
    console.log('✅ Applied interpolated positions to ideas array');
  }
}

// ===== SAVE/LOAD ANIMATION FUNCTIONS =====

function saveAnimation() {
  if (AnimationState.data.keyframes.length < 2) {
    alert('Please record an animation first (mark in and out points)');
    return;
  }
  
  const animationToSave = {
    ...AnimationState.data,
    timestamp: Date.now(),
    name: `Animation_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
  };
  
  const dataStr = JSON.stringify(animationToSave, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${animationToSave.name}.json`;
  link.click();
  
  console.log('💾 Animation saved:', animationToSave.name);
}

function loadAnimation() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedAnimation = JSON.parse(e.target.result);
        
        // Validate the loaded animation
        if (!loadedAnimation.keyframes || loadedAnimation.keyframes.length < 2) {
          alert('Invalid animation file: missing keyframes');
          return;
        }
        
        // Load the animation data
        animationData = {
          inPoint: loadedAnimation.inPoint || 0,
          outPoint: loadedAnimation.outPoint || 10,
          keyframes: loadedAnimation.keyframes,
          duration: loadedAnimation.duration || 10000,
          isRecording: false,
          isPlaying: false,
          currentTime: 0,
          startTime: 0
        };
        
        // Update duration dropdown
        const durationSelect = document.getElementById('mediaPlaybackDuration');
        durationSelect.value = animationData.duration;
        
        // Clear and rebuild timeline markers
        timelineMarkers = [];
        animationData.keyframes.forEach(keyframe => {
          addTimelineMarker('keyframe', keyframe.time);
        });
        
        // Add in/out markers
        addTimelineMarker('in', 0);
        addTimelineMarker('out', animationData.outPoint);
        
        console.log('📂 Animation loaded:', loadedAnimation.name || 'Unnamed Animation');
        
      } catch (error) {
        console.error('❌ Error loading animation:', error);
        alert('Error loading animation file');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ===== VIDEO CONTROL IMAGE HANDLING =====

function loadVideoControlImages() {
  const imageNames = ['prev', 'play', 'next', 'playlist', 'fullscreen', 'close'];
  const imageFileMap = {
    'prev': 'previous.png',
    'play': 'play.png',
    'next': 'next.png',
    'playlist': 'playlist.png',
    'fullscreen': 'fullscreen.png',
    'close': 'stop.png'
  };
  
  console.log('🎨 Loading video control PNG images...');
  
  // First, let's check if the buttons exist
  const buttons = document.querySelectorAll('.video-control-btn');
  console.log(`Found ${buttons.length} video control buttons`);
  
  imageNames.forEach(iconName => {
    const fileName = imageFileMap[iconName];
    const img = new Image();
    
    img.onload = function() {
      // Image loaded successfully, update button style
      const buttons = document.querySelectorAll(`[data-icon="${iconName}"]`);
      console.log(`Found ${buttons.length} buttons for ${iconName}`);
      
      buttons.forEach(button => {
        // Set the background image directly
        button.style.backgroundImage = `url('images/${fileName}')`;
        button.style.color = 'transparent';
        button.style.fontSize = '0';
        button.style.backgroundSize = 'cover';
        button.style.backgroundRepeat = 'no-repeat';
        button.style.backgroundPosition = 'center';
        
        console.log(`✅ Applied ${fileName} to ${iconName} button`);
      });
    };
    
    img.onerror = function() {
      // Image failed to load, keep emoji fallback
      console.log(`⚠️ Video control image not found: ${fileName} for ${iconName} button (using emoji fallback)`);
    };
    
    // Set the source to trigger loading
    img.src = `images/${fileName}`;
    console.log(`🔄 Attempting to load: images/${fileName}`);
  });
}

// ===== MEDIA EVENT LISTENER SETUP =====

function setupMediaEventListeners() {
  // Media toolbar functionality
  const bgLoader = document.getElementById('bgLoader');
  if (bgLoader && typeof handleBackgroundUpload === 'function') {
    bgLoader.addEventListener('change', handleBackgroundUpload);
    console.log('✅ Background upload listener set up');
  }
  
  const videoLoader = document.getElementById('videoLoader');
  if (videoLoader && typeof handleVideoUpload === 'function') {
    videoLoader.addEventListener('change', handleVideoUpload);
    console.log('✅ Video upload listener set up');
  }
  
  // Set up timeline slider events
  const timelineSlider = document.getElementById('mediaPlaybackSlider');
  if (timelineSlider) {
    timelineSlider.addEventListener('input', (e) => {
      if (!AnimationState.data.isPlaying) {
        const progress = parseFloat(e.target.value);
        console.log('🎛️ Timeline slider moved to progress:', progress);
        
        if (AnimationState.data.keyframes.length >= 2) {
          const currentTime = progress * (AnimationState.data.duration / 1000);
          AnimationState.currentPlaybackTime = currentTime;
          interpolateBubblePositions(progress);
          updatePlaybackTimeDisplay(currentTime, AnimationState.data.duration / 1000);
        } else {
          console.log('❌ No keyframes available for timeline scrubbing');
        }
      }
    });
    
    // Add change event to record positions when scrubbing to end
    timelineSlider.addEventListener('change', (e) => {
      if (!AnimationState.data.isPlaying && AnimationState.data.isRecording) {
        const progress = parseFloat(e.target.value);
        const currentTime = progress * (AnimationState.data.duration / 1000);
        
        // If scrubbed to the end (or very close), update the out point
        if (progress >= 0.95) { // Within 5% of the end
          console.log('🎬 Timeline scrubbed to end - updating out point');
          
          // Capture current positions
          const endPositions = captureBubblePositions();
          
          // Update the out keyframe
          const outKeyframeIndex = AnimationState.data.keyframes.findIndex(kf => kf.time === AnimationState.data.outPoint);
          if (outKeyframeIndex !== -1) {
            AnimationState.data.keyframes[outKeyframeIndex].positions = endPositions;
            console.log('✅ Out point updated with current positions');
          }
          
          // Update timeline markers
          updateTimelineMarkers();
        }
      }
    });
  }
  
  // Set up duration change handler
  const durationSelect = document.getElementById('mediaPlaybackDuration');
  if (durationSelect) {
    durationSelect.addEventListener('change', (e) => {
      AnimationState.data.duration = parseInt(e.target.value);
      console.log('⏱️ Animation duration changed to:', AnimationState.data.duration, 'ms');
    });
  }
  
  // Load toolbar button images immediately
  loadToolbarButtonImages();
  
  // Test PNG loading
  setTimeout(() => {
    console.log('🧪 Testing PNG loading...');
    const testButtons = document.querySelectorAll('[data-icon]');
    testButtons.forEach((button, index) => {
      const dataIcon = button.getAttribute('data-icon');
      const bgImage = getComputedStyle(button).backgroundImage;
      console.log(`Button ${index + 1}: data-icon="${dataIcon}", background="${bgImage}"`);
    });
    
    // Test if PNG files exist
    console.log('🧪 Testing PNG file existence...');
    const testFiles = ['recordin.png', 'keyframe.png', 'recordout.png', 'play.png', 'save.png', 'load.png', 'snapshot.png'];
    testFiles.forEach(file => {
      const img = new Image();
      img.onload = () => console.log(`✅ PNG file exists: ${file}`);
      img.onerror = () => console.log(`❌ PNG file missing: ${file}`);
      img.src = `images/${file}`;
    });
  }, 500);
}

// ===== PLAYLIST PANEL FUNCTIONS =====

function closePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  if (playlist) {
    playlist.style.display = 'none';
    playlist.style.pointerEvents = 'none';
    playlist.style.zIndex = '-1';
    playlist.style.visibility = 'hidden';
    videoPlaylistVisible = false;
    console.log('📋 Playlist panel closed');
  }
}

function minimizePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  if (playlist) {
    if (playlist.classList.contains('minimized')) {
      // Restore playlist
      playlist.classList.remove('minimized');
      playlist.style.width = '300px';
      playlist.style.height = '400px';
      playlist.style.overflow = 'auto';
      playlist.style.maxHeight = '400px';
      console.log('📋 Playlist panel restored');
    } else {
      // Minimize playlist
      playlist.classList.add('minimized');
      playlist.style.width = '30px';
      playlist.style.height = '200px';
      playlist.style.overflow = 'hidden';
      playlist.style.maxHeight = '200px';
      console.log('📋 Playlist panel minimized');
    }
  }
}

function restorePlaylist() {
  const playlist = document.getElementById('videoPlaylist');
  if (playlist && playlist.classList.contains('minimized')) {
    playlist.classList.remove('minimized');
    playlist.style.width = '300px';
    playlist.style.height = '400px';
    playlist.style.overflow = 'auto';
    playlist.style.maxHeight = '400px';
    console.log('📋 Playlist panel restored');
  }
}

// ===== DEBUG FUNCTIONS =====

function debugVideoControls() {
  console.log('🔍 Debugging video controls...');
  const buttons = document.querySelectorAll('.video-control-btn');
  console.log(`Found ${buttons.length} video control buttons`);
  
  buttons.forEach((button, index) => {
    const icon = button.getAttribute('data-icon');
    const backgroundImage = getComputedStyle(button).backgroundImage;
    const color = getComputedStyle(button).color;
    const fontSize = getComputedStyle(button).fontSize;
    console.log(`Button ${index + 1}: icon="${icon}", background="${backgroundImage}", color="${color}", fontSize="${fontSize}"`);
  });
}

function testPngAccess() {
  console.log('🧪 Testing PNG file access...');
  const testFiles = ['previous.png', 'play.png', 'next.png', 'playlist.png', 'fullscreen.png'];
  
  testFiles.forEach(fileName => {
    const img = new Image();
    img.onload = function() {
      console.log(`✅ PNG file accessible: ${fileName}`);
    };
    img.onerror = function() {
      console.log(`❌ PNG file not accessible: ${fileName}`);
    };
    img.src = `images/${fileName}`;
  });
}

// ===== MODULAR PNG LOADING SYSTEM =====

// PNG Configuration
const PNG_CONFIG = {
  mediaToolbar: [
    { dataIcon: 'record-in', file: 'recordin.png' },
    { dataIcon: 'keyframe', file: 'keyframe.png' },
    { dataIcon: 'record-out', file: 'recordout.png' },
    { dataIcon: 'play', file: 'play.png' },
    { dataIcon: 'save', file: 'saveanimation.png' },
    { dataIcon: 'load', file: 'loadanimation.png' },
    { dataIcon: 'snapshot-media', file: 'snapshot.png' },
    { dataIcon: 'youtube', file: 'youtube.png' },
    { dataIcon: 'hide', file: 'hide.png' }
  ],
  // Main toolbar buttons (with specific selectors)
  mainToolbar: [
    { dataIcon: 'media', file: 'media.png' },
    { dataIcon: 'youtube', file: 'youtube.png' },
    { dataIcon: 'dice', file: 'dice.png' },
    { dataIcon: 'rotate', file: 'rotate.png' },
    { dataIcon: 'music', file: 'music.png' },
    { dataIcon: 'clear', file: 'clear.png' },
    { dataIcon: 'reset', file: 'reset.png' },
    { dataIcon: 'cycle', file: 'cycle.png' },
    { dataIcon: 'rand', file: 'rand.png' },
    { dataIcon: 'pause', file: 'pause.png' },
    { dataIcon: 'video', file: 'video.png' },
    { dataIcon: 'snapshot', file: 'snapshot.png' },
    { dataIcon: 'save', file: 'save.png' },
    { dataIcon: 'load', file: 'load.png' },
    { dataIcon: 'draw', file: 'draw.png' }
  ],
  // Video control buttons
  videoControls: [
    { dataIcon: 'playlist', file: 'playlist.png' },
    { dataIcon: 'prev', file: 'previous.png' },
    { dataIcon: 'play', file: 'play.png' },
    { dataIcon: 'next', file: 'next.png' },
    { dataIcon: 'close', file: 'stop.png' }
  ]
};

// PNG Loading Utilities
const PNGLoader = {
  // Apply PNG to a single button
  applyPNG(button, pngFile) {
    if (!button || !pngFile) return false;
    
    // Check if this PNG is already applied to avoid unnecessary reloads
    const currentPng = button.style.getPropertyValue('--png-url');
    const newPng = `url(images/${pngFile})`;
    
    if (currentPng === newPng) {
      // PNG already applied, no need to reload
      return true;
    }
    
    try {
      // Set CSS custom property for PNG URL
      button.style.setProperty('--png-url', newPng, 'important');
      button.classList.add('has-png');
      
      console.log(`✅ PNG applied: ${pngFile} to ${button.getAttribute('data-icon')}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to apply PNG: ${pngFile}`, error);
      return false;
    }
  },
  
  // Find button by data-icon
  findButton(dataIcon) {
    return document.querySelector(`[data-icon="${dataIcon}"]`);
  },
  
  // Find button by data-icon within specific container
  findButtonInContainer(dataIcon, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
      return container.querySelector(`[data-icon="${dataIcon}"]`);
    }
    return null;
  },
  
  // Load PNGs for a specific toolbar
  loadToolbarPNGs(toolbarConfig) {
    console.log(`🎛️ Loading PNGs for toolbar...`);
    
    let successCount = 0;
    const totalButtons = toolbarConfig.length;
    
    toolbarConfig.forEach(({ dataIcon, file }) => {
      const button = this.findButton(dataIcon);
      if (button) {
        if (this.applyPNG(button, file)) {
          successCount++;
        }
      } else {
        console.log(`⚠️ Button not found: ${dataIcon}`);
      }
    });
    
    console.log(`🎛️ PNG loading complete: ${successCount}/${totalButtons} successful`);
    return successCount;
  },
  
  // Debug: Show all buttons with data-icon
  debugButtons() {
    const buttons = document.querySelectorAll('[data-icon]');
    console.log('🔍 Found buttons:');
    buttons.forEach((button, index) => {
      const dataIcon = button.getAttribute('data-icon');
      const text = button.textContent.trim();
      console.log(`  ${index + 1}: data-icon="${dataIcon}", text="${text}"`);
    });
  }
};

// Main PNG loading function
function loadToolbarButtonImages() {
  console.log('🎛️ Starting PNG loading system...');
  
  // Debug: Show all buttons
  PNGLoader.debugButtons();
  
  // Load media toolbar PNGs (specific to #mediaToolbar)
  let mediaCount = 0;
  PNG_CONFIG.mediaToolbar.forEach(({ dataIcon, file }) => {
    const button = PNGLoader.findButtonInContainer(dataIcon, '#mediaToolbar');
    if (button) {
      if (PNGLoader.applyPNG(button, file)) {
        mediaCount++;
      }
    }
  });
  
  // Load main toolbar PNGs (specific to #toolbar)
  let mainCount = 0;
  PNG_CONFIG.mainToolbar.forEach(({ dataIcon, file }) => {
    const button = PNGLoader.findButtonInContainer(dataIcon, '#toolbar');
    if (button) {
      if (PNGLoader.applyPNG(button, file)) {
        mainCount++;
      }
    }
  });
  
  // Load video control PNGs
  const videoCount = PNGLoader.loadToolbarPNGs(PNG_CONFIG.videoControls);
  
  const totalCount = mediaCount + mainCount + videoCount;
  console.log(`🎛️ PNG loading system complete: ${totalCount} PNGs loaded (Media: ${mediaCount}, Main: ${mainCount}, Video: ${videoCount})`);
}

function updatePauseButtonIcon() {
  const pauseButton = document.querySelector('.toolbar-btn[data-icon="pause"]');
  if (pauseButton) {
    const filename = speedMultiplier === 0 ? 'play.png' : 'pause.png';
    // Use our PNG system to update the button
    PNGLoader.applyPNG(pauseButton, filename);
    console.log(`🎛️ Updated pause button to ${filename} (speed: ${speedMultiplier})`);
  }
}

function updateVideoPlayButtonIcon() {
  const playButton = document.querySelector('.video-control-btn[data-icon="play"]');
  if (playButton) {
    const filename = videoIsPlaying ? 'pause.png' : 'play.png';
    PNGLoader.applyPNG(playButton, filename);
    console.log(`🎥 Updated video play button to ${filename} (playing: ${videoIsPlaying})`);
  }
}

// ===== PRE-LOAD PLAYLISTS FROM ROOT FOLDER =====
let playlistsPreloaded = false; // Flag to prevent double loading

async function preloadPlaylists() {
  if (playlistsPreloaded) {
    console.log('📋 Playlists already pre-loaded, skipping');
    return;
  }
  
  const playlistFiles = ['s25_playlist.txt', 'Argyle🎧Podcasts.txt'];
  
  console.log('📋 Pre-loading playlists from root folder...');
  
  // Clear existing playlists to prevent duplication
  uploadedPlaylists.length = 0;
  videoPlaylist = [];
  videoTitles = [];
  videoCurrentIndex = 0;
  
  for (const filename of playlistFiles) {
    try {
      const response = await fetch(filename);
      if (response.ok) {
        const content = await response.text();
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Extract YouTube URLs from lines
        const youtubeUrls = lines.filter(line => {
          return line.includes('youtube.com') || line.includes('youtu.be');
        });
        
        if (youtubeUrls.length > 0) {
          const playlistName = filename.replace('.txt', '');
          
          uploadedPlaylists.push({
            name: playlistName,
            urls: youtubeUrls
          });
          console.log(`📋 Pre-loaded playlist "${playlistName}" with ${youtubeUrls.length} videos`);
        } else {
          console.log(`⚠️ No YouTube URLs found in ${filename}`);
        }
      } else {
        console.log(`⚠️ Could not load ${filename}: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Error loading ${filename}:`, error.message);
    }
  }
  
  // Set current playlist index if we have playlists
  if (uploadedPlaylists.length > 0) {
    currentPlaylistIndex = 0;
    loadUploadedPlaylist(0);
    console.log(`📋 Loaded ${uploadedPlaylists.length} playlists from root folder`);
  } else {
    console.log('📋 No playlists found in root folder');
  }
  
  playlistsPreloaded = true;
}

// ===== MEDIA.JS LOADED =====
console.log('🔧 Media.js loaded successfully');

// ===== INITIALIZATION SYSTEM =====
function initializeMediaSystem() {
  console.log('🎛️ Initializing media system...');
  
  // Wait for DOM to be fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        loadToolbarButtonImages();
        console.log('🎛️ Media system initialized after DOM load');
      }, 100);
    });
  } else {
    // DOM is already loaded
    setTimeout(() => {
      loadToolbarButtonImages();
      console.log('🎛️ Media system initialized immediately');
    }, 100);
  }
}

// Initialize when script loads
initializeMediaSystem();

// ===== MANUAL DEBUG FUNCTIONS =====
// Call these from browser console to debug PNG loading

function debugPNGLoading() {
  console.log('🔍 === PNG LOADING DEBUG ===');
  
  // Check if PNG files exist
  console.log('📁 Checking PNG file existence...');
  const testFiles = [
    // Media toolbar
    'recordin.png', 'keyframe.png', 'recordout.png', 'play.png', 'saveanimation.png', 'loadanimation.png', 'snapshot.png', 'youtube.png',
    // Main toolbar
    'media.png', 'youtube.png', 'dice.png', 'rotate.png', 'music.png', 'clear.png', 'reset.png', 'cycle.png', 'rand.png', 'pause.png', 'video.png', 'snapshot.png', 'save.png', 'load.png',
    // Video controls
    'playlist.png', 'previous.png', 'next.png', 'stop.png'
  ];
  
  testFiles.forEach(file => {
    const img = new Image();
    img.onload = () => console.log(`✅ PNG exists: ${file}`);
    img.onerror = () => console.log(`❌ PNG missing: ${file}`);
    img.src = `images/${file}`;
  });
  
  // Check buttons
  console.log('🔘 Checking buttons...');
  const buttons = document.querySelectorAll('[data-icon]');
  console.log(`Found ${buttons.length} buttons with data-icon`);
  
  buttons.forEach((button, index) => {
    const dataIcon = button.getAttribute('data-icon');
    const text = button.textContent.trim();
    const bgImage = getComputedStyle(button).backgroundImage;
    console.log(`Button ${index + 1}: data-icon="${dataIcon}", text="${text}", background="${bgImage}"`);
  });
  
  // Test PNG loading
  console.log('🎛️ Testing PNG loading...');
  loadToolbarButtonImages();
}

// Make debug function globally available
window.debugPNGLoading = debugPNGLoading;

// Quick test function to check specific missing buttons
function testMissingButtons() {
  console.log('🔍 === TESTING MISSING BUTTONS ===');
  
  const missingButtons = [
    { dataIcon: 'pause', file: 'pause.png' },
    { dataIcon: 'video', file: 'video.png' },
    { dataIcon: 'snapshot', file: 'snapshot.png' }
  ];
  
  missingButtons.forEach(({ dataIcon, file }) => {
    const button = document.querySelector(`[data-icon="${dataIcon}"]`);
    if (button) {
      console.log(`✅ Found button: data-icon="${dataIcon}"`);
      
      // Test PNG file
      const img = new Image();
      img.onload = () => {
        console.log(`✅ PNG exists: ${file}`);
        // Apply PNG
        PNGLoader.applyPNG(button, file);
      };
      img.onerror = () => console.log(`❌ PNG missing: ${file}`);
      img.src = `images/${file}`;
    } else {
      console.log(`❌ Button not found: data-icon="${dataIcon}"`);
    }
  });
}

window.testMissingButtons = testMissingButtons;

// Test function for pause button
function testPauseButton() {
  console.log('⏯️ === TESTING PAUSE BUTTON ===');
  
  const pauseButton = document.querySelector('.toolbar-btn[data-icon="pause"]');
  if (pauseButton) {
    console.log('✅ Found pause button');
    console.log('Current speedMultiplier:', speedMultiplier);
    
    // Test the toggle
    console.log('🔄 Testing pause button toggle...');
    togglePauseButton();
    console.log('Speed after toggle:', speedMultiplier);
    
    // Check if PNG updated
    const bgImage = getComputedStyle(pauseButton).backgroundImage;
    console.log('Background image after toggle:', bgImage);
  } else {
    console.log('❌ Pause button not found');
  }
}

window.testPauseButton = testPauseButton;

// Test function for bubble capture
function testBubbleCapture() {
  console.log('🎬 === TESTING BUBBLE CAPTURE ===');
  
  // Check ideas array
  console.log('🔍 Checking ideas array...');
  console.log('  Ideas count:', ideas.length);
  console.log('  Ideas structure:', ideas.length > 0 ? Object.keys(ideas[0]) : 'No ideas');
  
  if (ideas.length === 0) {
    console.log('❌ No ideas found! Add some bubbles first.');
    return;
  }
  
  // Show some idea examples
  ideas.slice(0, 3).forEach((idea, index) => {
    console.log(`  Idea ${index}: x=${idea.x}, y=${idea.y}, title="${idea.title}"`);
  });
  
  // Test capturing positions
  console.log('🎬 Testing position capture...');
  const positions = captureBubblePositions();
  
  console.log('✅ Capture test complete. Positions:', positions);
  
  // Test animation state
  console.log('🎬 Animation state:', {
    inPoint: AnimationState.data.inPoint,
    outPoint: AnimationState.data.outPoint,
    keyframes: AnimationState.data.keyframes.length,
    isRecording: AnimationState.data.isRecording
  });
  
  // Test if we can create a test animation
  if (positions.length > 0) {
    console.log('🎬 Testing animation creation...');
    AnimationState.reset();
    AnimationState.data.inPoint = 0;
    AnimationState.data.outPoint = 10;
    AnimationState.data.keyframes = [
      { time: 0, positions: positions },
      { time: 10, positions: positions }
    ];
    console.log('✅ Test animation created with', positions.length, 'ideas');
  }
}

window.testBubbleCapture = testBubbleCapture;

// Function to create test bubbles for animation testing
function createTestBubbles() {
  console.log('🎬 Creating test bubbles for animation...');
  
  // Remove existing test bubbles
  const existingTestBubbles = document.querySelectorAll('.test-bubble');
  existingTestBubbles.forEach(bubble => bubble.remove());
  
  // Create test bubbles
  const testPositions = [
    { x: 100, y: 100, text: 'Test 1' },
    { x: 300, y: 150, text: 'Test 2' },
    { x: 200, y: 300, text: 'Test 3' }
  ];
  
  testPositions.forEach((pos, index) => {
    const bubble = document.createElement('div');
    bubble.className = 'test-bubble bubble';
    bubble.style.cssText = `
      position: absolute;
      left: ${pos.x}px;
      top: ${pos.y}px;
      width: 80px;
      height: 80px;
      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      cursor: move;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    bubble.textContent = pos.text;
    document.body.appendChild(bubble);
  });
  
  console.log('✅ Created', testPositions.length, 'test bubbles');
  return testPositions.length;
}

window.createTestBubbles = createTestBubbles;

// Function to update keyframes when bubbles are moved
function updateKeyframesForCurrentPositions() {
  if (!AnimationState.data.isRecording && AnimationState.data.keyframes.length === 0) {
    console.log('❌ No animation active to update');
    return;
  }
  
  console.log('🔄 Updating keyframes with current bubble positions...');
  
  // Capture current positions
  const currentPositions = captureBubblePositions();
  
  // Update all keyframes with current positions
  AnimationState.data.keyframes.forEach((keyframe, index) => {
    keyframe.positions = currentPositions;
    console.log(`  Updated keyframe ${index} at ${keyframe.time}s`);
  });
  
  console.log('✅ All keyframes updated with current positions');
}

// Function to automatically update keyframes when bubbles are moved during recording
function autoUpdateKeyframes() {
  if (AnimationState.data.keyframes.length > 0) {
    // Get current timeline position
    const timelineSlider = document.getElementById('mediaPlaybackSlider');
    if (timelineSlider) {
      const progress = parseFloat(timelineSlider.value);
      const currentTime = progress * (AnimationState.data.duration / 1000);
      
      // Find the closest keyframe to update
      let closestKeyframe = null;
      let minDistance = Infinity;
      
      AnimationState.data.keyframes.forEach(keyframe => {
        const distance = Math.abs(keyframe.time - currentTime);
        if (distance < minDistance) {
          minDistance = distance;
          closestKeyframe = keyframe;
        }
      });
      
      // If we're close to a keyframe (within 0.5 seconds), update it
      if (closestKeyframe && minDistance < 0.5) {
        const currentPositions = captureBubblePositions();
        closestKeyframe.positions = currentPositions;
        console.log(`🔄 Auto-updated keyframe at ${closestKeyframe.time}s`);
      }
    }
  }
}

// Make it globally available for manual updates
window.autoUpdateKeyframes = autoUpdateKeyframes;

// Make it globally available
window.updateKeyframesForCurrentPositions = updateKeyframesForCurrentPositions;

// ===== MUSIC VISUALIZER FUNCTIONS =====

function highlightCurrentTrack() {
  // Find the currently playing audio and highlight it in the music panel
  if (window.currentAudio && !window.currentAudio.paused) {
    const musicItems = document.querySelectorAll('.music-item');
    
    musicItems.forEach((item, index) => {
      item.classList.remove('playing');
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      
      // Check if this item corresponds to the currently playing track
      const itemText = item.textContent || '';
      const itemOnclick = item.getAttribute('onclick') || '';
      
      // For radio streams, check if the URL is in the onclick
      if (itemOnclick.includes('playRadioStream') && window.currentAudio.src) {
        const currentSrc = window.currentAudio.src;
        if (itemOnclick.includes(currentSrc) || itemText.includes(currentSrc)) {
          item.classList.add('playing');
          item.style.background = '#35CF3A';
          console.log(`🎵 Highlighted current radio track: ${itemText}`);
        }
      }
      // For local files, check if the filename matches
      else if (itemOnclick.includes('playMusic') && window.currentAudio.src) {
        const currentSrc = window.currentAudio.src;
        const filename = currentSrc.split('/').pop();
        if (itemOnclick.includes(filename) || itemText.includes(filename)) {
          item.classList.add('playing');
          item.style.background = '#35CF3A';
          console.log(`🎵 Highlighted current music track: ${itemText}`);
        }
      }
    });
  }
}

function startMusicVisualizer() {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
  }
  
  const visualizer1 = document.getElementById('musicVisualizer');
  const visualizer2 = document.getElementById('musicVisualizer2');
  
  if (visualizer1) visualizer1.style.display = 'block';
  if (visualizer2) visualizer2.style.display = 'block';
  
  // Generate random colors for this session
  currentVisualizerColors = [];
  const barColors = [
    // Reds & Pinks
    '#FF6B6B', '#FF4757', '#FF3838', '#FF1744', '#F50057',
    '#E91E63', '#C2185B', '#AD1457', '#FF4081', '#F50057',
    
    // Oranges & Yellows
    '#FF9800', '#FF5722', '#FF7043', '#FF8A65', '#FFAB40',
    '#FFC107', '#FFD54F', '#FFEB3B', '#FFF176', '#FFF59D',
    
    // Greens
    '#4CAF50', '#8BC34A', '#CDDC39', '#9CCC65', '#66BB6A',
    '#4DB6AC', '#26A69A', '#00BCD4', '#00ACC1', '#009688',
    
    // Blues
    '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB',
    '#3F51B5', '#5C6BC0', '#7986CB', '#9FA8DA', '#C5CAE9',
    
    // Purples
    '#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
    '#673AB7', '#7E57C2', '#9575CD', '#B39DDB', '#D1C4E9',
    
    // Cyans & Teals
    '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2',
    '#009688', '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB',
    
    // Magentas
    '#E91E63', '#F06292', '#F8BBD9', '#FCE4EC', '#F3E5F5',
    '#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
    
    // Special Colors
    '#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FF1493',
    '#00FF00', '#00FFFF', '#FF00FF', '#FFFF00', '#FF69B4',
    '#00CED1', '#FF8C00', '#32CD32', '#FF69B4', '#9370DB'
  ];
  
  const glowColors = [
    '#FFD700', '#FF69B4', '#00FFFF', '#FF1493', '#32CD32',
    '#FF6347', '#9370DB', '#00CED1', '#FF8C00', '#FF4500',
    '#FF00FF', '#FFFF00', '#00FF00', '#FF69B4', '#FFD700',
    '#FF1493', '#00FFFF', '#32CD32', '#FF6347', '#9370DB'
  ];
  
  // Generate 8 random colors for the bars and glows
  for (let i = 0; i < 8; i++) {
    const barColor = barColors[Math.floor(Math.random() * barColors.length)];
    const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
    currentVisualizerColors.push({ bar: barColor, glow: glowColor });
  }
  
  // Apply random colors to bars
  const bars1 = document.querySelectorAll('#visualizerBars .viz-bar');
  const bars2 = document.querySelectorAll('#visualizerBars2 .viz-bar');
  
  bars1.forEach((bar, index) => {
    bar.style.background = currentVisualizerColors[index].bar;
    bar.style.boxShadow = `0 0 4px ${currentVisualizerColors[index].glow}`;
    bar.style.filter = `drop-shadow(0 0 2px ${currentVisualizerColors[index].glow})`;
  });
  
  bars2.forEach((bar, index) => {
    bar.style.background = currentVisualizerColors[index].bar;
    bar.style.boxShadow = `0 0 4px ${currentVisualizerColors[index].glow}`;
    bar.style.filter = `drop-shadow(0 0 2px ${currentVisualizerColors[index].glow})`;
  });
  
  visualizerInterval = setInterval(() => {
    if (!isMusicPlaying) {
      stopMusicVisualizer();
      return;
    }
    
    // Animate visualizer bars
    const bars1 = document.querySelectorAll('#visualizerBars .viz-bar');
    const bars2 = document.querySelectorAll('#visualizerBars2 .viz-bar');
    
    bars1.forEach((bar, index) => {
      const height = Math.random() * 100;
      bar.style.height = `${height}%`;
    });
    
    bars2.forEach((bar, index) => {
      const height = Math.random() * 100;
      bar.style.height = `${height}%`;
    });
  }, 100);
}

function stopMusicVisualizer() {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
    visualizerInterval = null;
  }
  
  const visualizer1 = document.getElementById('musicVisualizer');
  const visualizer2 = document.getElementById('musicVisualizer2');
  
  if (visualizer1) visualizer1.style.display = 'none';
  if (visualizer2) visualizer2.style.display = 'none';
  
  // Reset bar heights
  const bars1 = document.querySelectorAll('#visualizerBars .viz-bar');
  const bars2 = document.querySelectorAll('#visualizerBars2 .viz-bar');
  
  bars1.forEach(bar => bar.style.height = '0%');
  bars2.forEach(bar => bar.style.height = '0%');
} 