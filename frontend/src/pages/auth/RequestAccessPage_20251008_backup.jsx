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
      rightBg={useColorModeValue('gray.50', 'gray.900')}
      languageSwitcherProps={{ compact: true }}
      rightContainerProps={{ maxW: 'lg' }}
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
            {pageTitle}
          </Heading>
          <Text
            color={useColorModeValue('gray.600', 'gray.400')}
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="400"
            lineHeight="1.6"
          >
            {pageSubtitle}
          </Text>
          {pageDescription && (
            <Text
              color={useColorModeValue('gray.500', 'gray.500')}
              fontSize={{ base: 'sm', md: 'md' }}
              mt={2}
              lineHeight="1.5"
            >
              {pageDescription}
            </Text>
          )}
        </Box>

        {benefits.length > 0 && (
          <Box
            bg={useColorModeValue('gray.50', 'gray.750')}
            p={{ base: 5, md: 6 }}
            borderRadius="xl"
            border="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
          >
            <Text
              fontWeight="600"
              mb={3}
              fontSize={{ base: 'sm', md: 'md' }}
              color={useColorModeValue('gray.700', 'gray.300')}
            >
              {copy.benefitsHeading}
            </Text>
            <List spacing={3} fontSize={{ base: 'sm', md: 'md' }}>
              {benefits.map((item, index) => (
                <ListItem key={index} display="flex" alignItems="flex-start">
                  <ListIcon
                    as={Circle}
                    boxSize={2}
                    mt={1.5}
                    mr={2}
                    fill={useColorModeValue('brand.500', 'brand.300')}
                  />
                  <Text color={useColorModeValue('gray.600', 'gray.400')}>{item}</Text>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {successMessage && (
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
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
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
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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

              <FormControl isRequired>
                <FormLabel
                  htmlFor="lastName"
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
              <FormControl isRequired>
                <FormLabel
                  htmlFor="email"
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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

              <FormControl isRequired>
                <FormLabel
                  htmlFor="phone"
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
              <FormControl>
                <FormLabel
                  htmlFor="city"
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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

              <FormControl>
                <FormLabel
                  htmlFor="state"
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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

              <FormControl>
                <FormLabel
                  htmlFor="zip"
                  fontWeight="600"
                  fontSize={{ base: 'sm', md: 'md' }}
                  mb={2}
                  color={useColorModeValue('gray.700', 'gray.300')}
                  letterSpacing="tight"
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
                  minH={{ base: '48px', md: '52px' }}
                  borderRadius="xl"
                  fontSize={{ base: 'md', md: 'md' }}
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
            </SimpleGrid>

            <FormControl>
              <FormLabel
                htmlFor="company"
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={2}
                color={useColorModeValue('gray.700', 'gray.300')}
                letterSpacing="tight"
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
                minH={{ base: '48px', md: '52px' }}
                borderRadius="xl"
                fontSize={{ base: 'md', md: 'md' }}
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

            <FormControl>
              <FormLabel
                htmlFor="message"
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                mb={2}
                color={useColorModeValue('gray.700', 'gray.300')}
                letterSpacing="tight"
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
                minH={{ base: '100px', md: '120px' }}
                borderRadius="xl"
                fontSize={{ base: 'md', md: 'md' }}
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
              <Text
                fontSize="xs"
                textAlign="right"
                color={useColorModeValue('gray.500', 'gray.500')}
                mt={1}
              >
                {form.message.length}/2000
              </Text>
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
              loadingText={copy.submitting}
              mt={2}
            >
              {copy.submit}
            </Button>
          </VStack>
        </Box>

        <Box
          textAlign="center"
          pt={{ base: 4, md: 2 }}
          borderTop="1px solid"
          borderColor={useColorModeValue('gray.100', 'gray.700')}
        >
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            color={useColorModeValue('gray.600', 'gray.400')}
          >
            {copy.alreadyHaveAccess}{' '}
            <Link
              as={RouterLink}
              to="/login"
              color={useColorModeValue('brand.600', 'brand.300')}
              fontWeight="600"
              _hover={{
                textDecoration: 'underline',
                color: useColorModeValue('brand.700', 'brand.400'),
              }}
              transition="color 0.2s"
            >
              {copy.signIn}
            </Link>
          </Text>
        </Box>
      </VStack>
    </AuthLayout>
  )
}

export default RequestAccessPage
