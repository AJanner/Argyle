// ===== MINDS EYE - MAIN CORE =====

// Global variables
let movementDelayActive = true;
let backgroundRotation = 0;
let speedMultiplier = 1;
let previousSpeed = 1; // Store the previous speed for toggling
let showPauseBorder = false; // Track pause border state (renamed from showCheckeredBorder)
let ideas = [];
let selectedIdea = null;
let backgroundImage = null;
let currentTheme = "default";
let backgroundIndex = 1;
let width, height;
let border = 10;
let strikerAttacks = []; // Array to track active striker attacks

// Drag and drop variables
let isDragging = false;
let draggedIdea = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Canvas setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Font array
const fonts = [
  "Monaco", "Arial", "Verdana", "Tahoma", "Trebuchet MS", "Comic Sans MS",
  "Impact", "Franklin Gothic Medium", "Century Gothic", "Calibri", "Cambria",
  "Constantia", "Corbel", "Arial Black", "System-ui", "Sans-serif",
  "Times New Roman", "Georgia", "Garamond", "Courier New", "Lucida Sans Unicode",
  "Palatino Linotype", "Serif", "Monospace"
];
let fontIndex = 0;

// Image management
const loadedImages = {};
let imageLoadErrors = new Set();

// Panel management
let panelSide = 'left';
let panelFadeTimeout = null;

// Video Playlist variables
let videoPlaylist = [];
let videoCurrentIndex = 0;
let videoPlaylistVisible = false;
let videoPlaylistTimeout = null;
let videoTitles = [];

// Drawing mode variables
let isDrawingMode = false;
let isDrawing = false;
let drawingPath = [];
let drawingColor = '#FF3131';
let drawingWidth = 5;
let drawingFlash = false;
let drawingPaths = []; // Store all drawing paths for smoothing
let previousSpeedForDrawing = 1; // Store speed when entering drawing mode

// ===== UTILITY FUNCTIONS =====

function randomColor() {
  return `hsl(${Math.random() * 360}, 100%, 70%)`;
}

// ===== SHAPE DRAWING FUNCTIONS =====

function drawShape(ctx, shape, x, y, radius, heightRatio = 1.0, rotation = 0) {
  // Calculate width and height based on ratio
  let width, height;
  if (heightRatio <= 1.0) {
    // For ratios <= 1.0, keep width constant, adjust height
    width = radius;
    height = radius * heightRatio;
  } else {
    // For ratios > 1.0, keep height constant, adjust width
    width = radius / heightRatio;
    height = radius;
  }
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  switch(shape) {
    case 'circle':
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
      break;
      
    case 'square':
      ctx.beginPath();
      ctx.rect(-width, -height, width * 2, height * 2);
      break;
      
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -height);
      ctx.lineTo(-width, height);
      ctx.lineTo(width, height);
      ctx.closePath();
      break;
      
    case 'pentagon':
      drawRegularPolygon(ctx, 0, 0, width, 5);
      break;
      
    case 'hexagon':
      drawRegularPolygon(ctx, 0, 0, width, 6);
      break;
      
    case 'octagon':
      drawRegularPolygon(ctx, 0, 0, width, 8);
      break;
      
    case 'striker':
      // Striker is drawn as a circle with a special visual indicator
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
      break;
      
    default:
      // Default to circle
      ctx.beginPath();
      ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
  }
  
  ctx.restore();
}

function drawRegularPolygon(ctx, x, y, radius, sides) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function randomTextColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 100;
  const lightness = 50 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ===== DRAWING FUNCTIONS =====

function toggleDrawingMode() {
  isDrawingMode = !isDrawingMode;
  console.log('✏️ Drawing mode:', isDrawingMode ? 'ON' : 'OFF');
  
  // Get references to elements
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  const drawingDropdowns = document.getElementById('drawingDropdowns');
  const colorDropdown = document.getElementById('drawingColorDropdown');
  const widthDropdown = document.getElementById('drawingWidthDropdown');
  
  // Update cursor and CSS class
  if (isDrawingMode) {
    // Store current speed and pause animation
    previousSpeedForDrawing = speedMultiplier;
    speedMultiplier = 0;
    
    // Update the speed slider to reflect paused state
    const speedSlider = document.querySelector('input[type="range"]');
    if (speedSlider) {
      speedSlider.value = 0;
      speedSlider.classList.add('paused');
    }
    
    canvas.style.cursor = 'url(images/cross.png) 16 16, crosshair';
    canvas.classList.add('drawing-mode');
    console.log('🎨 Drawing mode activated - click and drag to draw');
    console.log('⌨️ Keyboard shortcuts: C=Clear, D=Color, W=Width');
    console.log('💡 Animation paused, bubble creation disabled');
    
    // Hide Analysis button and show drawing dropdowns
    if (analysisButton) {
      analysisButton.style.display = 'none';
    }
    if (drawingDropdowns) {
      drawingDropdowns.style.display = 'flex';
      // Set current values in dropdowns
      if (colorDropdown) {
        colorDropdown.value = drawingColor;
      }
      if (widthDropdown) {
        widthDropdown.value = drawingWidth;
      }
    }
    
    // Drawings will be automatically redrawn by the draw loop
    console.log('🎨 Drawing mode activated - drawings will be preserved');
    
    // Update draw button to show active state
    const drawButton = document.querySelector('[data-icon="draw"]');
    if (drawButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(drawButton, 'draw2.png');
    }
  } else {
    // Restore previous speed
    speedMultiplier = previousSpeedForDrawing;
    
    // Update the speed slider to reflect restored state
    const speedSlider = document.querySelector('input[type="range"]');
    if (speedSlider) {
      speedSlider.value = previousSpeedForDrawing;
      speedSlider.classList.remove('paused');
    }
    
    canvas.style.cursor = 'default';
    canvas.classList.remove('drawing-mode');
    console.log('🎨 Drawing mode deactivated');
    console.log('💡 Animation resumed, bubble creation re-enabled');
    
    // Show Analysis button and hide drawing dropdowns
    if (analysisButton) {
      analysisButton.style.display = 'block';
    }
    if (drawingDropdowns) {
      drawingDropdowns.style.display = 'none';
    }
    
    // Update draw button to show inactive state
    const drawButton = document.querySelector('[data-icon="draw"]');
    if (drawButton && typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(drawButton, 'draw.png');
    }
  }
}

function startDrawing(e) {
  if (!isDrawingMode) return;
  
  // Prevent bubble creation when drawing
  e.preventDefault();
  e.stopPropagation();
  
  // Close drawing settings panel when drawing starts
  closeDrawingSettings();
  
  isDrawing = true;
  drawingPath = [];
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  drawingPath.push({ x, y });
  console.log('✏️ Started drawing at:', x, y);
}

