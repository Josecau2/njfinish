import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  Download,
  Eye,
  File as FileIcon,
  Image as ImageIcon,
  Menu as MenuIcon,
  Trash2,
  UploadCloud,
  Video,
} from 'lucide-react'
import axiosInstance from '../../../helpers/axiosInstance'

const MotionBox = motion(Box)
const MotionButton = motion(Button)
const apiUrl = import.meta.env.VITE_API_URL

const acceptedTypes = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
}

const allAcceptedTypes = [
  ...acceptedTypes.images,
  ...acceptedTypes.documents,
  ...acceptedTypes.videos,
]

const maxFileSize = 50 * 1024 * 1024 // 50MB

const getFileType = (mimeType) => {
  if (acceptedTypes.images.includes(mimeType)) return 'image'
  if (acceptedTypes.documents.includes(mimeType)) return 'document'
  if (acceptedTypes.videos.includes(mimeType)) return 'video'
  return 'unknown'
}

const getFileIconComponent = (fileType) => {
  switch (fileType) {
    case 'image':
      return ImageIcon
    case 'video':
      return Video
    default:
      return FileIcon
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const FileUploadSection = ({ proposalId, onFilesChange }) => {
  const { t } = useTranslation()
  const toast = useToast()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewModal, setPreviewModal] = useState({ open: false, file: null })
  const fileInputRef = useRef(null)

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

    const { data } = await axiosInstance.post('/api/proposals/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  const syncFiles = useCallback(
    (nextFiles) => {
      setFiles(nextFiles)
      onFilesChange?.(nextFiles)
    },
    [onFilesChange],
  )

  const handleFiles = useCallback(
    async (fileList) => {
      const validFiles = []
      const errors = []

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
        } else {
          validFiles.push(file)
        }
      })

      if (errors.length > 0) {
        toast({
          status: 'error',
          title: t('files.validation.title', 'Some files could not be uploaded'),
          description: errors.join('\n'),
          duration: 7000,
          isClosable: true,
        })
      }

      if (!validFiles.length) return

      setUploading(true)
      try {
        const uploads = await Promise.all(validFiles.map(uploadFile))
        const normalizedUploads = uploads.map((result) => ({
          id: result?.id || result?.file?.id || crypto.randomUUID(),
          name: result?.name || result?.fileName || result?.file?.name || 'file',
          size: result?.size || result?.file?.size || 0,
          url: result?.url || result?.fileUrl || '',
          type: result?.type || result?.fileType || getFileType(result?.mimeType || ''),
        }))
        const nextFiles = [...files, ...normalizedUploads]
        syncFiles(nextFiles)
        toast({
          status: 'success',
          title: t('files.uploadSuccessTitle', 'Files uploaded'),
          description: t('files.uploadSuccessBody', { count: normalizedUploads.length }),
        })
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          status: 'error',
          title: t('files.uploadErrorTitle', 'Upload failed'),
          description:
            error?.response?.data?.message || error?.message || t('common.errorGeneric', 'Something went wrong'),
        })
      } finally {
        setUploading(false)
      }
    },
    [files, syncFiles, t, toast],
  )

  const handleInputChange = useCallback(
    (event) => {
      const { files: selectedFiles } = event.target
      if (selectedFiles?.length) {
        handleFiles(selectedFiles)
      }
    },
    [handleFiles],
  )

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()
      setDragActive(false)
      if (event.dataTransfer?.files?.length) {
        handleFiles(event.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const deleteFile = async (file) => {
    try {
      await axiosInstance.delete(`/api/proposals/files/${file.id}`)
      const nextFiles = files.filter((item) => item.id !== file.id)
      syncFiles(nextFiles)
      toast({ status: 'success', title: t('files.deleteSuccess', 'File removed') })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        status: 'error',
        title: t('files.deleteErrorTitle', 'Unable to delete file'),
        description: error?.response?.data?.message || error?.message || t('common.errorGeneric'),
      })
    }
  }

  const confirmDelete = (file) => {
    const confirmed = window.confirm(
      t('files.deleteConfirm', { name: file.name }) || `Delete "${file.name}"?`,
    )
    if (confirmed) {
      deleteFile(file)
    }
  }

  const downloadFile = (file) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const previewFile = (file) => {
    setPreviewModal({ open: true, file })
  }

  const renderPreview = (file) => {
    if (file.type === 'image') {
      return (
        <Box as="img" src={file.url} alt={file.name} maxH="60vh" mx="auto" borderRadius="lg" />

  )
    }
    if (file.type === 'video') {
      return (
        <Box as="video" maxH="60vh" mx="auto" controls borderRadius="lg">
          <source src={file.url} type="video/mp4" />
        </Box>

  )
    }
    return (
      <Box maxW="100%" textAlign="center">
        <iframe
          title={file.name}
          src={file.url}
          style={{ width: '100%', minHeight: '60vh', borderRadius: '12px', border: 'none' }}
        />
      </Box>

  )
  }

  return (
    <>
      <Card shadow="md" borderRadius="xl" borderColor={dragActive ? 'brand.300' : 'transparent'}>
        <CardHeader borderBottomWidth="1px" borderColor="gray.100" bg="gray.50">
          <Heading size="md" color="gray.800">
            {t('files.sectionTitle', 'Supporting files')}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            {t('files.sectionSubtitle', 'Upload drawings, contracts, or reference media')}
          </Text>
        </CardHeader>
        <CardBody>
          <MotionBox
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={dragActive ? 'brand.400' : 'gray.300'}
            borderRadius="xl"
            bg={dragActive ? 'brand.50' : 'gray.50'}
            py={10}
            px={6}
            textAlign="center"
            transition="all 0.2s"
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragActive(false)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <Stack spacing={4} align="center">
              {uploading ? (
                <>
                  <Spinner size="xl" color="brand.500" />
                  <Text color="gray.600">{t('files.uploading')}</Text>
                </>
              ) : (
                <>
                  <Icon as={UploadCloud} boxSize={12} color="brand.400" />
                  <Heading as="h3" size="sm">
                    {t('files.dropOrBrowse', 'Drop files here or browse to upload')}
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    {t('files.maxSize', { size: formatFileSize(maxFileSize) })}
                  </Text>
                  <MotionButton
                    colorScheme="brand"
                    size="md"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('files.browseButton', 'Select files')}
                  </MotionButton>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleInputChange}
                style={{ display: 'none' }}
                aria-label={t('files.inputAria', 'Select files to upload')}
              />
            </Stack>
          </MotionBox>

          {files.length > 0 ? (
            <Box mt={8}>
              <Heading as="h4" size="sm" mb={4} color="gray.700">
                {t('files.uploadedCount', { count: files.length })}
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                {files.map((file) => {
                  const IconComponent = getFileIconComponent(file.type)
                  return (
                    <Card key={file.id} borderWidth="1px" borderRadius="lg" shadow="sm">
                      <CardBody>
                        <Flex justify="space-between" align="center" mb={4}>
                          <Badge
                            colorScheme={file.type === 'image' ? 'green' : file.type === 'video' ? 'orange' : 'blue'}
                            textTransform="uppercase"
                            fontWeight="semibold"
                          >
                            {file.type}
                          </Badge>
                          <Menu>
                            <MenuButton
                              as={Button}
                              size="sm"
                              variant="ghost"
                              colorScheme="gray"
                              aria-label={t('files.actions', 'File actions')}
                            >
                              <Icon as={MenuIcon} boxSize={4} />
                            </MenuButton>
                            <MenuList>
                              <MenuItem icon={<Icon as={Eye} boxSize={4} />} onClick={() => previewFile(file)}>
                                {t('files.preview')}
                              </MenuItem>
                              <MenuItem icon={<Icon as={Download} boxSize={4} />} onClick={() => downloadFile(file)}>
                                {t('files.download')}
                              </MenuItem>
                              <MenuItem
                                icon={<Icon as={Trash2} boxSize={4} />}
                                onClick={() => confirmDelete(file)}
                                color="red.500"
                              >
                                {t('common.delete')}
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>

                        <Stack spacing={4} align="center">
                          <Icon as={IconComponent} boxSize={10} color="brand.400" />
                          <Text fontWeight="semibold" noOfLines={2} textAlign="center">
                            {file.name}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {formatFileSize(file.size)}
                          </Text>
                        </Stack>
                      </CardBody>
                    </Card>
                  )
                })}
              </SimpleGrid>
            </Box>
          ) : !uploading ? (
            <Box mt={6} p={4} borderRadius="lg" bg="blue.50" borderWidth="1px" borderColor="blue.100">
              <Heading as="h4" size="sm" color="blue.700" mb={1}>
                {t('files.noneYet')}
              </Heading>
              <Text fontSize="sm" color="blue.600">
                {t('files.dropHint')}
              </Text>
            </Box>
          ) : null}
        </CardBody>
      </Card>

      <Modal isOpen={previewModal.open} onClose={() => setPreviewModal({ open: false, file: null })} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{previewModal.file?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{previewModal.file && renderPreview(previewModal.file)}</ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setPreviewModal({ open: false, file: null })} mr={3}>
              {t('common.cancel')}
            </Button>
            <Button colorScheme="brand" leftIcon={<Icon as={Download} boxSize={4} />} onClick={() => downloadFile(previewModal.file)}>
              {t('files.download')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
export default FileUploadSection
