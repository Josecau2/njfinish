# Media Viewer Audit - Resources Page
**Date**: 2025-10-04
**Scope**: Video and image playback functionality in Resources page
**Files Audited**:
- `frontend/src/components/FileViewerModal.jsx`
- `frontend/src/pages/Resources/index.jsx`

---

## Current Implementation Analysis

### Image Viewing (Lines 181-194)
**Implementation**: Native Chakra UI `<Image>` component
```jsx
<Image
  src={inlineUrl}
  alt={file?.name}
  maxW="100%"
  maxH="70vh"
  mx="auto"
  objectFit="contain"
/>
```

**✅ Strengths**:
- Lightweight, no dependencies needed
- Chakra UI integration (theme-aware, responsive)
- Works perfectly for static images
- Proper containment with maxW/maxH
- Centered display

**⚠️ Issues**:
1. No zoom/pan functionality for detailed inspection
2. No fullscreen mode
3. No rotation support
4. No download from within viewer (must use footer button)
5. Limited on mobile - cannot pinch-zoom
6. No landscape orientation optimization
7. No image metadata display (dimensions, file size)

**Mobile/Desktop**: Works identically on both, responsive but basic

---

### Video Viewing (Lines 196-209)
**Implementation**: Native HTML5 `<video>` element via Chakra `Box` component
```jsx
<Box
  as="video"
  controls
  maxW="100%"
  maxH="70vh"
  src={inlineUrl}
/>
```

**✅ Strengths**:
- Zero dependencies
- Native browser controls
- Works with all standard formats (mp4, webm, ogg)
- Responsive sizing

**❌ Critical Issues**:
1. **No landscape mode handling** - Video doesn't optimize for landscape orientation on mobile
2. **Basic controls only** - No playback speed, quality selection, or advanced features
3. **No fullscreen API integration** - Uses browser's basic fullscreen (poor UX)
4. **No custom styling** - Controls don't match app theme/branding
5. **No picture-in-picture support**
6. **No keyboard shortcuts** (space to play/pause, arrow keys for seek)
7. **No loading states** - Just shows blank until video loads
8. **No error handling** - If video fails to load, shows nothing
9. **No subtitles/captions support**
10. **No playback quality indicator**
11. **Poor mobile experience**:
    - Small controls difficult to tap (< 44px touch targets)
    - No gesture support (swipe to seek, pinch to zoom)
    - No auto-rotate to landscape for fullscreen
12. **No thumbnail preview on seek**
13. **Volume controls not optimized for mobile** (many devices have fixed volume)

**Mobile Testing Notes**:
- Controls are too small on phones (< 36px)
- No rotation lock handling
- Cannot force landscape mode for better viewing
- No tap-to-play/pause on video area
- Scrubbing timeline is difficult with small touch target

**Desktop Testing Notes**:
- Works but very basic
- No hover preview on timeline
- No keyboard shortcuts beyond browser defaults

---

### Audio Viewing (Lines 211-218)
**Implementation**: Native HTML5 `<audio>` element
```jsx
<Box as="audio" controls w="100%" src={inlineUrl} />
```

**Status**: Basic but adequate for audio files. Audio doesn't require the same rich experience as video.

---

## Responsive Design Issues

### Modal Size
- Fixed `size='xl'` (line 51)
- Not responsive to viewport - could be too large on mobile or too small on desktop for media
- No dynamic sizing based on content aspect ratio

### Height Constraints
- Hardcoded `maxH="70vh"` (line 28, 188, 204)
- Doesn't account for mobile browser chrome (URL bar, bottom nav)
- Actual visible height often < 50vh on mobile
- No landscape orientation optimization

### Orientation Detection
- Basic mobile detection only checks width `window.innerWidth <= 768` (line 66)
- No orientation API usage
- Doesn't detect landscape mode on mobile devices
- Video should go fullscreen or maximize in landscape

---

## Recommendations

### Option 1: Keep Native + Add Enhancements ⭐ **RECOMMENDED**

**Why**: Matches project's philosophy of minimal dependencies, lightweight approach

**Enhancements Needed**:

