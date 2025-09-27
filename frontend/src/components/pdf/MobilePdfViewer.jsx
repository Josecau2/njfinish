import React from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
// Use the worker that comes bundled with react-pdf (matches the pdfjs version)
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url'
import { getFreshestToken } from '../../utils/authToken'

// Configure pdf.js worker explicitly for Vite - FORCE override
if (pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
}

export default function MobilePdfViewer({ fileUrl, onClose }) {
  const [numPages, setNumPages] = React.useState(null)
  const [pageNumber, setPageNumber] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  const documentFile = React.useMemo(() => {
    const token = getFreshestToken();
    if (token) {
      return {
        url: fileUrl,
        httpHeaders: { Authorization: `Bearer ${token}` },
        withCredentials: false,
      };
    }
    return { url: fileUrl };
  }, [fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error)
    console.error('PDF URL:', fileUrl)
    setError(`Failed to load PDF: ${error.message || 'Unknown error'}`)
    setLoading(false)
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1))

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10000
    }}>
      {/* Mobile Header Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderBottom: '1px solid #333',
        color: 'white',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {numPages > 1 && (
            <>
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                style={{
                  padding: '4px 8px',
                  backgroundColor: pageNumber <= 1 ? '#444' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ←
              </button>
              <span style={{ minWidth: '60px', textAlign: 'center' }}>
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                style={{
                  padding: '4px 8px',
                  backgroundColor: pageNumber >= numPages ? '#444' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer'
                }}
              >
                →
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* PDF Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
        overflow: 'auto',
        backgroundColor: '#2a2a2a'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '100%' }}>
          {/* Force worker override right before Document render */}
          {(() => {
            if (pdfjs?.GlobalWorkerOptions) {
              pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
            }
            return null;
          })()}
          <Document
            file={documentFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div style={{ color: 'white', padding: '20px' }}>
                Loading PDF...
              </div>
            }
            error={
              <div style={{ color: '#dc3545', padding: '20px' }}>
                {error || 'Failed to load PDF document'}
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={Math.min(window.innerWidth - 20, 800)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div style={{ color: 'white', padding: '20px' }}>
                  Loading page...
                </div>
              }
              error={
                <div style={{ color: '#dc3545', padding: '20px' }}>
                  Failed to load page
                </div>
              }
            />
          </Document>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
