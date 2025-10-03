import React, { useCallback, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import {
  Box,
  Center,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getFreshestToken } from '../../utils/authToken'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const DesktopPdfViewer = ({ fileUrl, onClose }) => {
  const { t } = useTranslation()

  // Color mode values
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const iconRed500 = useColorModeValue('red.500', 'red.300')
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const token = getFreshestToken()

  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages)
    setPageNumber(1)
    setIsLoading(false)
  }, [])

  const onDocumentLoadError = useCallback((err) => {
    console.error('PDF load error:', err)
    setError(err?.message || 'Unable to load PDF.')
    setIsLoading(false)
  }, [])

  const canGoBack = pageNumber > 1
  const canGoForward = numPages ? pageNumber < numPages : false

  return (
    <VStack spacing={4} align="stretch" h="full">
      <HStack justify="space-between">
        <Text fontWeight="semibold">{t('pdf.preview')}</Text>
        <Button variant="ghost" size="sm" onClick={onClose} minH="44px">
          {t('pdf.close')}
        </Button>
      </HStack>

      <HStack spacing={4} justify="center">
        <IconButton
          minW="44px"
          minH="44px"
          aria-label={t('pdf.zoomOut')}
          icon={<ZoomOut size={ICON_SIZE_MD} />}
          size="sm"
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
        />
        <Text fontSize="sm" w="60px" textAlign="center">
          {(scale * 100).toFixed(0)}%
        </Text>
        <IconButton
          minW="44px"
          minH="44px"
          aria-label={t('pdf.zoomIn')}
          icon={<ZoomIn size={ICON_SIZE_MD} />}
          size="sm"
          onClick={() => setScale((prev) => Math.min(2, prev + 0.1))}
        />
      </HStack>

      <Box flex="1" borderWidth="1px" borderRadius="md" bg={bgGray50} overflow="auto" p={4}>
        {isLoading && !error && (
          <Center h="full" py={8}>
            <Spinner />
          </Center>
        )}
        {error && (
          <Center py={8}>
            <Text color={iconRed500} fontSize="sm">
              {error}
            </Text>
          </Center>
        )}
        {!error && (
          <Document
            file={{ url: fileUrl, httpHeaders: { Authorization: token ? `Bearer ${token}` : undefined } }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            error={null}
          >
            <Page pageNumber={pageNumber} scale={scale} renderAnnotationLayer={false} renderTextLayer={false} />
          </Document>
        )}
      </Box>

      <HStack justify="center" spacing={4}>
        <IconButton
          minW="44px"
          minH="44px"
          aria-label={t('pdf.previousPage')}
          icon={<ChevronLeft size={ICON_SIZE_MD} />}
          size="sm"
          onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
          isDisabled={!canGoBack}
        />
        <Text fontSize="sm">
          {pageNumber} / {numPages || '--'}
        </Text>
        <IconButton
          minW="44px"
          minH="44px"
          aria-label={t('pdf.nextPage')}
          icon={<ChevronRight size={ICON_SIZE_MD} />}
          size="sm"
          onClick={() => setPageNumber((prev) => Math.min(numPages || prev, prev + 1))}
          isDisabled={!canGoForward}
        />
      </HStack>
    </VStack>
  )
}

export default DesktopPdfViewer
