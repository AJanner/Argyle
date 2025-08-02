// ===== MINDS EYE - MAIN CORE =====

// Global variables
let movementDelayActive = true;
let backgroundRotation = 0;
let speedMultiplier = 1;
let ideas = [];
let selectedIdea = null;
let backgroundImage = null;
let currentTheme = "default";
let backgroundIndex = 1;
let width, height;
let border = 10;

// Canvas setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Font array
const fonts = [
  "Arial", "Monaco", "Verdana", "Tahoma", "Trebuchet MS", "Comic Sans MS",
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

// ===== UTILITY FUNCTIONS =====

function randomColor() {
  return `hsl(${Math.random() * 360}, 100%, 70%)`;
}

function randomTextColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 100;
  const lightness = 50 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

// ===== IDEA MANAGEMENT =====

function addIdea(x, y, title = "", description = "", color = randomColor(), textColor = "white", radius = 80) {
  const maxSpeed = 3;
  const bubbleColor = color || randomColor();
  
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
    glow: false,
    flash: false,
    animateColors: false,
    transparent: false,
    glowColor: null,
    fixed: false,
    static: false
  });
  
  console.log("🆕 New bubble created with color:", bubbleColor);
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
        radius: idea.radius || 80
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
  
  presetSelector.innerHTML = '<option value="">Select Preset</option>';
  
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
    radius: idea.radius || 80
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
  document.getElementById("rotationSlider").value = selectedIdea.rotation || 0;
  
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

function resetPanelFade() {
  const panel = document.getElementById('panel');
  if (panel && panel.style.display === 'block') {
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

  // Update and draw ideas
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
  // Canvas click
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let clicked = false;
    
    for (let idea of ideas) {
      const dx = x - idea.x;
      const dy = y - idea.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < idea.radius) {
        selectedIdea = idea;
        showPanel();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) addIdea(x, y);
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
          rotation: idea.rotation || 0
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
  
  // Media toolbar functionality
  const bgLoader = document.getElementById('bgLoader');
  if (bgLoader) {
    bgLoader.addEventListener('change', handleBackgroundUpload);
  }
  
  const videoLoader = document.getElementById('videoLoader');
  if (videoLoader) {
    videoLoader.addEventListener('change', handleVideoUpload);
  }
}

// ===== EXPORTS =====

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    setupEventListeners,
    switchTheme,
    addIdea,
    saveIdeas,
    deleteAllIdeas
  };
} 