/**
 * Transitions and Animations System
 *
 * Smooth, consistent micro-interactions throughout the app
 * All transitions use proper easing curves for natural motion
 */

export const transitions = {
  // ============================================================================
  // TRANSITION PROPERTIES - What to animate
  // ============================================================================
  property: {
    common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    colors: 'background-color, border-color, color, fill, stroke',
    dimensions: 'width, height',
    position: 'left, right, top, bottom',
    background: 'background-color, background-image, background-position',
    transform: 'transform',
    opacity: 'opacity',
    shadow: 'box-shadow',
    all: 'all',
  },

  // ============================================================================
  // EASING FUNCTIONS - Natural motion curves
  // ============================================================================
  easing: {
    // Standard easing - Most common
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Deceleration - Entering elements
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',

    // Acceleration - Exiting elements
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',

    // Sharp - Quick transitions
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

    // Bounce - Playful interactions
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

    // Elastic - Spring-like
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // ============================================================================
  // DURATIONS - Time scales
  // ============================================================================
  duration: {
    instant: '0ms',
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },

  // ============================================================================
  // PRE-CONFIGURED TRANSITIONS - Common combinations
  // ============================================================================
  presets: {
    // Fade in/out
    fade: {
      property: 'opacity',
      duration: 'normal',
      easing: 'easeInOut',
    },

    // Scale effects
    scale: {
      property: 'transform',
      duration: 'fast',
      easing: 'easeOut',
    },

    // Slide animations
    slide: {
      property: 'transform',
      duration: 'normal',
      easing: 'easeInOut',
    },

    // Color changes
    color: {
      property: 'colors',
      duration: 'fast',
      easing: 'easeInOut',
    },

    // Shadow changes (elevation)
    elevation: {
      property: 'box-shadow, transform',
      duration: 'normal',
      easing: 'easeOut',
    },

    // Hover state
    hover: {
      property: 'common',
      duration: 'fast',
      easing: 'easeInOut',
    },

    // Active/pressed state
    active: {
      property: 'transform',
      duration: 'fastest',
      easing: 'easeOut',
    },
  },
}

// ============================================================================
// KEYFRAME ANIMATIONS - Reusable animations
// ============================================================================
export const keyframes = {
  // Fade in
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },

  // Fade out
  fadeOut: {
    '0%': { opacity: 1 },
    '100%': { opacity: 0 },
  },

  // Slide in from right
  slideInRight: {
    '0%': { transform: 'translateX(100%)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },

  // Slide in from left
  slideInLeft: {
    '0%': { transform: 'translateX(-100%)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },

  // Slide in from top
  slideInTop: {
    '0%': { transform: 'translateY(-100%)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },

  // Slide in from bottom
  slideInBottom: {
    '0%': { transform: 'translateY(100%)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },

  // Scale up (zoom in)
  scaleIn: {
    '0%': { transform: 'scale(0.9)', opacity: 0 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },

  // Scale down (zoom out)
  scaleOut: {
    '0%': { transform: 'scale(1)', opacity: 1 },
    '100%': { transform: 'scale(0.9)', opacity: 0 },
  },

  // Spin (loading)
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },

  // Pulse (attention)
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  // Bounce (playful)
  bounce: {
    '0%, 100%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  // Shake (error state)
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
  },
}

// Helper function to build transition string
export const buildTransition = (preset = 'hover') => {
  const config = transitions.presets[preset]
  if (!config) return 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'

  const { property, duration, easing } = config
  const durationValue = transitions.duration[duration] || duration
  const easingValue = transitions.easing[easing] || easing

  return `${property} ${durationValue} ${easingValue}`
}
