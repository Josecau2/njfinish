import React, { useEffect, useMemo, useState } from 'react'
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
  useToast,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import AuthShell from '../../components/auth/AuthShell'

const MotionButton = motion(Button)

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || '#0e1446'
  const rightPanelColors = useMemo(() => getOptimalColors(loginBackground), [loginBackground])
  const toast = useToast()
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { email: '' },
  })

  const [serverMessage, setServerMessage] = useState('')
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore
    }
  }, [])

  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }) => {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        const error = new Error(t('auth.emailRequired'))
        error.displayMessage = t('auth.emailRequired')
        throw error
      }
      const response = await axios.post(`${api_url}/api/forgot-password`, { email: trimmedEmail })
      return response?.data || {}
    },
    onSuccess: (data) => {
      const message = data.message || t('auth.forgotPassword.success')
      setServerMessage(message)
      setServerError('')
      toast({
        status: 'success',
        title: t('auth.forgotPassword.title'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
      reset()
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error.displayMessage || t('auth.forgotPassword.error')
      setServerError(message)
      setServerMessage('')
      toast({
        status: 'error',
        title: t('auth.forgotPassword.title'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
    },
  })

  const onSubmit = handleSubmit((values) => {
    setServerMessage('')
    setServerError('')
    forgotPasswordMutation.mutate(values)
  })

  return (
    <AuthShell
      backgroundColor={loginBackground}
      title={loginBrand.rightTitle || brand.logoAlt || t('auth.forgotPassword.title')}
      subtitle={loginBrand.rightSubtitle || t('auth.forgotPassword.subtitle')}
      description={loginBrand.rightDescription || ''}
      textColor={rightPanelColors.text}
      subtitleColor={rightPanelColors.subtitle}
    >
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <BrandLogo size={logoHeight} />
          <Heading as="h2" className="text-2xl font-semibold text-text-primary">
            {loginBrand.resetTitle || t('auth.forgotPassword.title')}
          </Heading>
          <Text className="text-sm text-text-muted max-w-md">
            {loginBrand.resetSubtitle || t('auth.forgotPassword.subtitle')}
          </Text>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {serverMessage ? (
            <Alert status="success" borderRadius="md" role="status" aria-live="polite">
              <AlertIcon />
              {serverMessage}
            </Alert>
          ) : null}

          {serverError ? (
            <Alert status="error" borderRadius="md" role="alert" aria-live="assertive">
              <AlertIcon />
              {serverError}
            </Alert>
          ) : null}

          <FormControl isInvalid={Boolean(errors.email)} className="space-y-2">
            <FormLabel htmlFor="email" className="flex items-center gap-1 text-sm font-semibold">
              {t('auth.email')}
              <span className="text-red-600">*</span>
            </FormLabel>
            <Input
              id="email"
              type="email"
              size="md"
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /[^\s]+@[^\s]+\.[^\s]+/,
                  message: t('auth.emailInvalid'),
                },
              })}
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <MotionButton
            type="submit"
            colorScheme="brand"
            className="w-full h-11"
            isLoading={forgotPasswordMutation.isPending}
            loadingText={t('auth.forgotPassword.submitting')}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            {t('auth.forgotPassword.submit')}
          </MotionButton>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}

export default ForgotPasswordPage
