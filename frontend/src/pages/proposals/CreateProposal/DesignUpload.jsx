import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  CardBody,
  Flex,
  Heading,
  Icon,
  Image,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  Tabs,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { motion } from 'framer-motion'
import { CloudUpload, PenSquare, UploadCloud } from 'lucide-react'
import axiosInstance from '../../../helpers/axiosInstance'
import { buildUploadUrl } from '../../../utils/uploads'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const MotionButton = motion.create(Button)

const DesignImportStep = ({
  updateFormData,
  manufacturerData,
  onStyleSelect,
  formData,
  hideBack,
  prevStep,
}) => {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('manual')
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [stylesMeta, setStylesMeta] = useState([])
  const [isFetchingStyles, setIsFetchingStyles] = useState(false)

  const stylesCacheRef = useRef(new Map())
  const fetchDebounceRef = useRef(null)
  const activeRequestRef = useRef(null)
  const selectedManufacturerId = useMemo(() => {
    const manufacturer = formData?.manufacturersData?.[0]?.manufacturer
    return typeof manufacturer === 'number' || typeof manufacturer === 'string' ? manufacturer : null
  }, [formData?.manufacturersData])

  const isMobile = useBreakpointValue({ base: true, md: false })
  const tabIndex = activeTab === 'import' ? 1 : 0

  // Dark mode colors - MUST be before useState
  const headingColor = useColorModeValue('gray.800', 'gray.200')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const dropzoneBg = useColorModeValue('gray.50', 'gray.800')
  const iconColor = useColorModeValue('gray.400', 'gray.500')
  const textSecondary = useColorModeValue('gray.500', 'gray.400')
  const stickyBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const cardImageBg = useColorModeValue('gray.50', 'gray.800')
  const overlayTextColor = useColorModeValue('white', 'gray.100')
  const styleCardBorderColor = useColorModeValue('gray.600', 'gray.500')
  const styleCardBgUnselected = useColorModeValue('white', 'gray.800')
  const styleCardTextColor = useColorModeValue('gray.900', 'gray.100')

  const gridSpacing = useBreakpointValue({ base: 2, md: 3, lg: 4 }) || 3
  // 2:1 aspect ratio for style images: mobile 121x242, desktop 130x260
  const cardMaxWidth = useBreakpointValue({ base: 121, md: 130, lg: 130 }) || 130
  const cardImageHeight = useBreakpointValue({ base: 242, md: 260, lg: 260 }) || 260
  const cardImagePadding = useBreakpointValue({ base: 0.5, md: 0.5, lg: 0.5 }) || 0.5
  const hoverScale = useBreakpointValue({ base: 1.02, md: 1.03 }) || 1.03

  const handleTabSelect = (index) => {
    setActiveTab(index === 1 ? 'import' : 'manual')
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      updateFormData({ designFile: file })
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const filteredCollections = useMemo(() => {
    if (!stylesMeta?.length) return []
    const query = searchTerm.trim().toLowerCase()
    if (!query) return stylesMeta

    return stylesMeta.filter((style) => {
      const styleName = (style.style || '').toLowerCase()
      const variantMatch = Array.isArray(style.styleVariants)
        ? style.styleVariants.some((variant) =>
            (variant.shortName || '').toLowerCase().includes(query),
          )
        : false
      return styleName.includes(query) || variantMatch
    })
  }, [stylesMeta, searchTerm])

  useEffect(() => {
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current)
      fetchDebounceRef.current = null
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.abort()
      activeRequestRef.current = null
    }

    if (!selectedManufacturerId) {
      setStylesMeta([])
      setIsFetchingStyles(false)
      return
    }

    if (stylesCacheRef.current.has(selectedManufacturerId)) {
      setStylesMeta(stylesCacheRef.current.get(selectedManufacturerId) || [])
      setIsFetchingStyles(false)
      return
    }

    const controller = new AbortController()
    activeRequestRef.current = controller
    setIsFetchingStyles(true)
    const manufacturerIdForRequest = selectedManufacturerId

    fetchDebounceRef.current = setTimeout(async () => {
      try {
        const response = await axiosInstance.get(
          `/api/manufacturers/${manufacturerIdForRequest}/styles-meta`,
          { signal: controller.signal },
        )
        let nextStyles = []
        if (response?.data?.styles && Array.isArray(response.data.styles)) {
          nextStyles = response.data.styles
        } else if (Array.isArray(response?.data)) {
          nextStyles = response.data
        }
        stylesCacheRef.current.set(manufacturerIdForRequest, nextStyles)
        setStylesMeta(nextStyles)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching styles meta', error)
          setStylesMeta([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingStyles(false)
        }
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null
        }
        fetchDebounceRef.current = null
      }
    }, 200)

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current)
        fetchDebounceRef.current = null
      }
      controller.abort()
      if (!controller.signal.aborted) {
        setIsFetchingStyles(false)
      }
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null
      }
    }
  }, [selectedManufacturerId])

  return (
    <Box w="full">
      <StandardCard my={4} shadow="md" w="full">
        <CardBody p={{ base: 3, md: 4 }}>
          <Flex justify="space-between" align="center" mb={6} gap={4} flexWrap="wrap">
            <Heading size="md" color={headingColor}>
              {t('proposals.create.design.title')}
            </Heading>
            {!hideBack && (
              <MotionButton
                variant="outline"
                colorScheme="gray"
                onClick={prevStep}
                whileTap={{ scale: 0.98 }}
                minW="90px"
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {t('common.back')}
              </MotionButton>
            )}
          </Flex>

          <Tabs
            index={tabIndex}
            onChange={handleTabSelect}
            variant="enclosed"
            display={{ base: 'none', md: 'block' }}
            mb={6}
          >
            <TabList>
              <Tab>{t('proposals.create.design.tabs.manualEntry')}</Tab>
              <Tab>{t('proposals.create.design.tabs.import2020')}</Tab>
            </TabList>
          </Tabs>

          {activeTab === 'import' ? (
            <Stack spacing={6} align="center" textAlign="center" py={6}>
              <Text color={textColor}>
                {t('proposals.create.design.supportedTypes', { types: '.TXT, .CSV' })}
              </Text>

              <Box
                as="button"
                onClick={handleBrowseClick}
                w="full"
                maxW="520px"
                borderWidth="2px"
                borderStyle="dashed"
                borderRadius="xl"
                bg={dropzoneBg}
                py={10}
                px={6}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
                _hover={{ borderColor: 'brand.400', bg: hoverBg }}
              >
                <Icon as={CloudUpload} boxSize={12} color={iconColor} mb={3} />
                <Text color={textColor} mb={4}>
                  {t('proposals.create.design.selectExportedFile')}
                </Text>
                <MotionButton
                  colorScheme="brand"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBrowseClick}
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  {t('proposals.create.design.selectFileCta')}
                </MotionButton>
                <Input
                  ref={fileInputRef}
                  type="file"
                  display="none"
                  accept=".txt,.csv"
                  onChange={handleFileSelect}
                />
              </Box>

              <MotionButton
                variant="link"
                colorScheme="brand"
                onClick={() => setActiveTab('manual')}
                whileTap={{ scale: 0.98 }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {t('proposals.create.design.no2020SwitchToManual')}
              </MotionButton>

              <Button variant="link" colorScheme="brand" fontSize={{ base: 'sm', md: 'md' }}>
                {t('proposals.create.design.howToExport')}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={6} align="center" py={6}>
              <Input
                placeholder={t('proposals.create.design.searchStylePlaceholder')}
                maxW={{ base: '100%', md: '320px' }}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {isFetchingStyles ? (
                <Spinner size="lg" color="brand.500" />
              ) : filteredCollections.length === 0 ? (
                <Text color={textSecondary} fontStyle="italic">
                  {t('proposals.create.design.noStylesFound', 'No styles found for this search.')}
                </Text>
              ) : (
                <SimpleGrid
                  columns={{ base: 2, sm: 3, md: 4, lg: 5 }}
                  spacing={gridSpacing}
                  w="full"
                  justifyItems="center"
                >
                  {filteredCollections.map((style) => (
                    <Box
                      key={style.id}
                      as="button"
                      type="button"
                      bg="transparent"
                      border="none"
                      position="relative"
                      onMouseEnter={() => setHoveredId(style.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onStyleSelect?.(style.id)}
                      cursor="pointer"
                      mx="auto"
                    >
                      <Box
                        borderRadius="md"
                        overflow="hidden"
                        boxShadow="md"
                        transition="transform 0.2s"
                        transform={hoveredId === style.id ? `scale(${hoverScale})` : 'scale(1)'}
                        w="100%"
                        maxW={`${cardMaxWidth}px`}
                        mx="auto"
                      >
                        <Box
                          w="100%"
                          maxW={`${cardMaxWidth}px`}
                          h={`${cardImageHeight}px`}
                          bg={cardImageBg}
                          borderRadius="md"
                          borderWidth="3px"
                          borderStyle="solid"
                          borderColor={styleCardBorderColor}
                          p={cardImagePadding}
                          position="relative"
                          overflow="hidden"
                        >
                          <Image
                            src={
                              style.styleVariants?.[0]?.image
                                ? buildUploadUrl(`/uploads/images/${style.styleVariants[0].image}`)
                                : '/images/nologo.png'
                            }
                            alt={style.styleVariants?.[0]?.shortName || style.style}
                            w="100%"
                            h="100%"
                            objectFit="fill"
                            loading="lazy"
                            fallbackSrc="/images/nologo.png"
                            onError={(event) => {
                              const fileName = style.styleVariants?.[0]?.image
                              if (fileName && !event.target.dataset.fallbackTried) {
                                event.target.dataset.fallbackTried = '1'
                                event.target.src = buildUploadUrl(
                                  `/uploads/manufacturer_catalogs/${fileName}`,
                                )
                              } else {
                                event.target.src = '/images/nologo.png'
                              }
                            }}
                          />
                        </Box>
                        <Box
                          position="absolute"
                          inset={0}
                          bg="blackAlpha.600"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          opacity={hoveredId === style.id ? 1 : 0}
                          transition="opacity 0.2s"
                          px={3}
                        >
                          <Text color={overlayTextColor} fontWeight="medium" fontSize="sm" textAlign="center">
                            {style.style || t('common.na')}
                          </Text>
                        </Box>
                      </Box>
                      <Box
                        mt={2}
                        w="100%"
                        maxW={`${cardMaxWidth}px`}
                        px={3}
                        py={2}
                        borderRadius="md"
                        bg={styleCardBgUnselected}
                        borderWidth="2px"
                        borderStyle="solid"
                        borderColor={styleCardBorderColor}
                        boxShadow="sm"
                        fontWeight="500"
                        textAlign="center"
                      >
                        <Text fontSize="xs" mb={0} color={styleCardTextColor} noOfLines={1}>
                          {style.styleVariants?.[0]?.shortName || style.style}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Stack>
          )}
        </CardBody>
      </StandardCard>

      {isMobile && (
        <Box
          position="sticky"
          bottom={0}
          bg={stickyBg}
          borderTopWidth="1px"
          boxShadow="md"
          px={4}
          py={3}
          zIndex={1}
        >
          <Stack spacing={3}>
            <MotionButton
              variant={activeTab === 'manual' ? 'solid' : 'outline'}
              colorScheme="brand"
              onClick={() => setActiveTab('manual')}
              whileTap={{ scale: 0.98 }}
              leftIcon={<Icon as={PenSquare} boxSize={ICON_BOX_MD} />}
              minH="44px"
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('proposals.create.design.tabs.manualEntry')}
            </MotionButton>
            <MotionButton
              variant={activeTab === 'import' ? 'solid' : 'outline'}
              colorScheme="brand"
              onClick={() => setActiveTab('import')}
              whileTap={{ scale: 0.98 }}
              leftIcon={<Icon as={UploadCloud} boxSize={ICON_BOX_MD} />}
              minH="44px"
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('proposals.create.design.tabs.import2020')}
            </MotionButton>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default DesignImportStep
