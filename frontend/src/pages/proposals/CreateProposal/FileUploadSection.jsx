import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CRow,
  CProgress, CAlert, CBadge, CDropdown, CDropdownToggle,
  CDropdownMenu, CDropdownItem, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload, cilFile, cilImage, cilVideo,
  cilTrash, cilSettings
} from '@coreui/icons'
import Swal from 'sweetalert2'
import axiosInstance from '../../../helpers/axiosInstance'

const api_url = import.meta.env.VITE_API_URL;

const FileUploadSection = ({ proposalId, onFilesChange }) => {
  const { t } = useTranslation();
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
  return t('files.validation.unsupportedType', { type: file.type })
    }
    if (file.size > maxFileSize) {
  return t('files.validation.sizeExceeded', { size: formatFileSize(maxFileSize) })
    }
    return null
  }

  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('proposalId', proposalId)
    formData.append('fileType', getFileType(file.type))

    try {
      const { data } = await axiosInstance.post('/api/proposals/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return data
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
        title: t('files.invalidTitle'),
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
        title: t('common.success'),
        text: t('files.uploadSuccess', { count: uploadedFiles.length }),
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: t('files.uploadFailedTitle'),
        text: t('files.uploadFailedText'),
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
      await axiosInstance.delete(`/api/proposals/files/${fileId}`)

      const updatedFiles = files.filter(file => file.id !== fileId)
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)

      Swal.fire({
        icon: 'success',
        title: t('common.deleted'),
        text: t('files.deleteSuccess'),
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: t('files.deleteFailedTitle'),
        text: t('files.deleteFailedText'),
      })
    }
  }

  const confirmDelete = (file) => {
    Swal.fire({
      title: t('customers.confirmTitle'),
      text: t('files.confirmDelete', { name: file.name }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('customers.confirmYes')
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
          {t('files.videoNotSupported')}
        </video>
      )
    } else {
      return (
        <div className="text-center p-4">
          <CIcon icon={cilFile} size="4xl" className="mb-3" />
          <p>{t('files.docPreviewNA')}</p>
          <CButton color="primary" onClick={() => downloadFile(file)}>
            <CIcon icon={cilSettings} className="me-2" />
            {t('files.downloadToView')}
          </CButton>
        </div>
      )
    }
  }

  return (
    <>
      <style>{`
        .file-upload-section .btn { min-height: 44px; }
      `}</style>
      <CCard>
        <CCardHeader>
          <h5 className="mb-0">{t('files.title')}</h5>
          <small className="text-muted">
            {t('files.supportedList')}
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
              aria-label={t('files.inputAria','Select files to upload')}
            />

            {uploading ? (
              <div>
                <CSpinner color="primary" className="mb-3" />
                <p className="mb-0">{t('files.uploading')}</p>
              </div>
            ) : (
              <div>
                <CIcon icon={cilCloudUpload} size="3xl" className="mb-3 text-primary" />
                <h6>{t('files.dropOrBrowse')}</h6>
                <p className="text-muted mb-0">
                  {t('files.maxSize', { size: formatFileSize(maxFileSize) })}
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div>
              <h6 className="mb-3">{t('files.uploadedCount', { count: files.length })}</h6>
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
                              aria-label={t('files.actions','File actions')}
                            >
                              <CIcon icon={cilSettings} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem onClick={() => previewFile(file)}>
                                <CIcon icon={cilSettings} className="me-2" />
                                {t('files.preview')}
                              </CDropdownItem>
                              <CDropdownItem onClick={() => downloadFile(file)}>
                                <CIcon icon={cilSettings} className="me-2" />
                                {t('files.download')}
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => confirmDelete(file)}
                                className="text-danger"
                              >
                                <CIcon icon={cilSettings} className="me-2" />
                                {t('common.delete')}
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
        <strong>{t('files.noneYet')}</strong> {t('files.dropHint')}
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
            <CIcon icon={cilSettings} className="me-2" />
            {t('files.download')}
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setPreviewModal({ open: false, file: null })}
          >
            {t('common.cancel')}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default FileUploadSection