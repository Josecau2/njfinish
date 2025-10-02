import StandardCard from '../../../components/StandardCard'

import React, { useEffect, useRef, useState } from 'react'
import { Alert, AlertIcon, Box, Button, CardBody, Container, Flex, FormControl, FormLabel, HStack, Icon, Input, SimpleGrid, Spinner, Stack, Text, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import { useDispatch, useSelector } from 'react-redux'
import { Settings, Image, Palette, Save, Trash } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import PageHeader from '../../../components/PageHeader'
import { setCustomization } from '../../../store/slices/customizationSlice'
import axiosInstance from '../../../helpers/axiosInstance'
import { resolveBrandAssetUrl } from '../../../utils/brandAssets'
import { getContrastColor } from '../../../utils/colorUtils'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const ColorField = ({ label, name, value, onChange }) => (
  <FormControl>
    <FormLabel fontSize="sm" fontWeight="medium" color="gray.600">
      {label}
    </FormLabel>
    <HStack spacing={4} align="center">
      <Input
        type="color"
        name={name}
        value={value || "white"}
        onChange={onChange}
        w="48px"
        h="48px"
        p={0}
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        cursor="pointer"
      />
      <Box
        px={3}
        py={1}
        borderRadius="md"
        fontFamily="mono"
        fontSize="sm"
        borderWidth="1px"
        borderColor="gray.200"
        bg="gray.50"
        color="gray.600"
      >
        {value || "white"}
      </Box>
    </HStack>
  </FormControl>
)

const CustomizationPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const customization = useSelector((state) => state.customization)

  const [formData, setFormData] = useState(customization)
  const [previewLogo, setPreviewLogo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileInputRef = useRef(null)

  useEffect(() => {
    setFormData(customization)
    const resolved = resolveBrandAssetUrl(customization.logoImage)
    setPreviewLogo(resolved || null)
  }, [customization])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('settings.customization.ui.alerts.fileTooLarge') })
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('settings.customization.ui.alerts.invalidImage') })
      return
    }

    setFormData((prev) => ({ ...prev, logoImage: file }))
    setPreviewLogo(URL.createObjectURL(file))
    setMessage({ type: '', text: '' })
  }

  const handleRemoveLogo = async () => {
    try {
      setLoading(true)
      if (customization.logoImage) {
        await axiosInstance.delete('/api/settings/customization/logo')
      }
      setFormData((prev) => ({ ...prev, logoImage: '' }))
      setPreviewLogo(null)
      dispatch(setCustomization({ ...customization, logoImage: '' }))
      setMessage({ type: 'success', text: t('settings.customization.ui.alerts.removeLogoSuccess') })
    } catch (error) {
      console.error('Failed to remove logo:', error)
      setMessage({ type: 'error', text: t('settings.customization.ui.alerts.removeLogoFailed') })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setMessage({ type: '', text: '' })

      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value ?? '')
      })

      await axiosInstance.post('/api/settings/customization', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const { data } = await axiosInstance.get('/api/settings/customization')
      dispatch(setCustomization(data))
      setMessage({ type: 'success', text: t('settings.customization.ui.alerts.saveSuccess') })
    } catch (err) {
      console.error('Failed to save customization:', err)
      setMessage({ type: 'error', text: t('settings.customization.ui.alerts.saveFailed') })
    } finally {
      setLoading(false)
    }
  }

  const alertStatus = message.type === 'success' ? 'success' : message.type === 'error' ? 'error' : 'info'

  const headerBg = formData.headerBg || customization.headerBg || "purple.500"
  const headerTextColor = getContrastColor(headerBg)

  return (
    <PageContainer>
      <PageHeader
        title={t('settings.customization.ui.headerTitle')}
        subtitle={t('settings.customization.ui.headerSubtitle')}
        icon={Settings}
        actions={[
          <Button
            key="save"
            leftIcon={<Icon as={Save} boxSize={ICON_BOX_MD} aria-hidden="true" />}
            colorScheme="blue"
            onClick={handleSave}
            isLoading={loading}
            minH="44px"
          >
            {loading
              ? t('settings.customization.ui.buttons.saving')
              : t('settings.customization.ui.buttons.saveChanges')}
          </Button>,
        ]}
      />

      <Stack spacing={6}>
        {message.text && (
          <Alert status={alertStatus} borderRadius="lg">
            <AlertIcon />
            <Text>{message.text}</Text>
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="stretch">
          <StandardCard variant="outline" borderRadius="xl" shadow="sm">
            <CardBody>
              <Stack spacing={5}>
                <Stack direction="row" align="center" spacing={4}>
                  <Flex
                    align="center"
                    justify="center"
                    w="48px"
                    h="48px"
                    borderRadius="lg"
                    bg="blue.50"
                    color="blue.600"
                  >
                    <Icon as={Image} boxSize={ICON_BOX_MD} aria-hidden="true" />
                  </Flex>
                  <Box>
                    <Text fontWeight="semibold" fontSize="lg" color="gray.800">
                      {t('settings.customization.ui.brandLogo.title')}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {t('settings.customization.ui.brandLogo.subtitle')}
                    </Text>
                  </Box>
                </Stack>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                    {t('settings.customization.ui.brandLogo.labels.logoText')}
                  </FormLabel>
                  <Input
                    name="logoText"
                    value={formData.logoText || ''}
                    onChange={handleChange}
                    placeholder={t('settings.customization.ui.brandLogo.placeholders.logoText')}
                    minH="44px"
                  />
                </FormControl>

                <Box>
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    display="none"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    leftIcon={<Icon as={Image} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                    onClick={() => fileInputRef.current?.click()}
                    minH="44px"
                  >
                    {t('settings.customization.ui.brandLogo.chooseImageCta')}
                  </Button>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {t('settings.customization.ui.brandLogo.supportedTypes')}
                  </Text>
                </Box>

                {previewLogo && (
                  <Flex
                    align="center"
                    gap={4}
                    p={4}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    bg="gray.50"
                  >
                    <Box as="img" src={previewLogo} alt={t('settings.customization.ui.brandLogo.alt.logoPreview')} h="48px" borderRadius="md" shadow="sm" />
                    <Button
                      variant="outline"
                      colorScheme="red"
                      leftIcon={<Icon as={Trash} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                      onClick={handleRemoveLogo}
                      minH="44px"
                      isLoading={loading}
                    >
                      {t('settings.customization.ui.brandLogo.labels.removeLogo')}
                    </Button>
                  </Flex>
                )}
              </Stack>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline" borderRadius="xl" shadow="sm">
            <CardBody>
              <Stack spacing={5}>
                <Stack direction="row" align="center" spacing={4}>
                  <Flex
                    align="center"
                    justify="center"
                    w="48px"
                    h="48px"
                    borderRadius="lg"
                    bg="purple.50"
                    color="purple.600"
                  >
                    <Icon as={Palette} boxSize={ICON_BOX_MD} aria-hidden="true" />
                  </Flex>
                  <Box>
                    <Text fontWeight="semibold" fontSize="lg" color="gray.800">
                      {t('settings.customization.ui.colorPalette.title')}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {t('settings.customization.ui.colorPalette.subtitle')}
                    </Text>
                  </Box>
                </Stack>

                <Stack spacing={6}>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                      {t('settings.customization.ui.colorPalette.headerTitle')}
                    </Text>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <ColorField
                        label={t('settings.customization.ui.colorPalette.labels.logoBg')}
                        name="logoBg"
                        value={formData.logoBg}
                        onChange={handleChange}
                      />
                      <ColorField
                        label={t('settings.customization.ui.colorPalette.labels.headerBg')}
                        name="headerBg"
                        value={formData.headerBg}
                        onChange={handleChange}
                      />
                      <ColorField
                        label={t('settings.customization.ui.colorPalette.labels.headerText')}
                        name="headerFontColor"
                        value={formData.headerFontColor}
                        onChange={handleChange}
                      />
                    </SimpleGrid>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                      {t('settings.customization.ui.colorPalette.sidebarTitle')}
                    </Text>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <ColorField
                        label={t('settings.customization.ui.colorPalette.labels.sidebarBg')}
                        name="sidebarBg"
                        value={formData.sidebarBg}
                        onChange={handleChange}
                      />
                      <ColorField
                        label={t('settings.customization.ui.colorPalette.labels.sidebarText')}
                        name="sidebarFontColor"
                        value={formData.sidebarFontColor}
                        onChange={handleChange}
                      />
                    </SimpleGrid>
                  </Box>

                  <Box borderRadius="md" p={4} bg={headerBg} color={headerTextColor} data-preview-header>
                    <Text fontWeight="semibold">{t('settings.customization.ui.preview.header')}</Text>
                    <Text fontSize="sm">
                      {t('settings.customization.ui.preview.description')}
                    </Text>
                  </Box>
                </Stack>
              </Stack>
            </CardBody>
          </StandardCard>
        </SimpleGrid>
      </Stack>
    </PageContainer>
  )
}

export default CustomizationPage
