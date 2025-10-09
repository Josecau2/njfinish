import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { Global, css } from '@emotion/react'

// Import CSS for text and annotation layers
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure pdf.js worker explicitly - FORCE override
if (pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
}

const DesktopPdfViewer = ({ fileUrl, onClose }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [committedScale, setCommittedScale] = useState(1.2) // applied to <Page/>
  const [displayScale, setDisplayScale] = useState(1.2)     // instant CSS-feedback
  const zoomDebounceRef = useRef(null)
  const lastZoomTsRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageInputValue, setPageInputValue] = useState('1')
  const scrollContainerRef = React.useRef(null)

  const bgOverlay = useColorModeValue('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)')
  const bgHeader = useColorModeValue('rgba(0, 0, 0, 0.8)', 'rgba(10, 10, 10, 0.9)')
  const borderColor = useColorModeValue('#333', '#444')
  const textColor = useColorModeValue('white', 'gray.100')
  const inputBg = useColorModeValue('#222', '#1a1a1a')
  const inputBorder = useColorModeValue('#555', '#666')

  // Build file descriptor for react-pdf with auth headers when available
  const documentFile = useMemo(() => ({
    url: fileUrl,
    withCredentials: true,
  }), [fileUrl])

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error) => {
    console.error('Error loading PDF:', error)
    console.error('PDF URL:', fileUrl)
    setError(`Failed to load PDF document: ${error.message || 'Unknown error'}`)
    setLoading(false)
  }, [fileUrl])

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => {
      const newPage = Math.max(1, prev - 1)
      setPageInputValue(String(newPage))
      return newPage
    })
  }, [])

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => {
      const newPage = Math.min(numPages || 1, prev + 1)
      setPageInputValue(String(newPage))
      return newPage
    })
  }, [numPages])

  // New center-anchor + debounced zoom system
  const anchorRef = useRef(null)
  const recordAnchor = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    anchorRef.current = { mid: el.scrollTop + el.clientHeight / 2, prevScale: committedScale }
  }, [committedScale])
  const applyAnchorAfterCommit = useCallback((nextScale) => {
    const el = scrollContainerRef.current
    if (!el || !anchorRef.current) return
    const { mid, prevScale } = anchorRef.current
    const ratio = nextScale / prevScale
    let targetScrollTop = (mid * ratio) - el.clientHeight / 2
    if (targetScrollTop < 0) targetScrollTop = 0
    const maxScroll = el.scrollHeight - el.clientHeight
    if (targetScrollTop > maxScroll) targetScrollTop = maxScroll
    el.scrollTop = targetScrollTop
    anchorRef.current = null
  }, [])
  const clampScale = useCallback(v => Math.min(3, Math.max(0.5, v)), [])
  const scheduleCommit = useCallback((target) => {
    if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current)
    zoomDebounceRef.current = setTimeout(() => {
      setCommittedScale(prev => {
        if (prev === target) return prev
        requestAnimationFrame(() => applyAnchorAfterCommit(target))
        return target
      })
    }, 140)
  }, [applyAnchorAfterCommit])
  const applyDisplayScale = useCallback((next) => {
    setDisplayScale(next)
    scheduleCommit(next)
  }, [scheduleCommit])
  const changeScale = useCallback((delta, absolute = false) => {
    recordAnchor()
    setDisplayScale(prev => {
      const base = absolute ? delta : prev + delta
      const next = clampScale(base)
      applyDisplayScale(next)
      return next
    })
    lastZoomTsRef.current = Date.now()
  }, [recordAnchor, clampScale, applyDisplayScale])
  const zoomIn = useCallback(() => changeScale(0.25), [changeScale])
  const zoomOut = useCallback(() => changeScale(-0.25), [changeScale])
  const resetZoom = useCallback(() => changeScale(1.2, true), [changeScale])

  const handlePageInputChange = (e) => {
    setPageInputValue(e.target.value)
  }

  const handlePageInputBlur = () => {
    const value = parseInt(pageInputValue)
    if (value && value >= 1 && value <= numPages) {
      setPageNumber(value)
    } else {
      setPageInputValue(String(pageNumber))
    }
  }

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  const handleKeyDown = useCallback((e) => {
    // Don't interfere if user is typing in an input
    if (e.target.tagName === 'INPUT') return
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        goToPrevPage()
        break
      case 'ArrowRight':
        e.preventDefault()
        goToNextPage()
        break
      case 'ArrowUp':
        // Scroll up in the container
        if (scrollContainerRef.current) {
          e.preventDefault()
          scrollContainerRef.current.scrollBy({ top: -50, behavior: 'smooth' })
        }
        break
      case 'ArrowDown':
        // Scroll down in the container
        if (scrollContainerRef.current) {
          e.preventDefault()
          scrollContainerRef.current.scrollBy({ top: 50, behavior: 'smooth' })
        }
        break
      case 'PageUp':
        // Page up scrolling
        if (scrollContainerRef.current) {
          e.preventDefault()
          scrollContainerRef.current.scrollBy({ 
            top: -scrollContainerRef.current.clientHeight * 0.9, 
            behavior: 'smooth' 
          })
        }
        break
      case 'PageDown':
        // Page down scrolling
        if (scrollContainerRef.current) {
          e.preventDefault()
          scrollContainerRef.current.scrollBy({ 
            top: scrollContainerRef.current.clientHeight * 0.9, 
            behavior: 'smooth' 
          })
        }
        break
      case 'Home':
        // Scroll to top
        if (scrollContainerRef.current) {
          e.preventDefault()
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
        break
      case 'End':
        // Scroll to bottom
        if (scrollContainerRef.current) {
          e.preventDefault()
          scrollContainerRef.current.scrollTo({ 
            top: scrollContainerRef.current.scrollHeight, 
            behavior: 'smooth' 
          })
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case '+':
      case '=':
        e.preventDefault()
        zoomIn()
        break
      case '-':
        e.preventDefault()
        zoomOut()
        break
      case '0':
        e.preventDefault()
        resetZoom()
        break
    }
  }, [goToPrevPage, goToNextPage, onClose, zoomIn, zoomOut, resetZoom])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    setPageInputValue(String(pageNumber))
  }, [pageNumber])

  // Keep displayScale aligned if committedScale changes externally
    useEffect(() => { setDisplayScale(committedScale) }, [committedScale])

    // Pinch gesture support (mobile/tablet)
    useEffect(() => {
      const el = scrollContainerRef.current
      if (!el) return

      let pinchStartDist = null
      let pinchStartScale = null
      let pinchAnchor = null // { mid, prevScale }
      let pinchActive = false
      let pinchCommitTimeout = null

      const distance = (t1, t2) => {
        const dx = t2.clientX - t1.clientX
        const dy = t2.clientY - t1.clientY
        return Math.hypot(dx, dy)
      }

      const getMidpoint = (t1, t2) => ({
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      })

      const onTouchStart = (e) => {
        if (e.touches.length === 2) {
          pinchActive = true
          pinchStartDist = distance(e.touches[0], e.touches[1])
          pinchStartScale = displayScale
          const mid = getMidpoint(e.touches[0], e.touches[1])
          // Compute content midpoint relative to scroll container for anchoring
          const rect = el.getBoundingClientRect()
          const contentMidY = el.scrollTop + (mid.y - rect.top)
          pinchAnchor = { mid: contentMidY, prevScale: committedScale }
          if (pinchCommitTimeout) { clearTimeout(pinchCommitTimeout); pinchCommitTimeout = null }
        }
      }

      const onTouchMove = (e) => {
        if (!pinchActive || e.touches.length !== 2 || !pinchStartDist) return
        e.preventDefault()
        const dist = distance(e.touches[0], e.touches[1])
        const scaleFactor = dist / pinchStartDist
        const next = clampScale(pinchStartScale * scaleFactor)
        setDisplayScale(next)
        // Do not schedule commit yet; we commit after gesture ends (debounced)
      }

      const finishPinchCommit = () => {
        const target = displayScale
        setCommittedScale(prev => {
          if (prev === target) return prev
          // Apply anchor based on pinchAnchor
          requestAnimationFrame(() => {
            if (pinchAnchor) {
              const el2 = scrollContainerRef.current
              if (el2) {
                const ratio = target / pinchAnchor.prevScale
                let targetScrollTop = (pinchAnchor.mid * ratio) - el2.clientHeight / 2
                if (targetScrollTop < 0) targetScrollTop = 0
                const maxScroll = el2.scrollHeight - el2.clientHeight
                if (targetScrollTop > maxScroll) targetScrollTop = maxScroll
                el2.scrollTop = targetScrollTop
              }
            }
            pinchAnchor = null
          })
          return target
        })
      }

      const onTouchEnd = (e) => {
        if (pinchActive && e.touches.length < 2) {
          pinchActive = false
          pinchStartDist = null
          pinchStartScale = null
          // Debounce commit slightly in case fingers re-engage quickly
          pinchCommitTimeout = setTimeout(finishPinchCommit, 120)
        }
      }

      el.addEventListener('touchstart', onTouchStart, { passive: false })
      el.addEventListener('touchmove', onTouchMove, { passive: false })
      el.addEventListener('touchend', onTouchEnd, { passive: true })
      el.addEventListener('touchcancel', onTouchEnd, { passive: true })
      return () => {
        el.removeEventListener('touchstart', onTouchStart)
        el.removeEventListener('touchmove', onTouchMove)
        el.removeEventListener('touchend', onTouchEnd)
        el.removeEventListener('touchcancel', onTouchEnd)
        if (pinchCommitTimeout) clearTimeout(pinchCommitTimeout)
      }
    }, [displayScale, committedScale, clampScale])

  // Config: tune fallback scroll feel
  const FALLBACK_SCROLL_SPEED = 2.2   // Multiplier applied when native scroll blocked
  const INERTIA_DECAY = 0.085         // Higher -> stops sooner (0.08 - 0.12 reasonable)
  const MIN_VELOCITY = 0.25           // Stop threshold

  // Inertial wheel fallback that animates when native scroll is blocked
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    let animating = false
    let velocity = 0

    const step = () => {
      if (Math.abs(velocity) < MIN_VELOCITY) {
        animating = false
        velocity = 0
        return
      }
      el.scrollTop += velocity
      velocity *= (1 - INERTIA_DECAY)
      requestAnimationFrame(step)
    }

    const ensureAnim = () => {
      if (!animating) {
        animating = true
        requestAnimationFrame(step)
      }
    }

    const wheelListener = (e) => {
      if (e.defaultPrevented) return
      const startTop = el.scrollTop
      // Allow native first
      requestAnimationFrame(() => {
        const afterTop = el.scrollTop
        if (afterTop === startTop) {
          // Native did not move – apply accelerated velocity-based scroll
            // Accumulate velocity (clamp to avoid runaway)
          velocity += e.deltaY * FALLBACK_SCROLL_SPEED
          if (velocity > 200) velocity = 200
          if (velocity < -200) velocity = -200
          ensureAnim()
        }
      })
    }

    el.addEventListener('wheel', wheelListener, { passive: false })
    return () => {
      el.removeEventListener('wheel', wheelListener, { passive: false })
    }
  }, [committedScale])

  return (
    <>
      <Global
        styles={css`
          /* Ensure react-pdf elements don't block mouse events */
          .react-pdf-document,
          .react-pdf-page,
          .react-pdf__Document,
          .react-pdf__Page,
          .react-pdf__Page__canvas,
          .react-pdf__Page__textContent,
          .react-pdf__Page__annotations {
            pointer-events: auto !important;
          }
          
          /* Ensure the canvas is not blocking scroll */
          .react-pdf__Page__canvas {
            display: block;
            user-select: none;
          }
        `}
      />
      <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={bgOverlay}
      display="flex"
      flexDirection="column"
      zIndex={1500}
    >
      {/* Header Controls */}
      <HStack
        justify="space-between"
        px={5}
        py={3}
        bg={bgHeader}
        borderBottom={`1px solid ${borderColor}`}
      >
        <HStack spacing={4}>
          {/* Page Navigation */}
          <HStack spacing={2}>
            <Button
              onClick={goToPrevPage}
              isDisabled={pageNumber <= 1}
              size="sm"
              colorScheme={pageNumber <= 1 ? 'gray' : 'blue'}
              minH="36px"
            >
              ← Prev
            </Button>

            <Text color={textColor} fontSize="sm">
              Page
            </Text>

            <Input
              type="number"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              min={1}
              max={numPages || 1}
              w="60px"
              size="sm"
              bg={inputBg}
              borderColor={inputBorder}
              color={textColor}
              textAlign="center"
              _focus={{ borderColor: 'blue.400' }}
            />

            <Text color={textColor} fontSize="sm">
              of {numPages || 0}
            </Text>

            <Button
              onClick={goToNextPage}
              isDisabled={pageNumber >= (numPages || 1)}
              size="sm"
              colorScheme={pageNumber >= (numPages || 1) ? 'gray' : 'blue'}
              minH="36px"
            >
              Next →
            </Button>
          </HStack>

          {/* Zoom Controls */}
          <HStack spacing={2} ml={5}>
            <Button
              onClick={zoomOut}
              isDisabled={displayScale <= 0.5}
              size="sm"
              colorScheme={displayScale <= 0.5 ? 'gray' : 'green'}
              minH="36px"
            >
              -
            </Button>

            <Text color={textColor} fontSize="sm" minW="60px" textAlign="center">
              {Math.round(displayScale * 100)}%
            </Text>

            <Button
              onClick={zoomIn}
              isDisabled={displayScale >= 3}
              size="sm"
              colorScheme={displayScale >= 3 ? 'gray' : 'green'}
              minH="36px"
            >
              +
            </Button>

            <Button
              onClick={resetZoom}
              size="sm"
              colorScheme="gray"
              minH="36px"
            >
              Reset
            </Button>
          </HStack>
        </HStack>

        {/* Close Button */}
        <Button
          onClick={onClose}
          size="sm"
          colorScheme="red"
          minH="36px"
        >
          ✕ Close
        </Button>
      </HStack>

      {/* PDF Content Area */}
      <Box
        ref={scrollContainerRef}
        flex={1}
        p={5}
        tabIndex={0}
        onMouseEnter={(e) => e.currentTarget.focus()}
        sx={{
          overflow: 'auto',
          overflowY: 'scroll',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
          '&:focus': {
            outline: 'none',
          },
          '&::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.5)',
            },
          },
          // CRITICAL: Ensure all child elements don't block pointer events
          '& *': {
            pointerEvents: 'auto',
          },
        }}
      >
        <Box 
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          minHeight="max-content"
          width="100%"
        >
          <Box 
            textAlign="center"
            sx={{
              // Ensure the PDF container doesn't block events
              pointerEvents: 'auto',
            }}
          >
            {/* Force worker override right before Document render */}
            {(() => {
              if (pdfjs?.GlobalWorkerOptions) {
                pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
              }
              return null
            })()}
            <Document
              file={documentFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <Text color={textColor} p={5}>
                  Loading PDF document...
                </Text>
              }
              error={
                <Text color="red.400" p={5}>
                  {error || 'Failed to load PDF document'}
                </Text>
              }
              className="react-pdf-document"
            >
              <Box
                style={{
                  display: 'inline-block',
                  transform: `scale(${displayScale / committedScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={committedScale}
                  loading={
                    <Text color={textColor} p={5}>
                      Loading page...
                    </Text>
                  }
                  error={
                    <Text color="red.400" p={5}>
                      Failed to load page
                    </Text>
                  }
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="react-pdf-page"
                />
              </Box>
            </Document>
          </Box>
        </Box>
      </Box>

      {/* Footer with keyboard shortcuts */}
      <Box
        px={5}
        py={2}
        bg={bgHeader}
        borderTop={`1px solid ${borderColor}`}
        fontSize="xs"
        color="gray.500"
        textAlign="center"
      >
        Keyboard shortcuts: ← → (navigate) | ↑ ↓ Page Up/Down Home/End (scroll) | + - 0 (zoom) | ESC (close)
      </Box>
    </Box>
    </>
  )
}

export default DesktopPdfViewer
