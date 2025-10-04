# Media Viewer Library Recommendations - 2025
**Date**: 2025-10-04
**For**: Resources Page Media Viewer Enhancement

---

## 🎯 Best Solution: **Yet Another React Lightbox** + **react-player**

### Package 1: Yet Another React Lightbox
**GitHub**: https://github.com/igordanchenko/yet-another-react-lightbox
**NPM**: `yet-another-react-lightbox`
**Bundle Size**: 16.3 KB (minified + gzipped) - **VERY LIGHTWEIGHT!**
**Latest Version**: 3.25.0 (actively maintained)

#### ✅ Why This is Perfect for Your Project:

1. **Images AND Videos in One Library**
   - Core library handles images
   - Optional Video plugin for video support
   - Unified UI for both media types

2. **Extremely Lightweight**
   - Core: 16.3 KB gzipped
   - Lite version: 4.6 KB (if you only need basics)
   - Plugins are optional - only bundle what you need

3. **Plugin Architecture** (Pay only for what you use)
   - `yet-another-react-lightbox/plugins/zoom` - Image zoom
   - `yet-another-react-lightbox/plugins/video` - Video support
   - `yet-another-react-lightbox/plugins/fullscreen` - Fullscreen mode
   - `yet-another-react-lightbox/plugins/thumbnails` - Thumbnail navigation
   - `yet-another-react-lightbox/plugins/captions` - Captions support

4. **Built-in Features**
   - ✅ Keyboard navigation (arrows, ESC, etc.)
   - ✅ Touch/swipe gestures on mobile
   - ✅ Responsive images with automatic resolution switching
   - ✅ Preloading optimization
   - ✅ TypeScript definitions
   - ✅ React 19 compatible
   - ✅ Dark mode support
   - ✅ Customizable UI

5. **Mobile & Landscape Optimized**
   - Fully responsive out of the box
   - Touch gestures (swipe, pinch-zoom)
   - Auto-adapts to orientation changes
   - Works in landscape mode perfectly

