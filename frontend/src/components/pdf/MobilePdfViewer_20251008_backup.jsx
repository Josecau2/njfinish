import React, { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import { Box, Button, HStack } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, X } from '@/icons-lucide'

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
      bg="rgba(0, 0, 0, 0.95)"
      display="flex"
      flexDirection="column"
      zIndex={10000}
    >
      {/* Mobile Header Controls */}
      <HStack
        justify="space-between"
        align="center"
        p={2}
        bg="rgba(0, 0, 0, 0.9)"
        borderBottom="1px solid"
        borderColor="#333"
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
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={2}
        overflow="auto"
        bg="#2a2a2a"
      >
        <Box textAlign="center" maxW="100%">
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
              width={Math.min(window.innerWidth - 20, 800)}
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
      </Box>
    </Box>
  )
}

export default MobilePdfViewer
