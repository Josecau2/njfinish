import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import { Box, Button, HStack, useColorModeValue } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, X } from '@/icons-lucide'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

// Configure pdf.js worker explicitly for Vite - FORCE override
if (pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
}

const MobilePdfViewer = ({ fileUrl, onClose }) => {
  const { t } = useTranslation()
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [containerWidth, setContainerWidth] = useState(Math.max(window.innerWidth - 40, 280))
  // Dynamic theming for overlay and header; fall back to dark shades in both modes
  const overlayBg = useColorModeValue('rgba(0,0,0,0.88)', 'rgba(0,0,0,0.92)')
  const headerBg = useColorModeValue('rgba(0,0,0,0.85)', 'rgba(10,10,10,0.9)')
  const surfaceBg = useColorModeValue('#1f1f1f', '#222')

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      // Use window width minus padding (20px on each side)
      // Minimum 280px for mobile readability
      setContainerWidth(Math.max(window.innerWidth - 40, 280))
    }

    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Memoize file descriptor to prevent unnecessary reloads
  const documentFile = useMemo(() => ({
    url: fileUrl,
    withCredentials: true,
  }), [fileUrl])

  const onLoadSuccess = useCallback(({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages)
    setIsLoading(false)
    setError(null)
  }, [])

  const onLoadError = useCallback((err) => {
    console.error('PDF load error:', err)
    console.error('PDF URL:', fileUrl)
    setError(`Failed to load PDF: ${err?.message || 'Unknown error'}`)
    setIsLoading(false)
  }, [fileUrl])

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1))
  }, [numPages])

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={overlayBg}
      display="flex"
      flexDirection="column"
      zIndex={10000}
    >
      {/* Mobile Header Controls */}
      <HStack
        justify="space-between"
        align="center"
        p={2}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        color="white"
        fontSize="sm"
      >
        <HStack spacing={3}>
          {numPages > 1 && (
            <>
              <Button
                onClick={goToPrevPage}
                isDisabled={pageNumber <= 1}
                size="md"
                colorScheme={pageNumber <= 1 ? 'gray' : 'blue'}
                minW="44px"
                h="44px"
                aria-label={t('common.ariaLabels.previousPage', 'Previous page')}
              >
                <ChevronLeft />
              </Button>
              <Box minW="60px" textAlign="center" fontWeight="medium">
                {pageNumber} / {numPages}
              </Box>
              <Button
                onClick={goToNextPage}
                isDisabled={pageNumber >= numPages}
                size="md"
                colorScheme={pageNumber >= numPages ? 'gray' : 'blue'}
                minW="44px"
                h="44px"
                aria-label={t('common.ariaLabels.nextPage', 'Next page')}
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </HStack>

        <Button
          onClick={onClose}
          size="md"
          colorScheme="red"
          leftIcon={<X />}
          minW="44px"
          h="44px"
          fontWeight="bold"
        >
          Close
        </Button>
      </HStack>

      {/* PDF Content */}
      <Box
        flex={1}
        bg={surfaceBg}
        overflow="hidden"
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit={true}
          wheel={{ disabled: false }}
          pinch={{ disabled: false }}
          doubleClick={{ disabled: false, mode: 'zoomIn', step: 0.5 }}
          panning={{ disabled: false }}
        >
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
              display: 'flex',
              // Center horizontally & allow vertical scroll start near top
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '10px',
              overflow: 'auto'
            }}
            contentStyle={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '10px',
              // Prevent content from hugging left on certain transforms
              margin: '0 auto'
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
                onLoadSuccess={onLoadSuccess}
                onLoadError={onLoadError}
                loading={
                  <Box color="white" p={5}>
                    Loading PDF...
                  </Box>
                }
                error={
                  <Box color="#dc3545" p={5}>
                    {error || 'Failed to load PDF document'}
                  </Box>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <Box color="white" p={5}>
                      Loading page...
                    </Box>
                  }
                  error={
                    <Box color="#dc3545" p={5}>
                      Failed to load page
                    </Box>
                  }
                />
              </Document>
            </Box>
          </TransformComponent>
        </TransformWrapper>
      </Box>
    </Box>
  )
}

export default MobilePdfViewer
