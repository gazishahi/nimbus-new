/**
 * Nimbus - Cloud-Inspired Color Palette
 * A beautiful, easy-on-the-eyes color scheme inspired by nimbus clouds and sky
 */

export const Colors = {
  // Primary Nimbus Blues
  primary: {
    deepNimbus: '#1e3a8a',    // Deep blue, like heavy storm clouds
    skyBlue: '#3b82f6',       // Bright blue, like day sky
    cloudBlue: '#60a5fa',     // Lighter blue, like lit cloud edges
    mistyBlue: '#93c5fd',     // Very light blue, like distant clouds
  },

  // Background Colors
  background: {
    nightSky: '#0f172a',      // Very dark blue-gray, main background
    twilight: '#1e293b',      // Slightly lighter, secondary background
    overcast: '#334155',      // Medium gray-blue, panels
    storm: '#475569',         // Lighter panels
  },

  // Supporting Grays
  gray: {
    cloudWhite: '#f8fafc',    // Off-white, like cloud highlights
    silverLining: '#cbd5e1',  // Light gray, like cloud edges
    stormGray: '#64748b',     // Medium gray, like cloud shadows
    charcoal: '#334155',      // Dark gray
  },

  // Accent Colors
  accent: {
    lightning: '#fbbf24',     // Warm yellow, like lightning
    sunset: '#f97316',        // Orange, like sunset through clouds
    rainGreen: '#10b981',     // Teal-green, like rain-washed nature
    dawn: '#ec4899',          // Pink, like dawn clouds
    thunder: '#6366f1',       // Purple-blue, like lightning-lit clouds
  },

  // Status Colors
  status: {
    success: '#10b981',       // Rain green
    warning: '#fbbf24',       // Lightning yellow
    error: '#ef4444',         // Bright red
    info: '#3b82f6',          // Sky blue
  },

  // Text Colors
  text: {
    primary: '#f8fafc',       // Cloud white
    secondary: '#cbd5e1',     // Silver lining
    muted: '#94a3b8',         // Light gray
    accent: '#fbbf24',        // Lightning yellow
  },

  // Button Variants
  button: {
    primary: {
      background: '#3b82f6',
      border: '#1e40af',
      shadow: '#1e3a8a',
      text: '#ffffff',
    },
    secondary: {
      background: '#6366f1',
      border: '#4f46e5',
      shadow: '#3730a3',
      text: '#ffffff',
    },
    success: {
      background: '#10b981',
      border: '#059669',
      shadow: '#047857',
      text: '#ffffff',
    },
    warning: {
      background: '#fbbf24',
      border: '#f59e0b',
      shadow: '#d97706',
      text: '#000000',
    },
    danger: {
      background: '#ef4444',
      border: '#dc2626',
      shadow: '#b91c1c',
      text: '#ffffff',
    },
  },

  // Progress Bars
  progress: {
    background: '#475569',
    fill: '#3b82f6',
    success: '#10b981',
    warning: '#fbbf24',
  },

  // Tab Bar
  tabBar: {
    background: '#1e293b',
    border: '#475569',
    active: '#3b82f6',
    inactive: '#64748b',
  },

  // Cards and Panels
  card: {
    background: '#334155',
    border: '#475569',
    shadow: '#0f172a',
  },

  // Difficulty Colors (for quests)
  difficulty: {
    easy: ['#10b981', '#059669'],      // Rain green gradient
    medium: ['#fbbf24', '#f59e0b'],    // Lightning yellow gradient
    hard: ['#f97316', '#ea580c'],      // Sunset orange gradient
    legendary: ['#6366f1', '#4f46e5'], // Thunder purple gradient
  },

  // Character Classes
  classes: {
    speedRunner: '#3b82f6',     // Sky blue
    enduranceMaster: '#6366f1', // Thunder purple
    explorer: '#10b981',        // Rain green
  },
} as const;

// Helper function to get rgba color with opacity
export const rgba = (color: string, opacity: number): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert hex to rgb
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to create gradients
export const createGradient = (colors: readonly [string, string]) => ({
  colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
});