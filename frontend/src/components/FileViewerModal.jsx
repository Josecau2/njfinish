import React, { useEffect, useMemo, useState } from 'react'
import { CButton, CAlert, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilFile, cilLinkBroken } from '@coreui/icons'
import axiosInstance from '../helpers/axiosInstance'
import Editor from '@monaco-editor/react'
import ReactXmlViewer from 'react-xml-viewer'
import MobilePdfViewer from './pdf/MobilePdfViewer'
import DesktopPdfViewer from './pdf/DesktopPdfViewer'
import NeutralModal from './NeutralModal'

// Reusable file viewer modal for images, videos, audio, and PDFs.
// Props:
// - visible: boolean
// - file: { id, name, url?, fileType?, type?, mimeType? }
// - onClose: () => void
// - resolveFileUrl?: (file, mode?) => string | null  // e.g., Resources.resolveFileUrl
// - onDownload?: (file) => void                      // optional custom download handler
// - title?: string                                   // optional modal title override
// - size?: 'sm'|'lg'|'xl'                            // optional modal size
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
  // Spreadsheet preview removed to drop xlsx dependency
  const [xmlContent, setXmlContent] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Set mobile state on mount and window resize
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    updateMobileState()
    window.addEventListener('resize', updateMobileState)

    return () => window.removeEventListener('resize', updateMobileState)
  }, [])

  const fileType = useMemo(() => {
    if (!file) return 'other'

    // First try the explicit file type fields
    const t = (file?.fileType || file?.type || '').toString().toLowerCase()
    if (['image', 'video', 'audio', 'pdf', 'spreadsheet', 'document'].includes(t)) return t

    // Then try to infer from mime type
    const mime = (file?.mimeType || '').toLowerCase()
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime === 'application/pdf') return 'pdf'

    // Finally, try to detect from file extension
    if (file.name) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') return 'pdf'
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
      if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return 'video'
      if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
      if (['csv', 'xlsx', 'xls'].includes(ext)) return 'spreadsheet'
      if (['txt', 'md', 'json', 'js', 'css', 'html', 'sql'].includes(ext)) return 'document'
    }

    return 'other'
  }, [file])

  const inlineUrl = useMemo(() => {
    if (!file) return null
    if (typeof resolveFileUrl === 'function') {
      return resolveFileUrl(file, 'inline')
    }
    return file.url || null
  }, [file, resolveFileUrl])

  const handleDownload = () => {
    if (!file) return
    if (typeof onDownload === 'function') {
      onDownload(file)
      return
    }
    // fallback: open raw/secured download url in new tab
    const url = typeof resolveFileUrl === 'function' ? resolveFileUrl(file) : file?.url
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener')
    }
  }

  // Helper to detect file type from extension and content
  const getFileTypeFromExtension = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (['xml'].includes(ext)) return 'xml'
    if (['csv', 'xlsx', 'xls'].includes(ext)) return 'spreadsheet'
    if (ext === 'pdf') return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
    if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
    if (['txt', 'md', 'json', 'js', 'css', 'html', 'sql'].includes(ext) || fileType === 'document') return 'text'
    return 'other'
  }

  // Load file content for text and XML files
  useEffect(() => {
    const loadFileContent = async () => {
      if (!visible || !file || !['text', 'xml'].includes(getFileTypeFromExtension(file.name))) return

      try {
        const url = typeof resolveFileUrl === 'function' ? resolveFileUrl(file, 'inline') : (file?.url || '')
        if (!url) return

        const response = await axiosInstance.get(url, { responseType: 'blob' })
        const blob = response.data

        const fileExt = getFileTypeFromExtension(file.name)

        if (fileExt === 'xml') {
          const text = await blob.text()
          setXmlContent(text)
        } else if (fileExt === 'text') {
          const text = await blob.text()
          setTextContent(text)
        }
      } catch (err) {
        console.error('Failed to load file content:', err)
      }
    }

    loadFileContent()
  }, [visible, file, resolveFileUrl])

  const renderBody = () => {
    if (!file) return null

    // Use the consistent fileType instead of separate detection
    const detectedType = fileType

    if (!inlineUrl && ['image', 'video', 'audio', 'pdf'].includes(detectedType)) {
      return (
        <CAlert color="warning" className="mb-0 d-flex align-items-center gap-2">
          <CIcon icon={cilLinkBroken} />
          <span>Preview unavailable. Try downloading the file.</span>
        </CAlert>
      )
    }

    if (detectedType === 'image') {
      return (
        <div className="text-center">
          <img
            src={inlineUrl}
            alt={file?.name}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>
      )
    }

    if (detectedType === 'video') {
      return (
        <div className="text-center">
          <video
            controls
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            src={inlineUrl}
          />
        </div>
      )
    }

    if (detectedType === 'audio') {
      return (
        <div>
          <audio controls style={{ width: '100%' }} src={inlineUrl} />
        </div>
      )
    }

    if (detectedType === 'pdf') {
      console.log('PDF detected, file:', file);
      console.log('Inline URL:', inlineUrl);
      console.log('Is mobile:', isMobile);

      if (!inlineUrl) {
        console.error('No PDF URL available for file:', file);
        return (
          <CAlert color="warning" className="mb-0 d-flex align-items-center gap-2">
            <CIcon icon={cilLinkBroken} />
            <span>PDF preview unavailable. Try downloading the file.</span>
          </CAlert>
        )
      }

      // Render appropriate PDF viewer based on device type
      if (isMobile) {
        return <MobilePdfViewer fileUrl={inlineUrl} onClose={onClose} />
      } else {
        return <DesktopPdfViewer fileUrl={inlineUrl} onClose={onClose} />
      }
    }

    if (detectedType === 'text') {
      return textContent ? (
        <div style={{ height: '70vh', overflow: 'auto' }}>
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
        </div>
      ) : (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
          <CSpinner color="primary" />
        </div>
      )
    }

    if (detectedType === 'xml') {
      return xmlContent ? (
        <div style={{ height: '70vh', overflow: 'auto' }}>
          <ReactXmlViewer xml={xmlContent} />
        </div>
      ) : (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
          <CSpinner color="primary" />
        </div>
      )
    }

    if (detectedType === 'spreadsheet') {
      return (
        <div className="text-center p-4">
          <CAlert color="info" className="mb-3">
            Spreadsheet preview is not available. Please download to view this file.
          </CAlert>
          <CButton color="primary" onClick={handleDownload}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Download
          </CButton>
        </div>
      )
    }

    // Fallback for other docs
    return (
      <div className="text-center p-4">
        <CIcon icon={cilFile} size="4xl" className="mb-3 text-muted" />
        <p className="mb-3">Preview is not available for this file type.</p>
        <CButton color="primary" onClick={handleDownload}>
          <CIcon icon={cilCloudDownload} className="me-2" />
          Download
        </CButton>
      </div>
    )
  }

  // For PDF files, the dedicated viewers handle their own modals
  if (visible && fileType === 'pdf' && inlineUrl) {
    return renderBody()
  }

  return (
    <NeutralModal
      visible={visible}
      onClose={onClose}
      size={size}
      className="file-viewer-modal"
      title={title || file?.name || 'Preview'}
      footer={
        <>
          <CButton color="primary" onClick={handleDownload} disabled={!file}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Download
          </CButton>
          <CButton color="secondary" onClick={onClose}>Close</CButton>
        </>
      }
    >
      {renderBody()}
    </NeutralModal>
  )
}
