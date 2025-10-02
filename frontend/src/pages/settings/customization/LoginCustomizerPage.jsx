import StandardCard from '../../../components/StandardCard'
import { useState, useEffect } from 'react'
import { Box, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Textarea, Checkbox, Grid, GridItem, Container, Spinner, InputGroup, InputLeftElement, Slider, SliderTrack, SliderFilledTrack, SliderThumb, VStack, HStack, Text, Flex, useToast, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  Settings,
  Palette,
  Type,
  Save,
  Cog,
  TestTube,
  PaintBucket,
  Mail,
} from 'lucide-react'
import axiosInstance from '../../../helpers/axiosInstance'
import LoginPreview from '../../../components/LoginPreview'
import { CUSTOMIZATION_CONFIG as FALLBACK_APP_CUSTOMIZATION } from '../../../config/customization'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const MotionButton = motion(Button)

const DEFAULT_SETTINGS = {
  logo: '',
  logoHeight: 60,
  title: 'Sign In',
  subtitle: 'Enter your email and password to sign in!',
  backgroundColor: "gray.900",
  showForgotPassword: true,
  showKeepLoggedIn: true,
  rightTitle: 'See Your Cabinet Price in Seconds!',
  rightSubtitle: 'CABINET PORTAL',
  rightTagline: 'Dealer Portal',
  rightDescription:
    'Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry. A flexible and component-based B2B solution that can integrate with your existing inventory, accounting, and other systems.',
  requestAccessTitle: 'Request Access',
  requestAccessSubtitle: 'Interested in partnering with NJ Cabinets?',
  requestAccessDescription:
    "Tell us a bit about your business and we'll follow up with onboarding details.",
  requestAccessBenefits: [
    'Generate accurate cabinet quotes in minutes',
    'Submit and track orders from one dashboard',
    'Collaborate directly with our support specialists',
  ],
  requestAccessSuccessMessage: "Thank you! We've received your request and will be in touch soon.",
  requestAccessAdminSubject: 'New Access Request Submitted',
  requestAccessAdminBody:
    'You have a new access request from {{name}} ({{email}}).{{companyLine}}{{messageBlock}}',
  requestAccessLeadSubject: 'We received your request',
  requestAccessLeadBody:
    'Hi {{firstName}},\n\nThank you for your interest in the NJ Cabinets platform. Our team will review your request and reach out shortly with next steps.\n\nIf you have immediate questions, simply reply to this email.\n\n- The NJ Cabinets Team',
  smtpHost: '',
  smtpPort: '',
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  emailFrom: '',
}