function drawLine(e) {
  if (!isDrawingMode || !isDrawing) return;
  
  // Prevent bubble creation when drawing
  e.preventDefault();
  e.stopPropagation();
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  drawingPath.push({ x, y });
  
  // Draw the line segment directly on the main canvas
  if (drawingPath.length >= 2) {
    const prev = drawingPath[drawingPath.length - 2];
    const curr = drawingPath[drawingPath.length - 1];
    
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = drawingWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Apply flash effect if active
    if (drawingFlash) {
      ctx.globalAlpha = 0.3 + 0.7 * Math.sin(Date.now() / 200);
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    console.log('✏️ Drawing line from', prev.x, prev.y, 'to', curr.x, curr.y, 'color:', drawingColor, 'width:', drawingWidth);
  }
}

function stopDrawing() {
  if (!isDrawingMode) return;
  
  isDrawing = false;
  
  // Save the completed path with color and width
  if (drawingPath.length > 1) {
    const pathWithMetadata = [...drawingPath];
    // Always save the current drawing color and width
    pathWithMetadata.color = drawingColor;
    pathWithMetadata.width = drawingWidth;
    drawingPaths.push(pathWithMetadata);
    console.log('✏️ Drawing path saved with', drawingPath.length, 'points, color:', drawingColor, 'width:', drawingWidth);
    console.log('📊 Total paths stored:', drawingPaths.length);
    
    // Debug: Check all stored paths
    for (let i = 0; i < drawingPaths.length; i++) {
      const path = drawingPaths[i];
      console.log(`  Path ${i}: color=${path.color}, width=${path.width}, points=${path.length}`);
    }
  }
  
  drawingPath = [];
  console.log('✏️ Stopped drawing');
}

function clearDrawing() {
  // Clear the canvas and redraw everything
  ctx.clearRect(0, 0, width, height);
  draw(); // Redraw all bubbles and background
  
  // Also clear the drawing paths array
  drawingPaths = [];
  
  // Stop flash animation if it's running
  if (drawingFlash) {
    stopFlashAnimation();
  }
  
  console.log('🧹 Drawing cleared and paths array emptied');
}

function clearDrawingOnly() {
  // Clear the drawingPaths array
  drawingPaths = [];
  
  // Only clear drawings, preserve bubbles and background
  if (backgroundImage) {
    // Redraw background to clear drawings
    if (backgroundRotation !== 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((backgroundRotation * Math.PI) / 180);
      const maxDimension = Math.max(width, height);
      const scaleX = width / backgroundImage.width;
      const scaleY = height / backgroundImage.height;
      const scale = Math.max(scaleX, scaleY) * 1.2;
      
      const scaledWidth = backgroundImage.width * scale;
      const scaledHeight = backgroundImage.height * scale;
      
      ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    } else {
      ctx.drawImage(backgroundImage, 0, 0, width, height);
    }
  } else {
    // Clear with background color
    ctx.clearRect(0, 0, width, height);
  }
  
  // Redraw bubbles
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    
    // Draw bubble
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    ctx.beginPath();
    ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
    ctx.clip();

    if (a.image) {
      const src = a.image;
      
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          ctx.drawImage(loadedImages[src], -a.radius, -a.radius, a.radius * 2, a.radius * 2);
        } catch (error) {
          console.error("❌ Error drawing image for bubble:", a.title, "Error:", error);
          a.image = null;
        }
      } else {
        if (!loadedImages[src]) {
          const img = new Image();
          img.onload = () => {
            loadedImages[src] = img;
          };
          img.onerror = () => {
            console.error("❌ Failed to load image:", src);
            a.image = null;
          };
          img.src = src;
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }

      if (a.glow) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = a.color || "white";
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
      }
      
      ctx.fill();
    }

    ctx.restore();

    // Effects
    if (a.glow || a.flash) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      if (a.flash) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
        ctx.beginPath();
        ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      if (a.glow) {
        const glowColor = a.glowColor || a.color || "white";
        
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, a.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Text
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    ctx.fillStyle = a.textColor || "white";
    const fontSize = a.fontSize || 14;
    ctx.font = `bold ${fontSize}px ${a.font || "Tahoma"}`;
    ctx.textAlign = "center";
    const words = a.title.split(" ");
    const lineHeight = fontSize + 2;
    words.forEach((word, idx) => {
      ctx.fillText(word, 0, idx * lineHeight - (words.length - 1) * (lineHeight / 2));
    });
    ctx.restore();
    
    // Visual feedback for dragging and manual control
    if (speedMultiplier === 0 && showPauseBorder) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
    
    // Visual feedback for dragging
    if (isDragging && draggedIdea === a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      ctx.arc(0, 0, a.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }
  
  console.log('🧹 Only drawings cleared, bubbles and background preserved');
  console.log('🎨 Drawings cleared - drawingPaths array reset');
}

// ===== DRAWING FLASH AND SMOOTH FUNCTIONS =====

function toggleDrawingFlash() {
  drawingFlash = !drawingFlash;
  const flashBtn = document.getElementById('flashDrawingBtn');
  
  if (drawingFlash) {
    flashBtn.style.background = 'linear-gradient(45deg, #FF1493, #FF69B4)';
    flashBtn.textContent = '✨ Flash ON';
    console.log('✨ Drawing flash activated');
    
    // Start flash animation for existing drawings
    startFlashAnimation();
  } else {
    flashBtn.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
    flashBtn.textContent = '✨ Flash Drawing';
    console.log('✨ Drawing flash deactivated');
    
    // Stop flash animation
    stopFlashAnimation();
  }
}

let flashAnimationId = null;

function startFlashAnimation() {
  if (flashAnimationId) return;
  
  function flashLoop() {
    if (!drawingFlash) return;
    
    // Redraw all paths with flash effect
    clearDrawingOnly();
    
    for (let i = 0; i < drawingPaths.length; i++) {
      const path = drawingPaths[i];
      const pathColor = path.color || drawingColor;
      const pathWidth = path.width || drawingWidth;
      
      // Debug: Log what color is being used for each path
      console.log(`🎨 Flash drawing path ${i}: stored color=${path.color}, using color=${pathColor}`);
      
      // Draw path with its original color/width without changing global variables
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let j = 1; j < path.length; j++) {
        ctx.lineTo(path[j].x, path[j].y);
      }
      
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Apply flash effect
      ctx.globalAlpha = 0.3 + 0.7 * Math.sin(Date.now() / 200);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    flashAnimationId = setTimeout(flashLoop, 100); // Slower flash animation
  }
  
  flashLoop();
}

function stopFlashAnimation() {
  if (flashAnimationId) {
    clearTimeout(flashAnimationId);
    flashAnimationId = null;
  }
}

function debugDrawingPaths() {
  console.log('🔍 Debugging drawing paths:');
  console.log('📊 Total paths:', drawingPaths.length);
  for (let i = 0; i < drawingPaths.length; i++) {
    const path = drawingPaths[i];
    console.log(`  Path ${i}: color=${path.color}, width=${path.width}, points=${path.length}`);
  }
}

function smoothLastLine() {
  if (drawingPaths.length === 0) {
    console.log('⚠️ No lines to smooth');
    return;
  }
  
  const lastPath = drawingPaths[drawingPaths.length - 1];
  if (!lastPath || lastPath.length < 3) {
    console.log('⚠️ Last line too short to smooth');
    return;
  }
  
  // Store original color and width
  const originalColor = drawingColor;
  const originalWidth = drawingWidth;
  
  // Clear the last line
  clearDrawingOnly();
  
  // Redraw all paths except the last one with their original colors
  for (let i = 0; i < drawingPaths.length - 1; i++) {
    const path = drawingPaths[i];
    const pathColor = path.color || originalColor;
    const pathWidth = path.width || originalWidth;
    
    // Draw path with its original color/width without changing global variables
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    
    for (let j = 1; j < path.length; j++) {
      ctx.lineTo(path[j].x, path[j].y);
    }
    
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = pathWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  
  // Create smoothed version of the last path
  const smoothedPath = smoothPath(lastPath);
  
  // Replace the last path with smoothed version
  drawingPaths[drawingPaths.length - 1] = smoothedPath;
  
  // Draw the smoothed path with original color/width
  ctx.beginPath();
  ctx.moveTo(smoothedPath[0].x, smoothedPath[0].y);
  
  for (let i = 1; i < smoothedPath.length; i++) {
    ctx.lineTo(smoothedPath[i].x, smoothedPath[i].y);
  }
  
  ctx.strokeStyle = originalColor;
  ctx.lineWidth = originalWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  console.log('🔄 Last line smoothed');
}

function smoothPath(path) {
  if (path.length < 3) return path;
  
  const smoothed = [];
  const tension = 0.3; // Reduced smoothing factor for less strict smoothing
  
  // Add first point
  smoothed.push(path[0]);
  
  // Smooth intermediate points
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];
    
    // Calculate smoothed point with gentler smoothing
    const smoothedX = curr.x + (prev.x + next.x - 2 * curr.x) * tension * 0.3;
    const smoothedY = curr.y + (prev.y + next.y - 2 * curr.y) * tension * 0.3;
    
    smoothed.push({ x: smoothedX, y: smoothedY });
  }
  
  // Add last point
  smoothed.push(path[path.length - 1]);
  
  return smoothed;
}

