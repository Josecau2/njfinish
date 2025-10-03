
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, AlertIcon, Box, Button, CardBody, CardHeader, Container, Flex, FormControl, FormLabel, HStack, Icon, Input, Radio, RadioGroup, Select, Stack, Switch, Text, Textarea, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import { CreditCard, Settings, Save } from 'lucide-react'

import Swal from 'sweetalert2'
import PageHeader from '../../components/PageHeader'
import {
  fetchPaymentConfig,
  savePaymentConfig,
  updatePaymentConfig,
} from '../../store/slices/paymentsSlice'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const SECRET_ACTIONS = {
  KEEP: 'keep',
  REPLACE: 'replace',
  CLEAR: 'clear',
}

const PaymentConfiguration = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { paymentConfig, configLoading, configError } = useSelector((state) => state.payments)

  const [formData, setFormData] = useState({
    gatewayProvider: 'stripe',
    gatewayUrl: '',
    embedCode: '',
    supportedCurrencies: ['USD'],
    settings: {},
    cardPaymentsEnabled: false,
    stripePublishableKey: '',
  })

  const [secretState, setSecretState] = useState({
    hasSecretKey: false,
    hasWebhookSecret: false,
    secretKeyAction: SECRET_ACTIONS.KEEP,
    secretKeyValue: '',
    webhookSecretAction: SECRET_ACTIONS.KEEP,
    webhookSecretValue: '',
  })

  const [isDirty, setIsDirty] = useState(false)

  // Dark mode colors
  const iconBlue = useColorModeValue('blue.500', 'blue.300')
  const iconGreen = useColorModeValue('green.500', 'green.300')
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const borderGray100 = useColorModeValue('gray.100', 'gray.700')

  useEffect(() => {
    dispatch(fetchPaymentConfig())
  }, [dispatch])

  useEffect(() => {
    if (paymentConfig) {
      setFormData({
        gatewayProvider: paymentConfig.gatewayProvider || 'stripe',
        gatewayUrl: paymentConfig.gatewayUrl || '',
        embedCode: paymentConfig.embedCode || '',
        supportedCurrencies: Array.isArray(paymentConfig.supportedCurrencies)
          ? paymentConfig.supportedCurrencies
          : typeof paymentConfig.supportedCurrencies === 'string'
            ? paymentConfig.supportedCurrencies.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
            : ['USD'],
        settings: paymentConfig.settings || {},
        cardPaymentsEnabled: Boolean(paymentConfig.cardPaymentsEnabled),
        stripePublishableKey: paymentConfig.stripePublishableKey || '',
      })
      setSecretState((prev) => ({
        ...prev,
        hasSecretKey: Boolean(paymentConfig.hasSecretKey),
        hasWebhookSecret: Boolean(paymentConfig.hasWebhookSecret),
        secretKeyAction: SECRET_ACTIONS.KEEP,
        secretKeyValue: '',
        webhookSecretAction: SECRET_ACTIONS.KEEP,
        webhookSecretValue: '',
      }))
      setIsDirty(false)
    }
  }, [paymentConfig])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsDirty(true)
  }

  const handleCurrenciesChange = (value) => {
    const currencies = (value || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
    handleInputChange('supportedCurrencies', currencies.length ? currencies : ['USD'])
  }

  const handleSecretActionChange = (field, action) => {
    setSecretState((prev) => ({
      ...prev,
      [field]: action,
      ...(field === 'secretKeyAction' ? { secretKeyValue: '' } : {}),
      ...(field === 'webhookSecretAction' ? { webhookSecretValue: '' } : {}),
    }))
    setIsDirty(true)
  }

  const handleSecretValueChange = (field, value) => {
    setSecretState((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const parseSettings = () => {
    const value = formData.settings
    if (typeof value === 'string') {
      if (!value.trim()) return {}
      return JSON.parse(value)
    }
    return value || {}
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        supportedCurrencies: formData.supportedCurrencies,
        settings: parseSettings(),
        secretKeyAction: secretState.secretKeyAction,
        secretKeyValue: secretState.secretKeyValue,
        webhookSecretAction: secretState.webhookSecretAction,
        webhookSecretValue: secretState.webhookSecretValue,
      }

      setIsDirty(false)

      if (paymentConfig && paymentConfig.id) {
        await dispatch(updatePaymentConfig({ id: paymentConfig.id, data: payload })).unwrap()
      } else {
        await dispatch(savePaymentConfig(payload)).unwrap()
      }

      Swal.fire({
        icon: 'success',
        title: t('paymentConfig.alerts.savedTitle', 'Configuration saved'),
        text: t('paymentConfig.alerts.savedMessage', 'Payment configuration has been updated.'),
      })
    } catch (err) {
      console.error('Failed to save configuration:', err)
      Swal.fire({
        icon: 'error',
        title: t('common.error', 'Error'),
        text: err?.message || t('paymentConfig.alerts.saveFailed', 'Unable to save configuration.'),
      })
      setIsDirty(true)
    }
  }

  const showLegacyFields = formData.gatewayProvider !== 'stripe'
  const currencyInputValue = formData.supportedCurrencies.join(', ')
  const settingsTextareaValue =
    typeof formData.settings === 'object' ? JSON.stringify(formData.settings, null, 2) : formData.settings
  const previewBg = useColorModeValue('gray.50', 'gray.700')
  const labelColor = useColorModeValue('gray.700', 'gray.300')

  const previewDetails = useMemo(
    () => [
      {
        label: t('paymentConfig.gateway.provider', 'Provider'),
        value: formData.gatewayProvider,
      },
      {
        label: t('paymentConfig.currencies.label', 'Currencies'),
        value: currencyInputValue || 'USD',
      },
      formData.gatewayProvider === 'stripe'
        ? {
            label: t('paymentConfig.stripe.publishableKey', 'Publishable key'),
            value: formData.stripePublishableKey || t('paymentConfig.preview.notSet', 'Not configured'),
          }
        : {
            label: t('paymentConfig.gateway.url', 'Gateway URL'),
            value: formData.gatewayUrl || t('paymentConfig.preview.notSet', 'Not configured'),
          },
      formData.gatewayProvider === 'stripe'
        ? {
            label: t('paymentConfig.stripe.cardStatus', 'Card payments enabled'),
            value: formData.cardPaymentsEnabled ? t('common.yes', 'Yes') : t('common.no', 'No'),
          }
        : null,
    ].filter(Boolean),
    [formData, currencyInputValue, t],
  )

  return (
    <PageContainer>
      <PageHeader
        title={t('paymentConfig.title', 'Payment Configuration')}
        subtitle={t('paymentConfig.subtitle', 'Manage payment gateway integration settings')}
        icon={Settings}
        actions={[
          <Button
            key="save"
            leftIcon={<Icon as={Save} boxSize={ICON_BOX_MD} aria-hidden="true" />}
            colorScheme="brand"
            onClick={handleSave}
            isLoading={configLoading}
            isDisabled={configLoading || !isDirty}
            minH="44px"
          >
            {configLoading
              ? t('paymentConfig.buttons.saving', 'Saving...')
              : t('paymentConfig.buttons.save', 'Save Changes')}
          </Button>,
        ]}
      />

      <Stack spacing={6}>
        {configError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {configError}
          </Alert>
        )}

        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardHeader borderBottomWidth="1px">
            <HStack spacing={4} align="center">
              <Icon as={CreditCard} boxSize={ICON_BOX_MD} color={iconBlue} />
              <Text fontWeight="semibold" fontSize="lg">
                {t('paymentConfig.gateway.title', 'Gateway Settings')}
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <Stack spacing={6}>
              <FormControl>
                <FormLabel fontWeight="medium" color={labelColor}>
                  {t('paymentConfig.gateway.provider', 'Provider')}
                </FormLabel>
                <Select
                  value={formData.gatewayProvider}
                  onChange={(event) => handleInputChange('gatewayProvider', event.target.value)}
                  minH="44px"
                >
                  <option value="stripe">Stripe</option>
                  <option value="custom">Custom</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium" color={labelColor}>
                  {t('paymentConfig.currencies.label', 'Supported Currencies')}
                </FormLabel>
                <Input
                  value={currencyInputValue}
                  onChange={(event) => handleCurrenciesChange(event.target.value)}
                  placeholder="USD, EUR, CAD"
                  minH="44px"
                />
                <Text fontSize="xs" color={textGray500} mt={1}>
                  {t('paymentConfig.currencies.help', 'Comma-separated list of currency codes (ISO 4217)')}
                </Text>
              </FormControl>

              {formData.gatewayProvider === 'stripe' && (
                <Stack spacing={4} borderWidth="1px" borderColor={borderGray100} borderRadius="lg" p={4}>
                  <FormControl>
                    <FormLabel fontWeight="medium" color={labelColor}>
                      {t('paymentConfig.stripe.publishableKey', 'Publishable key')}
                    </FormLabel>
                    <Input
                      value={formData.stripePublishableKey}
                      onChange={(event) => handleInputChange('stripePublishableKey', event.target.value)}
                      placeholder="pk_live_..."
                      minH="44px"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel fontWeight="medium" color={labelColor} mb={0}>
                      {t('paymentConfig.stripe.cardStatus', 'Enable card payments')}
                    </FormLabel>
                    <Switch
                      isChecked={formData.cardPaymentsEnabled}
                      onChange={(event) => handleInputChange('cardPaymentsEnabled', event.target.checked)}
                      colorScheme="brand"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="medium" color={labelColor}>
                      {t('paymentConfig.stripe.secretAction', 'Secret key management')}
                    </FormLabel>
                    <RadioGroup
                      value={secretState.secretKeyAction}
                      onChange={(value) => handleSecretActionChange('secretKeyAction', value)}
                    >
                      <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                        <Radio value={SECRET_ACTIONS.KEEP}>{t('paymentConfig.secret.keep', 'Keep current key')}</Radio>
                        <Radio value={SECRET_ACTIONS.REPLACE}>{t('paymentConfig.secret.replace', 'Replace key')}</Radio>
                        {secretState.hasSecretKey && (
                          <Radio value={SECRET_ACTIONS.CLEAR}>{t('paymentConfig.secret.clear', 'Remove key')}</Radio>
                        )}
                      </Stack>
                    </RadioGroup>
                    {secretState.secretKeyAction === SECRET_ACTIONS.REPLACE && (
                      <Input
                        mt={3}
                        type="password"
                        placeholder="sk_live_..."
                        value={secretState.secretKeyValue}
                        onChange={(event) => handleSecretValueChange('secretKeyValue', event.target.value)}
                        minH="44px"
                      />
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="medium" color={labelColor}>
                      {t('paymentConfig.stripe.webhookAction', 'Webhook secret management')}
                    </FormLabel>
                    <RadioGroup
                      value={secretState.webhookSecretAction}
                      onChange={(value) => handleSecretActionChange('webhookSecretAction', value)}
                    >
                      <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                        <Radio value={SECRET_ACTIONS.KEEP}>{t('paymentConfig.secret.keep', 'Keep current key')}</Radio>
                        <Radio value={SECRET_ACTIONS.REPLACE}>{t('paymentConfig.secret.replace', 'Replace key')}</Radio>
                        {secretState.hasWebhookSecret && (
                          <Radio value={SECRET_ACTIONS.CLEAR}>{t('paymentConfig.secret.clear', 'Remove key')}</Radio>
                        )}
                      </Stack>
                    </RadioGroup>
                    {secretState.webhookSecretAction === SECRET_ACTIONS.REPLACE && (
                      <Input
                        mt={3}
                        type="password"
                        placeholder="whsec_..."
                        value={secretState.webhookSecretValue}
                        onChange={(event) => handleSecretValueChange('webhookSecretValue', event.target.value)}
                        minH="44px"
                      />
                    )}
                  </FormControl>
                </Stack>
              )}

              {showLegacyFields && (
                <Stack spacing={4} borderWidth="1px" borderColor={borderGray100} borderRadius="lg" p={4}>
                  <FormControl>
                    <FormLabel fontWeight="medium" color={labelColor}>
                      {t('paymentConfig.gateway.url', 'Gateway URL')}
                    </FormLabel>
                    <Input
                      type="url"
                      value={formData.gatewayUrl}
                      onChange={(event) => handleInputChange('gatewayUrl', event.target.value)}
                      placeholder="https://your-payment-gateway.com/checkout"
                      minH="44px"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="medium" color={labelColor}>
                      {t('paymentConfig.embed.title', 'Embedded Payment Form Code')}
                    </FormLabel>
                    <Textarea
                      rows={6}
                      value={formData.embedCode}
                      onChange={(event) => handleInputChange('embedCode', event.target.value)}
                      placeholder={t('paymentConfig.embed.placeholder', "Paste your payment gateway's embed code here...")}
                    />
                    <Text fontSize="xs" color={textGray500} mt={1}>
                      {t('paymentConfig.embed.help', 'Optional: HTML/JavaScript code to embed payment forms directly in your pages')}
                    </Text>
                  </FormControl>
                </Stack>
              )}

              <FormControl>
                <FormLabel fontWeight="medium" color={labelColor}>
                  {t('paymentConfig.advanced.title', 'Advanced Settings (JSON)')}
                </FormLabel>
                <Textarea
                  rows={6}
                  value={settingsTextareaValue}
                  onChange={(event) => handleInputChange('settings', event.target.value)}
                  placeholder={`{
  "theme": "light",
  "locale": "en",
  "allowedPaymentMethods": ["card", "bank_transfer"]
}`}
                />
                <Text fontSize="xs" color={textGray500} mt={1}>
                  {t('paymentConfig.advanced.help', 'Additional configuration options in JSON format')}
                </Text>
              </FormControl>
            </Stack>
          </CardBody>
        </StandardCard>

        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardHeader borderBottomWidth="1px">
            <HStack spacing={4} align="center">
              <Icon as={CreditCard} boxSize={ICON_BOX_MD} color={iconGreen} />
              <Text fontWeight="semibold" fontSize="lg">
                {t('paymentConfig.preview.title', 'Configuration Preview')}
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <Stack spacing={4} bg={previewBg} borderRadius="lg" p={4} borderWidth="1px" borderColor={borderGray100}>
              {previewDetails.map((item) => (
                <Flex key={item.label} justify="space-between" wrap="wrap" gap={4}>
                  <Text fontWeight="semibold" color={textGray600}>
                    {item.label}
                  </Text>
                  <Text>{item.value}</Text>
                </Flex>
              ))}
              {showLegacyFields && formData.embedCode && (
                <Text fontSize="sm" color={textGray500}>
                  {t('paymentConfig.preview.embedConfigured', 'Embedded payment form configured.')}
                </Text>
              )}
            </Stack>
          </CardBody>
        </StandardCard>
      </Stack>
    </PageContainer>
  )
}

export default PaymentConfiguration
