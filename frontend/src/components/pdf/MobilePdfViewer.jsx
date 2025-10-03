import React, { useCallback, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import { Box, Center, Spinner, Text, VStack, useColorModeValue } from '@chakra-ui/react'
import { getFreshestToken } from '../../utils/authToken'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const MobilePdfViewer = ({ fileUrl }) => {

  // Color mode values
  const iconRed500 = useColorModeValue('red.500', 'red.300')
  const [numPages, setNumPages] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const token = getFreshestToken()

  const onLoadSuccess = useCallback(({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages)
    setIsLoading(false)
  }, [])

  const onLoadError = useCallback((err) => {
    console.error('PDF load error:', err)
    setError(err?.message || 'Unable to load PDF.')
    setIsLoading(false)
  }, [])

  return (
    <VStack spacing={4} align="stretch">
      <Text fontWeight="semibold" textAlign="center">
        PDF Preview
      </Text>
      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        {isLoading && (
          <Center py={12}>
            <Spinner />
          </Center>
        )}
        {error && (
          <Center py={12}>
            <Text fontSize="sm" color={iconRed500}>
              {error}
            </Text>
          </Center>
        )}
        {!error && (
          <Document
            file={{ url: fileUrl, httpHeaders: { Authorization: token ? `Bearer ${token}` : undefined } }}
            loading={null}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            error={null}
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            ))}
          </Document>
        )}
      </Box>
    </VStack>
  )
}

export default MobilePdfViewer
