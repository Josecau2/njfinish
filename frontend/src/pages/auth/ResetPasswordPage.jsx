import React, { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Box, Flex, Container, Heading, Text, FormControl, FormLabel, Input, Button, Link, Alert, AlertIcon, VStack, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import { getOptimalColors } from '../../utils/colorUtils'

const ResetPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const { token } = useParams()
  const navigate = useNavigate()
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || "gray.900"
  const rightPanelColors = getOptimalColors(loginBackground)

  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch(`${api_url}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await res.json()

      if (res.ok) {
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

  return (
    <Flex minH="100vh" className="login-page-wrapper">
      {/* Left Panel - Illustration and Branding */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        flex="1"
        bg={loginBackground}
        alignItems="center"
        justifyContent="center"
        px={8}
        className="login-left-panel"
      >
        <VStack spacing={4} maxW="500px" textAlign="center">
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
      </Box>

      {/* Right Panel - Form */}
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        bg={useColorModeValue("white", "gray.800")}
        className="login-right-panel"
      >
        <Container maxW="md" py={8}>
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <BrandLogo size={logoHeight} />
            </Box>
            <Heading as="h2" size="lg" textAlign="center">
              {loginBrand.resetTitle || t('auth.resetPassword.formTitle')}
            </Heading>
            <Text textAlign="center" color={useColorModeValue("gray.700", "gray.300")}>
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
                    onChange={(e) => setPassword(e.target.value)}
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
              <Link as={RouterLink} to="/login" color={useColorModeValue("blue.600", "blue.300")} minH="44px" py={2}>
                {t('auth.backToLogin')}
              </Link>
            </Text>
          </VStack>
        </Container>
      </Flex>
    </Flex>
  )
}

export default ResetPasswordPage
