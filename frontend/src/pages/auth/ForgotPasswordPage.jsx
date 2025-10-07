import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getBrandColors, getLoginBrand } from '../../brand/useBrand'
import AuthLayout from '../../components/AuthLayout'

const EMPTY_FORM = {
  email: '',
}

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const apiUrl = import.meta.env.VITE_API_URL
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || 'gray.900'
  const rightPanelColors = getOptimalColors(loginBackground)

  const bgWhite = useColorModeValue('white', 'gray.800')
  const textGray700 = useColorModeValue('gray.700', 'gray.300')
  const linkBlue = useColorModeValue('blue.600', 'blue.300')

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_err) {
      // ignore storage failures
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const trimmedEmail = form.email.trim()
      if (!trimmedEmail) {
        setError(t('auth.emailRequired'))
        setIsSubmitting(false)
        return
      }

      const response = await axios.post(`${apiUrl}/api/forgot-password`, { email: trimmedEmail })
      const data = response?.data || {}
      setMessage(data.message || t('auth.forgotPassword.success'))
      setForm({ ...EMPTY_FORM })
    } catch (err) {
      const errorMsg = err?.response?.data?.message || t('auth.forgotPassword.error')
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const leftPanel = (
    <VStack spacing={6} maxW="lg" textAlign="center">
      <Heading as="h1" size="2xl" color={rightPanelColors.text}>
        {loginBrand.rightTitle || brand.logoAlt || t('auth.forgotPassword.title')}
      </Heading>
      <Text fontSize="xl" color={rightPanelColors.subtitle}>
        {loginBrand.rightSubtitle || t('auth.forgotPassword.subtitle')}
      </Text>
      <Text fontSize="md" color={rightPanelColors.subtitle}>
        {loginBrand.rightDescription || ''}
      </Text>
    </VStack>
  )

  return (
    <AuthLayout
      leftContent={leftPanel}
      leftBg={loginBackground}
      leftTextColor={rightPanelColors.text}
      rightBg={useColorModeValue('gray.50', 'gray.900')}
      languageSwitcherProps={{ compact: true }}
    >
      <VStack spacing={{ base: 8, md: 10 }} align="stretch" px={{ base: 0, md: 2 }} position="relative" zIndex={2}>
        <Box textAlign="center" mb={{ base: -2, md: -2 }}>
          <BrandLogo size={logoHeight} />
        </Box>

        <Box textAlign="center" px={{ base: 0, md: 4 }}>
          <Heading
            as="h2"
            size={{ base: 'xl', md: '2xl' }}
            fontWeight="700"
            letterSpacing="-0.02em"
            color={useColorModeValue('gray.900', 'white')}
            mb={3}
          >
            {loginBrand.resetTitle || t('auth.forgotPassword.title')}
          </Heading>
          <Text
            color={useColorModeValue('gray.600', 'gray.400')}
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="400"
            lineHeight="1.6"
          >
            {loginBrand.resetSubtitle || t('auth.forgotPassword.subtitle')}
          </Text>
        </Box>

        {message && (
          <Alert
            status="success"
            borderRadius="xl"
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            bg={useColorModeValue('green.50', 'green.900')}
            border="1px solid"
            borderColor={useColorModeValue('green.200', 'green.700')}
          >
            <AlertIcon />
            {message}
          </Alert>
        )}

        {error && (
          <Alert
            status="error"
            borderRadius="xl"
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            bg={useColorModeValue('red.50', 'red.900')}
            border="1px solid"
            borderColor={useColorModeValue('red.200', 'red.700')}
          >
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={{ base: 6, md: 5 }}>
            <FormControl isRequired>
              <FormLabel
                htmlFor="email"
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={2}
                color={useColorModeValue('gray.700', 'gray.300')}
                letterSpacing="tight"
              >
                {t('auth.email')}
              </FormLabel>
              <Input
                id="email"
                name="email"
                type="email"
                size="lg"
                placeholder={t('auth.emailPlaceholder')}
                value={form.email}
                onChange={handleChange}
                minH={{ base: '52px', md: '56px' }}
                borderRadius="xl"
                fontSize={{ base: 'md', md: 'lg' }}
                bg={useColorModeValue('gray.50', 'gray.700')}
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                _hover={{
                  borderColor: useColorModeValue('gray.300', 'gray.500'),
                  bg: useColorModeValue('white', 'gray.650'),
                }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                  bg: useColorModeValue('white', 'gray.700'),
                }}
                transition="all 0.2s"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              minH={{ base: '52px', md: '56px' }}
              borderRadius="xl"
              fontWeight="700"
              fontSize={{ base: 'md', md: 'lg' }}
              letterSpacing="tight"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
              }}
              _active={{
                transform: 'translateY(0)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              isLoading={isSubmitting}
              loadingText={t('auth.forgotPassword.submitting')}
              mt={2}
            >
              {t('auth.forgotPassword.submit')}
            </Button>
          </VStack>
        </Box>

        <Box
          textAlign="center"
          pt={{ base: 4, md: 2 }}
          borderTop="1px solid"
          borderColor={useColorModeValue('gray.100', 'gray.700')}
        >
          <Link
            as={RouterLink}
            to="/login"
            color={useColorModeValue('brand.600', 'brand.300')}
            fontWeight="600"
            fontSize={{ base: 'sm', md: 'md' }}
            _hover={{
              textDecoration: 'underline',
              color: useColorModeValue('brand.700', 'brand.400'),
            }}
            transition="color 0.2s"
          >
            {t('auth.backToLogin')}
          </Link>
        </Box>
      </VStack>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