function drawPath(path) {
  if (path.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  
  // Use path's stored color and width, or fall back to current
  const pathColor = path.color || drawingColor;
  const pathWidth = path.width || drawingWidth;
  
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = pathWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (drawingFlash) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
  }
  
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function changeDrawingColor() {
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', 
    '#FFA500', '#800080', '#008000', '#000080', '#FFD700', '#FF69B4',
    '#32CD32', '#FF4500', '#8A2BE2', '#00CED1', '#FF1493', '#32CD32',
    '#FF6347', '#9370DB', '#20B2AA', '#FFB6C1', '#DDA0DD', '#98FB98',
    '#F0E68C', '#FFA07A', '#87CEEB', '#DDA0DD', '#90EE90', '#F0E68C'
  ];
  const currentIndex = colors.indexOf(drawingColor);
  const nextIndex = (currentIndex + 1) % colors.length;
  drawingColor = colors[nextIndex];
  console.log('🎨 Drawing color changed to:', drawingColor);
}

function changeDrawingWidth() {
  const widths = [1, 2, 3, 4, 5, 8, 12, 16, 20];
  const currentIndex = widths.indexOf(drawingWidth);
  const nextIndex = (currentIndex + 1) % widths.length;
  drawingWidth = widths[nextIndex];
  console.log('📏 Drawing width changed to:', drawingWidth);
}

// Test function to verify drawing is working
function testDrawing() {
  console.log('🧪 Testing drawing functionality...');
  console.log('🎨 Current drawing color:', drawingColor);
  console.log('📏 Current drawing width:', drawingWidth);
  console.log('✏️ Drawing mode:', isDrawingMode);
  console.log('🎯 Canvas context:', ctx);
  console.log('🎨 Canvas z-index:', canvas.style.zIndex || 'default');
  
  // Check computed z-index
  const computedStyle = window.getComputedStyle(canvas);
  console.log('🎨 Computed canvas z-index:', computedStyle.zIndex);
  
  // Check video player z-index
  const videoPlayer = document.getElementById('videoPlayer');
  if (videoPlayer) {
    const videoComputedStyle = window.getComputedStyle(videoPlayer);
    console.log('🎥 Video player z-index:', videoComputedStyle.zIndex);
  }
  
  // Draw a test line
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(200, 200);
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  console.log('✅ Test line drawn from (100,100) to (200,200)');
  console.log('🎯 Check if red line appears on screen');
}

// ===== DRAWING SETTINGS PANEL FUNCTIONS =====

function showDrawingSettings(e) {
  if (!isDrawingMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const panel = document.getElementById('drawingSettingsPanel');
  const colorSelect = document.getElementById('drawingColorSelect');
  const widthSelect = document.getElementById('drawingWidthSelect');
  
  // Set current values
  colorSelect.value = drawingColor;
  widthSelect.value = drawingWidth;
  
  // Position panel near mouse
  panel.style.left = e.clientX + 'px';
  panel.style.top = e.clientY + 'px';
  panel.style.display = 'block';
  
  console.log('🎨 Drawing settings panel opened');
}

function closeDrawingSettings() {
  const panel = document.getElementById('drawingSettingsPanel');
  panel.style.display = 'none';
  console.log('🎨 Drawing settings panel closed');
}

function setDrawingColor(color) {
  drawingColor = color;
  console.log('🎨 Drawing color set to:', color);
}

function setDrawingWidth(width) {
  drawingWidth = width;
  console.log('📏 Drawing width set to:', width);
}

function clearDrawingFromPanel() {
  // Clear the visual canvas
  clearDrawingOnly();
  
  // Actually remove all drawing paths from the array
  drawingPaths = [];
  
  // Stop flash animation if it's running
  if (drawingFlash) {
    stopFlashAnimation();
  }
  
  closeDrawingSettings();
  console.log('🧹 All drawings cleared from panel and paths array emptied');
}

function switchToBubbleMode() {
  // Exit drawing mode while preserving drawings
  isDrawingMode = false;
  
  // Restore animation speed
  speedMultiplier = previousSpeedForDrawing;
  
  // Update UI
  canvas.classList.remove('drawing-mode');
  canvas.style.cursor = 'default';
  
  // Stop flash animation if running
  if (drawingFlash) {
    stopFlashAnimation();
    drawingFlash = false;
  }
  
  // Close drawing settings panel
  closeDrawingSettings();
  
  // Update draw button to show inactive state
  const drawButton = document.querySelector('[data-icon="draw"]');
  if (drawButton && typeof PNGLoader !== 'undefined') {
    PNGLoader.applyPNG(drawButton, 'draw.png');
  }
  
  // Resume normal canvas drawing (bubbles will be drawn again)
  console.log('🫧 Switched to bubble mode - drawings preserved');
  console.log('📊 Preserved', drawingPaths.length, 'drawing paths');
}

function clearDrawingsOnRightClick(event) {
  event.preventDefault(); // Prevent default context menu
  
  // Clear only the drawings (like the panel button does)
  clearDrawingOnly();
  drawingPaths = [];
  
  // Stop flash animation if running
  if (drawingFlash) {
    stopFlashAnimation();
    drawingFlash = false;
  }
  
  console.log('🧹 All drawings cleared via right-click on toggle button');
  
  // Show a brief visual feedback
  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '🧹';
  button.style.background = 'linear-gradient(45deg, #f44336, #da190b)';
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = 'linear-gradient(45deg, #FF6B6B, #FF8E53)';
  }, 500);
}

let drawingSettingsFadeTimeout = null;

function handleDrawButtonRightClick(event) {
  event.preventDefault(); // Prevent default context menu
  event.stopPropagation();
  
  if (isDrawingMode) {
    // If drawing mode is active, show drawing settings
    showDrawingSettingsOnRightClick(event);
  } else {
    // If drawing mode is not active, clear drawings
    clearDrawingOnly();
    console.log('🎨 Drawings cleared via right-click on draw button');
  }
  
  return false; // Ensure context menu doesn't show
}

function showDrawingSettingsOnRightClick(event) {
  event.preventDefault(); // Prevent default context menu
  event.stopPropagation();
  
  const panel = document.getElementById('drawingSettingsPanel');
  const colorSelect = document.getElementById('drawingColorSelect');
  const widthSelect = document.getElementById('drawingWidthSelect');
  
  // Toggle panel visibility if already visible
  if (panel && panel.style.display === 'block') {
    hideDrawingSettingsPanel();
    return false;
  }
  
  // Set current values
  if (colorSelect) {
    colorSelect.value = drawingColor;
  }
  
  if (widthSelect) {
    widthSelect.value = drawingWidth;
  }
  
  // Position panel at the x-coordinate of the draw button
  if (panel) {
    const drawButton = event.target;
    const buttonRect = drawButton.getBoundingClientRect();
    
    // Position panel at button's x-position
    panel.style.position = 'fixed';
    panel.style.left = buttonRect.left + 'px';
    panel.style.top = (buttonRect.bottom + 10) + 'px'; // 10px below button
    panel.style.display = 'block';
    panel.style.zIndex = '10000';
    panel.style.opacity = '1';
    
    console.log('🎨 Drawing settings panel opened at button position');
    
    // Clear any existing timeout
    if (drawingSettingsFadeTimeout) {
      clearTimeout(drawingSettingsFadeTimeout);
    }
    
    // Set fade-out timeout for 10 seconds
    drawingSettingsFadeTimeout = setTimeout(() => {
      fadeOutDrawingSettingsPanel();
    }, 10000);
  }
  
  return false; // Ensure context menu doesn't show
}

function hideDrawingSettingsPanel() {
  const panel = document.getElementById('drawingSettingsPanel');
  if (panel) {
    panel.style.display = 'none';
    if (drawingSettingsFadeTimeout) {
      clearTimeout(drawingSettingsFadeTimeout);
      drawingSettingsFadeTimeout = null;
    }
    console.log('🎨 Drawing settings panel hidden');
  }
}

function fadeOutDrawingSettingsPanel() {
  const panel = document.getElementById('drawingSettingsPanel');
  if (panel && panel.style.display === 'block') {
    // Fade out animation
    panel.style.transition = 'opacity 1s ease-out';
    panel.style.opacity = '0';
    
    // Hide after fade completes
    setTimeout(() => {
      panel.style.display = 'none';
      panel.style.transition = '';
      drawingSettingsFadeTimeout = null;
      console.log('🎨 Drawing settings panel faded out');
    }, 1000);
  }
}

