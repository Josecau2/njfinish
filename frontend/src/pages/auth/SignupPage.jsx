import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTranslation, Trans } from 'react-i18next'
import {
  Alert,
  AlertIcon,
  Button,
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
import { Eye, EyeOff } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getBrandColors, getLoginBrand } from '../../brand/useBrand'
import { getOptimalColors } from '../../utils/colorUtils'

const MotionButton = motion(Button)

const SignupPage = () => {
  const navigate = useNavigate()
  const api_url = import.meta.env.VITE_API_URL
  const { t } = useTranslation()
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
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { username: '', email: '', password: '' },
  })

  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')
    try {
      await axios.post(`${api_url}/api/signup`, values)
      toast({
        status: 'success',
        title: t('auth.signup.successTitle'),
        description: t('auth.signup.successDescription'),
        duration: 3500,
        isClosable: true,
      })
      navigate('/login')
    } catch (err) {
      const message = err?.response?.data?.message || t('auth.signup.error')
      setServerError(message)
      toast({
        status: 'error',
        title: t('auth.signup.errorTitle'),
        description: message,
        duration: 3500,
        isClosable: true,
      })
    }
  })

  return (
    <AuthShell
      backgroundColor={loginBackground}
      title={loginBrand.rightTitle || brand.logoAlt || t('auth.signup.heroTitle')}
      subtitle={loginBrand.rightSubtitle || t('auth.signup.heroSubtitle')}
      description={loginBrand.rightDescription || t('auth.signup.heroDescription')}
      textColor={rightPanelColors.text}
      subtitleColor={rightPanelColors.subtitle}
    >
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <BrandLogo size={logoHeight} />
          <Heading as="h2" className="text-2xl font-semibold text-text-primary">
            {t('auth.signup.title')}
          </Heading>
          <Text className="text-sm text-text-muted max-w-md">
            {t('auth.signup.subtitle')}
          </Text>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {serverError ? (
            <Alert status="error" borderRadius="md" role="alert" aria-live="assertive">
              <AlertIcon />
              {serverError}
            </Alert>
          ) : null}

          <FormControl isInvalid={Boolean(errors.username)} className="space-y-2">
            <FormLabel htmlFor="username" className="flex items-center gap-1 text-sm font-semibold">
              {t('auth.signup.fields.usernameLabel')}
              <span className="text-red-600">*</span>
            </FormLabel>
            <Input
              id="username"
              type="text"
              placeholder={t('auth.signup.fields.usernamePlaceholder')}
              autoComplete="username"
              {...register('username', {
                required: t('auth.signup.validation.usernameRequired'),
                minLength: {
                  value: 3,
                  message: t('auth.signup.validation.usernameLength'),
                },
              })}
            />
            <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.email)} className="space-y-2">
            <FormLabel htmlFor="email" className="flex items-center gap-1 text-sm font-semibold">
              {t('auth.signup.fields.emailLabel')}
              <span className="text-red-600">*</span>
            </FormLabel>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.signup.fields.emailPlaceholder')}
              autoComplete="email"
              {...register('email', {
                required: t('auth.signup.validation.emailRequired'),
                pattern: {
                  value: /[^\s]+@[^\s]+\.[^\s]+/,
                  message: t('auth.signup.validation.emailInvalid'),
                },
              })}
            />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={Boolean(errors.password)} className="space-y-2">
            <FormLabel htmlFor="password" className="flex items-center gap-1 text-sm font-semibold">
              {t('auth.signup.fields.passwordLabel')}
              <span className="text-red-600">*</span>
            </FormLabel>
            <InputGroup size="md" className="h-11">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.signup.fields.passwordPlaceholder')}
                autoComplete="new-password"
                {...register('password', {
                  required: t('auth.signup.validation.passwordRequired'),
                  minLength: {
                    value: 8,
                    message: t('auth.signup.validation.passwordLength'),
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

          <MotionButton
            type="submit"
            colorScheme="brand"
            className="w-full h-11"
            isLoading={isSubmitting}
            loadingText={t('auth.signup.submitting')}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            {t('auth.signup.cta')}
          </MotionButton>
        </form>

        <div className="text-center text-sm text-text-muted">
          <Trans i18nKey="auth.signup.loginPrompt">
            Already have an account? <Link to="/login">Sign in</Link>
          </Trans>
        </div>
      </div>
    </AuthShell>
  )
}

export default SignupPage
