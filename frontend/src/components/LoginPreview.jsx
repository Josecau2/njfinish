import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react'
import { Eye, EyeOff } from '@/icons-lucide'
import { getContrastColor, getOptimalColors } from '../utils/colorUtils'
import { resolveAssetUrl } from '../utils/assetUtils'
import { CUSTOMIZATION_CONFIG as FALLBACK_APP_CUSTOMIZATION } from '../config/customization'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'

const LoginPreview = ({ config }) => {
  const { t } = useTranslation()
  const [activeView, setActiveView] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const customizationState = useSelector((state) => state.customization)
  const apiUrl = import.meta.env.VITE_API_URL
  const resolvedAppCustomization =
    customizationState && Object.keys(customizationState).length
      ? customizationState
      : FALLBACK_APP_CUSTOMIZATION

  useEffect(() => {
    if (activeView === 'forgot' && !config.showForgotPassword) {
      setActiveView('login')
    }
  }, [activeView, config.showForgotPassword])

  const headerBg = config.headerBg || "purple.500"
  const buttonTextColor = getContrastColor(headerBg)
  const marketingColors = useMemo(
    () => getOptimalColors(config.backgroundColor || "gray.900"),
    [config.backgroundColor],
  )
  const rawLogo = config.logo || resolvedAppCustomization.logoImage || ''
  const brandLogo = useMemo(() => resolveAssetUrl(rawLogo, apiUrl), [rawLogo, apiUrl])
  const logoHeight = Number(config.logoHeight) || Number(resolvedAppCustomization.logoHeight) || 60

  const previewOptions = useMemo(
    () => [
      { key: 'login', label: 'Login' },
      { key: 'forgot', label: 'Forgot Password', disabled: !config.showForgotPassword },
      { key: 'request', label: 'Request Access' },
    ],
    [config.showForgotPassword],
  )

  const benefits = useMemo(() => {
    if (Array.isArray(config.requestAccessBenefits)) {
      return config.requestAccessBenefits.map((item) => String(item || '').trim()).filter(Boolean)
    }
    if (typeof config.requestAccessBenefits === 'string') {
      return config.requestAccessBenefits
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return []
  }, [config.requestAccessBenefits])

  const ButtonLike = ({ children, ...props }) => (
    <Button
      w="full"
      minH="44px"
      border="none"
      _hover={{ bg: headerBg }}
      _active={{ bg: headerBg }}
      bg={headerBg}
      color={buttonTextColor}
      {...props}
    >
      {children}
    </Button>
  )

  const PreviewWrapper = ({ children }) => (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      minH={{ lg: '75vh' }}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="lg"
      overflow="hidden"
      bg={useColorModeValue("gray.50","gray.800")}
    >
      {children}
    </Flex>
  )

  const MarketingPanel = () => (
    <Flex
      align="center"
      justify="center"
      w={{ base: '100%', lg: '50%' }}
      px={{ base: 6, lg: 12 }}
      py={{ base: 10, lg: 12 }}
      bg={config.backgroundColor || "gray.900"}
    >
      <Stack spacing={4} textAlign="center" maxW="md">
        <Heading size="lg" color={marketingColors.text} fontWeight="bold">
          {config.rightTitle}
        </Heading>
        {config.rightSubtitle && (
          <Text color={marketingColors.subtitle}>{config.rightSubtitle}</Text>
        )}
        {config.rightTagline && (
          <Text color={marketingColors.subtitle}>{config.rightTagline}</Text>
        )}
        {config.rightDescription && (
          <Text color={marketingColors.subtitle}>{config.rightDescription}</Text>
        )}
      </Stack>
    </Flex>
  )

  const renderLoginForm = () => (
    <Stack spacing={6} w="full" maxW="400px">
      {brandLogo && (
        <Image
          src={brandLogo}
          alt='Logo preview'
          h={`${logoHeight}px`}
          objectFit='contain'
          mb={2}
        />
      )}
      <Stack spacing={4}>
        <Heading size='md'>{config.title}</Heading>
        <Text color='gray.500'>{config.subtitle}</Text>
      </Stack>
      <Stack
        as='form'
        spacing={4}
        onSubmit={(event) => event.preventDefault()}
      >
        <FormControl>
          <FormLabel htmlFor='login-preview-email'>{t('auth.email')}</FormLabel>
          <Input id='login-preview-email' type='email' isDisabled />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor='login-preview-password'>{t('auth.password')}</FormLabel>
          <InputGroup>
            <Input
              id='login-preview-password'
              type={showPassword ? 'text' : 'password'}
              isDisabled
            />
            <InputRightElement>
              <IconButton
                minW="44px"
                minH="44px"
                variant='ghost'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={<Icon as={showPassword ? EyeOff : Eye} boxSize={ICON_BOX_MD} />}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Flex justify='space-between' align='center' fontSize='sm' color='gray.600'>
          {config.showKeepLoggedIn && (
            <Checkbox isDisabled>{t('auth.keepMeLoggedIn')}</Checkbox>
          )}
          {config.showForgotPassword && (
            <Text color='brand.600' fontWeight='semibold'>Forgot password?</Text>
          )}
        </Flex>
        <ButtonLike aria-label='Sign in (preview only)' isDisabled>
          {t('auth.signIn')}
        </ButtonLike>
      </Stack>
    </Stack>
  )

  const renderForgotPasswordForm = () => (
    <Stack spacing={6} w='full' maxW='420px'>
      {brandLogo && (
        <Image
          src={brandLogo}
          alt='Logo preview'
          h={`${logoHeight}px`}
          objectFit='contain'
          mb={2}
        />
      )}
      <Stack spacing={4}>
        <Heading size='md'>{t('auth.forgotPassword.title')}</Heading>
        <Text color='gray.500'>{t('auth.forgotPassword.subtitle')}</Text>
      </Stack>
      <Stack as='form' spacing={4} onSubmit={(event) => event.preventDefault()}>
        <FormControl>
          <FormLabel htmlFor='login-preview-forgot-email'>{t('auth.forgotPassword.emailLabel')}</FormLabel>
          <Input id='login-preview-forgot-email' type='email' isDisabled />
        </FormControl>
        <ButtonLike isDisabled>{t('auth.forgotPassword.submit')}</ButtonLike>
      </Stack>
      <Text color='gray.500' fontSize='sm'>
        {t('auth.forgotPassword.remember')}{' '}
        <Text as='span' color='brand.600' fontWeight='semibold'>{t('auth.signIn')}</Text>
      </Text>
    </Stack>
  )

  const renderRequestAccessForm = () => (
    <Stack spacing={6} w='full' maxW='520px'>
      {brandLogo && (
        <Image
          src={brandLogo}
          alt='Logo preview'
          h={`${logoHeight}px`}
          objectFit='contain'
          mb={2}
        />
      )}
      <Stack spacing={4}>
        <Heading size='md'>{config.requestAccessTitle || 'Request Access'}</Heading>
        {config.requestAccessSubtitle && (
          <Text color='gray.500'>{config.requestAccessSubtitle}</Text>
        )}
        {config.requestAccessDescription && (
          <Text color='gray.500'>{config.requestAccessDescription}</Text>
        )}
      </Stack>
      {benefits.length > 0 && (
        <Stack spacing={4} fontSize='sm' color='gray.600'>
          <Text fontWeight='medium'>{t('auth.benefits')}</Text>
          <Stack spacing={4} pl={2}>
            {benefits.map((item, index) => (
              <Text key={index}>• {item}</Text>
            ))}
          </Stack>
        </Stack>
      )}
      <Stack as='form' spacing={4} onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel htmlFor='login-preview-first'>{t('auth.firstName')}</FormLabel>
            <Input id='login-preview-first' placeholder='Jane' isDisabled />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-last'>{t('auth.lastName')}</FormLabel>
            <Input id='login-preview-last' placeholder='Doe' isDisabled />
          </FormControl>
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-email'>{t('auth.email')}</FormLabel>
            <Input
              id='login-preview-req-email'
              placeholder='dealer@example.com'
              isDisabled
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-phone'>{t('auth.phone')}</FormLabel>
            <Input
              id='login-preview-req-phone'
              placeholder='(555) 123-4567'
              isDisabled
            />
          </FormControl>
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-city'>{t('auth.city')}</FormLabel>
            <Input id='login-preview-req-city' placeholder='City' isDisabled />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-state'>{t('auth.state')}</FormLabel>
            <Input id='login-preview-req-state' placeholder='NJ' isDisabled />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-zip'>{t('auth.zip')}</FormLabel>
            <Input id='login-preview-req-zip' placeholder='07030' isDisabled />
          </FormControl>
        </SimpleGrid>
        <FormControl>
          <FormLabel htmlFor='login-preview-req-company'>{t('auth.company')}</FormLabel>
          <Input
            id='login-preview-req-company'
            placeholder='Your business name'
            isDisabled
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor='login-preview-req-about'>{t('auth.projectDescription')}</FormLabel>
          <Textarea
            id='login-preview-req-about'
            rows={3}
            placeholder='Share a brief overview'
            isDisabled
          />
        </FormControl>
        <ButtonLike isDisabled>{t('auth.submitRequest')}</ButtonLike>
      </Stack>
    </Stack>
  )

  const renderActiveView = () => {
    switch (activeView) {
      case 'forgot':
        return renderForgotPasswordForm()
      case 'request':
        return renderRequestAccessForm()
      case 'login':
      default:
        return renderLoginForm()
    }
  }

  return (
    <Stack spacing={6}>
      <Flex justify='center' wrap='wrap' gap={4}>
        {previewOptions.map((option) => (
          <Button
            key={option.key}
            size='sm'
            variant={activeView === option.key ? 'solid' : 'outline'}
            colorScheme='brand'
            onClick={() => !option.disabled && setActiveView(option.key)}
            isDisabled={option.disabled}
          >
            {option.label}
          </Button>
        ))}
      </Flex>
      <PreviewWrapper>
        <Flex
          align='center'
          justify='center'
          w={{ base: '100%', lg: '50%' }}
          px={{ base: 6, lg: 12 }}
          py={{ base: 10, lg: 12 }}
          bg='white'
        >
          {renderActiveView()}
        </Flex>
        <MarketingPanel />
      </PreviewWrapper>
    </Stack>
  )
}

export default LoginPreview
