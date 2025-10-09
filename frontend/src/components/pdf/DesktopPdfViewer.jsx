import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageInputValue, setPageInputValue] = useState('1')
  const transformRef = useRef(null)

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
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevPage()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNextPage()
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

          {/* Zoom Controls */}
          <HStack spacing={2} ml={5}>
            <Text color={textColor} fontSize="sm" minW="80px" textAlign="center">
              Zoom: {Math.round(currentScale * 100)}%
            </Text>
            <Text color="gray.500" fontSize="xs">
              (use mouse wheel)
            </Text>
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
        flex={1}
        p={5}
        sx={{
          overflow: 'auto',
          overflowY: 'scroll',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
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
        }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          wheel={{ step: 0.1 }}
          pinch={{ disabled: false }}
          doubleClick={{ mode: 'zoomIn' }}
          onTransformed={(ref) => setCurrentScale(ref.state.scale)}
        >
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
            contentStyle={{
              display: 'inline-block',
            }}
          >
            <Box textAlign="center">
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
              >
                <Page
                  pageNumber={pageNumber}
                  scale={1.5}
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
        Keyboard shortcuts: ← → (navigate pages) | Mouse wheel or pinch (zoom) | ESC (close)
      </Box>
    </Box>
    </>
  )
}

export default DesktopPdfViewer
