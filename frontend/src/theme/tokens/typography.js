/**
 * Typography System
 *
 * Refined type scale, weights, line heights, and letter spacing
 * All values are relative and scale appropriately
 */

export const typography = {
  // ============================================================================
  // FONT SIZES - Refined scale
  // ============================================================================
  fontSizes: {
    '2xs': '0.625rem',   // 10px - tiny labels
    xs: '0.75rem',       // 12px - small text, captions
    sm: '0.875rem',      // 14px - body small, table cells
    md: '1rem',          // 16px - body text (base)
    lg: '1.125rem',      // 18px - emphasized text
    xl: '1.25rem',       // 20px - small headings
    '2xl': '1.5rem',     // 24px - medium headings
    '3xl': '1.875rem',   // 30px - large headings
    '4xl': '2.25rem',    // 36px - page titles
    '5xl': '3rem',       // 48px - hero text
    '6xl': '3.75rem',    // 60px - display text
    '7xl': '4.5rem',     // 72px - extra large display
  },

  // ============================================================================
  // FONT WEIGHTS - From normal to black
  // ============================================================================
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // ============================================================================
  // LINE HEIGHTS - For readability
  // ============================================================================
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // ============================================================================
  // LETTER SPACING - For typography control
  // ============================================================================
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // ============================================================================
  // FONT FAMILIES
  // ============================================================================
  fonts: {
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Droid Sans Mono", monospace',
  },
}

// ============================================================================
// TEXT STYLES - Pre-configured combinations
// ============================================================================
export const textStyles = {
  // Display styles (hero, landing pages)
  display: {
    xl: {
      fontSize: '7xl',
      fontWeight: 'bold',
      lineHeight: 'none',
      letterSpacing: 'tight',
    },
    lg: {
      fontSize: '6xl',
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: 'tight',
    },
    md: {
      fontSize: '5xl',
      fontWeight: 'bold',
      lineHeight: 'tight',
    },
  },

  // Heading styles (section titles)
  heading: {
    '4xl': {
      fontSize: '4xl',
      fontWeight: 'bold',
      lineHeight: 'tight',
    },
    '3xl': {
      fontSize: '3xl',
      fontWeight: 'bold',
      lineHeight: 'snug',
    },
    '2xl': {
      fontSize: '2xl',
      fontWeight: 'bold',
      lineHeight: 'snug',
    },
    xl: {
      fontSize: 'xl',
      fontWeight: 'semibold',
      lineHeight: 'snug',
    },
    lg: {
      fontSize: 'lg',
      fontWeight: 'semibold',
      lineHeight: 'normal',
    },
  },

  // Body text styles
  body: {
    lg: {
      fontSize: 'lg',
      lineHeight: 'relaxed',
    },
    md: {
      fontSize: 'md',
      lineHeight: 'normal',
    },
    sm: {
      fontSize: 'sm',
      lineHeight: 'normal',
    },
  },

  // Label styles (form labels, table headers)
  label: {
    lg: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      lineHeight: 'tight',
      letterSpacing: 'wide',
    },
    md: {
      fontSize: 'sm',
      fontWeight: 'medium',
      lineHeight: 'tight',
    },
    sm: {
      fontSize: 'xs',
      fontWeight: 'medium',
      lineHeight: 'tight',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
    },
  },

  // Caption styles (helper text, metadata)
  caption: {
    md: {
      fontSize: 'sm',
      lineHeight: 'normal',
      color: 'text.secondary',
    },
    sm: {
      fontSize: 'xs',
      lineHeight: 'tight',
      color: 'text.tertiary',
    },
  },

  // Code/monospace styles
  code: {
    inline: {
      fontFamily: 'mono',
      fontSize: 'sm',
      px: 1.5,
      py: 0.5,
      borderRadius: 'md',
      bg: 'surface.subtle',
    },
    block: {
      fontFamily: 'mono',
      fontSize: 'sm',
      lineHeight: 'relaxed',
      p: 4,
      borderRadius: 'lg',
      bg: 'surface.subtle',
    },
  },
}
