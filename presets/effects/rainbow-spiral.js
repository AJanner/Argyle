/**
 * Rainbow Spiral - Custom Preset Example
 * A colorful spiral effect with rainbow color evolution
 */

export function renderRainbowSpiral(ctx, time, audioData, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create spiral pattern
  for (let i = 0; i < 200; i++) {
    const angle = (i / 200) * Math.PI * 8 + time * 2;
    const radius = i * 2 + Math.sin(time + i * 0.1) * 20;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = Math.max(1, 5 - (i / 200) * 4);
    
    // Rainbow color effect
    const hue = (i * 2 + time * 50) % 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add audio-reactive particles
  if (audioData.volume > 50) {
    for (let p = 0; p < 20; p++) {
      const particleAngle = (p / 20) * Math.PI * 2 + time * 3;
      const particleRadius = 100 + Math.sin(time + p * 0.2) * 30;
      const particleX = centerX + Math.cos(particleAngle) * particleRadius;
      const particleY = centerY + Math.sin(particleAngle) * particleRadius;
      const particleSize = Math.max(2, audioData.volume * 0.1);
      
      ctx.fillStyle = `hsl(${(p * 18 + time * 40) % 360}, 90%, 60%)`;
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
