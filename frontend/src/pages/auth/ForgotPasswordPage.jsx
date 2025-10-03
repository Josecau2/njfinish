import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Flex, Container, Heading, Text, FormControl, FormLabel, Input, Button, Link, Alert, AlertIcon, VStack, useColorModeValue } from '@chakra-ui/react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'

const EMPTY_FORM = {
  email: '',
}

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || "gray.900"
  const rightPanelColors = getOptimalColors(loginBackground)

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore
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

      const res = await axios.post(`${api_url}/api/forgot-password`, { email: trimmedEmail })
      const data = res?.data || {}
      setMessage(data.message || t('auth.forgotPassword.success'))
      setForm({ ...EMPTY_FORM })
    } catch (err) {
      const errorMsg = err?.response?.data?.message || t('auth.forgotPassword.error')
      setError(errorMsg)
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
            {loginBrand.rightTitle || brand.logoAlt || t('auth.forgotPassword.title')}
          </Heading>
          <Text fontSize="xl" color={rightPanelColors.subtitle}>
            {loginBrand.rightSubtitle || t('auth.forgotPassword.subtitle')}
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
              {loginBrand.resetTitle || t('auth.forgotPassword.title')}
            </Heading>
            <Text textAlign="center" color={useColorModeValue("gray.700", "gray.300")}>
              {loginBrand.resetSubtitle || t('auth.forgotPassword.subtitle')}
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

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel htmlFor="email" fontWeight="500">
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
                  loadingText={t('auth.forgotPassword.submitting')}
                >
                  {t('auth.forgotPassword.submit')}
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

export default ForgotPasswordPage
