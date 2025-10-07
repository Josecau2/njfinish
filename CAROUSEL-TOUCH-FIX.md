# Mobile Carousel Touch Improvements

## Problem
The manufacturer style comparison carousel in the proposal creation/edit sections had poor touch responsiveness on mobile devices:
- Swiping would jump the entire carousel to the end instead of smooth scrolling
- No visual feedback during touch interaction
- Imprecise touch controls made it difficult to browse styles
- Empty space could appear when scrolling past the last items

## Solution
Enhanced the touch handling implementation with:

### 1. **Live Drag Tracking**
- Added real-time finger tracking that follows the user's swipe
- The carousel now moves smoothly with the user's finger during drag
- Visual feedback shows immediate response to touch input

### 2. **Smart Boundary Control**
- Strict boundaries prevent scrolling beyond the first/last items
- Strong resistance (80% reduction) applied when trying to drag past limits
- Prevents empty space from appearing at either end of the carousel
- Automatic snapping to exact start/end positions

### 3. **Page-Based Navigation**
- Changed from single-item scrolling to page-based scrolling
- Each swipe advances by one full page (2-6 items depending on screen size)
- More intuitive navigation with better content visibility
- Prevents overshooting: snaps to exact end if advance would exceed bounds

### 4. **Smooth Transitions**
- Transitions are disabled during active dragging for immediate response
- Re-enabled after release for smooth snap-to-position animation
- Uses `transform` transitions for hardware-accelerated performance

### 5. **Touch Action Optimization**
- Added `touchAction: 'pan-y'` to allow vertical page scrolling while capturing horizontal swipes
- Disabled text selection during drag to prevent UI glitches
- Proper cleanup of touch states on release

### 6. **Precise Width Calculation**
- Changed width calculation from `Math.ceil()` to exact ratio
- Formula: `(stylesMeta.length / itemsPerPage) * 100%`
- Ensures carousel container is exactly sized to fit all items without gaps
- Prevents empty space rendering at the end

## Changes Made

### Files Modified:
1. **`frontend/src/components/ItemSelectionContent.jsx`** (Create Proposal)
2. **`frontend/src/components/ItemSelectionContentEdit.jsx`** (Edit Proposal)

### New State Variables:
```javascript
const [isDragging, setIsDragging] = useState(false)
const [dragOffset, setDragOffset] = useState(0)
const [transitionEnabled, setTransitionEnabled] = useState(true)
const carouselRef = useRef(null)
```

### Enhanced Touch Handlers:

#### `onTouchStart`
- Initializes drag state
- Disables CSS transitions for immediate feedback
- Captures starting touch position

#### `onTouchMove`
- Calculates real-time drag offset
- Applies boundary resistance algorithm
- Updates carousel position dynamically

#### `onTouchEnd`
- Determines if swipe threshold was met
- Advances/retreats by one page if threshold exceeded
- Re-enables transitions for smooth snap
- Resets all touch states

### Updated Navigation:
- Changed `nextSlide` to advance by `itemsPerPage` instead of 1
- Changed `prevSlide` to retreat by `itemsPerPage` instead of 1
- Both desktop button navigation and mobile swipe use same page-based logic

### Carousel Rendering:
```jsx
<Box
  ref={carouselRef}
  transform={{
    base: isDragging
      ? `translateX(calc(-${carouselCurrentIndex * (100 / itemsPerPage)}% + ${dragOffset}px))`
      : `translateX(-${carouselCurrentIndex * (100 / itemsPerPage)}%)`,
    md: 'none'
  }}
  transition={transitionEnabled ? 'transform 0.3s ease-out' : 'none'}
  style={{
    touchAction: 'pan-y',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  }}
  onTouchStart={onTouchStart}
  onTouchMove={onTouchMove}
  onTouchEnd={onTouchEnd}
>
```

## Testing Recommendations

### Mobile Testing:
1. Test on various mobile devices (iOS/Android)
2. Verify smooth drag tracking
3. Test boundary resistance at carousel edges
4. Confirm swipe threshold detection
5. Verify vertical scrolling still works

### Desktop Testing:
1. Confirm arrow button navigation still works
2. Verify no regression in desktop carousel behavior
3. Test responsive breakpoints (2/4/5/6 items per page)

### Edge Cases:
- Very slow swipes (should snap back if under threshold)
- Very fast swipes (should advance one page only)
- Rapid successive swipes
- Mixed touch and button navigation
- Switching between portrait/landscape on mobile

## Performance
- Hardware-accelerated CSS transforms
- `startTransition` used for state updates to prevent UI blocking
- Minimal re-renders through careful state management
- Touch events properly cleaned up on unmount

## Browser Compatibility
- Modern browsers with touch event support
- Fallback behavior for devices without touch (button navigation)
- `-webkit-` prefixes included for older Safari versions

## Date
October 6, 2025
