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
  List,
  ListIcon,
  ListItem,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { Circle } from 'lucide-react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getBrandColors, getLoginBrand } from '../../brand/useBrand'
import AuthLayout from '../../components/AuthLayout'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
  company: '',
  message: '',
}

const RequestAccessPage = () => {
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

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const copy = {
    title: t('auth.requestAccess.title'),
    subtitle: t('auth.requestAccess.subtitle'),
    description: t('auth.requestAccess.description'),
    success: t('auth.requestAccess.success'),
    submit: t('auth.requestAccess.submit'),
    submitting: t('auth.requestAccess.submitting'),
    submitError: t('auth.requestAccess.submitError'),
    benefitsHeading: t('auth.requestAccess.benefitsHeading'),
    alreadyHaveAccess: t('auth.requestAccess.alreadyHaveAccess'),
    signIn: t('auth.signIn'),
    fields: {
      firstNameLabel: t('auth.requestAccess.fields.firstNameLabel'),
      firstNamePlaceholder: t('auth.requestAccess.fields.firstNamePlaceholder'),
      lastNameLabel: t('auth.requestAccess.fields.lastNameLabel'),
      lastNamePlaceholder: t('auth.requestAccess.fields.lastNamePlaceholder'),
      emailLabel: t('auth.requestAccess.fields.emailLabel'),
      emailPlaceholder: t('auth.requestAccess.fields.emailPlaceholder'),
      phoneLabel: t('auth.requestAccess.fields.phoneLabel'),
      phonePlaceholder: t('auth.requestAccess.fields.phonePlaceholder'),
      cityLabel: t('auth.requestAccess.fields.cityLabel'),
      cityPlaceholder: t('auth.requestAccess.fields.cityPlaceholder'),
      stateLabel: t('auth.requestAccess.fields.stateLabel'),
      statePlaceholder: t('auth.requestAccess.fields.statePlaceholder'),
      zipLabel: t('auth.requestAccess.fields.zipLabel'),
      zipPlaceholder: t('auth.requestAccess.fields.zipPlaceholder'),
      companyLabel: t('auth.requestAccess.fields.companyLabel'),
      companyPlaceholder: t('auth.requestAccess.fields.companyPlaceholder'),
      messageLabel: t('auth.requestAccess.fields.messageLabel'),
      messagePlaceholder: t('auth.requestAccess.fields.messagePlaceholder'),
    },
  }

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_err) {
      // ignore storage failures
    }
  }, [])

  const benefits = Array.isArray(loginBrand.requestAccessBenefits)
    ? loginBrand.requestAccessBenefits
    : String(loginBrand.requestAccessBenefits || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

  const pageTitle = loginBrand.requestAccessTitle || copy.title
  const pageSubtitle = loginBrand.requestAccessSubtitle || copy.subtitle
  const pageDescription = loginBrand.requestAccessDescription || copy.description
  const successCopy = loginBrand.requestAccessSuccessMessage || copy.success

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'state' ? value.toUpperCase() : value
    setForm((prev) => ({ ...prev, [name]: nextValue }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      )
      const response = await axios.post(`${apiUrl}/api/request-access`, payload)
      const data = response?.data || {}
      setSuccessMessage(data.message || successCopy)
      setForm({ ...EMPTY_FORM })
    } catch (err) {
      const message = err?.response?.data?.message || copy.submitError
      setErrorMessage(message)
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
        {loginBrand.rightDescription || copy.description}
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
      rightContainerProps={{ maxW: 'lg' }}
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
          {pageTitle}
        </Heading>
        <Text 
          textAlign="center" 
          color={textGray700}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="medium"
        >
          {pageSubtitle}
        </Text>
        {pageDescription && (
          <Text 
            textAlign="center" 
            color={textGray700} 
            fontSize={{ base: 'xs', md: 'sm' }}
          >
            {pageDescription}
          </Text>
        )}

        {benefits.length > 0 && (
          <Box>
            <Text 
              fontWeight="600" 
              mb={2}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {copy.benefitsHeading}
            </Text>
            <List spacing={4} fontSize={{ base: 'xs', sm: 'sm' }}>
              {benefits.map((item, index) => (
                <ListItem key={index} display="flex" alignItems="flex-start">
                  <ListIcon as={Circle} boxSize={2} mt={1.5} mr={2} fill="currentColor" />
                  <Text>{item}</Text>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {successMessage && (
          <Alert 
            status="success" 
            borderRadius={{ base: 'lg', md: 'md' }}
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            <AlertIcon />
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert 
            status="error" 
            borderRadius={{ base: 'lg', md: 'md' }}
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            <AlertIcon />
            {errorMessage}
          </Alert>
        )}

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={{ base: 5, md: 4 }}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
              <FormControl isRequired>
                <FormLabel 
                  htmlFor="firstName" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.firstNameLabel}
                </FormLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder={copy.fields.firstNamePlaceholder}
                  value={form.firstName}
                  onChange={handleChange}
                  maxLength={191}
                  autoComplete="given-name"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel 
                  htmlFor="lastName" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.lastNameLabel}
                </FormLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder={copy.fields.lastNamePlaceholder}
                  value={form.lastName}
                  onChange={handleChange}
                  maxLength={191}
                  autoComplete="family-name"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
              <FormControl isRequired>
                <FormLabel 
                  htmlFor="email" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.emailLabel}
                </FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={copy.fields.emailPlaceholder}
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel 
                  htmlFor="phone" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.phoneLabel}
                </FormLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={copy.fields.phonePlaceholder}
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={32}
                  autoComplete="tel"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
              <FormControl>
                <FormLabel 
                  htmlFor="city" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.cityLabel}
                </FormLabel>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder={copy.fields.cityPlaceholder}
                  value={form.city}
                  onChange={handleChange}
                  maxLength={191}
                  autoComplete="address-level2"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel 
                  htmlFor="state" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.stateLabel}
                </FormLabel>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  placeholder={copy.fields.statePlaceholder}
                  value={form.state}
                  onChange={handleChange}
                  maxLength={64}
                  autoComplete="address-level1"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel 
                  htmlFor="zip" 
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                >
                  {copy.fields.zipLabel}
                </FormLabel>
                <Input
                  id="zip"
                  name="zip"
                  type="text"
                  placeholder={copy.fields.zipPlaceholder}
                  value={form.zip}
                  onChange={handleChange}
                  maxLength={32}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel 
                htmlFor="company" 
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={2}
              >
                {copy.fields.companyLabel}
              </FormLabel>
              <Input
                id="company"
                name="company"
                type="text"
                placeholder={copy.fields.companyPlaceholder}
                value={form.company}
                onChange={handleChange}
                maxLength={191}
                autoComplete="organization"
                minH="44px"
                borderRadius={{ base: 'lg', md: 'md' }}
                fontSize={{ base: 'md', md: 'lg' }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel 
                htmlFor="message" 
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={2}
              >
                {copy.fields.messageLabel}
              </FormLabel>
              <Textarea
                id="message"
                name="message"
                placeholder={copy.fields.messagePlaceholder}
                rows={3}
                value={form.message}
                onChange={handleChange}
                maxLength={2000}
                minH="44px"
                borderRadius={{ base: 'lg', md: 'md' }}
                fontSize={{ base: 'md', md: 'lg' }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
              />
              <Text fontSize="xs" textAlign="right" color={textGray700} mt={1}>
                {form.message.length}/2000
              </Text>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="100%"
              minH="44px"
              isLoading={isSubmitting}
              loadingText={copy.submitting}
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
              {copy.submit}
            </Button>
          </VStack>
        </Box>

        <Text 
          textAlign="center" 
          fontSize={{ base: 'sm', md: 'md' }}
        >
          {copy.alreadyHaveAccess}{' '}
          <Link 
            as={RouterLink} 
            to="/login" 
            color={linkBlue} 
            fontWeight="600" 
            minH="44px" 
            py={2}
            _hover={{
              textDecoration: 'underline',
            }}
          >
            {copy.signIn}
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  )
}

export default RequestAccessPage