const LoginCustomizerPage = () => {
  const APP_CUSTOMIZATION =
    (typeof window !== 'undefined' && window.__APP_CUSTOMIZATION__) || FALLBACK_APP_CUSTOMIZATION
  const { t } = useTranslation()
  const toast = useToast()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')

  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    requestAccessBenefits: [...DEFAULT_SETTINGS.requestAccessBenefits],
  }))
  const [testEmail, setTestEmail] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)

  const normalizeSettings = (incoming = {}) => {
    const merged = {
      ...DEFAULT_SETTINGS,
      requestAccessBenefits: [...DEFAULT_SETTINGS.requestAccessBenefits],
      ...incoming,
    }

    merged.logo = incoming.logo || merged.logo || APP_CUSTOMIZATION.logoImage || ''
    merged.logoHeight =
      Number(incoming.logoHeight ?? merged.logoHeight) || DEFAULT_SETTINGS.logoHeight

    const rawBenefits = incoming.requestAccessBenefits ?? merged.requestAccessBenefits
    merged.requestAccessBenefits = Array.isArray(rawBenefits)
      ? rawBenefits.map((item) => String(item || '').trim()).filter(Boolean)
      : String(rawBenefits || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)

    const coerceField = (value) => (value === undefined || value === null ? '' : String(value))
    merged.smtpHost = coerceField(incoming.smtpHost ?? merged.smtpHost)
    const rawPort = incoming.smtpPort ?? merged.smtpPort
    merged.smtpPort =
      rawPort === undefined || rawPort === null || rawPort === '' ? '' : String(rawPort)
    merged.smtpSecure =
      incoming.smtpSecure !== undefined ? Boolean(incoming.smtpSecure) : Boolean(merged.smtpSecure)
    merged.smtpUser = coerceField(incoming.smtpUser ?? merged.smtpUser)
    merged.smtpPass = coerceField(incoming.smtpPass ?? merged.smtpPass)
    merged.emailFrom = coerceField(incoming.emailFrom ?? merged.emailFrom)

    return merged
  }

  const handleBenefitsChange = (value) => {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    setSettings((prev) => ({ ...prev, requestAccessBenefits: lines }))
  }

  const buildPayload = () => {
    const sanitizedBenefits = (settings.requestAccessBenefits || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)

    const trimmed = (value) => (value === undefined || value === null ? '' : String(value).trim())

    return {
      ...settings,
      requestAccessBenefits: sanitizedBenefits,
      logo: settings.logo || APP_CUSTOMIZATION.logoImage || '',
      logoHeight: Number(settings.logoHeight) || DEFAULT_SETTINGS.logoHeight,
      smtpHost: trimmed(settings.smtpHost),
      smtpPort:
        settings.smtpPort === '' || settings.smtpPort === null || settings.smtpPort === undefined
          ? ''
          : String(settings.smtpPort).trim(),
      smtpSecure: Boolean(settings.smtpSecure),
      smtpUser: trimmed(settings.smtpUser),
      smtpPass:
        settings.smtpPass === undefined || settings.smtpPass === null
          ? ''
          : String(settings.smtpPass),
      emailFrom: trimmed(settings.emailFrom),
    }
  }

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get('/api/login-customization')
        if (res.data.customization) {
          setSettings(normalizeSettings(res.data.customization))
        }
      } catch (err) {
        console.error('Error fetching customization:', err)
        toast({
          title: t('common.error'),
          description: t('settings.customization.login.alerts.loadFailed'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchCustomization()
  }, [t, toast])

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = buildPayload()
      await axiosInstance.post('/api/login-customization', payload)
      setSettings(normalizeSettings(payload))
      toast({
        title: t('common.success'),
        description: t('settings.customization.login.alerts.saveSuccess'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Failed to save customization:', err)
      toast({
        title: t('common.error'),
        description: t('settings.customization.login.alerts.saveFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    const recipient = (testEmail || '').trim()
    if (!recipient) {
      toast({
        title: t('common.error'),
        description: t('settings.customization.login.smtp.testMissingEmail'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    try {
      setTestingEmail(true)
      const payload = buildPayload()
      await axiosInstance.post('/api/login-customization/test-email', {
        email: recipient,
        settings: payload,
      })
      toast({
        title: t('common.success'),
        description: t('settings.customization.login.smtp.testSuccess', { email: recipient }),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('settings.customization.login.smtp.testFailed')
      toast({
        title: t('common.error'),
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setTestingEmail(false)
    }
  }

  const getCharCount = (text, max) => {
    const count = text?.length || 0
    const isOverLimit = count > max
    return (
      <small className={`text-${isOverLimit ? 'danger' : 'muted'}`}>
        {/* {count}/{max} characters */}
      </small>
    )
  }

  return (
    <Container
      maxW="full"
      bg={bgColor}
      minH="100vh"
      p={4}
      className="main-div-custom-login"
    >
      <PageHeader
        title={t('settings.customization.login.headerTitle')}
        subtitle={t('settings.customization.login.headerSubtitle')}
        icon={Cog}
      >
        <MotionButton
          variant="outline"
          colorScheme="gray"
          size="md"
          leftIcon={<Save size={ICON_SIZE_MD} />}
          onClick={() => setShowPreview(true)}
          isDisabled={loading}
          whileTap={{ scale: 0.98 }}
          aria-label={t('settings.customization.login.buttons.preview')}
        >
          {t('settings.customization.login.buttons.preview')}
        </MotionButton>
        <MotionButton
          variant="solid"
          colorScheme="green"
          size="md"
          leftIcon={saving ? <Spinner size="sm" /> : <Save size={ICON_SIZE_MD} />}
          onClick={handleSave}
          isDisabled={loading || saving}
          isLoading={saving}
          loadingText={t('settings.customization.login.buttons.saving')}
          whileTap={{ scale: 0.98 }}
          aria-label={t('settings.customization.login.buttons.saveSettings')}
        >
          {t('settings.customization.login.buttons.saveSettings')}
        </MotionButton>
      </PageHeader>

      {loading && (
        <StandardCard bg={cardBg} shadow="sm" borderWidth="0">
          <CardBody textAlign="center" py={8}>
            <Spinner color="blue.500" size="lg" />
            <Text color="gray.500" mt={3} mb={0}>
              {t('settings.customization.login.loading')}
            </Text>
          </CardBody>
        </StandardCard>
      )}

      {!loading && (
        <StandardCard bg={cardBg} shadow="sm" borderWidth="0">
          <CardBody>
            <Box as="form">
              <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                <GridItem>
                  <VStack align="stretch" spacing={6}>
                    <Flex align="center" gap={4}>
                      <Flex
                        align="center"
                        justify="center"
                        w="32px"
                        h="32px"
                        bg="blue.50"
                        borderRadius="8px"
                      >
                        <Type size={ICON_SIZE_MD} color="blue.500" />
                      </Flex>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {t('settings.customization.login.form.title')}
                      </Text>
                    </Flex>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.form.loginTitle')}
                      </FormLabel>
                      <Input
                        value={settings.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder={t('settings.customization.login.form.placeholders.title')}
                        borderRadius="8px"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      />
                      {getCharCount(settings.title, 50)}
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.form.loginSubtitle')}
                      </FormLabel>
                      <Input
                        value={settings.subtitle}
                        onChange={(e) => handleChange('subtitle', e.target.value)}
                        placeholder={t('settings.customization.login.form.placeholders.subtitle')}
                        borderRadius="8px"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      />
                      {getCharCount(settings.subtitle, 100)}
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.form.backgroundColor')}
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement w="60px">
                          <input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            style={{
                              width: '40px',
                              height: '30px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          />
                        </InputLeftElement>
                        <Input
                          pl="70px"
                          value={settings.backgroundColor}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          placeholder="black"
                          borderRadius="8px"
                          borderColor="gray.200"
                          fontSize="sm"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.logoSize.label')}
                      </FormLabel>
                      <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} gap={4}>
                        <Slider
                          min={32}
                          max={160}
                          step={1}
                          value={Number(settings.logoHeight) || 60}
                          onChange={(value) => handleChange('logoHeight', Number(value))}
                          aria-label={t('settings.customization.login.logoSize.aria')}
                          flex="1"
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text fontWeight="semibold" color="gray.500" minW="60px" textAlign="center">
                          {Math.round(Number(settings.logoHeight) || 60)}px
                        </Text>
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={3}>
                        {t('settings.customization.login.options.title')}
                      </FormLabel>
                      <VStack spacing={4} align="stretch">
                        <Box p={3} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="8px">
                          <Checkbox
                            isChecked={settings.showForgotPassword}
                            onChange={(e) => handleChange('showForgotPassword', e.target.checked)}
                            id="forgotPassword"
                            mb={1}
                          >
                            {t('settings.customization.login.options.showForgot')}
                          </Checkbox>
                          <Text fontSize="sm" color="gray.500">
                            {t('settings.customization.login.options.showForgotHint')}
                          </Text>
                        </Box>

                        <Box p={3} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="8px">
                          <Checkbox
                            isChecked={settings.showKeepLoggedIn}
                            onChange={(e) => handleChange('showKeepLoggedIn', e.target.checked)}
                            id="keepLoggedIn"
                            mb={1}
                          >
                            {t('settings.customization.login.options.showKeep')}
                          </Checkbox>
                          <Text fontSize="sm" color="gray.500">
                            {t('settings.customization.login.options.showKeepHint')}
                          </Text>
                        </Box>
                      </VStack>
                    </FormControl>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="stretch" spacing={6}>
                    <Flex align="center" gap={4}>
                      <Flex
                        align="center"
                        justify="center"
                        w="32px"
                        h="32px"
                        bg="green.50"
                        borderRadius="8px"
                      >
                        <Palette size={ICON_SIZE_MD} color="green.600" />
                      </Flex>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {t('settings.customization.login.rightPanel.title')}
                      </Text>
                    </Flex>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.rightPanel.panelTitle')}
                      </FormLabel>
                      <Input
                        value={settings.rightTitle}
                        onChange={(e) => handleChange('rightTitle', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.title')}
                        borderRadius="8px"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      />
                      {getCharCount(settings.rightTitle, 50)}
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.rightPanel.panelSubtitle')}
                      </FormLabel>
                      <Input
                        value={settings.rightSubtitle}
                        onChange={(e) => handleChange('rightSubtitle', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.subtitle')}
                        borderRadius="8px"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      />
                      {getCharCount(settings.rightSubtitle, 80)}
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.rightPanel.tagline')}
                      </FormLabel>
                      <Input
                        value={settings.rightTagline}
                        onChange={(e) => handleChange('rightTagline', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.tagline')}
                        borderRadius="8px"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      />
                      {getCharCount(settings.rightTagline, 30)}
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                        {t('settings.customization.login.rightPanel.description')}
                      </FormLabel>
                      <Textarea
                        rows={5}
                        value={settings.rightDescription}
                        onChange={(e) => handleChange('rightDescription', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.description')}
                        borderRadius="8px"
                        borderColor="gray.200"
                        fontSize="sm"
                        resize="vertical"
                        _hover={{ borderColor: 'gray.300' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      />
                      {getCharCount(settings.rightDescription, 500)}
                    </FormControl>
                  </VStack>
                </GridItem>
              </Grid>

              <Box mt={6}>
                <VStack align="stretch" spacing={6}>
                  <Flex align="center" gap={4}>
                    <Flex
                      align="center"
                      justify="center"
                      w="32px"
                      h="32px"
                      bg="blue.50"
                      borderRadius="8px"
                    >
                      <Settings size={ICON_SIZE_MD} color="blue.600" />
                    </Flex>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      {t('settings.customization.login.smtp.title')}
                    </Text>
                  </Flex>

                  <Text color="gray.500" mb={4}>
                    {t('settings.customization.login.smtp.subtitle')}
                  </Text>

                  <Grid templateColumns={{ base: '1fr', md: 'repeat(6, 1fr)' }} gap={4}>
                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.smtp.host')}
                        </FormLabel>
                        <Input
                          value={settings.smtpHost}
                          onChange={(e) => handleChange('smtpHost', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.host')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.smtp.port')}
                        </FormLabel>
                        <Input
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => handleChange('smtpPort', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.port')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={1} display="flex" alignItems="end">
                      <FormControl>
                        <Checkbox
                          isChecked={Boolean(settings.smtpSecure)}
                          onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                          mb={3}
                        >
                          {t('settings.customization.login.smtp.secure')}
                        </Checkbox>
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.smtp.user')}
                        </FormLabel>
                        <Input
                          value={settings.smtpUser}
                          onChange={(e) => handleChange('smtpUser', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.user')}
                          autoComplete="username"
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.smtp.pass')}
                        </FormLabel>
                        <Input
                          type="password"
                          value={settings.smtpPass}
                          onChange={(e) => handleChange('smtpPass', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.pass')}
                          autoComplete="new-password"
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.smtp.from')}
                        </FormLabel>
                        <Input
                          value={settings.emailFrom}
                          onChange={(e) => handleChange('emailFrom', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.from')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <Box borderTop="1px" borderColor="gray.200" pt={4} mt={4}>
                    <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'end' }} gap={4}>
                      <Box flex="1">
                        <FormControl>
                          <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                            {t('settings.customization.login.smtp.testLabel')}
                          </FormLabel>
                          <Input
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder={t('settings.customization.login.smtp.testPlaceholder')}
                            borderRadius="8px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'gray.300' }}
                            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                          />
                        </FormControl>
                      </Box>
                      <Box>
                        <MotionButton
                          variant="solid"
                          colorScheme="blue"
                          isDisabled={testingEmail}
                          isLoading={testingEmail}
                          loadingText={t('settings.customization.login.smtp.testing')}
                          leftIcon={testingEmail ? <Spinner size="sm" /> : <TestTube size={ICON_SIZE_MD} />}
                          onClick={handleSendTestEmail}
                          whileTap={{ scale: 0.98 }}
                          aria-label={t('settings.customization.login.smtp.testButton')}
                          mt={{ base: 3, md: 0 }}
                        >
                          {t('settings.customization.login.smtp.testButton')}
                        </MotionButton>
                      </Box>
                    </Flex>
                  </Box>
                </VStack>
              </Box>

              <Box mt={6}>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                  <GridItem>
                    <VStack align="stretch" spacing={6}>
                      <Flex align="center" gap={4}>
                        <Flex
                          align="center"
                          justify="center"
                          w="32px"
                          h="32px"
                          bg="orange.50"
                          borderRadius="8px"
                        >
                          <PaintBucket size={ICON_SIZE_MD} color="orange.400" />
                        </Flex>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                          {t('settings.customization.login.requestAccess.title')}
                        </Text>
                      </Flex>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.pageTitle')}
                        </FormLabel>
                        <Input
                          value={settings.requestAccessTitle}
                          onChange={(e) => handleChange('requestAccessTitle', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.pageTitle')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.subtitle')}
                        </FormLabel>
                        <Input
                          value={settings.requestAccessSubtitle}
                          onChange={(e) => handleChange('requestAccessSubtitle', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.subtitle')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.description')}
                        </FormLabel>
                        <Textarea
                          rows={4}
                          value={settings.requestAccessDescription}
                          onChange={(e) => handleChange('requestAccessDescription', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.description')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          resize="vertical"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.benefits')}
                        </FormLabel>
                        <Textarea
                          rows={5}
                          value={(settings.requestAccessBenefits || []).join('\n')}
                          onChange={(e) => handleBenefitsChange(e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.benefits')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          resize="vertical"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          {t('settings.customization.login.requestAccess.benefitsHint')}
                        </Text>
                      </FormControl>
                    </VStack>
                  </GridItem>

                  <GridItem>
                    <VStack align="stretch" spacing={6}>
                      <Flex align="center" gap={4}>
                        <Flex
                          align="center"
                          justify="center"
                          w="32px"
                          h="32px"
                          bg="blue.50"
                          borderRadius="8px"
                        >
                          <Mail size={ICON_SIZE_MD} color="blue.700" />
                        </Flex>
                        <Text fontSize="lg" fontWeight="bold" color="gray.800">
                          {t('settings.customization.login.requestAccess.requestEmails')}
                        </Text>
                      </Flex>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.successMessage')}
                        </FormLabel>
                        <Input
                          value={settings.requestAccessSuccessMessage}
                          onChange={(e) => handleChange('requestAccessSuccessMessage', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.successMessage')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.leadEmailSubject')}
                        </FormLabel>
                        <Input
                          value={settings.requestAccessLeadSubject}
                          onChange={(e) => handleChange('requestAccessLeadSubject', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.leadEmailSubject')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.leadEmailBody')}
                        </FormLabel>
                        <Textarea
                          rows={6}
                          value={settings.requestAccessLeadBody}
                          onChange={(e) => handleChange('requestAccessLeadBody', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.leadEmailBody')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          resize="vertical"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          {t('settings.customization.login.requestAccess.placeholdersAvailable')}{' '}
                          {'{{firstName}}'}, {'{{name}}'}, {'{{email}}'}
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.adminEmailSubject')}
                        </FormLabel>
                        <Input
                          value={settings.requestAccessAdminSubject}
                          onChange={(e) => handleChange('requestAccessAdminSubject', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.adminEmailSubject')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          {t('settings.customization.login.requestAccess.adminEmailBody')}
                        </FormLabel>
                        <Textarea
                          rows={6}
                          value={settings.requestAccessAdminBody}
                          onChange={(e) => handleChange('requestAccessAdminBody', e.target.value)}
                          placeholder={t('settings.customization.login.requestAccess.placeholders.adminEmailBody')}
                          borderRadius="8px"
                          borderColor="gray.200"
                          resize="vertical"
                          _hover={{ borderColor: 'gray.300' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                        />
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          {t('settings.customization.login.requestAccess.placeholdersAvailable')}{' '}
                          {'{{name}}'}, {'{{email}}'}, {'{{companyLine}}'}, {'{{messageBlock}}'}
                        </Text>
                      </FormControl>
                    </VStack>
                  </GridItem>
                </Grid>
              </Box>
            </Box>
          </CardBody>
        </StandardCard>
      )}

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        size="full"
        scrollBehavior="inside"
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent borderRadius="0" border="none" className="login-preview-modal">
          <ModalHeader
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={3}
            borderBottom="1px"
            borderColor="gray.200"
          >
            <Text fontSize="lg" fontWeight="bold" mb={0}>
              {t('settings.customization.login.previewTitle')}
            </Text>
            <MotionButton
              variant="ghost"
              colorScheme="gray"
              size="sm"
              onClick={() => setShowPreview(false)}
              whileTap={{ scale: 0.95 }}
              aria-label={t('settings.customization.login.closePreview')}
              borderRadius="6px"
            >
              {t('settings.customization.login.closePreview')}
            </MotionButton>
          </ModalHeader>
          <ModalBody p={0}>
            <LoginPreview config={settings} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default LoginCustomizerPage
