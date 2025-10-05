import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import { getBrand, getBrandColors, getLoginBrand } from '../../brand/useBrand'
import BrandLogo from '../../components/BrandLogo'
import AuthLayout from '../../components/AuthLayout'
import { ICON_SIZE_MD } from '../../constants/iconSizes'

const SignupPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || 'gray.900'
  const rightPanelColors = getOptimalColors(loginBackground)
  const logoHeight = Number(loginBrand.logoHeight) || 60

  const bgWhite = useColorModeValue('white', 'gray.800')
  const textGray600 = useColorModeValue('gray.600', 'gray.400')
  const linkBlue = useColorModeValue('blue.600', 'blue.300')

  const copy = {
    title: loginBrand.signupTitle || t('auth.signUp.title'),
    subtitle: loginBrand.signupSubtitle || t('auth.signUp.subtitle'),
    alreadyHaveAccount: loginBrand.signupAlreadyHaveAccount || t('auth.signUp.alreadyHaveAccount'),
    signInLink: loginBrand.signupSignInLink || t('auth.signUp.signInLink'),
  }

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      await axios.post(`${apiUrl}/api/signup`, formData)
      setSuccess(t('auth.signUp.success'))
      setFormData({ username: '', email: '', password: '' })
      setShowPassword(false)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      if (err?.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(t('auth.genericError') || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const leftPanel = (
    <VStack spacing={6} maxW="lg" textAlign="center">
      <Heading as="h1" size="2xl" color={rightPanelColors.text}>
        {loginBrand.rightTitle || brand.logoAlt || copy.title}
      </Heading>
      <Text fontSize="xl" color={rightPanelColors.subtitle}>
        {loginBrand.rightSubtitle || copy.subtitle}
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
      rightContainerProps={{ maxW: 'md' }}
    >
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <BrandLogo size={logoHeight} />
        </Box>

        <Heading as="h2" size="lg" textAlign="center">
          {copy.title}
        </Heading>
        <Text color={textGray600} textAlign="center">
          {copy.subtitle}
        </Text>

        {success && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            {success}
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
              <FormLabel htmlFor="username" fontWeight="500">
                {t('auth.username', { defaultValue: 'Username' })}
              </FormLabel>
              <Input
                id="username"
                name="username"
                type="text"
                size="lg"
                placeholder={t('auth.placeholders.usernameExample')}
                value={formData.username}
                onChange={handleChange}
                minH="44px"
              />
            </FormControl>

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
                value={formData.email}
                onChange={handleChange}
                minH="44px"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="password" fontWeight="500">
                {t('auth.password')}
              </FormLabel>
              <InputGroup size="lg">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.placeholders.password')}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minH="44px"
                />
                <InputRightElement width="44px" height="44px">
                  <IconButton
                    aria-label={showPassword ? t('auth.hidePassword', { defaultValue: 'Hide password' }) : t('auth.showPassword', { defaultValue: 'Show password' })}
                    icon={showPassword ? <EyeOff size={ICON_SIZE_MD} /> : <Eye size={ICON_SIZE_MD} />}
                    onClick={() => setShowPassword((prev) => !prev)}
                    variant="ghost"
                    tabIndex={-1}
                    minW="44px"
                    minH="44px"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              minH="44px"
              isLoading={isSubmitting}
              loadingText={t('auth.signUp.submitting')}
            >
              {t('auth.signUp.submit')}
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center">
          {copy.alreadyHaveAccount}{' '}
          <Link as={RouterLink} to="/login" color={linkBlue} minH="44px" py={2}>
            {copy.signInLink}
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  )
}

export default SignupPage