6. **Chakra UI Compatible**
   - Headless architecture - you control the styling
   - Can wrap in Chakra components
   - Uses portals (won't conflict with modals)
   - Customizable via CSS or inline styles

7. **Accessibility**
   - ARIA labels built-in
   - Keyboard navigation
   - Screen reader friendly

---

## 📦 Installation

```bash
npm install yet-another-react-lightbox
```

### Optional Plugins (install as needed):
```bash
npm install yet-another-react-lightbox
# All plugins are included in the main package, just import what you need
```

---

## 💻 Implementation Example

### Basic Setup (Images + Videos)

```jsx
import Lightbox from "yet-another-react-lightbox";
import { Zoom, Video, Fullscreen } from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/styles.css";

function ResourcesMediaViewer({ files, open, onClose, currentIndex }) {
  // Convert files to lightbox slides format
  const slides = files.map(file => {
    const isVideo = file.fileType === 'video';
    const isImage = file.fileType === 'image';

    if (isVideo) {
      return {
        type: "video",
        width: 1920,
        height: 1080,
        sources: [
          {
            src: resolveFileUrl(file),
            type: file.mimeType || "video/mp4"
          }
        ]
      };
    }

    if (isImage) {
      return {
        src: resolveFileUrl(file),
        alt: file.name,
        width: 1920,  // Optional: provide actual dimensions
        height: 1080,
      };
    }
  });

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={currentIndex}
      slides={slides}
      plugins={[Zoom, Video, Fullscreen]}

      // Keyboard shortcuts
      keyboard={{
        ArrowLeft: { action: "prev" },
        ArrowRight: { action: "next" },
        Escape: { action: "close" },
      }}

      // Video plugin config
      video={{
        controls: true,
        autoPlay: false,
        muted: false,
      }}

      // Zoom plugin config
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}

      // Animation
      animation={{ fade: 300, swipe: 250 }}

      // Controller
      controller={{
        closeOnBackdropClick: true,
        closeOnPullDown: true,  // Mobile gesture
        closeOnPullUp: true,    // Mobile gesture
      }}
    />
  );
}
```

### Integration with FileViewerModal

Replace your current FileViewerModal with this for images/videos:

```jsx
// In Resources/index.jsx

const [lightboxState, setLightboxState] = useState({
  open: false,
  index: 0,
  slides: []
});

const handleOpenMedia = (file) => {
  // Build slides array from your files
  const mediaFiles = allFiles.filter(f =>
    f.fileType === 'image' || f.fileType === 'video'
  );

  const slides = mediaFiles.map(f => ({
    type: f.fileType === 'video' ? 'video' : 'image',
    src: resolveFileUrl(f),
    sources: f.fileType === 'video' ? [{
      src: resolveFileUrl(f),
      type: f.mimeType
    }] : undefined,
  }));

  const currentIndex = mediaFiles.findIndex(f => f.id === file.id);

  setLightboxState({
    open: true,
    index: currentIndex,
    slides
  });
};

// In JSX
<Lightbox
  open={lightboxState.open}
  close={() => setLightboxState({ ...lightboxState, open: false })}
  index={lightboxState.index}
  slides={lightboxState.slides}
  plugins={[Zoom, Video, Fullscreen]}
/>
```

---

## 🎨 Chakra UI Theming Integration

You can customize the lightbox to match your Chakra theme:

```jsx
import { useColorModeValue } from '@chakra-ui/react';

function ThemedLightbox({ ...props }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Lightbox
      {...props}
      styles={{
        container: {
          backgroundColor: useColorModeValue('rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)')
        },
        button: {
          color: textColor,
          filter: useColorModeValue('none', 'invert(1)'),
        },
      }}
    />
  );
}
```

---

## 📱 Mobile & Landscape Optimization

**Built-in Mobile Features:**
- ✅ Swipe left/right to navigate between images/videos
- ✅ Pinch to zoom on images
- ✅ Pull down/up to close
- ✅ Touch-friendly controls (44px+ touch targets)
- ✅ Auto-rotates content in landscape
- ✅ Fullscreen API support (iOS included)

**Landscape Mode:**
The lightbox automatically detects orientation and optimizes the layout. No additional code needed!

---

## ⚡ Performance Optimization

```jsx
<Lightbox
  slides={slides}

  // Preload adjacent images for smooth navigation
  render={{
    slide: (props) => (
      <div {...props}>
        {/* Custom slide rendering if needed */}
      </div>
    ),
  }}

  // Lazy load images
  carousel={{
    preload: 2,  // Preload 2 images before/after current
    finite: false,  // Infinite loop
  }}
/>
```

---

## 🆚 Comparison with Custom Implementation

| Feature | Yet Another React Lightbox | Custom Build |
|---------|---------------------------|--------------|
| **Bundle Size** | 16.3 KB | ~10-15 KB |
| **Development Time** | 1-2 hours | 4-6 days |
| **Maintenance** | Library updates | You maintain |
| **Mobile Gestures** | ✅ Built-in | ❌ Need to build |
| **Video Support** | ✅ Plugin | ❌ Need to build |
| **Zoom** | ✅ Plugin | ❌ Need to build |
| **Keyboard Nav** | ✅ Built-in | ❌ Need to build |
| **Accessibility** | ✅ WCAG compliant | ⚠️ Must implement |
| **Dark Mode** | ✅ Built-in | ❌ Need to build |
| **Thumbnails** | ✅ Plugin | ❌ Need to build |
| **Fullscreen** | ✅ Plugin | ❌ Need to build |
| **Testing** | ✅ Battle-tested | ❌ Need to test all browsers |

**Verdict**: Only 5-10KB larger than custom, but saves 4-6 days of development + ongoing maintenance!

---

## 🔌 Alternative: react-player (Video Only)

If you need ONLY video playback with advanced features:

**Package**: `react-player`
**Bundle Size**: ~60 KB
**Features**: YouTube, Vimeo, file URLs, streaming (HLS/DASH)

```jsx
import ReactPlayer from 'react-player';

<ReactPlayer
  url={videoUrl}
  controls
  width="100%"
  height="auto"
  playing={false}
  config={{
    file: {
      attributes: {
        controlsList: 'nodownload',
        disablePictureInPicture: false,
      }
    }
  }}
/>
```

**Use Case**: Only if you need streaming protocol support (HLS/DASH). Otherwise, Yet Another React Lightbox's video plugin is sufficient.

---

## 📋 Final Recommendation

### ⭐ **Primary Choice: Yet Another React Lightbox**

**Pros:**
- ✅ Handles both images AND videos
- ✅ Tiny bundle (16.3 KB)
- ✅ Fully responsive & mobile-optimized
- ✅ Landscape mode works perfectly
- ✅ Chakra UI compatible
- ✅ Plugin architecture (only bundle what you need)
- ✅ Actively maintained (updated 2 months ago)
- ✅ TypeScript support
- ✅ React 19 compatible
- ✅ 1-2 hours to implement
- ✅ Battle-tested by community

**Cons:**
- Requires ~1KB CSS import
- Slightly opinionated UI (but fully customizable)

### Implementation Timeline:
- **Setup**: 30 minutes
- **Integration**: 1 hour
- **Chakra theming**: 30 minutes
- **Testing**: 30 minutes
- **Total**: ~2-3 hours

### Bundle Impact:
- Core library: **+16.3 KB**
- Video plugin: **~3 KB**
- Zoom plugin: **~2 KB**
- **Total: ~21 KB** (vs. ~10KB custom but saves 4-6 days of dev time)

---

## 🚀 Next Steps

1. Install package: `npm install yet-another-react-lightbox`
2. Replace FileViewerModal for images/videos with Lightbox component
3. Keep FileViewerModal for PDFs, text files, etc.
4. Test on mobile devices (iOS Safari, Android Chrome)
5. Test landscape orientation on mobile
6. Verify dark mode compatibility

**Ready to implement?** This is the best solution for your use case! ✨