#### For Images:
1. **Add react-medium-image-zoom** (`~5kb gzipped`)
   - Enables click-to-zoom with smooth animations
   - Chakra UI compatible (uses portals)
   - Works on mobile (pinch-zoom)
   - Example: `<ControlledZoom><Image /></ControlledZoom>`

2. **Add rotation controls** (custom implementation)
   - Simple CSS transform rotation
   - 3 buttons: Rotate left, Rotate right, Reset
   - < 50 lines of code

3. **Add fullscreen API**
   - Use browser's Fullscreen API
   - Add fullscreen button
   - < 30 lines of code

#### For Video:
1. **Custom Video Player Component** (build in-house)
   - Use HTML5 `<video>` as base
   - Add custom Chakra UI controls overlay
   - Implement keyboard shortcuts
   - Add loading/error states
   - Estimated: ~200-300 lines of code

2. **Landscape optimization**
   - Detect orientation with Screen Orientation API
   - Auto-suggest fullscreen on landscape
   - Optimize controls for landscape mode

3. **Features to implement**:
   - Play/pause with spacebar and click on video
   - Seek with arrow keys (5s) and mouse/touch drag
   - Volume control (up/down arrows, scrollwheel)
   - Fullscreen toggle (F key)
   - Playback speed selector (0.5x, 1x, 1.25x, 1.5x, 2x)
   - Loading spinner overlay
   - Error message display
   - Time display (current / total)
   - Progress bar with hover preview
   - Mobile: tap zones (left = -10s, right = +10s)
   - Mobile: swipe up/down for volume (if not locked)

**Pros**:
- Total bundle size impact: ~10-15kb
- Full control over UX
- Chakra UI integration
- Match app design system
- Works offline
- No license concerns

**Cons**:
- More development time (~2-3 days for video player)
- Need to maintain custom code
- Testing required for all browsers

**Code Estimate**:
- Custom video player: 300 lines
- Image zoom integration: 20 lines
- Rotation controls: 50 lines
- Fullscreen handler: 30 lines
- **Total: ~400 lines**

---

### Option 2: Use React Player Library

