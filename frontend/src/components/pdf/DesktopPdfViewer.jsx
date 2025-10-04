import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import { getFreshestToken } from '../../utils/authToken'
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'

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
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageInputValue, setPageInputValue] = useState('1')

  const bgOverlay = useColorModeValue('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)')
  const bgHeader = useColorModeValue('rgba(0, 0, 0, 0.8)', 'rgba(10, 10, 10, 0.9)')
  const borderColor = useColorModeValue('#333', '#444')
  const textColor = useColorModeValue('white', 'gray.100')
  const inputBg = useColorModeValue('#222', '#1a1a1a')
  const inputBorder = useColorModeValue('#555', '#666')

  // Build file descriptor for react-pdf with auth headers when available
  const documentFile = useMemo(() => {
    const token = getFreshestToken()
    if (token) {
      return {
        url: fileUrl,
        httpHeaders: { Authorization: `Bearer ${token}` },
        withCredentials: false,
      }
    }
    return { url: fileUrl }
  }, [fileUrl])

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

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1.2)
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

  const handleKeyDown = useCallback((e) => {
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

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={bgOverlay}
      display="flex"
      flexDirection="column"
      zIndex={10000}
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
              isDisabled={scale <= 0.5}
              size="sm"
              colorScheme={scale <= 0.5 ? 'gray' : 'green'}
              minH="36px"
            >
              -
            </Button>

            <Text color={textColor} fontSize="sm" minW="60px" textAlign="center">
              {Math.round(scale * 100)}%
            </Text>

            <Button
              onClick={zoomIn}
              isDisabled={scale >= 3}
              size="sm"
              colorScheme={scale >= 3 ? 'gray' : 'green'}
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
        flex={1}
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
        p={5}
        overflow="auto"
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
              scale={scale}
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
        Keyboard shortcuts: ← → (navigate) | + - 0 (zoom) | ESC (close)
      </Box>
    </Box>
  )
}

export default DesktopPdfViewer