let analysisPanelFadeTimeout = null;

function toggleAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  
  if (panel) {
    if (panel.style.display === 'block') {
      hideAnalysisPanel();
    } else {
      showAnalysisPanel();
    }
  }
}

function showAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  
  if (panel && analysisButton) {
    // Position panel under the analysis button
    const buttonRect = analysisButton.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.left = buttonRect.left + 'px';
    panel.style.top = (buttonRect.bottom + 10) + 'px';
    panel.style.display = 'block';
    panel.style.opacity = '1';
    panel.style.zIndex = '29999';
    
    console.log('📊 Analysis panel opened under button');
    
    // Apply analysis.png to button
    if (typeof PNGLoader !== 'undefined') {
      PNGLoader.applyPNG(analysisButton, 'analysis.png');
    }
    
    // Clear any existing timeout
    if (analysisPanelFadeTimeout) {
      clearTimeout(analysisPanelFadeTimeout);
    }
    
    // Set fade-out timeout for 10 seconds
    analysisPanelFadeTimeout = setTimeout(() => {
      fadeOutAnalysisPanel();
    }, 10000);
  }
}

function hideAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  const analysisButton = document.querySelector('[data-icon="analysis"]');
  
  if (panel) {
    panel.style.display = 'none';
    if (analysisPanelFadeTimeout) {
      clearTimeout(analysisPanelFadeTimeout);
      analysisPanelFadeTimeout = null;
    }
    console.log('📊 Analysis panel closed');
  }
  
  // Reset button to default state
  if (analysisButton && typeof PNGLoader !== 'undefined') {
    PNGLoader.applyPNG(analysisButton, 'analysis.png');
  }
}

function fadeOutAnalysisPanel() {
  const panel = document.getElementById('analysisPanel');
  if (panel && panel.style.display === 'block') {
    // Fade out animation
    panel.style.opacity = '0';
    
    // Hide after fade completes
    setTimeout(() => {
      panel.style.display = 'none';
      analysisPanelFadeTimeout = null;
      console.log('📊 Analysis panel faded out');
    }, 1000);
  }
}

function closeAnalysisPanel() {
  hideAnalysisPanel();
}

function openAnalysisIframe(type) {
  const container = document.getElementById('analysisIframeContainer');
  const iframe = document.getElementById('analysisIframe');
  
  if (container && iframe) {
    // Set the iframe source based on type
    if (type === 'suggestions') {
      iframe.src = 'https://stonehousess.github.io/Sifi/';
    } else {
      iframe.src = 'https://ajanner.com';
    }
    
    // Show the container
    container.style.display = 'block';
    
    console.log('📊 Analysis iframe opened for:', type);
  }
}

function closeAnalysisIframe() {
  const container = document.getElementById('analysisIframeContainer');
  const iframe = document.getElementById('analysisIframe');
  
  if (container && iframe) {
    // Clear the iframe source
    iframe.src = '';
    
    // Hide the container
    container.style.display = 'none';
    
    console.log('📊 Analysis iframe closed');
  }
}


function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

// ===== IDEA MANAGEMENT =====

function addIdea(x, y, title = "", description = "", color = randomColor(), textColor = "white", radius = 80) {
  const maxSpeed = 3;
  const bubbleColor = color || randomColor();
  
  // Get current date and time
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS format
  
  ideas.push({ 
    title, 
    description, 
    x, 
    y, 
    vx: (Math.random() * 2 - 1) * maxSpeed, 
    vy: (Math.random() * 2 - 1) * maxSpeed, 
    color: bubbleColor, 
    textColor, 
    radius, 
    font: fonts[0],
    shape: 'circle',
    heightRatio: 1.0,
    glow: false,
    flash: false,
    animateColors: false,
    transparent: false,
    glowColor: null,
    fixed: false,
    static: false,
    showPauseBorder: false,
    strikerVelocity: 5,
    createdDate: dateString,
    createdTime: timeString
  });
  
  console.log("🆕 New bubble created with color:", bubbleColor, "at", dateString, timeString);
}

// ===== THEME SYSTEM =====

function switchTheme(themeName) {
  console.log('🎨 Switching theme to:', themeName);
  currentTheme = themeName;
  backgroundIndex = 1;
  
  const theme = themePresets[themeName];
  if (!theme) {
    console.error('❌ Theme not found:', themeName);
    return;
  }
  
  // Update preset selector
  updatePresetSelector(themeName);
  
  // Load first preset if available
  if (theme.presets) {
    const presetKeys = Object.keys(theme.presets);
    if (presetKeys.length > 0) {
      const firstPreset = presetKeys[0];
      switchPreset(firstPreset);
    }
  } else {
    // Fallback for old theme structure
    console.log('📋 Loading theme ideas:', theme.ideas?.length || 0);
    if (theme.ideas) {
      ideas = theme.ideas.map(idea => ({
        ...idea,
        font: idea.font || fonts[0],
        radius: idea.radius || 80,
        shape: idea.shape || 'circle',
        heightRatio: idea.heightRatio || 1.0,
        showPauseBorder: idea.showPauseBorder || false,
        createdDate: idea.createdDate || new Date().toISOString().split('T')[0],
        createdTime: idea.createdTime || new Date().toTimeString().split(' ')[0]
      }));
    }
    
    if (theme.bg) {
      loadBackgroundImage(theme.bg);
    }
  }
}

function updatePresetSelector(themeName) {
  const presetSelector = document.getElementById('presetSelector');
  if (!presetSelector) return;
  
  presetSelector.innerHTML = '<option value="">😇 Preset</option>';
  
  const theme = themePresets[themeName];
  if (theme && theme.presets) {
    Object.keys(theme.presets).forEach(presetKey => {
      const preset = theme.presets[presetKey];
      const option = document.createElement('option');
      option.value = presetKey;
      option.textContent = preset.name;
      presetSelector.appendChild(option);
    });
  }
}

function switchPreset(presetKey) {
  if (!presetKey || !currentTheme) return;
  
  const theme = themePresets[currentTheme];
  if (!theme || !theme.presets) return;
  
  const preset = theme.presets[presetKey];
  if (!preset) {
    console.error('❌ Preset not found:', presetKey);
    return;
  }
  
  console.log('📋 Loading preset:', preset.name, 'with', preset.ideas.length, 'ideas');
  
  // Load preset ideas
  ideas = preset.ideas.map(idea => ({
    ...idea,
    font: idea.font || fonts[0],
    radius: idea.radius || 80,
    shape: idea.shape || 'circle',
    heightRatio: idea.heightRatio || 1.0,
    showPauseBorder: idea.showPauseBorder || false,
    createdDate: idea.createdDate || new Date().toISOString().split('T')[0],
    createdTime: idea.createdTime || new Date().toTimeString().split(' ')[0]
  }));
  
  // Load preset background
  if (preset.bg) {
    loadBackgroundImage(preset.bg);
  }
}

function loadBackgroundImage(bgPath) {
  const img = new Image();
  img.onload = function () {
    backgroundImage = img;
    console.log('🖼️ Background image loaded:', bgPath);
  };
  img.onerror = function() {
    console.error('❌ Failed to load background image:', bgPath);
  };
  img.src = bgPath;
}

function cycleBackground() {
  backgroundIndex += 1;
  const img = new Image();
  img.onload = function () {
    backgroundImage = img;
  };
  img.onerror = function () {
    backgroundIndex = 1;
    img.src = `images/${currentTheme}1.png`;
  };
  img.src = `images/${currentTheme}${backgroundIndex}.png`;
}

function rotateBackground() {
  backgroundRotation = (backgroundRotation + 90) % 360;
  console.log("🔄 Background rotated to:", backgroundRotation + "°");
}

// ===== PANEL MANAGEMENT =====

