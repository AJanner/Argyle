/**
 * Preset Configuration - All Available Visualization Presets
 * This file defines all presets and can be easily modified to add new ones
 */

// Import custom presets
import { renderRainbowSpiral } from './effects/rainbow-spiral-GL.js';
import { renderNeonPulse } from './effects/neon-pulse.js';
import { renderMyCoolEffect } from './effects/my-cool-effect.js';

// Preset definitions
export const presets = [
  // Built-in presets
  {
    name: 'Wave Symphony',
    type: 'waveform',
    description: 'Complex wave patterns with color evolution',
    category: 'Audio'
  },
  {
    name: 'Particle Galaxy',
    type: 'particles',
    description: 'Dynamic particle system with physics',
    category: 'Particles'
  },
  {
    name: 'Circular Ripples',
    type: 'rings',
    description: 'Expanding circular rings with ripple effects',
    category: 'Geometric'
  },
  {
    name: 'Spectrum Bars',
    type: 'spectrum',
    description: 'Audio spectrum-like bars with motion',
    category: 'Audio'
  },
  {
    name: 'Geometric Dance',
    type: 'shapes',
    description: 'Rotating geometric shapes with colors',
    category: 'Geometric'
  },
  {
    name: 'Spiral Galaxy',
    type: 'spiral',
    description: 'Spiral patterns with cosmic effects',
    category: 'Cosmic'
  },
  {
    name: 'Matrix Rain',
    type: 'matrix',
    description: 'Digital rain effect with glowing trails',
    category: 'Digital'
  },
  {
    name: 'Fireworks',
    type: 'fireworks',
    description: 'Explosive particle effects',
    category: 'Particles'
  },
  {
    name: 'Neon Grid',
    type: 'neonGrid',
    description: 'Glowing neon grid with pulsing effects',
    category: 'Neon'
  },
  {
    name: 'Cosmic Dust',
    type: 'cosmicDust',
    description: 'Floating cosmic particles with trails',
    category: 'Cosmic'
  },
  {
    name: 'Liquid Metal',
    type: 'liquidMetal',
    description: 'Flowing metallic liquid effects',
    category: 'Metallic'
  },
  {
    name: 'Energy Field',
    type: 'energyField',
    description: 'Pulsing energy field with lightning',
    category: 'Energy'
  },
  {
    name: 'Crystal Formation',
    type: 'crystalFormation',
    description: 'Growing crystal structures',
    category: 'Crystal'
  },
  {
    name: 'Plasma Storm',
    type: 'plasmaStorm',
    description: 'Intense plasma storm effects',
    category: 'Plasma'
  },
  {
    name: 'Quantum Waves',
    type: 'quantumWaves',
    description: 'Quantum wave interference patterns',
    category: 'Quantum'
  },
  {
    name: 'Stellar Nebula',
    type: 'stellarNebula',
    description: 'Cosmic nebula with star formation',
    category: 'Cosmic'
  },
  {
    name: 'Digital Vortex',
    type: 'digitalVortex',
    description: 'Digital vortex with data streams',
    category: 'Digital'
  },
  {
    name: 'Holographic Display',
    type: 'holographic',
    description: '3D holographic projection effects',
    category: 'Holographic'
  },
  {
    name: 'Neural Network',
    type: 'neuralNetwork',
    description: 'Animated neural network connections',
    category: 'Neural'
  },
  {
    name: 'Fractal Universe',
    type: 'fractalUniverse',
    description: 'Infinite fractal patterns',
    category: 'Fractal'
  },
  {
    name: 'Solar Flare',
    type: 'solarFlare',
    description: 'Intense solar flare effects',
    category: 'Solar'
  },
  {
    name: 'Aurora Borealis',
    type: 'auroraBorealis',
    description: 'Northern lights simulation',
    category: 'Aurora'
  },
  {
    name: 'Magnetic Field',
    type: 'magneticField',
    description: 'Magnetic field line visualization',
    category: 'Magnetic'
  },
  {
    name: 'Temporal Rift',
    type: 'temporalRift',
    description: 'Time distortion effects',
    category: 'Temporal'
  },
  {
    name: 'Gravity Well',
    type: 'gravityWell',
    description: 'Gravitational distortion effects',
    category: 'Gravitational'
  },
  {
    name: 'Quantum Tunnel',
    type: 'quantumTunnel',
    description: 'Quantum tunneling visualization',
    category: 'Quantum'
  },
  {
    name: 'Dark Matter',
    type: 'darkMatter',
    description: 'Dark matter particle effects',
    category: 'Cosmic'
  },
  {
    name: 'Light Speed',
    type: 'lightSpeed',
    description: 'Relativistic light effects',
    category: 'Relativistic'
  },
  {
    name: 'Wormhole',
    type: 'wormhole',
    description: 'Space-time wormhole effects',
    category: 'Cosmic'
  },
  {
    name: 'Supernova',
    type: 'supernova',
    description: 'Explosive supernova simulation',
    category: 'Cosmic'
  },
  
  // Custom presets
  {
    name: 'Rainbow Spiral GL',
    type: 'rainbowSpiral',
    description: 'High-performance WebGL2 kaleidoscopic spiral with audio reactivity',
    category: 'Custom',
    custom: true
  },
  {
    name: 'Neon Pulse',
    type: 'neonPulse',
    description: 'Pulsing neon effects with audio reactivity',
    category: 'Custom',
    custom: true
  },
  {
    name: 'My Cool Effect',
    type: 'myCoolEffect',
    description: 'Custom audio-reactive circles with connecting lines',
    category: 'Custom',
    custom: true
  }
];

// Export custom render functions
export const customEffects = {
  rainbowSpiral: renderRainbowSpiral,
  neonPulse: renderNeonPulse,
  myCoolEffect: renderMyCoolEffect
};

// Make customEffects available globally
if (typeof window !== 'undefined') {
  window.customEffects = customEffects;
}

// Get presets by category
export function getPresetsByCategory(category) {
  return presets.filter(preset => preset.category === category);
}

// Get all categories
export function getCategories() {
  return [...new Set(presets.map(preset => preset.category))];
}

// Get custom presets
export function getCustomPresets() {
  return presets.filter(preset => preset.custom);
}

// Get built-in presets
export function getBuiltInPresets() {
  return presets.filter(preset => !preset.custom);
}
