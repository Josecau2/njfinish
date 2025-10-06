import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { getContrastColor } from '../../../utils/colorUtils'
import StandardCard from '../../../components/StandardCard'
import FileViewerModal from '../../../components/FileViewerModal'
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
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const MotionBox = motion.create(Box)
const MotionButton = motion.create(Button)
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
  if (acceptedTypes.videos.includes(mimeType)) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'
  if (acceptedTypes.documents.includes(mimeType)) return 'document'
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
  const [deleting, setDeleting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewModal, setPreviewModal] = useState({ open: false, file: null })
  const fileInputRef = useRef(null)
  const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure()
  const deleteCancelRef = useRef(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const customization = useSelector((state) => state.customization) || {}
  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization.headerFontColor || getContrastColor(resolvedHeaderBg)

  // Dark mode colors
  const borderGray100 = useColorModeValue('gray.100', 'gray.700')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const textGray800 = useColorModeValue('gray.800', 'gray.200')
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const textGray700 = useColorModeValue('gray.700', 'gray.200')
  const textRed500 = useColorModeValue('red.500', 'red.300')
  const bgBlue50 = useColorModeValue('blue.50', 'blue.900')
  const borderBlue100 = useColorModeValue('blue.100', 'blue.700')
  const textBlue700 = useColorModeValue('blue.700', 'blue.300')
  const textBlue600 = useColorModeValue('blue.600', 'blue.300')

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
            error?.response?.data?.message ||
            error?.message ||
            t('common.errorGeneric', 'Something went wrong'),
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
    setDeleting(true)
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
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = (file) => {
    setPendingDelete(file)
    onOpenDeleteDialog()
  }

  const handleCloseDeleteDialog = () => {
    setPendingDelete(null)
    onCloseDeleteDialog()
  }

  const handleConfirmDelete = async () => {
    if (pendingDelete) {
      await deleteFile(pendingDelete)
    }
    setPendingDelete(null)
    onCloseDeleteDialog()
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

  return (
    <>
      <StandardCard
        shadow="md"
        borderRadius="xl"
        borderColor={dragActive ? 'brand.300' : 'transparent'}
      >
        <CardHeader borderBottomWidth="1px" borderColor={borderGray100} bg={bgGray50}>
          <Heading size="md" color={textGray800}>
            {t('files.sectionTitle', 'Supporting files')}
          </Heading>
          <Text fontSize="sm" color={textGray500}>
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
                  <Text color={textGray600}>{t('files.uploading')}</Text>
                </>
              ) : (
                <>
                  <Icon as={UploadCloud} boxSize={12} color="brand.400" />
                  <Heading as="h3" size="sm">
                    {t('files.dropOrBrowse', 'Drop files here or browse to upload')}
                  </Heading>
                  <Text fontSize="sm" color={textGray500}>
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
              <Box
                as="input"
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleInputChange}
                display="none"
                aria-label={t('files.inputAria', 'Select files to upload')}
              />
            </Stack>
          </MotionBox>

          {files.length > 0 ? (
            <Box mt={8}>
              <Heading as="h4" size="sm" mb={4} color={textGray700}>
                {t('files.uploadedCount', { count: files.length })}
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                {files.map((file) => {
                  const IconComponent = getFileIconComponent(file.type)
                  return (
                    <StandardCard key={file.id} borderWidth="1px" borderRadius="lg" shadow="sm">
                      <CardBody>
                        <Flex justify="space-between" align="center" mb={4}>
                          <Badge
                            colorScheme={
                              file.type === 'image'
                                ? 'green'
                                : file.type === 'video'
                                  ? 'orange'
                                  : file.type === 'pdf'
                                    ? 'red'
                                    : 'blue'
                            }
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
                              <Icon as={MenuIcon} boxSize={ICON_BOX_MD} />
                            </MenuButton>
                            <MenuList>
                              <MenuItem
                                icon={<Icon as={Eye} boxSize={ICON_BOX_MD} />}
                                onClick={() => previewFile(file)}
                              >
                                {t('files.preview')}
                              </MenuItem>
                              <MenuItem
                                icon={<Icon as={Download} boxSize={ICON_BOX_MD} />}
                                onClick={() => downloadFile(file)}
                              >
                                {t('files.download')}
                              </MenuItem>
                              <MenuItem
                                icon={<Icon as={Trash2} boxSize={ICON_BOX_MD} />}
                                onClick={() => confirmDelete(file)}
                                color={textRed500}
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
                          <Text fontSize="sm" color={textGray500}>
                            {formatFileSize(file.size)}
                          </Text>
                        </Stack>
                      </CardBody>
                    </StandardCard>
                  )
                })}
              </SimpleGrid>
            </Box>
          ) : !uploading ? (
            <Box
              mt={6}
              p={4}
              borderRadius="lg"
              bg={bgBlue50}
              borderWidth="1px"
              borderColor={borderBlue100}
            >
              <Heading as="h4" size="sm" color={textBlue700} mb={1}>
                {t('files.noneYet')}
              </Heading>
              <Text fontSize="sm" color={textBlue600}>
                {t('files.dropHint')}
              </Text>
            </Box>
          ) : null}
        </CardBody>
      </StandardCard>

      <FileViewerModal
        visible={previewModal.open}
        onClose={() => setPreviewModal({ open: false, file: null })}
        file={previewModal.file}
        resolveFileUrl={(file) => file?.url}
        onDownload={downloadFile}
        title={previewModal.file?.name}
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={deleteCancelRef}
        onClose={handleCloseDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="12px" overflow="hidden">
            <AlertDialogHeader bg={resolvedHeaderBg} color={headerTextColor}>
              <Text fontSize="lg" fontWeight="semibold">
                {t('files.deleteTitle', 'Delete file')}
              </Text>
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              {t('files.deleteConfirm', {
                name: pendingDelete?.name || t('files.thisFile', 'this file'),
              })}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={handleCloseDeleteDialog} variant="outline" minH="44px">
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" ml={3} onClick={handleConfirmDelete} isLoading={deleting} minH="44px">
                {t('common.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}
export default FileUploadSection

