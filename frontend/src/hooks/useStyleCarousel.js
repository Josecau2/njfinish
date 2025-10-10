import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

/**
 * Custom hook for style carousel with touch swipe, keyboard navigation, and responsive breakpoints
 * Replaces custom carousel implementation with battle-tested Embla Carousel
 *
 * Features:
 * - Touch swipe gestures on mobile/tablet
 * - Keyboard navigation (arrow keys, home/end)
 * - Responsive breakpoints (disable on desktop, enable on mobile)
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Auto-adjusts to style count changes
 *
 * @param {Array} stylesMeta - Array of style objects to display
 * @returns {Object} Carousel state and controls
 */
export function useStyleCarousel(stylesMeta = []) {
  // Initialize Embla with options
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: true, // Enable free scrolling for smoother multi-item view
    slidesToScroll: 3, // Scroll 3 items at a time when using buttons
    // Responsive breakpoints - disable carousel on desktop (768px+)
    breakpoints: {
      '(min-width: 768px)': {
        active: false, // Desktop uses grid layout instead
      },
    },
  });

  // Navigation state
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Scroll to previous slide
  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
    }
  }, [emblaApi]);

  // Scroll to next slide
  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
    }
  }, [emblaApi]);

  // Scroll to specific index
  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) {
        emblaApi.scrollTo(index);
      }
    },
    [emblaApi]
  );

  // Update navigation state
  const onSelect = useCallback((emblaApi) => {
    if (!emblaApi) return;

    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  // Initialize and subscribe to events
  useEffect(() => {
    if (!emblaApi) return;

    // Initial state
    onSelect(emblaApi);

    // Subscribe to events
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);

    // Cleanup
    return () => {
      emblaApi.off('reInit', onSelect);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Re-initialize when styles change
  useEffect(() => {
    if (emblaApi && stylesMeta.length > 0) {
      emblaApi.reInit();
    }
  }, [emblaApi, stylesMeta.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!emblaApi) return;

    const handleKeyDown = (event) => {
      // Only handle keyboard events when carousel is active (mobile/tablet)
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      if (isDesktop) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          scrollPrev();
          break;
        case 'ArrowRight':
          event.preventDefault();
          scrollNext();
          break;
        case 'Home':
          event.preventDefault();
          scrollTo(0);
          break;
        case 'End':
          event.preventDefault();
          scrollTo(emblaApi.scrollSnapList().length - 1);
          break;
        default:
          break;
      }
    };

    // Add keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [emblaApi, scrollPrev, scrollNext, scrollTo]);

  return {
    emblaRef,
    emblaApi,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedIndex,
  };
}