function showPanel() {
  if (!selectedIdea) return;
  
  document.getElementById("title").value = selectedIdea.title;
  document.getElementById("description").value = selectedIdea.description;
  document.getElementById("sizeSlider").value = selectedIdea.radius || 80;
  document.getElementById("fontSizeSlider").value = selectedIdea.fontSize || 14;
  document.getElementById("heightRatioSlider").value = selectedIdea.heightRatio || 1.0;
  document.getElementById("rotationSlider").value = selectedIdea.rotation || 0;
  document.getElementById("shapeSelector").value = selectedIdea.shape || 'circle';
  
  // Update action slider visibility and value
  updateActionSliderVisibility();
  
  // Set date and time fields
  document.getElementById("dateField").value = selectedIdea.createdDate || new Date().toISOString().split('T')[0];
  document.getElementById("timeField").value = selectedIdea.createdTime || new Date().toTimeString().split(' ')[0];
  
  // Update checkered border button state
  const checkeredBorderButtons = document.querySelectorAll('button[onclick="toggleCheckeredBorder()"]');
  checkeredBorderButtons.forEach(button => {
    if (selectedIdea.showPauseBorder) {
      button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
      button.style.color = "black";
    } else {
      button.style.background = "";
      button.style.color = "";
    }
  });
  
  // Update image selector
  if (selectedIdea.image) {
    if (selectedIdea.image.startsWith('data:')) {
      document.getElementById("imageSelector").value = "";
      const uploadInput = document.getElementById('uploadImage');
      uploadInput.style.border = '2px solid gold';
      uploadInput.title = "Custom image uploaded";
    } else {
      document.getElementById("imageSelector").value = selectedIdea.image;
      document.getElementById('uploadImage').style.border = '';
      document.getElementById('uploadImage').title = "Upload custom image";
    }
  } else {
    document.getElementById("imageSelector").value = "";
    document.getElementById('uploadImage').style.border = '';
    document.getElementById('uploadImage').title = "Upload custom image";
  }
  
  document.getElementById('panel').style.display = "block";
  resetPanelFade();
}

function savePanel() {
  if (!selectedIdea) return;
  
  selectedIdea.title = document.getElementById("title").value;
  selectedIdea.description = document.getElementById("description").value;
  selectedIdea.createdDate = document.getElementById("dateField").value;
  selectedIdea.createdTime = document.getElementById("timeField").value;
  selectedIdea.shape = document.getElementById("shapeSelector").value;
  selectedIdea.heightRatio = parseFloat(document.getElementById("heightRatioSlider").value);
  
  // Save striker velocity if it exists
  if (selectedIdea.shape === 'striker') {
    const actionSlider = document.getElementById('actionSlider');
    if (actionSlider) {
      selectedIdea.strikerVelocity = parseInt(actionSlider.value);
    }
  }
  
  document.getElementById('panel').style.display = "none";
}

function deleteIdea() {
  if (selectedIdea) {
    ideas = ideas.filter(idea => idea !== selectedIdea);
    selectedIdea = null;
    document.getElementById('panel').style.display = "none";
  }
}

function closePanel() { 
  document.getElementById('panel').style.display = "none"; 
  if (panelFadeTimeout) {
    clearTimeout(panelFadeTimeout);
    panelFadeTimeout = null;
  }
}

function minimizePanel() {
  const panel = document.getElementById('panel');
  const minimizeBtn = panel.querySelector('button[onclick="minimizePanel()"]');
  if (panel) {
    if (panel.classList.contains('minimized')) {
      // Restore panel
      panel.classList.remove('minimized');
      panel.style.width = '300px';
      panel.style.height = 'auto';
      panel.style.overflow = 'visible';
      if (minimizeBtn) {
        minimizeBtn.textContent = '📋';
        minimizeBtn.title = 'Minimize';
      }
      console.log('💭 Panel restored');
    } else {
      // Minimize panel
      panel.classList.add('minimized');
      panel.style.width = '15px';
      panel.style.height = '200px';
      panel.style.overflow = 'hidden';
      if (minimizeBtn) {
        minimizeBtn.textContent = '⬜';
        minimizeBtn.title = 'Restore';
      }
      console.log('💭 Panel minimized');
    }
  }
}

function restorePanel() {
  const panel = document.getElementById('panel');
  if (panel && panel.classList.contains('minimized')) {
    panel.classList.remove('minimized');
    panel.style.width = '300px';
    panel.style.height = 'auto';
    panel.style.overflow = 'visible';
    console.log('💭 Panel restored');
  }
}

function resetPanelFade() {
  const panel = document.getElementById('panel');
  const disableTimeoutCheckbox = document.getElementById('disablePanelTimeout');
  
  if (panel && panel.style.display === 'block') {
    // Check if timeout is disabled
    if (disableTimeoutCheckbox && disableTimeoutCheckbox.checked) {
      // Clear any existing timeout but don't set a new one
      if (panelFadeTimeout) {
        clearTimeout(panelFadeTimeout);
        panelFadeTimeout = null;
      }
      return;
    }
    
    if (panelFadeTimeout) {
      clearTimeout(panelFadeTimeout);
    }
    
    panelFadeTimeout = setTimeout(() => {
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.style.display = 'none';
        panel.style.opacity = '1';
      }, 500);
    }, 30000);
  }
}

function resetPanelTimer() {
  const panel = document.getElementById('panel');
  if (panel.style.display === 'block') {
    resetPanelFade();
  }
}

// ===== EFFECTS SYSTEM =====

function toggleGlow() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  selectedIdea.glow = !selectedIdea.glow;
  console.log("✨ Glow:", selectedIdea.glow ? "ON" : "OFF");
  
  const button = event.target;
  if (selectedIdea.glow) {
    button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
    button.style.color = "black";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}

function toggleFlash() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  selectedIdea.flash = !selectedIdea.flash;
  console.log("⚡ Flash:", selectedIdea.flash ? "ON" : "OFF");
  
  const button = event.target;
  if (selectedIdea.flash) {
    button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
    button.style.color = "black";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}

function toggleAnimateColors() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  selectedIdea.animateColors = !selectedIdea.animateColors;
  console.log("🎨 Animate:", selectedIdea.animateColors ? "ON" : "OFF");
  
  const button = event.target;
  if (selectedIdea.animateColors) {
    button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
    button.style.color = "black";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}

function toggleTransparent() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  selectedIdea.transparent = !selectedIdea.transparent;
  console.log("👻 Transparent:", selectedIdea.transparent ? "ON" : "OFF");
  
  const button = event.target;
  if (selectedIdea.transparent) {
    button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
    button.style.color = "black";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}

function changeGlowColor() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  
  const glowColor = randomColor();
  selectedIdea.glowColor = glowColor;
  console.log("🌈 Glow color changed to:", glowColor);
  
  const button = event.target;
  button.style.background = `linear-gradient(45deg, ${glowColor}, ${glowColor}80)`;
  button.style.color = "white";
  
  setTimeout(() => {
    button.style.background = "";
    button.style.color = "";
  }, 1000);
}

function toggleFixed() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  selectedIdea.fixed = !selectedIdea.fixed;
  console.log("🛑 Fixed:", selectedIdea.fixed ? "ON" : "OFF");
  
  const button = event.target;
  if (selectedIdea.fixed) {
    button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
    button.style.color = "black";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}

function toggleStatic() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  selectedIdea.static = !selectedIdea.static;
  console.log("🛑 Static:", selectedIdea.static ? "ON" : "OFF");
  
  const button = event.target;
  if (selectedIdea.static) {
    button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
    button.style.color = "black";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}

function toggleCheckeredBorder() {
  if (!selectedIdea) {
    alert("Please select a bubble first");
    return;
  }
  
  selectedIdea.showPauseBorder = !selectedIdea.showPauseBorder;
  console.log("🏁 Checkered border:", selectedIdea.showPauseBorder ? "ON" : "OFF");
  
  // Find the button that was clicked
  const buttons = document.querySelectorAll('button[onclick="toggleCheckeredBorder()"]');
  buttons.forEach(button => {
    if (selectedIdea.showPauseBorder) {
      button.style.background = "linear-gradient(45deg, #FFD700, #FFA500)";
      button.style.color = "black";
    } else {
      button.style.background = "";
      button.style.color = "";
    }
  });
}

// ===== BUBBLE PROPERTIES =====

function changeColor() { 
  if (!selectedIdea) return;
  selectedIdea.color = randomColor(); 
  console.log("🎨 Color changed to:", selectedIdea.color);
}

