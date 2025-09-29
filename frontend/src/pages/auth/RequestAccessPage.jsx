import React, { useEffect, useMemo } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import AuthShell from '../../components/auth/AuthShell'

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

const MotionButton = motion(Button)

const RequestAccessPage = () => {
  const { t } = useTranslation()
  const apiUrl = import.meta.env.VITE_API_URL
  const toast = useToast()
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || '#0e1446'
  const rightPanelColors = useMemo(() => getOptimalColors(loginBackground), [loginBackground])
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { ...EMPTY_FORM },
  })

  const mutation = useMutation({
    mutationFn: async (values) => {
      const trimmedForm = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
      )
      const payload = {
        ...trimmedForm,
        name: `${trimmedForm.firstName} ${trimmedForm.lastName}`.trim(),
      }
      const response = await axios.post(`${apiUrl}/api/request-access`, payload)
      return response?.data || {}
    },
    onSuccess: (data) => {
      const message = data?.message || t('auth.requestAccess.success')
      toast({
        status: 'success',
        title: t('auth.requestAccess.title'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
      reset({ ...EMPTY_FORM })
    },
    onError: (error) => {
      const message = error?.response?.data?.message || t('auth.requestAccess.submitError')
      toast({
        status: 'error',
        title: t('auth.requestAccess.title'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
    },
  })

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore storage failures
    }
  }, [])

  const benefits = Array.isArray(loginBrand.requestAccessBenefits)
    ? loginBrand.requestAccessBenefits
    : String(loginBrand.requestAccessBenefits || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

  const pageTitle = loginBrand.requestAccessTitle || t('auth.requestAccess.title')
  const pageSubtitle = loginBrand.requestAccessSubtitle || t('auth.requestAccess.subtitle')
  const pageDescription = loginBrand.requestAccessDescription || t('auth.requestAccess.description')

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values)
  })

  const messageValue = watch('message') || ''

  return (
    <AuthShell
      backgroundColor={loginBackground}
      title={loginBrand.rightTitle}
      subtitle={loginBrand.rightSubtitle}
      description={loginBrand.rightDescription}
      textColor={rightPanelColors.text}
      subtitleColor={rightPanelColors.subtitle}
    >
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <BrandLogo size={logoHeight} />
          <Heading as="h2" className="text-2xl font-semibold text-text-primary">
            {pageTitle}
          </Heading>
          <Text className="text-sm text-text-muted max-w-xl">{pageSubtitle}</Text>
          {pageDescription ? (
            <Text className="text-xs text-text-muted max-w-xl">{pageDescription}</Text>
          ) : null}
          {benefits.length > 0 ? (
            <div className="w-full rounded-lg bg-white/60 backdrop-blur p-4 border border-white/70">
              <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {t('auth.requestAccess.benefitsHeading')}
              </Text>
              <ul className="mt-2 space-y-1 text-xs text-text-muted">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {mutation.isSuccess ? (
            <Alert status="success" borderRadius="md" role="status" aria-live="polite">
              <AlertIcon />
              {mutation.data?.message || t('auth.requestAccess.success')}
            </Alert>
          ) : null}

          {mutation.isError ? (
            <Alert status="error" borderRadius="md" role="alert" aria-live="assertive">
              <AlertIcon />
              {mutation.error?.response?.data?.message || t('auth.requestAccess.submitError')}
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl isInvalid={Boolean(errors.firstName)} className="space-y-2">
              <FormLabel htmlFor="firstName" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.firstNameLabel')} <span className="text-red-600">*</span>
              </FormLabel>
              <Input
                id="firstName"
                placeholder={t('auth.requestAccess.fields.firstNamePlaceholder')}
                autoComplete="given-name"
                {...register('firstName', {
                  required: t('auth.requestAccess.validation.firstNameRequired'),
                  maxLength: { value: 191, message: t('auth.requestAccess.validation.nameTooLong') },
                })}
              />
              <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={Boolean(errors.lastName)} className="space-y-2">
              <FormLabel htmlFor="lastName" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.lastNameLabel')} <span className="text-red-600">*</span>
              </FormLabel>
              <Input
                id="lastName"
                placeholder={t('auth.requestAccess.fields.lastNamePlaceholder')}
                autoComplete="family-name"
                {...register('lastName', {
                  required: t('auth.requestAccess.validation.lastNameRequired'),
                  maxLength: { value: 191, message: t('auth.requestAccess.validation.nameTooLong') },
                })}
              />
              <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={Boolean(errors.email)} className="space-y-2 md:col-span-1">
              <FormLabel htmlFor="email" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.emailLabel')} <span className="text-red-600">*</span>
              </FormLabel>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.requestAccess.fields.emailPlaceholder')}
                autoComplete="email"
                {...register('email', {
                  required: t('auth.requestAccess.validation.emailRequired'),
                  pattern: {
                    value: /[^\s]+@[^\s]+\.[^\s]+/,
                    message: t('auth.requestAccess.validation.emailInvalid'),
                  },
                })}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={Boolean(errors.phone)} className="space-y-2">
              <FormLabel htmlFor="phone" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.phoneLabel')} <span className="text-red-600">*</span>
              </FormLabel>
              <Input
                id="phone"
                type="tel"
                placeholder={t('auth.requestAccess.fields.phonePlaceholder')}
                autoComplete="tel"
                {...register('phone', {
                  required: t('auth.requestAccess.validation.phoneRequired'),
                  maxLength: { value: 32, message: t('auth.requestAccess.validation.phoneInvalid') },
                })}
              />
              <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
            </FormControl>

            <FormControl className="space-y-2">
              <FormLabel htmlFor="city" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.cityLabel')}
              </FormLabel>
              <Input
                id="city"
                placeholder={t('auth.requestAccess.fields.cityPlaceholder')}
                autoComplete="address-level2"
                {...register('city', {
                  maxLength: { value: 191, message: t('auth.requestAccess.validation.cityTooLong') },
                })}
              />
              <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
            </FormControl>

            <FormControl className="space-y-2">
              <FormLabel htmlFor="state" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.stateLabel')}
              </FormLabel>
              <Input
                id="state"
                placeholder={t('auth.requestAccess.fields.statePlaceholder')}
                autoComplete="address-level1"
                {...register('state', {
                  maxLength: { value: 64, message: t('auth.requestAccess.validation.stateTooLong') },
                  setValueAs: (value) => (typeof value === 'string' ? value.toUpperCase() : value),
                })}
              />
              <FormErrorMessage>{errors.state?.message}</FormErrorMessage>
            </FormControl>

            <FormControl className="space-y-2">
              <FormLabel htmlFor="zip" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.zipLabel')}
              </FormLabel>
              <Input
                id="zip"
                placeholder={t('auth.requestAccess.fields.zipPlaceholder')}
                inputMode="numeric"
                autoComplete="postal-code"
                {...register('zip', {
                  maxLength: { value: 32, message: t('auth.requestAccess.validation.zipTooLong') },
                })}
              />
              <FormErrorMessage>{errors.zip?.message}</FormErrorMessage>
            </FormControl>

            <FormControl className="space-y-2 md:col-span-2">
              <FormLabel htmlFor="company" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.companyLabel')}
              </FormLabel>
              <Input
                id="company"
                placeholder={t('auth.requestAccess.fields.companyPlaceholder')}
                autoComplete="organization"
                {...register('company', {
                  maxLength: { value: 191, message: t('auth.requestAccess.validation.companyTooLong') },
                })}
              />
              <FormErrorMessage>{errors.company?.message}</FormErrorMessage>
            </FormControl>

            <FormControl className="space-y-2 md:col-span-2">
              <FormLabel htmlFor="message" className="text-sm font-semibold">
                {t('auth.requestAccess.fields.messageLabel')}
              </FormLabel>
              <Textarea
                id="message"
                rows={4}
                placeholder={t('auth.requestAccess.fields.messagePlaceholder')}
                {...register('message', {
                  maxLength: { value: 2000, message: t('auth.requestAccess.validation.messageTooLong') },
                })}
              />
              <div className="text-right text-xs text-text-muted">{messageValue.length}/2000</div>
              <FormErrorMessage>{errors.message?.message}</FormErrorMessage>
            </FormControl>
          </div>

          <MotionButton
            type="submit"
            colorScheme="brand"
            className="w-full h-11"
            isLoading={mutation.isPending}
            loadingText={t('auth.requestAccess.submitting')}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            {t('auth.requestAccess.submit')}
          </MotionButton>
        </form>

        <div className="text-center text-sm text-text-muted">
          <span>{t('auth.requestAccess.alreadyHaveAccess')} </span>
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}

export default RequestAccessPage
