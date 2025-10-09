import React, { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
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
import { useTranslation } from 'react-i18next'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getBrandColors, getLoginBrand } from '../../brand/useBrand'
import { getOptimalColors } from '../../utils/colorUtils'
import AuthLayout from '../../components/AuthLayout'

const ResetPasswordPage = () => {
  const { t } = useTranslation()
  const apiUrl = import.meta.env.VITE_API_URL
  const { token } = useParams()
  const navigate = useNavigate()
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || 'gray.900'
  const rightPanelColors = getOptimalColors(loginBackground)

  const bgWhite = useColorModeValue('white', 'gray.800')
  const textGray700 = useColorModeValue('gray.700', 'gray.300')
  const linkBlue = useColorModeValue('blue.600', 'blue.300')

  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReset = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || t('auth.resetPassword.success'))
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.message || t('auth.resetPassword.error'))
      }
    } catch (err) {
      setError(t('auth.resetPassword.requestError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const leftPanel = (
    <VStack spacing={6} maxW="lg" textAlign="center">
      <Heading as="h1" size="2xl" color={rightPanelColors.text}>
        {loginBrand.rightTitle || brand.logoAlt || t('auth.resetPassword.title')}
      </Heading>
      <Text fontSize="xl" color={rightPanelColors.subtitle}>
        {loginBrand.rightSubtitle || t('auth.resetPassword.subtitle')}
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
      rightBg={bgWhite}
      languageSwitcherProps={{ compact: true }}
    >
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <BrandLogo size={logoHeight} />
        </Box>

        <Heading as="h2" size="lg" textAlign="center">
          {loginBrand.resetTitle || t('auth.resetPassword.formTitle')}
        </Heading>
        <Text textAlign="center" color={textGray700}>
          {loginBrand.resetSubtitle || t('auth.resetPassword.formDescription')}
        </Text>

        {message && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            {message}
          </Alert>
        )}

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box as="form" onSubmit={handleReset}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel htmlFor="password" fontWeight="500">
                {t('auth.resetPassword.passwordLabel')}
              </FormLabel>
              <Input
                id="password"
                type="password"
                size="lg"
                placeholder={t('auth.resetPassword.passwordPlaceholder')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                minH="44px"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              minH="44px"
              isLoading={isSubmitting}
              loadingText={t('auth.resetPassword.submitting')}
            >
              {t('auth.resetPassword.submit')}
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center">
          <Link as={RouterLink} to="/login" color={linkBlue} minH="44px" py={2}>
            {t('auth.backToLogin')}
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  )
}

export default ResetPasswordPage
