import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUser, setError } from '../../store/slices/authSlice'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertIcon,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { motion, useReducedMotion } from 'framer-motion'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import { installTokenEverywhere } from '../../utils/authToken'
import AuthShell from '../../components/auth/AuthShell'

const MotionButton = motion(Button)

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const api_url = import.meta.env.VITE_API_URL
  const { t } = useTranslation()
  const toast = useToast()

  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || '#0e1446'
  const rightPanelColors = useMemo(() => getOptimalColors(loginBackground), [loginBackground])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore storage failures
    }
  }, [])

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '')
      const reason = params.get('reason') || sessionStorage.getItem('logout_reason') || ''
      if (reason) {
        try {
          sessionStorage.removeItem('logout_reason')
        } catch {}
      }
      if (reason === 'expired' || reason === 'auth-error') {
        setNoticeMessage(t('auth.sessionExpired') || 'Your session expired. Please sign in again.')
      } else if (reason) {
        setNoticeMessage(t('auth.loginRequired') || 'Please sign in to continue.')
      }
    } catch (_) {
      // no-op
    }
  }, [location.search, t])

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const response = await axios.post(`${api_url}/api/login`, {
        email: values.email,
        password: values.password,
      })

      const { token, userId, name, role, role_id, group_id, group } = response.data
      const user = {
        email: values.email,
        userId,
        name,
        role: String(role || '').toLowerCase(),
        role_id,
        group_id,
        group,
      }

      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}

      installTokenEverywhere(token, { preserveUser: false })
      try {
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}

      await new Promise((resolve) => setTimeout(resolve, 100))

      const verifyToken = sessionStorage.getItem('token')
      if (!verifyToken || verifyToken !== token) {
        throw new Error('Token installation failed')
      }

      try {
        window.localStorage.setItem('__auth_changed__', String(Date.now()))
      } catch {}

      dispatch(setUser({ user, token }))
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')

      const returnTo = (() => {
        try {
          return sessionStorage.getItem('return_to') || '/'
        } catch {
          return '/'
        }
      })()
      try {
        sessionStorage.removeItem('return_to')
      } catch {}
      navigate(returnTo)
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('auth.loginFailed')
      dispatch(setError(errorMsg))
      setErrorMessage(errorMsg)
      toast({
        status: 'error',
        title: t('auth.loginFailed'),
        description: errorMsg,
        duration: 3500,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  })

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
            {loginBrand.title}
          </Heading>
          <Text className="text-sm text-text-muted max-w-md">{loginBrand.subtitle}</Text>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {noticeMessage ? (
            <Alert status="info" borderRadius="md" role="status" aria-live="polite">
              <AlertIcon />
              {noticeMessage}
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert status="error" borderRadius="md" role="alert" aria-live="assertive">
              <AlertIcon />
              {errorMessage}
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

          <FormControl isInvalid={Boolean(errors.password)} className="space-y-2">
            <FormLabel htmlFor="password" className="flex items-center gap-1 text-sm font-semibold">
              {t('auth.password')}
              <span className="text-red-600">*</span>
            </FormLabel>
            <InputGroup size="md" className="h-11">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
                {...register('password', {
                  required: t('auth.passwordRequired', 'Password is required'),
                  minLength: {
                    value: 6,
                    message: t('auth.passwordTooShort', 'Use at least 6 characters'),
                  },
                })}
              />
              <InputRightElement height="100%" className="pr-1">
                <IconButton
                  variant="ghost"
                  colorScheme="gray"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  icon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="w-11 h-11"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {loginBrand.showKeepLoggedIn ? (
              <Checkbox
                id="keepLoggedIn"
                isChecked={keepLoggedIn}
                onChange={(event) => setKeepLoggedIn(event.target.checked)}
                className="text-sm"
              >
                {t('auth.keepLoggedIn')}
              </Checkbox>
            ) : (
              <span className="h-4" aria-hidden />
            )}
            {loginBrand.showForgotPassword ? (
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {t('auth.forgotPasswordLink')}
              </Link>
            ) : null}
          </div>

          <MotionButton
            type="submit"
            colorScheme="brand"
            className="w-full h-11"
            isLoading={isSubmitting}
            loadingText={t('auth.signingIn')}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            {t('auth.signIn')}
          </MotionButton>
        </form>

        <div className="text-center text-sm text-text-muted">
          <span>{t('auth.noAccountPrompt')}</span>{' '}
          <Link to="/request-access" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            {t('auth.requestAccess.submit')}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}

export default LoginPage

