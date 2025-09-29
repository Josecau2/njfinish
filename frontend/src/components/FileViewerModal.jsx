import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import { Alert, AlertIcon, Spinner, Icon, Button } from '@chakra-ui/react'
import { Download, File, LinkBroken } from 'lucide-react'
import axiosInstance from '../helpers/axiosInstance'
import NeutralModal from './NeutralModal'

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
  file,
  onClose,
  resolveFileUrl,
  onDownload,
  title,
  size = 'xl',
}) {
  const [textContent, setTextContent] = useState('')
  const [xmlContent, setXmlContent] = useState('')
  const [isMobile, setIsMobile] = useState(false)

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
      if (!visible || !file) return
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
  }, [visible, file, resolveFileUrl, detectedType])

  useEffect(() => {
    if (!visible) {
      setTextContent('')
      setXmlContent('')
    }
  }, [visible])

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
        <Alert status='info'>
          <AlertIcon />
          No file selected.
        </Alert>
      )
    }

    if (!inlineUrl && ['image', 'video', 'audio', 'pdf'].includes(detectedType)) {
      return (
        <Alert status='warning' className='mb-0 d-flex align-items-center gap-2'>
          <AlertIcon as={LinkBroken} />
          <span>Preview unavailable. Try downloading the file.</span>
        </Alert>
      )
    }

    if (detectedType === 'image') {
      return (
        <div className='text-center'>
          <img
            src={inlineUrl || ''}
            alt={file?.name || 'preview'}
            style={{ maxWidth: '100%', maxHeight: FALLBACK_HEIGHT, objectFit: 'contain' }}
          />
        </div>
      )
    }

    if (detectedType === 'video') {
      return (
        <div className='text-center'>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video controls style={{ maxWidth: '100%', maxHeight: FALLBACK_HEIGHT }} src={inlineUrl || ''} />
        </div>
      )
    }

    if (detectedType === 'audio') {
      return (
        <div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls style={{ width: '100%' }} src={inlineUrl || ''} />
        </div>
      )
    }

    if (detectedType === 'pdf') {
      if (!inlineUrl) {
        return (
          <Alert status='warning' className='mb-0 d-flex align-items-center gap-2'>
            <AlertIcon as={LinkBroken} />
            <span>PDF preview unavailable. Try downloading the file.</span>
          </Alert>
        )
      }

      const fallback = (
        <div className='d-flex justify-content-center align-items-center' style={{ height: '400px' }}>
          <Spinner />
        </div>
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
          <div className='d-flex justify-content-center align-items-center' style={{ height: FALLBACK_HEIGHT }}>
            <Spinner color='blue.500' />
          </div>
        )
      }

      const fallback = (
        <div className='d-flex justify-content-center align-items-center' style={{ height: '100%' }}>
          <Spinner />
        </div>
      )

      return (
        <div style={{ height: FALLBACK_HEIGHT, overflow: 'auto' }}>
          <Suspense fallback={fallback}>
            <Editor
              height='100%'
              language='plaintext'
              value={textContent}
              theme='vs-dark'
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </Suspense>
        </div>
      )
    }

    if (detectedType === 'xml') {
      if (!xmlContent) {
        return (
          <div className='d-flex justify-content-center align-items-center' style={{ height: FALLBACK_HEIGHT }}>
            <Spinner color='blue.500' />
          </div>
        )
      }

      const fallback = (
        <div className='d-flex justify-content-center align-items-center' style={{ height: '100%' }}>
          <Spinner />
        </div>
      )

      return (
        <div style={{ height: FALLBACK_HEIGHT, overflow: 'auto' }}>
          <Suspense fallback={fallback}>
            <ReactXmlViewer xml={xmlContent} />
          </Suspense>
        </div>
      )
    }

    if (detectedType === 'spreadsheet') {
      return (
        <div className='text-center p-4'>
          <Alert status='info' className='mb-3'>
            Spreadsheet preview is not available. Please download to view this file.
          </Alert>
          <Button colorScheme='brand' onClick={handleDownload} leftIcon={<Icon as={Download} />}>Download</Button>
        </div>
      )
    }

    return (
      <div className='text-center p-4'>
        <Icon as={File} size='48px' className='mb-3 text-muted' />
        <p className='mb-3'>Preview is not available for this file type.</p>
        <Button colorScheme='brand' onClick={handleDownload} leftIcon={<Icon as={Download} />}>Download</Button>
      </div>
    )
  }

  if (visible && detectedType === 'pdf' && inlineUrl) {
    return renderBody()
  }

  return (
    <NeutralModal
      visible={visible}
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