**Library**: `react-player` (https://github.com/cookpete/react-player)
- Size: ~60kb gzipped
- 22k+ GitHub stars
- Supports: YouTube, Vimeo, Dailymotion, SoundCloud, Facebook, file URLs

**Pros**:
- Comprehensive, battle-tested
- Handles multiple video sources
- Built-in error handling
- Responsive out of box
- Good mobile support

**Cons**:
- Larger bundle size (+60kb)
- Brings support for platforms you may not need (YouTube, Vimeo, etc.)
- Less customizable styling
- May not fully match Chakra UI theme
- Overkill for simple file playback

**Usage**:
```jsx
import ReactPlayer from 'react-player'

<ReactPlayer
  url={inlineUrl}
  controls
  width="100%"
  height="auto"
  config={{
    file: {
      attributes: {
        controlsList: 'nodownload'
      }
    }
  }}
/>
```

---

### Option 3: Use Video.js

**Library**: `video.js` + `@videojs/react`
- Size: ~250kb (very heavy)
- Industry standard video player
- Used by major platforms

**Pros**:
- Extremely feature-rich
- HLS/DASH streaming support
- Plugin ecosystem
- Accessibility built-in
- Professional-grade

**Cons**:
- **Very large bundle size** (+250kb) - NOT RECOMMENDED for this use case
- Requires separate CSS import
- Complex API
- Overkill for simple file viewing
- Harder to integrate with Chakra UI theme
- May conflict with Emotion/styled-components

**Verdict**: ❌ **Too heavy for this use case**

---

### Option 4: Use Plyr

**Library**: `plyr-react` (https://github.com/sampotts/plyr)
- Size: ~30kb gzipped
- Modern, clean UI
- HTML5 video/audio player

**Pros**:
- Beautiful default UI
- Smaller than Video.js (~30kb)
- Good mobile support
- Keyboard shortcuts built-in
- Accessible (WCAG compliant)
- Customizable via CSS

**Cons**:
- Requires CSS import (may clash with Chakra)
- Less control over styling
- Not Chakra-native
- Another dependency to maintain

**Usage**:
```jsx
import Plyr from 'plyr-react'
import 'plyr-react/plyr.css'

<Plyr
  source={{
    type: 'video',
    sources: [{ src: inlineUrl, type: 'video/mp4' }]
  }}
  options={{
    controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    fullscreen: { enabled: true, iosNative: true }
  }}
/>
```

---

## Landscape Mode Handling

### Current Issue
- No landscape detection or optimization
- Videos play in portrait modal even when device is landscape
- Poor UX for video consumption on mobile

### Recommended Solution (Works with all options)

```jsx
import { useEffect, useState } from 'react'

const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait')

  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.screen?.orientation) {
        setOrientation(window.screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait')
      } else {
        // Fallback for older browsers
        setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      }
    }

    handleOrientationChange()
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  return orientation
}

// Usage in FileViewerModal
const orientation = useOrientation()
const isLandscape = orientation === 'landscape'

// Auto-maximize video modal in landscape on mobile
useEffect(() => {
  if (isLandscape && isMobile && detectedType === 'video') {
    // Request fullscreen or maximize modal
  }
}, [isLandscape, isMobile, detectedType])
```

---

## Final Recommendation: **Option 1 - Enhanced Native**

### Implementation Plan

#### Phase 1: Image Improvements (1 day)
1. Install `react-medium-image-zoom`: `npm install react-medium-image-zoom`
2. Wrap Image component with zoom
3. Add rotation controls (custom)
4. Add fullscreen button

#### Phase 2: Custom Video Player (2-3 days)
1. Create `CustomVideoPlayer.jsx` component
2. Implement core controls (play, pause, seek, volume)
3. Add keyboard shortcuts
4. Style with Chakra UI components
5. Add loading/error states
6. Mobile optimizations (tap zones, gesture controls)

#### Phase 3: Landscape & Responsive (1 day)
1. Create `useOrientation` hook
2. Add landscape detection logic
3. Optimize modal sizing for orientation
4. Add fullscreen suggestions on landscape

#### Phase 4: Touch Gestures (Optional - 1 day)
1. Add swipe to seek on video
2. Add pinch-to-zoom on video (like images)
3. Add double-tap to jump (left = -10s, right = +10s)

### Total Effort: 4-6 days
### Bundle Impact: +10-15kb
### Maintenance: Low (fully custom, no external player to update)

---

## Chakra UI Integration Checklist

✅ All custom components should use:
- `useColorModeValue` for dark mode support
- Chakra's `Box`, `IconButton`, `Slider`, etc.
- Theme tokens for colors, spacing, borders
- Responsive props (`display={{ base, md, lg }}`)
- Framer Motion for animations (already in dependencies)

✅ Accessibility:
- All controls must have `aria-label`
- Keyboard navigation must work
- Focus indicators must be visible
- Touch targets must be ≥ 44x44px
- Screen reader announcements for state changes

---

## Browser Compatibility Notes

### HTML5 Video Support
- Chrome/Edge: ✅ Full support (mp4, webm, ogg)
- Firefox: ✅ Full support
- Safari: ✅ mp4, limited webm
- Mobile Safari: ✅ With limitations (inline playback requires `playsinline` attr)
- Android Chrome: ✅ Full support

### Orientation API Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari 16.4+: ✅ Full support
- Older Safari: ⚠️ Use resize fallback

### Fullscreen API Support
- All modern browsers: ✅ Supported
- iOS Safari: ⚠️ Limited (native fullscreen only for video)

---

## Summary

**Current State**: ❌ Basic native HTML5 video/image display, not production-ready for media-focused app

**Recommended Path**: ✅ **Option 1 - Enhanced Native Implementation**
- Minimal bundle impact
- Full Chakra UI integration
- Complete control over UX
- Mobile-optimized with landscape support
- ~5 days development time
- Low ongoing maintenance

**Alternative**: If timeline is tight, use **Plyr** (~30kb) as temporary solution, then replace with custom implementation later.

**NOT Recommended**: Video.js (too heavy), React Player (unnecessary features), keeping current basic implementation (poor UX).
