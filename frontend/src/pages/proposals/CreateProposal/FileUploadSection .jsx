import { useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CRow,
  CProgress, CAlert, CBadge, CDropdown, CDropdownToggle,
  CDropdownMenu, CDropdownItem, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload, cilFile, cilImage, cilVideo,
  cilTrash, cilEye, cilDownload, cilOptions
} from '@coreui/icons'
import Swal from 'sweetalert2'

const FileUploadSection = ({ proposalId, onFilesChange }) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewModal, setPreviewModal] = useState({ open: false, file: null })
  const fileInputRef = useRef(null)

  // Accepted file types
  const acceptedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv']
  }

  const allAcceptedTypes = [...acceptedTypes.images, ...acceptedTypes.documents, ...acceptedTypes.videos]
  const maxFileSize = 50 * 1024 * 1024 // 50MB

  const getFileType = (mimeType) => {
    if (acceptedTypes.images.includes(mimeType)) return 'image'
    if (acceptedTypes.documents.includes(mimeType)) return 'document'
    if (acceptedTypes.videos.includes(mimeType)) return 'video'
    return 'unknown'
  }

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return cilImage
      case 'video': return cilVideo
      case 'document': return cilFile
      default: return cilFile
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file) => {
    if (!allAcceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`
    }
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`
    }
    return null
  }

  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('proposalId', proposalId)
    formData.append('fileType', getFileType(file.type))

    try {
      const response = await fetch('/api/proposals/upload-file', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleFiles = useCallback(async (fileList) => {
    const validFiles = []
    const errors = []

    // Validate files
    Array.from(fileList).forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Files',
        html: errors.join('<br>'),
      })
    }

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const fileData = await uploadFile(file)
        return {
          id: fileData.id,
          name: file.name,
          size: file.size,
          type: getFileType(file.type),
          mimeType: file.type,
          url: fileData.url,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded'
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const newFiles = [...files, ...uploadedFiles]
      setFiles(newFiles)
      onFilesChange(newFiles)

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${uploadedFiles.length} file(s) uploaded successfully`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to upload files. Please try again.',
      })
    } finally {
      setUploading(false)
    }
  }, [files, proposalId, onFilesChange])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const deleteFile = async (fileId) => {
    try {
      const response = await fetch(`/api/proposals/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      const updatedFiles = files.filter(file => file.id !== fileId)
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'File has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete file. Please try again.',
      })
    }
  }

  const confirmDelete = (file) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${file.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteFile(file.id)
      }
    })
  }

  const previewFile = (file) => {
    setPreviewModal({ open: true, file })
  }

  const downloadFile = (file) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderPreview = (file) => {
    if (file.type === 'image') {
      return (
        <img
          src={file.url}
          alt={file.name}
          style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
        />
      )
    } else if (file.type === 'video') {
      return (
        <video
          controls
          style={{ maxWidth: '100%', maxHeight: '400px' }}
        >
          <source src={file.url} type={file.mimeType} />
          Your browser does not support the video tag.
        </video>
      )
    } else {
      return (
        <div className="text-center p-4">
          <CIcon icon={cilFile} size="4xl" className="mb-3" />
          <p>Document preview not available</p>
          <CButton color="primary" onClick={() => downloadFile(file)}>
            <CIcon icon={cilDownload} className="me-2" />
            Download to view
          </CButton>
        </div>
      )
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader>
          <h5 className="mb-0">File Upload</h5>
          <small className="text-muted">
            Supported: Images (JPEG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, TXT), Videos (MP4, AVI, MOV, WMV, FLV)
          </small>
        </CCardHeader>
        <CCardBody>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded p-5 text-center mb-4 ${
              dragActive ? 'border-primary bg-light' : 'border-secondary'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allAcceptedTypes.join(',')}
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            
            {uploading ? (
              <div>
                <CSpinner color="primary" className="mb-3" />
                <p className="mb-0">Uploading files...</p>
              </div>
            ) : (
              <div>
                <CIcon icon={cilCloudUpload} size="3xl" className="mb-3 text-primary" />
                <h6>Drop files here or click to browse</h6>
                <p className="text-muted mb-0">
                  Maximum file size: {formatFileSize(maxFileSize)}
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div>
              <h6 className="mb-3">Uploaded Files ({files.length})</h6>
              <CRow>
                {files.map((file) => (
                  <CCol key={file.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                    <CCard className="h-100">
                      <CCardBody className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <CBadge
                            color={
                              file.type === 'image' ? 'success' :
                              file.type === 'video' ? 'warning' : 'info'
                            }
                            className="text-uppercase"
                          >
                            {file.type}
                          </CBadge>
                          <CDropdown>
                            <CDropdownToggle
                              color="transparent"
                              size="sm"
                              style={{ padding: '2px 6px' }}
                            >
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem onClick={() => previewFile(file)}>
                                <CIcon icon={cilEye} className="me-2" />
                                Preview
                              </CDropdownItem>
                              <CDropdownItem onClick={() => downloadFile(file)}>
                                <CIcon icon={cilDownload} className="me-2" />
                                Download
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => confirmDelete(file)}
                                className="text-danger"
                              >
                                <CIcon icon={cilTrash} className="me-2" />
                                Delete
                              </CDropdownItem>
                            </CDropdownMenu>
                          </CDropdown>
                        </div>
                        
                        <div className="text-center mb-2">
                          <CIcon
                            icon={getFileIcon(file.type)}
                            size="2xl"
                            className="text-primary"
                          />
                        </div>
                        
                        <h6 className="small mb-1" title={file.name}>
                          {file.name.length > 20 
                            ? `${file.name.substring(0, 20)}...` 
                            : file.name
                          }
                        </h6>
                        <small className="text-muted">
                          {formatFileSize(file.size)}
                        </small>
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))}
              </CRow>
            </div>
          )}

          {files.length === 0 && !uploading && (
            <CAlert color="info" className="mb-0">
              <strong>No files uploaded yet.</strong> Drag and drop files above or click to browse.
            </CAlert>
          )}
        </CCardBody>
      </CCard>

      {/* Preview Modal */}
      <CModal
        visible={previewModal.open}
        onClose={() => setPreviewModal({ open: false, file: null })}
        size="lg"
        alignment="center"
      >
        <CModalHeader closeButton>
          <CModalTitle>{previewModal.file?.name}</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center">
          {previewModal.file && renderPreview(previewModal.file)}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={() => downloadFile(previewModal.file)}
          >
            <CIcon icon={cilDownload} className="me-2" />
            Download
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setPreviewModal({ open: false, file: null })}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default FileUploadSection