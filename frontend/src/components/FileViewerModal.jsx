import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Icon,
  Image,
  Spinner,
  Text,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { Download, File, Link2Off } from '@/icons-lucide'
import Lightbox from 'yet-another-react-lightbox'
import { Zoom, Video, Fullscreen } from 'yet-another-react-lightbox/plugins'
import 'yet-another-react-lightbox/styles.css'
import axiosInstance from '../helpers/axiosInstance'
import NeutralModal from './NeutralModal'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'

const Editor = lazy(() => import('@monaco-editor/react'))
const ReactXmlViewer = lazy(() => import('react-xml-viewer'))
const MobilePdfViewer = lazy(() => import('./pdf/MobilePdfViewer'))
const DesktopPdfViewer = lazy(() => import('./pdf/DesktopPdfViewer'))

const FALLBACK_HEIGHT = '70vh'

const getExtensionType = (fileName, fallbackType = 'other') => {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  if (!ext) return fallbackType
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
  if (ext === 'xml') return 'xml'
  if (['csv', 'xlsx', 'xls'].includes(ext)) return 'spreadsheet'
  if (['txt', 'md', 'json', 'js', 'css', 'html', 'sql'].includes(ext)) return 'text'
  return fallbackType
}

export default function FileViewerModal({
  visible,
  isOpen,
  file,
  onClose,
  resolveFileUrl,
  onDownload,
  title,
  size = 'xl',
}) {
  const { t } = useTranslation()

  // Color mode values
  const iconBlue500 = useColorModeValue('blue.500', 'blue.300')
  const iconGray400 = useColorModeValue('gray.400', 'gray.500')
  const [textContent, setTextContent] = useState('')
  const [xmlContent, setXmlContent] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const modalVisible = (typeof visible === 'boolean' ? visible : undefined) ?? Boolean(isOpen)

  useEffect(() => {
    const updateMobileState = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth <= 768)
    }

    updateMobileState()
    window.addEventListener('resize', updateMobileState)
    return () => window.removeEventListener('resize', updateMobileState)
  }, [])

  const metadataType = useMemo(() => {
    if (!file) return 'other'
    const typeField = (file.fileType || file.type || '').toString().toLowerCase()
    if (['image', 'video', 'audio', 'pdf', 'spreadsheet', 'document'].includes(typeField)) {
      return typeField
    }
    const mime = (file.mimeType || '').toLowerCase()
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime === 'application/pdf') return 'pdf'
    return 'other'
  }, [file])

  const detectedType = useMemo(() => {
    if (!file) return 'other'
    if (metadataType === 'document') {
      return getExtensionType(file.name, 'text')
    }
    const extType = getExtensionType(file.name, metadataType)
    return extType === 'other' ? metadataType : extType
  }, [file, metadataType])

  const inlineUrl = useMemo(() => {
    if (!file) return null
    if (typeof resolveFileUrl === 'function') {
      return resolveFileUrl(file, 'inline')
    }
    return file.url || null
  }, [file, resolveFileUrl])

  useEffect(() => {
    const loadFileContent = async () => {
      if (!modalVisible || !file) return
      if (!['text', 'xml'].includes(detectedType)) {
        setTextContent('')
        setXmlContent('')
        return
      }

      try {
        const url =
          typeof resolveFileUrl === 'function' ? resolveFileUrl(file, 'inline') : file?.url || ''
        if (!url) return

        const response = await axiosInstance.get(url, { responseType: 'blob' })
        const blob = response.data

        if (detectedType === 'xml') {
          const text = await blob.text()
          setXmlContent(text)
          setTextContent('')
        } else {
          const text = await blob.text()
          setTextContent(text)
          setXmlContent('')
        }
      } catch (err) {
        console.error('Failed to load file content:', err)
        setTextContent('')
        setXmlContent('')
      }
    }

    loadFileContent()
  }, [modalVisible, file, resolveFileUrl, detectedType])

  useEffect(() => {
    if (!modalVisible) {
      setTextContent('')
      setXmlContent('')
    }
  }, [modalVisible])

  const handleDownload = () => {
    if (!file) return
    if (typeof onDownload === 'function') {
      onDownload(file)
      return
    }
    const url = typeof resolveFileUrl === 'function' ? resolveFileUrl(file) : file?.url
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener')
    }
  }

  const renderBody = () => {
    if (!file) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>No file selected.</AlertDescription>
        </Alert>
      )
    }

    if (!inlineUrl && ['image', 'video', 'audio', 'pdf'].includes(detectedType)) {
      return (
        <Alert status="warning" borderRadius="md">
          <HStack spacing={4} align="center">
            <Icon as={Link2Off} boxSize={ICON_BOX_MD} />
            <Text>{t('fileViewer.errors.previewUnavailable', 'Preview unavailable. Try downloading the file.')}</Text>
          </HStack>
        </Alert>
      )
    }

    if (detectedType === 'image') {
      return (
        <Box textAlign="center">
          <Image
            src={inlineUrl || ''}
            alt={file?.name || 'preview'}
            maxW="100%"
            maxH={FALLBACK_HEIGHT}
            mx="auto"
            objectFit="contain"
          />
        </Box>
      )
    }

    if (detectedType === 'video') {
      return (
        <Box textAlign="center">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <Box
            as="video"
            controls
            maxW="100%"
            maxH={FALLBACK_HEIGHT}
            src={inlineUrl || ''}
          />
        </Box>
      )
    }

    if (detectedType === 'audio') {
      return (
        <Box>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <Box as="audio" controls w="100%" src={inlineUrl || ''} />
        </Box>
      )
    }

    if (detectedType === 'pdf') {
      if (!inlineUrl) {
        return (
          <Alert status="warning" borderRadius="md">
            <HStack spacing={4} align="center">
              <Icon as={Link2Off} boxSize={ICON_BOX_MD} />
              <Text>{t('fileViewer.errors.pdfUnavailable', 'PDF preview unavailable. Try downloading the file.')}</Text>
            </HStack>
          </Alert>
        )
      }

      const fallback = (
        <Center h="400px">
          <Spinner />
        </Center>
      )

      return (
        <Suspense fallback={fallback}>
          {isMobile ? (
            <MobilePdfViewer fileUrl={inlineUrl} onClose={onClose} />
          ) : (
            <DesktopPdfViewer fileUrl={inlineUrl} onClose={onClose} />
          )}
        </Suspense>
      )
    }

    if (detectedType === 'text') {
      if (!textContent) {
        return (
          <Center h={FALLBACK_HEIGHT}>
            <Spinner color={iconBlue500} />
          </Center>
        )
      }

      const fallback = (
        <Center h="100%">
          <Spinner />
        </Center>
      )

      return (
        <Box h={FALLBACK_HEIGHT} overflow="auto">
          <Suspense fallback={fallback}>
            <Editor
              height="100%"
              language="plaintext"
              value={textContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </Suspense>
        </Box>
      )
    }

    if (detectedType === 'xml') {
      if (!xmlContent) {
        return (
          <Center h={FALLBACK_HEIGHT}>
            <Spinner color={iconBlue500} />
          </Center>
        )
      }

      const fallback = (
        <Center h="100%">
          <Spinner />
        </Center>
      )

      return (
        <Box h={FALLBACK_HEIGHT} overflow="auto">
          <Suspense fallback={fallback}>
            <ReactXmlViewer xml={xmlContent} />
          </Suspense>
        </Box>
      )
    }

    if (detectedType === 'spreadsheet') {
      return (
        <VStack spacing={4} py={4} textAlign="center">
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              Spreadsheet preview is not available. Please download to view this file.
            </AlertDescription>
          </Alert>
          <Button colorScheme="brand" onClick={handleDownload} leftIcon={<Icon as={Download} />}>
            Download
          </Button>
        </VStack>
      )
    }

    return (
      <VStack spacing={4} py={4} textAlign="center">
        <Icon as={File} boxSize={12} color={iconGray400} />
        <Text>Preview is not available for this file type.</Text>
        <Button colorScheme="brand" onClick={handleDownload} leftIcon={<Icon as={Download} />}>
          Download
        </Button>
      </VStack>
    )
  }

  // Use Lightbox for images and videos
  if (modalVisible && (detectedType === 'image' || detectedType === 'video') && inlineUrl) {
    const slides = []

    if (detectedType === 'image') {
      slides.push({
        src: inlineUrl,
        alt: file?.name || 'preview',
      })
    } else if (detectedType === 'video') {
      slides.push({
        type: 'video',
        width: 1920,
        height: 1080,
        sources: [
          {
            src: inlineUrl,
            type: file?.mimeType || 'video/mp4',
          },
        ],
      })
    }

    const bgColor = useColorModeValue('rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)')
    const buttonColor = useColorModeValue('#ffffff', '#ffffff')

    return (
      <Lightbox
        open={modalVisible}
        close={onClose}
        slides={slides}
        plugins={[Zoom, Video, Fullscreen]}
        video={{
          controls: true,
          autoPlay: false,
          muted: false,
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        animation={{ fade: 300, swipe: 250 }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullDown: true,
          closeOnPullUp: true,
        }}
        styles={{
          container: {
            backgroundColor: bgColor,
          },
          button: {
            color: buttonColor,
          },
        }}
        toolbar={{
          buttons: [
            <Button
              key="download"
              size="sm"
              colorScheme="brand"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              leftIcon={<Icon as={Download} />}
              position="absolute"
              top={4}
              right={16}
              zIndex={10}
            >
              Download
            </Button>,
            'close',
          ],
        }}
      />
    )
  }

  // PDF viewers use fullscreen overlay without modal wrapper (both desktop and mobile)
  if (modalVisible && detectedType === 'pdf' && inlineUrl) {
    return renderBody()
  }

  return (
    <NeutralModal
      visible={modalVisible}
      onClose={onClose}
      size={size}
      className='file-viewer-modal'
      title={title || file?.name || 'Preview'}
      footer={
        <>
          <Button
            colorScheme='brand'
            onClick={handleDownload}
            isDisabled={!file}
            leftIcon={<Icon as={Download} />}
            mr={3}
          >
            Download
          </Button>
          <Button variant='outline' colorScheme='gray' onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {renderBody()}
    </NeutralModal>
  )
}
