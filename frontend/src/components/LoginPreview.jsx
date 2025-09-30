import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
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
} from '@chakra-ui/react'
import { Eye, EyeOff } from '@/icons-lucide'
import { getContrastColor, getOptimalColors } from '../utils/colorUtils'
import { resolveAssetUrl } from '../utils/assetUtils'
import { CUSTOMIZATION_CONFIG as FALLBACK_APP_CUSTOMIZATION } from '../config/customization'

const LoginPreview = ({ config }) => {
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

  const headerBg = config.headerBg || '#667eea'
  const buttonTextColor = getContrastColor(headerBg)
  const marketingColors = useMemo(
    () => getOptimalColors(config.backgroundColor || '#0e1446'),
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
      bg="gray.50"
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
      bg={config.backgroundColor || '#0e1446'}
    >
      <Stack spacing={3} textAlign="center" maxW="md">
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
      <Stack spacing={1}>
        <Heading size='md'>{config.title}</Heading>
        <Text color='gray.500'>{config.subtitle}</Text>
      </Stack>
      <Stack
        as='form'
        spacing={4}
        onSubmit={(event) => event.preventDefault()}
      >
        <FormControl>
          <FormLabel htmlFor='login-preview-email'>Email</FormLabel>
          <Input id='login-preview-email' type='email' isDisabled />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor='login-preview-password'>Password</FormLabel>
          <InputGroup>
            <Input
              id='login-preview-password'
              type={showPassword ? 'text' : 'password'}
              isDisabled
            />
            <InputRightElement>
              <IconButton
                variant='ghost'
                size='sm'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={<Icon as={showPassword ? EyeOff : Eye} boxSize={4} />}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Flex justify='space-between' align='center' fontSize='sm' color='gray.600'>
          {config.showKeepLoggedIn && (
            <Checkbox isDisabled>Keep me logged in</Checkbox>
          )}
          {config.showForgotPassword && (
            <Text color='brand.600' fontWeight='semibold'>Forgot password?</Text>
          )}
        </Flex>
        <ButtonLike aria-label='Sign in (preview only)' isDisabled>
          Sign in
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
      <Stack spacing={1}>
        <Heading size='md'>Reset your password</Heading>
        <Text color='gray.500'>Enter the email you use to sign in and we'll send reset instructions.</Text>
      </Stack>
      <Stack as='form' spacing={4} onSubmit={(event) => event.preventDefault()}>
        <FormControl>
          <FormLabel htmlFor='login-preview-forgot-email'>Email</FormLabel>
          <Input id='login-preview-forgot-email' type='email' isDisabled />
        </FormControl>
        <ButtonLike isDisabled>Send reset email</ButtonLike>
      </Stack>
      <Text color='gray.500' fontSize='sm'>
        Remembered your password?{' '}
        <Text as='span' color='brand.600' fontWeight='semibold'>Sign in</Text>
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
      <Stack spacing={1}>
        <Heading size='md'>{config.requestAccessTitle || 'Request Access'}</Heading>
        {config.requestAccessSubtitle && (
          <Text color='gray.500'>{config.requestAccessSubtitle}</Text>
        )}
        {config.requestAccessDescription && (
          <Text color='gray.500'>{config.requestAccessDescription}</Text>
        )}
      </Stack>
      {benefits.length > 0 && (
        <Stack spacing={1} fontSize='sm' color='gray.600'>
          <Text fontWeight='medium'>Benefits</Text>
          <Stack spacing={1} pl={2}>
            {benefits.map((item, index) => (
              <Text key={index}>• {item}</Text>
            ))}
          </Stack>
        </Stack>
      )}
      <Stack as='form' spacing={4} onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl>
            <FormLabel htmlFor='login-preview-first'>First name</FormLabel>
            <Input id='login-preview-first' placeholder='Jane' isDisabled />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-last'>Last name</FormLabel>
            <Input id='login-preview-last' placeholder='Doe' isDisabled />
          </FormControl>
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-email'>Email</FormLabel>
            <Input
              id='login-preview-req-email'
              placeholder='dealer@example.com'
              isDisabled
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-phone'>Phone</FormLabel>
            <Input
              id='login-preview-req-phone'
              placeholder='(555) 123-4567'
              isDisabled
            />
          </FormControl>
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-city'>City</FormLabel>
            <Input id='login-preview-req-city' placeholder='City' isDisabled />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-state'>State</FormLabel>
            <Input id='login-preview-req-state' placeholder='NJ' isDisabled />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='login-preview-req-zip'>ZIP</FormLabel>
            <Input id='login-preview-req-zip' placeholder='07030' isDisabled />
          </FormControl>
        </SimpleGrid>
        <FormControl>
          <FormLabel htmlFor='login-preview-req-company'>Company</FormLabel>
          <Input
            id='login-preview-req-company'
            placeholder='Your business name'
            isDisabled
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor='login-preview-req-about'>Tell us about your projects</FormLabel>
          <Textarea
            id='login-preview-req-about'
            rows={3}
            placeholder='Share a brief overview'
            isDisabled
          />
        </FormControl>
        <ButtonLike isDisabled>Submit request</ButtonLike>
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
      <Flex justify='center' wrap='wrap' gap={2}>
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
