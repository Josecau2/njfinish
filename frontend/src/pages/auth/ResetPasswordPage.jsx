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
      const response = await fetch(`${apiUrl}/api/reset-password`, {
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
        <Box textAlign="center" mb={{ base: 2, md: 0 }}>
          <BrandLogo size={logoHeight} />
        </Box>

        <Heading 
          as="h2" 
          size={{ base: 'lg', md: 'xl' }} 
          textAlign="center"
          fontWeight="bold"
          letterSpacing="tight"
          color={useColorModeValue('gray.900', 'white')}
        >
          {loginBrand.resetTitle || t('auth.resetPassword.formTitle')}
        </Heading>
        <Text 
          textAlign="center" 
          color={textGray700}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="medium"
        >
          {loginBrand.resetSubtitle || t('auth.resetPassword.formDescription')}
        </Text>

        {message && (
          <Alert 
            status="success" 
            borderRadius={{ base: 'lg', md: 'md' }}
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            <AlertIcon />
            {message}
          </Alert>
        )}

        {error && (
          <Alert 
            status="error" 
            borderRadius={{ base: 'lg', md: 'md' }}
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box as="form" onSubmit={handleReset}>
          <VStack spacing={{ base: 5, md: 4 }}>
            <FormControl isRequired>
              <FormLabel 
                htmlFor="password" 
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={2}
              >
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
                borderRadius={{ base: 'lg', md: 'md' }}
                fontSize={{ base: 'md', md: 'lg' }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
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
              borderRadius={{ base: 'lg', md: 'md' }}
              fontWeight="bold"
              fontSize={{ base: 'md', md: 'lg' }}
              boxShadow="sm"
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: 'md',
              }}
              transition="all 0.2s"
            >
              {t('auth.resetPassword.submit')}
            </Button>
          </VStack>
        </Box>

        <Text 
          textAlign="center"
          fontSize={{ base: 'sm', md: 'md' }}
        >
          <Link 
            as={RouterLink} 
            to="/login" 
            color={linkBlue} 
            minH="44px" 
            py={2}
            fontWeight="600"
            _hover={{
              textDecoration: 'underline',
            }}
          >
            {t('auth.backToLogin')}
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  )
}

export default ResetPasswordPage
