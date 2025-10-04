import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Flex, Container, Heading, Text, FormControl, FormLabel, Input, Textarea, Button, Link, Alert, AlertIcon, VStack, SimpleGrid, List, ListItem, ListIcon, useColorModeValue } from '@chakra-ui/react'
import { Circle } from 'lucide-react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import LanguageSwitcher from '../../components/LanguageSwitcher'


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
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || "gray.900"

  // Color mode values
  const bgWhite = useColorModeValue("white", "gray.800")
  const textGray700 = useColorModeValue("gray.700", "gray.300")
  const linkBlue = useColorModeValue("blue.600", "blue.300")

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
    logoAlt: t('auth.logoAlt'),
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
  const requiredAsterisk = <span>*</span>

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore storage failures
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'state' ? value.toUpperCase() : value
    setForm((prev) => ({ ...prev, [name]: nextValue }))
  }

  const rightPanelColors = getOptimalColors(loginBackground)
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    )
    const payload = {
      ...trimmedForm,
      name: `${trimmedForm.firstName} ${trimmedForm.lastName}`.trim(),
    }

    try {
      const res = await axios.post(`${apiUrl}/api/request-access`, payload)
      const data = res?.data || {}
      setSuccessMessage(data.message || successCopy)
      setForm(() => ({ ...EMPTY_FORM }))
    } catch (err) {
      const message = err?.response?.data?.message || copy.submitError
      setErrorMessage(message)
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
            {loginBrand.rightTitle}
          </Heading>
          <Text fontSize="xl" color={rightPanelColors.subtitle}>
            {loginBrand.rightSubtitle}
          </Text>
          <Text fontSize="md" color={rightPanelColors.subtitle}>
            {loginBrand.rightDescription}
          </Text>
        </VStack>
      </Box>

      {/* Right Panel - Form */}
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        bg={bgWhite}
        overflowY="auto"
        className="login-right-panel"
        position="relative"
      >
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <LanguageSwitcher compact />
        </Box>
        <Container maxW="lg" py={8}>
          <VStack spacing={4} align="stretch">
            <Box textAlign="center">
              <BrandLogo size={logoHeight} />
            </Box>
            <Heading as="h2" size="lg" textAlign="center">
              {pageTitle}
            </Heading>
            <Text textAlign="center" color={textGray700}>
              {pageSubtitle}
            </Text>
            {pageDescription && (
              <Text textAlign="center" color={textGray700} fontSize="sm">
                {pageDescription}
              </Text>
            )}

            {benefits.length > 0 && (
              <Box>
                <Text fontWeight="500" mb={2}>
                  {copy.benefitsHeading}
                </Text>
                <List spacing={4} fontSize="sm">
                  {benefits.map((item, idx) => (
                    <ListItem key={idx} display="flex" alignItems="flex-start">
                      <ListIcon as={Circle} boxSize={2} mt={1.5} mr={2} fill="currentColor" />
                      <Text>{item}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {successMessage && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                  <FormControl isRequired>
                    <FormLabel htmlFor="firstName" fontWeight="500">
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
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel htmlFor="lastName" fontWeight="500">
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
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                  <FormControl isRequired>
                    <FormLabel htmlFor="email" fontWeight="500">
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
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel htmlFor="phone" fontWeight="500">
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
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel htmlFor="city" fontWeight="500">
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
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="state" fontWeight="500">
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
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="zip" fontWeight="500">
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
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel htmlFor="company" fontWeight="500">
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
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="message" fontWeight="500">
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
                >
                  {copy.submit}
                </Button>
              </VStack>
            </Box>

            <Text textAlign="center" fontSize="sm">
              {copy.alreadyHaveAccess}{' '}
              <Link as={RouterLink} to="/login" color={linkBlue} fontWeight="600" minH="44px" py={2}>
                {copy.signIn}
              </Link>
            </Text>
          </VStack>
        </Container>
      </Flex>
    </Flex>
  )
}

export default RequestAccessPage