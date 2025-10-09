import { useEffect, useRef, useState } from 'react'

/**
 * Lightweight scroll-based virtualization helper.
 *
 * Keeps track of the scrollable container height/offset and returns
 * the visible slice boundaries plus spacer sizes so large lists can render
 * only the visible rows while preserving scroll height.
 */
const useVirtualizedList = ({
  itemCount,
  estimateSize = 300,
  overscan = 6,
  enabled = false,
}) => {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const container = containerRef.current
    if (!container) return undefined

    const handleScroll = () => {
      const next = container.scrollTop || 0
      setScrollTop((prev) => (prev === next ? prev : next))
    }

    const measureViewport = () => {
      const next = container.clientHeight || 0
      setViewport((prev) => (prev === next ? prev : next))
    }

    measureViewport()
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', measureViewport)

    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureViewport)
      resizeObserver.observe(container)
    }

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', measureViewport)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [enabled, itemCount])

  useEffect(() => {
    if (!enabled) {
      setScrollTop(0)
      setViewport(0)
    }
  }, [enabled, itemCount])

  if (!enabled || itemCount <= 0) {
    return {
      containerRef,
      startIndex: 0,
      endIndex: itemCount,
      paddingTop: 0,
      paddingBottom: 0,
      enabled: false,
    }
  }

  const safeEstimate = Math.max(estimateSize, 1)
  const safeOverscan = Math.max(overscan, 0)
  const effectiveViewport = viewport || safeEstimate
  const visibleCount = Math.ceil(effectiveViewport / safeEstimate) + safeOverscan * 2
  const startIndex = Math.max(Math.floor((scrollTop || 0) / safeEstimate) - safeOverscan, 0)
  const endIndex = Math.min(itemCount, startIndex + visibleCount)
  const paddingTop = startIndex * safeEstimate
  const paddingBottom = Math.max(itemCount - endIndex, 0) * safeEstimate

  return {
    containerRef,
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
    enabled: true,
  }
}

export default useVirtualizedList