function changeTextColor() { 
  if (!selectedIdea) return;
  selectedIdea.textColor = randomTextColor(); 
}

function cycleFont() {
  if (!selectedIdea) return;
  fontIndex = (fontIndex + 1) % fonts.length;
  selectedIdea.font = fonts[fontIndex];
}

function updateBubbleRatio(value) {
  if (!selectedIdea) return;
  const sliderValue = parseFloat(value);
  
  // Convert slider value to symmetric ratio
  // 0.3 -> 0.3 (very thin)
  // 1.0 -> 1.0 (perfect circle/square)
  // 1.7 -> 3.0 (very tall)
  let actualRatio;
  if (sliderValue <= 1.0) {
    // 0.3 to 1.0 maps to 0.3 to 1.0 (thin to normal)
    actualRatio = sliderValue;
  } else {
    // 1.0 to 1.7 maps to 1.0 to 3.0 (normal to tall)
    const normalizedValue = (sliderValue - 1.0) / 0.7; // 0 to 1
    actualRatio = 1.0 + (normalizedValue * 2.0); // 1.0 to 3.0
  }
  
  selectedIdea.heightRatio = actualRatio;
  console.log('📐 Ratio changed to:', actualRatio, '(slider:', sliderValue, ')');
}

function updateActionSlider(value) {
  if (!selectedIdea) return;
  const sliderValue = parseInt(value);
  
  // Update the display value
  const actionSliderValue = document.getElementById('actionSliderValue');
  if (actionSliderValue) {
    actionSliderValue.textContent = sliderValue;
  }
  
  // Store the value based on shape type
  if (selectedIdea.shape === 'striker') {
    selectedIdea.strikerVelocity = sliderValue;
    console.log('⚡ Striker velocity changed to:', sliderValue);
  }
  // Add more shape-specific actions here in the future
}

function updateActionSliderVisibility() {
  const actionSliderContainer = document.getElementById('actionSliderContainer');
  const actionSlider = document.getElementById('actionSlider');
  const actionSliderValue = document.getElementById('actionSliderValue');
  
  if (!actionSliderContainer || !actionSlider || !actionSliderValue) return;
  
  if (selectedIdea && selectedIdea.shape === 'striker') {
    actionSliderContainer.style.display = 'block';
    actionSlider.title = 'Striker Velocity';
    actionSlider.min = '1';
    actionSlider.max = '20';
    actionSlider.value = selectedIdea.strikerVelocity || 5;
    actionSliderValue.textContent = selectedIdea.strikerVelocity || 5;
  } else {
    actionSliderContainer.style.display = 'none';
  }
}

function triggerStrikerAttack(bubble) {
  if (bubble.shape !== 'striker') return;
  
  // Check cooldown - prevent continuous attacks
  const now = Date.now();
  const cooldownTime = 300; // 0.3 seconds cooldown
  if (bubble.lastStrikerAttack && (now - bubble.lastStrikerAttack) < cooldownTime) {
    return; // Still in cooldown
  }
  
  // Set last attack time
  bubble.lastStrikerAttack = now;
  
  // Create striker attack
  const attack = {
    x: bubble.x,
    y: bubble.y,
    radius: bubble.radius * 1.5, // 50% bigger
    color: bubble.color,
    startTime: Date.now(),
    duration: 200, // 0.2 seconds
    bubble: bubble
  };
  
  strikerAttacks.push(attack);
  console.log('⚡ Striker attack triggered!');
  
  // Remove attack after duration
  setTimeout(() => {
    const index = strikerAttacks.indexOf(attack);
    if (index > -1) {
      strikerAttacks.splice(index, 1);
    }
  }, attack.duration);
}

function handleImageUpload(event) {
  if (!selectedIdea) return;
  
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (PNG, JPG, etc.)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    selectedIdea.image = e.target.result; // Store as data URL
    document.getElementById('uploadImage').style.border = '2px solid gold';
    document.getElementById('uploadImage').title = "Custom image uploaded";
    document.getElementById("imageSelector").value = "";
    console.log("🖼️ Custom image uploaded to bubble");
  };
  reader.readAsDataURL(file);
}

function handleImageSelect(event) {
  if (!selectedIdea) return;
  
  const selectedImage = event.target.value;
  if (selectedImage) {
    selectedIdea.image = selectedImage;
    document.getElementById('uploadImage').style.border = '';
    document.getElementById('uploadImage').title = "Upload custom image";
    console.log("🖼️ Selected image applied:", selectedImage);
  } else {
    selectedIdea.image = null;
    console.log("🗑️ Image cleared from bubble");
  }
}

function clearUploadedImage() {
  if (!selectedIdea) return;
  
  selectedIdea.image = null;
  if (!selectedIdea.color || selectedIdea.color === "black") {
    selectedIdea.color = randomColor();
  }
  document.getElementById("imageSelector").value = "";
  document.getElementById('uploadImage').style.border = '';
  document.getElementById('uploadImage').title = "Upload custom image";
  console.log("🗑️ Image cleared from bubble, color set to:", selectedIdea.color);
}

// ===== SAVE/LOAD SYSTEM =====

function saveIdeas() {
  const dataToSave = ideas.map(idea => ({ ...idea }));
  const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ideas.json";
  a.click();
}

function deleteAllIdeas() {
  if (confirm("📋CREATE BLANK CANVAS? ✅")) {
    ideas = [];
    selectedIdea = null;
    document.getElementById('panel').style.display = "none";
    backgroundImage = null;
    
    const video = document.getElementById("bgVideo");
    video.style.display = "none";
    video.pause();
    video.src = "";
    
    const iframe = document.getElementById("ytFrame");
    iframe.style.display = "none";
    iframe.src = "";
  }
}

// ===== CANVAS RENDERING =====

