
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  HStack,
  Icon,
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
  Switch,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Controller, useForm } from 'react-hook-form'
import { Eye, Printer, Download } from 'lucide-react'
import axiosInstance from '../../helpers/axiosInstance'
import {
  buildProposalPdfHtml,
  DEFAULT_PROPOSAL_PDF_COLUMNS,
} from '../../helpers/proposalPdfBuilder'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const BASE_PAGE_WIDTH_PX = 794
const MotionButton = motion.create(Button)

const PrintProposalModal = ({ show, onClose, formData }) => {
  const { t, i18n } = useTranslation()
  const [pdfCustomization, setPdfCustomization] = useState(null)
  const [styleData, setStyleData] = useState(null)
  const [manufacturerNameData, setManufacturerNameData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const previewIframeRef = useRef(null)

  const defaultValues = useMemo(
    () => ({
      showProposalItems: true,
      showGroupItems: true,
      showPriceSummary: true,
      selectedVersions: [],
      selectedColumns: DEFAULT_PROPOSAL_PDF_COLUMNS.slice(),
    }),
    [],
  )

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
  } = useForm({
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
  })

  useEffect(() => {
    if (show) {
      reset(defaultValues)
      setShowPreview(false)
      setPreviewHtml('')
    }
  }, [show, defaultValues, reset])

  const isMobile = useBreakpointValue({ base: true, md: false })
  const mainModalSize = useBreakpointValue({ base: 'full', md: '4xl' })
  const previewModalSize = useBreakpointValue({ base: 'full', md: '6xl' })
  const previewPadding = useBreakpointValue({ base: 3, md: 6 })
  const previewMaxHeight = useBreakpointValue({
    base: 'calc(100vh - 180px)',
    md: '70vh',
    lg: '80vh',
  })

  const shortLabel = useCallback(
    (code) => {
      switch (code) {
        case 'L':
          return t('common.short.left', { defaultValue: 'L' })
        case 'R':
          return t('common.short.right', { defaultValue: 'R' })
        case 'B':
          return t('common.short.both', { defaultValue: 'B' })
        default:
          return code ?? t('common.na', 'N/A')
      }
    },
    [t],
  )

  const fetchPdfCustomization = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/settings/customization/pdf')
      setPdfCustomization(response.data || {})
    } catch (error) {
      console.error('Error fetching PDF customization:', error)
    }
  }, [])

  const fetchStyleData = useCallback(async (manufacturerId, styleId) => {
    if (!manufacturerId || !styleId) return
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`)
      const styles = response.data?.styles || []
      const matchedStyle = styles.find((style) => style.id === styleId)
      setStyleData(matchedStyle || null)
    } catch (error) {
      console.error('Error fetching style data:', error)
    }
  }, [])

  const fetchManufacturerName = useCallback(async (manufacturerId) => {
    if (!manufacturerId) return
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}`)
      setManufacturerNameData(response.data || null)
    } catch (error) {
      console.error('Error fetching manufacturer data:', error)
    }
  }, [])

  useEffect(() => {
    if (!show) return
    fetchPdfCustomization()
  }, [show, fetchPdfCustomization])

  useEffect(() => {
    if (!show) return
    const manufacturerData = Array.isArray(formData?.manufacturersData)
      ? formData.manufacturersData[0]
      : null
    const manufacturerId = manufacturerData?.manufacturer || manufacturerData?.manufacturerId
    const styleId = manufacturerData?.selectedStyle || manufacturerData?.styleId
    fetchStyleData(manufacturerId, styleId)
    fetchManufacturerName(manufacturerId)
  }, [show, formData?.manufacturersData, fetchStyleData, fetchManufacturerName])

  const buildHtml = useCallback(
    (values) =>
      buildProposalPdfHtml({
        formData,
        options: {
          selectedColumns: values.selectedColumns,
          showProposalItems: values.showProposalItems,
          showPriceSummary: values.showPriceSummary,
          selectedVersions: values.selectedVersions,
          includeCatalog: true,
        },
        pdfCustomization,
        t,
        i18n,
        shortLabel,
        styleData,
        manufacturerNameData,
      }),
    [formData, pdfCustomization, t, i18n, shortLabel, styleData, manufacturerNameData],
  )

  const refreshPreview = useCallback(
    (overrides = {}) => {
      if (!showPreview) return
      const nextValues = { ...getValues(), ...overrides }
      setPreviewHtml(buildHtml(nextValues))
    },
    [buildHtml, getValues, showPreview],
  )

  useEffect(() => {
    if (!showPreview) return
    refreshPreview()
  }, [showPreview, pdfCustomization, styleData, manufacturerNameData, refreshPreview])

  const handleDownload = useCallback(
    async (values) => {
      try {
        setIsLoading(true)
        const htmlContent = buildHtml(values)
        const response = await axiosInstance.post(
          '/api/generate-pdf',
          {
            html: htmlContent,
            options: {
              format: 'A4',
              margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
              },
            },
          },
          { responseType: 'blob' },
        )

        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'quote.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error generating PDF:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [buildHtml],
  )

  const handlePrint = useCallback(
    (values) => {
      const htmlContent = buildHtml(values)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.onload = () => {
          printWindow.print()
          printWindow.close()
        }
      } else {
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        document.body.appendChild(iframe)
        const doc = iframe.contentWindow?.document
        if (doc) {
          doc.open()
          doc.write(htmlContent)
          doc.close()
          iframe.onload = () => {
            iframe.contentWindow?.print()
            setTimeout(() => document.body.removeChild(iframe), 1000)
          }
        }
      }
    },
    [buildHtml],
  )

  const openPreview = useCallback(
    () => {
      const values = getValues()
      setShowPreview(true)
      setPreviewHtml(buildHtml(values))
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const iframe = previewIframeRef.current
          if (iframe?.contentWindow) {
            iframe.contentWindow.focus()
          }
        })
      })
    },
    [buildHtml, getValues],
  )

  const manufacturerData = useMemo(() => {
    if (!formData?.manufacturersData) return []
    if (Array.isArray(formData.manufacturersData)) return formData.manufacturersData
    try {
      const parsed = JSON.parse(formData.manufacturersData)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }, [formData?.manufacturersData])

  const versionOptions = useMemo(
    () =>
      manufacturerData.map((item) => ({
        value: item.versionName,
        label: item.versionName,
      })),
    [manufacturerData],
  )

  const columnOptions = useMemo(
    () => [
      { value: 'no', label: t('proposalColumns.no') },
      { value: 'qty', label: t('proposalColumns.qty'), isFixed: true },
      { value: 'item', label: t('proposalColumns.item') },
      { value: 'assembled', label: t('proposalColumns.assembled') },
      { value: 'hingeSide', label: t('proposalColumns.hingeSide') },
      { value: 'exposedSide', label: t('proposalColumns.exposedSide') },
      { value: 'price', label: t('proposalColumns.price'), isFixed: true },
      { value: 'assemblyCost', label: t('proposalColumns.assemblyCost') },
      { value: 'total', label: t('proposalColumns.total') },
    ],
    [t],
  )

  const fixedColumns = useMemo(
    () => columnOptions.filter((option) => option.isFixed).map((option) => option.value),
    [columnOptions],
  )

  const selectAllVersions = () => {
    const all = versionOptions.map((option) => option.value)
    setValue('selectedVersions', all)
    refreshPreview({ selectedVersions: all })
  }

  const clearVersions = () => {
    setValue('selectedVersions', [])
    refreshPreview({ selectedVersions: [] })
  }

  const selectAllColumns = () => {
    setValue('selectedColumns', DEFAULT_PROPOSAL_PDF_COLUMNS)
    refreshPreview({ selectedColumns: DEFAULT_PROPOSAL_PDF_COLUMNS })
  }

  const clearColumns = () => {
    const minimal = ['no', ...fixedColumns]
    setValue('selectedColumns', Array.from(new Set(minimal)))
    refreshPreview({ selectedColumns: Array.from(new Set(minimal)) })
  }

  const handleMainClose = () => {
    if (isLoading) return
    setShowPreview(false)
    setPreviewHtml('')
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    await handleDownload(values)
  })

  return (
    <>
      <Modal
        isOpen={show}
        onClose={handleMainClose}
        size={mainModalSize}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="lg" fontWeight="semibold">
              {t('proposalCommon.printTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton aria-label="Close modal" />
          <ModalBody>
            <Stack spacing={6}>
              <Box borderWidth="1px" borderRadius="lg" p={4}>
                <Text fontSize="sm" textTransform="uppercase" fontWeight="semibold" color="gray.500" mb={4}>
                  {t('proposalCommon.visibilityOptions', 'Visibility Options')}
                </Text>
                <SimpleGrid columns={isMobile ? 1 : 3} spacing={4}>
                  <Controller
                    control={control}
                    name="showProposalItems"
                    render={({ field }) => (
                      <HStack spacing={4} align="center">
                        <Switch
                          id="showProposalItems"
                          colorScheme="brand"
                          size="lg"
                          isChecked={field.value}
                          onChange={(event) => {
                            const checked = event.target.checked
                            field.onChange(checked)
                            refreshPreview({ showProposalItems: checked })
                          }}
                        />
                        <Text fontWeight="medium">
                          {t('proposalCommon.showProposalItems')}
                        </Text>
                      </HStack>
                    )}
                  />
                  <Controller
                    control={control}
                    name="showGroupItems"
                    render={({ field }) => (
                      <HStack spacing={4} align="center">
                        <Switch
                          id="showGroupItems"
                          colorScheme="brand"
                          size="lg"
                          isChecked={field.value}
                          onChange={(event) => {
                            const checked = event.target.checked
                            field.onChange(checked)
                            refreshPreview({ showGroupItems: checked })
                          }}
                        />
                        <Text fontWeight="medium">
                          {t('proposalCommon.showGroupItems')}
                        </Text>
                      </HStack>
                    )}
                  />
                  <Controller
                    control={control}
                    name="showPriceSummary"
                    render={({ field }) => (
                      <HStack spacing={4} align="center">
                        <Switch
                          id="showPriceSummary"
                          colorScheme="brand"
                          size="lg"
                          isChecked={field.value}
                          onChange={(event) => {
                            const checked = event.target.checked
                            field.onChange(checked)
                            refreshPreview({ showPriceSummary: checked })
                          }}
                        />
                        <Text fontWeight="medium">
                          {t('proposalCommon.showPriceSummary', 'Show Price Summary')}
                        </Text>
                      </HStack>
                    )}
                  />
                </SimpleGrid>
              </Box>

              {versionOptions.length > 0 && (
                <Box borderWidth="1px" borderRadius="lg" p={4}>
                  <HStack justify="space-between" align="center" mb={3} spacing={4} flexWrap="wrap">
                    <Text fontWeight="semibold">
                      {t('proposalCommon.selectVersion')}
                    </Text>
                    {versionOptions.length > 1 && (
                      <HStack spacing={4}>
                        <Button size="sm" minH="44px" variant="outline" onClick={selectAllVersions}>
                          {t('common.selectAll', 'Select All')}
                        </Button>
                        <Button size="sm" minH="44px" variant="outline" onClick={clearVersions}>
                          {t('common.clear', 'Clear')}
                        </Button>
                      </HStack>
                    )}
                  </HStack>
                  <Controller
                    control={control}
                    name="selectedVersions"
                    render={({ field }) => (
                      <CheckboxGroup
                        value={field.value}
                        onChange={(next) => {
                          field.onChange(next)
                          refreshPreview({ selectedVersions: next })
                        }}
                      >
                        <SimpleGrid columns={isMobile ? 1 : 2} spacing={4}>
                          {versionOptions.map((opt) => (
                            <Checkbox
                              key={opt.value}
                              value={opt.value}
                              alignItems="flex-start"
                              py={2}
                              px={3}
                              borderWidth="1px"
                              borderRadius="md"
                              _checked={{ bg: 'brand.50', borderColor: 'brand.300' }}
                            >
                              <Text isTruncated>{opt.label}</Text>
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </CheckboxGroup>
                    )}
                  />
                </Box>
              )}

              <Box borderWidth="1px" borderRadius="lg" p={4}>
                <HStack justify="space-between" align="center" mb={3} spacing={4} flexWrap="wrap">
                  <Text fontWeight="semibold">
                    {t('proposalCommon.selectColumns')}
                  </Text>
                  <HStack spacing={4}>
                    <Button size="sm" minH="44px" variant="outline" onClick={selectAllColumns}>
                      {t('common.selectAll', 'Select All')}
                    </Button>
                    <Button size="sm" minH="44px" variant="outline" onClick={clearColumns}>
                      {t('common.clear', 'Clear')}
                    </Button>
                  </HStack>
                </HStack>
                <Controller
                  control={control}
                  name="selectedColumns"
                  render={({ field }) => (
                    <CheckboxGroup
                      value={field.value}
                      onChange={(next) => {
                        const withFixed = Array.from(new Set([...next, ...fixedColumns]))
                        field.onChange(withFixed)
                        refreshPreview({ selectedColumns: withFixed })
                      }}
                    >
                      <SimpleGrid columns={isMobile ? 1 : 2} spacing={4}>
                        {columnOptions.map((opt) => (
                          <Checkbox
                            key={opt.value}
                            value={opt.value}
                            alignItems="flex-start"
                            py={2}
                            px={3}
                            borderWidth="1px"
                            borderRadius="md"
                            isDisabled={opt.isFixed}
                            _checked={{ bg: 'brand.50', borderColor: 'brand.300' }}
                            _disabled={{ cursor: 'not-allowed', color: 'gray.500' }}
                          >
                            <Text isTruncated>{opt.label}</Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  )}
                />
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4} flexWrap={isMobile ? 'wrap' : 'nowrap'} width="100%" justify={isMobile ? 'stretch' : 'flex-end'}>
              <MotionButton
                variant="outline"
                colorScheme="gray"
                onClick={openPreview}
                whileTap={{ scale: 0.98 }}
                flex={isMobile ? '1' : 'unset'}
              >
                <HStack spacing={4} justify="center" width="100%">
                  <Icon as={Eye} boxSize={ICON_BOX_MD} />
                  <Text>{t('proposalCommon.preview', 'Preview')}</Text>
                </HStack>
              </MotionButton>
              <MotionButton
                variant="outline"
                colorScheme="brand"
                onClick={() => handlePrint(getValues())}
                whileTap={{ scale: 0.98 }}
                flex={isMobile ? '1' : 'unset'}
              >
                <HStack spacing={4} justify="center" width="100%">
                  <Icon as={Printer} boxSize={ICON_BOX_MD} />
                  <Text>{t('proposalCommon.print', 'Print')}</Text>
                </HStack>
              </MotionButton>
              <MotionButton
                colorScheme="brand"
                isDisabled={isLoading}
                onClick={() => handleDownload(getValues())}
                whileTap={{ scale: 0.98 }}
                flex={isMobile ? '1' : 'unset'}
              >
                {isLoading ? (
                  <HStack spacing={4} justify="center" width="100%">
                    <Spinner size="sm" />
                    <Text>{t('proposalCommon.downloading')}</Text>
                  </HStack>
                ) : (
                  <HStack spacing={4} justify="center" width="100%">
                    <Icon as={Download} boxSize={ICON_BOX_MD} />
                    <Text>{t('proposalCommon.downloadPdf')}</Text>
                  </HStack>
                )}
              </MotionButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        size={previewModalSize}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="lg" fontWeight="semibold">
              {t('proposalCommon.previewTitle', 'Quote Preview')}
            </Text>
          </ModalHeader>
          <ModalCloseButton aria-label="Close modal" />
          <ModalBody p={0}>
            <Box px={previewPadding} py={4} bg="gray.50">
              <Box
                maxH={previewMaxHeight}
                overflow="auto"
                bg="white"
                borderWidth="1px"
                borderRadius="lg"
                boxShadow="base"
                display="flex"
                justifyContent="center"
                p={4}
              >
                <iframe
                  ref={previewIframeRef}
                  title="quote-preview-frame"
                  srcDoc={
                    previewHtml ||
                    '<html><body style="font-family:sans-serif;padding:2rem;">Loading...</body></html>'
                  }
                  style={{
                    width: BASE_PAGE_WIDTH_PX,
                    minHeight: '1120px',
                    border: 'none',
                  }}
                />
              </Box>
            </Box>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <HStack spacing={4}>
              <MotionButton
                variant="outline"
                colorScheme="gray"
                onClick={() => setShowPreview(false)}
                whileTap={{ scale: 0.98 }}
              >
                {t('common.close')}
              </MotionButton>
              <MotionButton
                colorScheme="brand"
                onClick={() => handleDownload(getValues())}
                isDisabled={isLoading}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <HStack spacing={4}>
                    <Spinner size="sm" />
                    <Text>{t('proposalCommon.downloading')}</Text>
                  </HStack>
                ) : (
                  <HStack spacing={4}>
                    <Icon as={Download} boxSize={ICON_BOX_MD} />
                    <Text>{t('proposalCommon.downloadPdf')}</Text>
                  </HStack>
                )}
              </MotionButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
export default PrintProposalModal
