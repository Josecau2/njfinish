import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import { getOptimalColors } from '../../utils/colorUtils'
import AuthShell from '../../components/auth/AuthShell'

const MotionButton = motion(Button)

const ResetPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const { token } = useParams()
  const navigate = useNavigate()
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
    defaultValues: { password: '' },
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

  const resetMutation = useMutation({
    mutationFn: async ({ password: newPassword }) => {
      const res = await fetch(`${api_url}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        const error = new Error(data?.message || t('auth.resetPassword.error'))
        error.displayMessage = data?.message || t('auth.resetPassword.error')
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      const message = data?.message || t('auth.resetPassword.success')
      setServerMessage(message)
      setServerError('')
      toast({
        status: 'success',
        title: t('auth.resetPassword.title'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
      reset()
      setTimeout(() => navigate('/login'), 3000)
    },
    onError: (error) => {
      const message = error?.displayMessage || error?.message || t('auth.resetPassword.requestError')
      setServerError(message)
      setServerMessage('')
      toast({
        status: 'error',
        title: t('auth.resetPassword.title'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
    },
  })

  const onSubmit = handleSubmit((values) => {
    setServerMessage('')
    setServerError('')
    resetMutation.mutate(values)
  })

  return (
    <AuthShell
      backgroundColor={loginBackground}
      title={loginBrand.rightTitle || brand.logoAlt || t('auth.resetPassword.title')}
      subtitle={loginBrand.rightSubtitle || t('auth.resetPassword.subtitle')}
      description={loginBrand.rightDescription || ''}
      textColor={rightPanelColors.text}
      subtitleColor={rightPanelColors.subtitle}
    >
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <BrandLogo size={logoHeight} />
          <Heading as="h2" className="text-2xl font-semibold text-text-primary">
            {loginBrand.resetTitle || t('auth.resetPassword.formTitle')}
          </Heading>
          <Text className="text-sm text-text-muted max-w-md">
            {loginBrand.resetSubtitle || t('auth.resetPassword.formDescription')}
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

          <FormControl isInvalid={Boolean(errors.password)} className="space-y-2">
            <FormLabel htmlFor="password" className="flex items-center gap-1 text-sm font-semibold">
              {t('auth.resetPassword.passwordLabel')}
              <span className="text-red-600">*</span>
            </FormLabel>
            <Input
              id="password"
              type="password"
              size="md"
              placeholder={t('auth.resetPassword.passwordPlaceholder')}
              autoComplete="new-password"
              {...register('password', {
                required: t('auth.resetPassword.requestError'),
                minLength: {
                  value: 8,
                  message: t('auth.resetPassword.error'),
                },
              })}
            />
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <MotionButton
            type="submit"
            colorScheme="brand"
            className="w-full h-11"
            isLoading={resetMutation.isPending}
            loadingText={t('auth.resetPassword.submitting')}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            {t('auth.resetPassword.submit')}
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

export default ResetPasswordPage