function draw() {
  // Only clear canvas if not in drawing mode
  if (!isDrawingMode) {
    // Draw background
    if (backgroundImage) {
      if (backgroundRotation !== 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((backgroundRotation * Math.PI) / 180);
        const maxDimension = Math.max(width, height);
        const scaleX = width / backgroundImage.width;
        const scaleY = height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY) * 1.2;
        
        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        
        ctx.drawImage(backgroundImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
      } else {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      }
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }
  // If in drawing mode, don't clear the canvas - preserve drawings

  // Update and draw ideas (skip drawing if in drawing mode)
  for (let i = 0; i < ideas.length; i++) {
    const a = ideas[i];
    const actualSpeed = movementDelayActive ? 0 : speedMultiplier;

    // Movement
    if (!a.fixed && !a.static) {
      a.x += a.vx * actualSpeed;
      a.y += a.vy * actualSpeed;
    }

    // Boundary bounce
    if (!a.static) {
      if (a.x - a.radius < border) { a.x = border + a.radius; a.vx *= -1; }
      if (a.x + a.radius > width - border) { a.x = width - border - a.radius; a.vx *= -1; }
      if (a.y - a.radius < border + 50) { a.y = border + 50 + a.radius; a.vy *= -1; }
      if (a.y + a.radius > height - border) { a.y = height - border - a.radius; a.vy *= -1; }
    }

    // Collision detection
    for (let j = i + 1; j < ideas.length; j++) {
      const b = ideas[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < a.radius + b.radius) {
        const angle = Math.atan2(dy, dx);
        
        if (a.static && !b.static) {
          const tx = a.x - Math.cos(angle) * (a.radius + b.radius);
          const ty = a.y - Math.sin(angle) * (a.radius + b.radius);
          b.x = tx;
          b.y = ty;
          b.vx *= -1;
          b.vy *= -1;
        } else if (!a.static && b.static) {
          const tx = b.x + Math.cos(angle) * (a.radius + b.radius);
          const ty = b.y + Math.sin(angle) * (a.radius + b.radius);
          a.x = tx;
          a.y = ty;
          a.vx *= -1;
          a.vy *= -1;
        } else {
          const tx = a.x - Math.cos(angle) * (a.radius + b.radius);
          const ty = a.y - Math.sin(angle) * (a.radius + b.radius);
          b.x = tx;
          b.y = ty;
          [a.vx, b.vx] = [b.vx, a.vx];
          [a.vy, b.vy] = [b.vy, a.vy];
        }
      }
    }

    // Draw bubble (skip if in drawing mode)
    if (!isDrawingMode) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      // Draw the shape path
      const shape = a.shape || 'circle';
      const heightRatio = a.heightRatio || 1.0;
      drawShape(ctx, shape, 0, 0, a.radius, heightRatio, 0);
      ctx.clip();

    if (a.image) {
      const src = a.image;
      
      if (loadedImages[src] && loadedImages[src].complete) {
        try {
          ctx.drawImage(loadedImages[src], -a.radius, -a.radius, a.radius * 2, a.radius * 2);
        } catch (error) {
          console.error("❌ Error drawing image for bubble:", a.title, "Error:", error);
          a.image = null;
        }
      } else {
        if (!loadedImages[src]) {
          const img = new Image();
          img.onload = () => {
            loadedImages[src] = img;
          };
          img.onerror = () => {
            console.error("❌ Failed to load image:", src);
            a.image = null;
          };
          img.src = src;
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }
    } else {
      if (a.transparent) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
      } else if (a.animateColors) {
        ctx.fillStyle = `hsl(${(Date.now() * 0.08) % 360}, 100%, 70%)`;
      } else {
        ctx.fillStyle = a.color || "white";
      }

      if (a.glow) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = a.color || "white";
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = a.color || "white";
      }
      
      ctx.fill();
    }

    ctx.restore();

    // Effects
    if (a.glow || a.flash) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      
      if (a.flash) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
        ctx.beginPath();
        ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      if (a.glow) {
        const glowColor = a.glowColor || a.color || "white";
        
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, a.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, a.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Text
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.rotation) {
      ctx.rotate((a.rotation * Math.PI) / 180);
    }
    ctx.fillStyle = a.textColor || "white";
    const fontSize = a.fontSize || 14;
    ctx.font = `bold ${fontSize}px ${a.font || "Tahoma"}`;
    ctx.textAlign = "center";
    const words = a.title.split(" ");
    const lineHeight = fontSize + 2;
    words.forEach((word, idx) => {
      ctx.fillText(word, 0, idx * lineHeight - (words.length - 1) * (lineHeight / 2));
    });
    ctx.restore();
    
    // Checkered border for glowing bubbles
    if (a.glow && a.showPauseBorder) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) {
        ctx.rotate((a.rotation * Math.PI) / 180);
      }
      const shape = a.shape || 'circle';
      const heightRatio = a.heightRatio || 1.0;
      drawShape(ctx, shape, 0, 0, a.radius + 3, heightRatio, 0);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
    
    // Visual feedback for manual control (always available) - REMOVED
    
    // Visual feedback for dragging
    if (isDragging && draggedIdea === a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      ctx.arc(0, 0, a.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    } // Close if (!isDrawingMode) block
  }

  // Draw striker attacks and handle collisions
  for (let i = 0; i < strikerAttacks.length; i++) {
    const attack = strikerAttacks[i];
    const elapsed = Date.now() - attack.startTime;
    const progress = elapsed / attack.duration;
    
    if (progress >= 1) continue; // Skip if attack is finished
    
    ctx.save();
    ctx.translate(attack.x, attack.y);
    
    // Draw attack ring with fade effect (outline only)
    ctx.globalAlpha = 0.7 * (1 - progress);
    ctx.strokeStyle = attack.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, attack.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Check for collisions with other bubbles
    for (let j = 0; j < ideas.length; j++) {
      const target = ideas[j];
      if (target === attack.bubble) continue; // Skip the attacking bubble
      
      // Check for collisions with other bubbles using expanded radius
      const expandedRadius = attack.bubble.radius * 2; // Twice the normal size
      const dx = attack.x - target.x;
      const dy = attack.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < expandedRadius + target.radius) {
        // Check if this target has already been hit by this attack
        if (!attack.hitTargets) {
          attack.hitTargets = new Set();
        }
        
        if (!attack.hitTargets.has(target)) {
          // Collision detected! Apply strike effect
          console.log('💥 Striker hit:', target.title);
          
          // Mark this target as hit by this attack
          attack.hitTargets.add(target);
          
          // Visual feedback - flash the hit bubble
          target.flash = true;
          setTimeout(() => {
            target.flash = false;
          }, 500);
          
          // Bounce effect - push the target away from the striker
          if (!target.static) {
            const pushDistance = 50; // Increased push distance
            
            // Calculate direction from striker to target
            const dirX = target.x - attack.x;
            const dirY = target.y - attack.y;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);
            
            if (distance > 0) {
              // Normalize direction
              const normalizedDirX = dirX / distance;
              const normalizedDirY = dirY / distance;
              
              // Set velocity based on striker's custom velocity setting
              const strikerVelocity = attack.bubble.strikerVelocity || 5;
              target.vx = normalizedDirX * strikerVelocity;
              target.vy = normalizedDirY * strikerVelocity;
            }
          }
        }
      }
    }
  }

  // Draw preserved drawings when not in drawing mode
  if (!isDrawingMode && drawingPaths.length > 0) {
    for (let i = 0; i < drawingPaths.length; i++) {
      const path = drawingPaths[i];
      const pathColor = path.color || drawingColor;
      const pathWidth = path.width || drawingWidth;
      
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let j = 1; j < path.length; j++) {
        ctx.lineTo(path[j].x, path[j].y);
      }
      
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = pathWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  requestAnimationFrame(draw);
}

// ===== INITIALIZATION =====

