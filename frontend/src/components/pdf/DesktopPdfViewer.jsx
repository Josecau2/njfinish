import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
// Use pdfjs-dist worker directly so API and worker stay aligned without custom bundling
const pdfWorkerModuleUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { Global, css } from '@emotion/react'
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch'

// Import CSS for text and annotation layers
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure pdf.js worker explicitly for Vite
if (pdfjs?.GlobalWorkerOptions) {
  if (typeof window !== 'undefined' && 'Worker' in window) {
    try {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(pdfWorkerModuleUrl, { type: 'module' })
    } catch (_) {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerModuleUrl.toString()
    }
  } else {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerModuleUrl.toString()
  }
}

const DesktopPdfViewer = ({ fileUrl, onClose }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageInputValue, setPageInputValue] = useState('1')
  const transformRef = useRef(null)
  const scrollContainerRef = useRef(null)

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

  const [currentScale, setCurrentScale] = useState(1)
  const [containerWidth, setContainerWidth] = useState(null)
  const containerRef = useRef(null)

  // Calculate container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Get the available width minus padding (20px on each side = 40px total)
        const availableWidth = containerRef.current.offsetWidth - 40
        // Use at least 300px width for readability
        setContainerWidth(Math.max(availableWidth, 300))
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

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

  // Simple keyboard navigation for pages and close
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere if user is typing in an input
      if (e.target.tagName === 'INPUT') return

      const scrollContainer = scrollContainerRef.current

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
          e.preventDefault()
          if (scrollContainer) {
            scrollContainer.scrollBy({ top: -50, behavior: 'smooth' })
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (scrollContainer) {
            scrollContainer.scrollBy({ top: 50, behavior: 'smooth' })
          }
          break
        case 'PageUp':
          e.preventDefault()
          if (scrollContainer) {
            scrollContainer.scrollBy({
              top: -scrollContainer.clientHeight * 0.9,
              behavior: 'smooth'
            })
          }
          break
        case 'PageDown':
          e.preventDefault()
          if (scrollContainer) {
            scrollContainer.scrollBy({
              top: scrollContainer.clientHeight * 0.9,
              behavior: 'smooth'
            })
          }
          break
        case 'Home':
          e.preventDefault()
          if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
          }
          break
        case 'End':
          e.preventDefault()
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            })
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevPage, goToNextPage, onClose])

  useEffect(() => {
    setPageInputValue(String(pageNumber))
  }, [pageNumber])

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
      <Box flex={1} position="relative">
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          wheel={{
            step: 0.05,
            activationKeys: ["Shift"]
          }}
          panning={{
            disabled: true
          }}
          pinch={{ disabled: false }}
          doubleClick={{ mode: 'zoomIn' }}
          onTransformed={(ref) => setCurrentScale(ref.state.scale)}
          alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
        >
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
            <>
              {/* Zoom Controls inside TransformWrapper context */}
              <Box
                position="absolute"
                top={4}
                right={4}
                zIndex={10}
                bg="rgba(0, 0, 0, 0.7)"
                borderRadius="md"
                p={2}
              >
                <HStack spacing={2}>
                  <Button
                    onClick={() => zoomOut()}
                    size="sm"
                    colorScheme="green"
                    minH="36px"
                  >
                    -
                  </Button>

                  <Text color="white" fontSize="sm" minW="60px" textAlign="center">
                    {Math.round(currentScale * 100)}%
                  </Text>

                  <Button
                    onClick={() => zoomIn()}
                    size="sm"
                    colorScheme="green"
                    minH="36px"
                  >
                    +
                  </Button>

                  <Button
                    onClick={() => resetTransform()}
                    size="sm"
                    colorScheme="gray"
                    minH="36px"
                  >
                    Reset
                  </Button>
                </HStack>
              </Box>

              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  overflow: 'auto'
                }}
                wrapperProps={{
                  ref: (el) => {
                    scrollContainerRef.current = el
                    containerRef.current = el
                  }
                }}
                contentStyle={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  paddingTop: '10px',
                  paddingBottom: '20px',
                  paddingLeft: '20px',
                  paddingRight: '20px'
                }}
              >
            <Box textAlign="center">
              {/* Ensure worker options are set before Document render (idempotent) */}
              {(() => {
                if (pdfjs?.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerPort && !pdfjs.GlobalWorkerOptions.workerSrc) {
                  if (typeof window !== 'undefined' && 'Worker' in window) {
                    try {
                      pdfjs.GlobalWorkerOptions.workerPort = new Worker(pdfWorkerModuleUrl, { type: 'module' })
                    } catch (_) {
                      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerModuleUrl.toString()
                    }
                  } else {
                    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerModuleUrl.toString()
                  }
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
              >
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth || undefined}
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
                />
              </Document>
            </Box>
          </TransformComponent>
            </>
          )}
        </TransformWrapper>
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
        Shortcuts: ← → (pages) | ↑ ↓ (scroll) | Page Up/Down | Home/End | Shift + Scroll (zoom) | +/- buttons | ESC (close)
      </Box>
    </Box>
    </>
  )
}

export default DesktopPdfViewer
