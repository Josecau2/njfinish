import React, { useState, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Use the worker that comes bundled with react-pdf (matches the pdfjs version)
import workerSrc from 'react-pdf/dist/pdf.worker.entry.js?url';
import { getFreshestToken } from '../../utils/authToken';

// Import CSS for text and annotation layers
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker explicitly for Vite - FORCE override
if (pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

const DesktopPdfViewer = ({ fileUrl, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Build file descriptor for react-pdf with auth headers when available
  const documentFile = useMemo(() => {
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

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('Error loading PDF:', error);
    console.error('PDF URL:', fileUrl);
    setError(`Failed to load PDF document: ${error.message || 'Unknown error'}`);
    setLoading(false);
  }, [fileUrl]);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.2);
  }, []);

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevPage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNextPage();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetZoom();
        break;
    }
  }, [goToPrevPage, goToNextPage, onClose, zoomIn, zoomOut, resetZoom]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const pageInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (value && value >= 1 && value <= numPages) {
      setPageNumber(value);
    }
  };

  return (
    <div
      className="desktop-pdf-viewer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10000
      }}
    >
      {/* Header Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Page Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              style={{
                padding: '6px 12px',
                backgroundColor: pageNumber <= 1 ? '#333' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Prev
            </button>

            <span style={{ color: 'white', fontSize: '14px' }}>
              Page
            </span>

            <input
              type="number"
              value={pageNumber}
              onChange={pageInputChange}
              min={1}
              max={numPages || 1}
              style={{
                width: '60px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#222',
                color: 'white',
                textAlign: 'center'
              }}
            />

            <span style={{ color: 'white', fontSize: '14px' }}>
              of {numPages || 0}
            </span>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
              style={{
                padding: '6px 12px',
                backgroundColor: pageNumber >= (numPages || 1) ? '#333' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pageNumber >= (numPages || 1) ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px' }}>
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              style={{
                padding: '6px 10px',
                backgroundColor: scale <= 0.5 ? '#333' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: scale <= 0.5 ? 'not-allowed' : 'pointer'
              }}
            >
              -
            </button>

            <span style={{ color: 'white', fontSize: '14px', minWidth: '60px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              style={{
                padding: '6px 10px',
                backgroundColor: scale >= 3 ? '#333' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: scale >= 3 ? 'not-allowed' : 'pointer'
              }}
            >
              +
            </button>

            <button
              onClick={resetZoom}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* PDF Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        overflow: 'auto'
      }}>
        {/* Always mount Document so it can actually load and update state */}
        <div style={{ textAlign: 'center' }}>
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
                Loading PDF document...
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
              scale={scale}
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
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>

      {/* Footer with keyboard shortcuts */}
      <div style={{
        padding: '8px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderTop: '1px solid #333',
        fontSize: '12px',
        color: '#888',
        textAlign: 'center'
      }}>
        Keyboard shortcuts: ← → (navigate) | + - 0 (zoom) | ESC (close)
      </div>
    </div>
  );
};

export default DesktopPdfViewer;