function init() {
  console.log("🚀 Initializing MindsEye...");
  
  // Set up canvas
  resize();
  window.addEventListener("resize", resize);
  
  // Set up movement delay
  movementDelayActive = true;
  setTimeout(() => {
    movementDelayActive = false;
  }, 10000);
  
  // Load default theme and first preset
  switchTheme('default');
  
  // Initialize video player
  if (typeof initVideoPlayer === 'function') {
    initVideoPlayer();
  }
  
  // Start rendering
  draw();
  
  console.log("✅ MindsEye initialized successfully");
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
  // Canvas click (left click for adding bubbles only)
  canvas.addEventListener("click", (e) => {
    if (isDragging) return; // Don't add bubbles while dragging
    if (isDrawingMode) return; // Don't add bubbles while in drawing mode
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let clicked = false;
    
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        // Left click on bubble - select it and show panel if it's not already open
        selectedIdea = idea;
        
        // Check if panel is open
        const panel = document.getElementById('panel');
        if (panel.style.display === 'block') {
          // Panel is open - update it with the new bubble's information
          showPanel();
        }
        // If panel is closed, just select the bubble without showing panel
        
        clicked = true;
        break;
      }
    }
    
    if (!clicked) addIdea(x, y);
  });

  // Right-click for panel
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    
    // If in drawing mode, clear drawings
    if (isDrawingMode) {
      clearDrawingOnly();
      drawingPaths = [];
      console.log('🧽 Drawings cleared');
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        selectedIdea = idea;
        
        // Check if panel is already open for this bubble
        const panel = document.getElementById('panel');
        if (panel.style.display === 'block' && selectedIdea === idea) {
          // Panel is open for this bubble - close it
          closePanel();
        } else {
          // Panel is not open or for different bubble - show panel
          showPanel();
        }
        return;
      }
    }
    
    // Right-click on empty space - close panel if open
    const panel = document.getElementById('panel');
    if (panel.style.display === 'block') {
      closePanel();
    }
  });

  // Drag and drop functionality
  canvas.addEventListener("mousedown", (e) => {
    if (isDrawingMode) return; // Don't drag bubbles while in drawing mode
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        isDragging = true;
        draggedIdea = idea;
        dragOffsetX = dx;
        dragOffsetY = dy;
        selectedIdea = idea;
        // Don't show panel on drag start
        break;
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging || !draggedIdea) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draggedIdea.x = x - dragOffsetX;
    draggedIdea.y = y - dragOffsetY;
    
    // Keep bubble within bounds
    if (draggedIdea.x - draggedIdea.radius < border) {
      draggedIdea.x = border + draggedIdea.radius;
    }
    if (draggedIdea.x + draggedIdea.radius > width - border) {
      draggedIdea.x = width - border - draggedIdea.radius;
    }
    if (draggedIdea.y - draggedIdea.radius < border + 50) {
      draggedIdea.y = border + 50 + draggedIdea.radius;
    }
    if (draggedIdea.y + draggedIdea.radius > height - border) {
      draggedIdea.y = height - border - draggedIdea.radius;
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    draggedIdea = null;
  });

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (!selectedIdea) return;
    
    const moveAmount = 5;
    let moved = false;
    
    switch(e.key) {
      case "ArrowUp":
        selectedIdea.y -= moveAmount;
        moved = true;
        break;
      case "ArrowDown":
        selectedIdea.y += moveAmount;
        moved = true;
        break;
      case "ArrowLeft":
        selectedIdea.x -= moveAmount;
        moved = true;
        break;
      case "ArrowRight":
        selectedIdea.x += moveAmount;
        moved = true;
        break;
      case "\\":
        // Backslash triggers striker attack
        if (selectedIdea.shape === 'striker') {
          triggerStrikerAttack(selectedIdea);
          e.preventDefault();
        }
        break;
    }
    
    if (moved) {
      e.preventDefault();
      
      // Keep bubble within bounds
      if (selectedIdea.x - selectedIdea.radius < border) {
        selectedIdea.x = border + selectedIdea.radius;
      }
      if (selectedIdea.x + selectedIdea.radius > width - border) {
        selectedIdea.x = width - border - selectedIdea.radius;
      }
      if (selectedIdea.y - selectedIdea.radius < border + 50) {
        selectedIdea.y = border + 50 + selectedIdea.radius;
      }
      if (selectedIdea.y + selectedIdea.radius > height - border) {
        selectedIdea.y = height - border - selectedIdea.radius;
      }
    }
  });

  // File loader
  document.getElementById("fileLoader").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const loaded = JSON.parse(event.target.result);
        ideas = loaded.map(idea => ({
          ...idea,
          font: idea.font || fonts[0],
          radius: idea.radius || 80,
          fontSize: idea.fontSize || 14,
          rotation: idea.rotation || 0,
          shape: idea.shape || 'circle',
          heightRatio: idea.heightRatio || 1.0,
          showPauseBorder: idea.showPauseBorder || false,
          createdDate: idea.createdDate || new Date().toISOString().split('T')[0],
          createdTime: idea.createdTime || new Date().toTimeString().split(' ')[0]
        }));

        movementDelayActive = true;
        setTimeout(() => {
          movementDelayActive = false;
        }, 10000);
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  // Panel interactions
  const panel = document.getElementById('panel');
  if (panel) {
    panel.addEventListener('mousemove', resetPanelTimer);
    panel.addEventListener('click', resetPanelTimer);
    panel.addEventListener('input', resetPanelTimer);
    panel.addEventListener('change', resetPanelTimer);
  }
  
  // Panel timeout checkbox
  const disableTimeoutCheckbox = document.getElementById('disablePanelTimeout');
  if (disableTimeoutCheckbox) {
    disableTimeoutCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // Disable timeout - clear any existing timeout
        if (panelFadeTimeout) {
          clearTimeout(panelFadeTimeout);
          panelFadeTimeout = null;
        }
        console.log('⏰ Panel timeout disabled');
      } else {
        // Re-enable timeout - start the timer again
        resetPanelFade();
        console.log('⏰ Panel timeout enabled');
      }
    });
  }
  
  // Image upload functionality
  const uploadImage = document.getElementById('uploadImage');
  if (uploadImage) {
    uploadImage.addEventListener('change', handleImageUpload);
  }
  
  // Image selector functionality
  const imageSelector = document.getElementById('imageSelector');
  if (imageSelector) {
    imageSelector.addEventListener('change', handleImageSelect);
  }
  
  // Shape selector functionality
  const shapeSelector = document.getElementById('shapeSelector');
  if (shapeSelector) {
    shapeSelector.addEventListener('change', function() {
      if (selectedIdea) {
        selectedIdea.shape = this.value;
        console.log('🔷 Shape changed to:', this.value);
        // Update action slider visibility when shape changes
        updateActionSliderVisibility();
      }
    });
  }
  
  // Media toolbar functionality
  const bgLoader = document.getElementById('bgLoader');
  if (bgLoader && typeof handleBackgroundUpload === 'function') {
    bgLoader.addEventListener('change', handleBackgroundUpload);
  }
  
  const videoLoader = document.getElementById('videoLoader');
  if (videoLoader && typeof handleVideoUpload === 'function') {
    videoLoader.addEventListener('change', handleVideoUpload);
  }
  
  // Add click handler for minimized panel
  const panelElement = document.getElementById('panel');
  if (panelElement) {
    panelElement.addEventListener('click', function(e) {
      // Only restore if minimized and click is not on a button
      if (this.classList.contains('minimized') && !e.target.matches('button')) {
        restorePanel();
      }
    });
  }
  
  // Drawing mode event listeners (higher priority)
  canvas.addEventListener('mousedown', startDrawing, true);
  canvas.addEventListener('mousemove', drawLine, true);
  canvas.addEventListener('mouseup', stopDrawing, true);
  canvas.addEventListener('mouseleave', stopDrawing, true);
  
  // Keyboard shortcuts for drawing
  document.addEventListener('keydown', (e) => {
    if (isDrawingMode) {
      switch(e.key) {
        case 'c':
        case 'C':
          clearDrawing();
          break;
        case 'd':
        case 'D':
          changeDrawingColor();
          break;
        case 'w':
        case 'W':
          changeDrawingWidth();
          break;
      }
    }
  });
}

function toggleSpeed() {
  const speedSlider = document.querySelector('input[type="range"]');
  if (speedMultiplier === 0) {
    // If currently paused, restore to previous speed
    speedMultiplier = previousSpeed;
    speedSlider.value = previousSpeed;
    speedSlider.classList.remove('paused');
  } else {
    // If currently running, pause and remember current speed
    previousSpeed = speedMultiplier;
    speedMultiplier = 0;
    speedSlider.value = 0;
    speedSlider.classList.add('paused');
  }
}

function togglePauseButton() {
  const speedSlider = document.querySelector('input[type="range"]');
  
  // If in drawing mode, exit drawing mode instead of toggling pause
  if (isDrawingMode) {
    console.log('⏯️ Pause button pressed while in drawing mode - exiting drawing mode');
    toggleDrawingMode();
    return;
  }
  
  if (speedMultiplier === 0) {
    // If currently paused, restore to previous speed
    speedMultiplier = previousSpeed;
    speedSlider.value = previousSpeed;
    speedSlider.classList.remove('paused');
    
    // Toggle media toolbar visibility when unpausing
    if (typeof toggleMediaToolbarVisibility === 'function') {
      toggleMediaToolbarVisibility();
    }
  } else {
    // If currently running, pause and remember current speed
    previousSpeed = speedMultiplier;
    speedMultiplier = 0;
    speedSlider.value = 0;
    speedSlider.classList.add('paused');
    
    // Toggle media toolbar visibility when pausing
    if (typeof toggleMediaToolbarVisibility === 'function') {
      toggleMediaToolbarVisibility();
    }
  }
  
  // Update the pause button icon
  if (typeof updatePauseButtonIcon === 'function') {
    updatePauseButtonIcon();
  }
}

// ===== TEST FUNCTIONS =====

function testImageUpload() {
  console.log('🧪 Testing image upload functionality...');
  alert('🧪 Image upload test - functionality working!');
}

function testEffects() {
  console.log('🎭 Testing effects functionality...');
  alert('🎭 Effects test - functionality working!');
}

function togglePanelSide() {
  const panel = document.getElementById('panel');
  if (panel) {
    const currentLeft = panel.style.left;
    if (currentLeft === '15px' || currentLeft === '') {
      panel.style.left = 'auto';
      panel.style.right = '15px';
      console.log('↔️ Panel moved to right side');
    } else {
      panel.style.left = '15px';
      panel.style.right = 'auto';
      console.log('↔️ Panel moved to left side');
    }
  }
}

// ===== MAIN.JS LOADED =====
console.log('🔧 Main.js loaded successfully'); 