import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, Box, Container, FormControl, Checkbox, Input, FormLabel, Select, Switch, Textarea, Flex, Spinner, Alert, Icon, Button, Collapse, RadioGroup, Radio } from '@chakra-ui/react'
import { Settings, Save } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { FaCogs, FaCreditCard } from 'react-icons/fa'
import Swal from 'sweetalert2'
import {
    fetchPaymentConfig,
    savePaymentConfig,
    updatePaymentConfig,
    clearConfigError,
} from '../../store/slices/paymentsSlice'

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
            ? paymentConfig.supportedCurrencies
                .split(',')
                .map((c) => c.trim().toUpperCase())
                .filter(Boolean)
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
      .filter((c) => c)
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
    setSecretState((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsDirty(true)
  }

  const parseSettings = () => {
    const value = formData.settings
    if (typeof value === 'string') {
      if (!value.trim()) return {}
      try {
        return JSON.parse(value)
      } catch (err) {
        Swal.fire(
          t('common.error', 'Error'),
          t('paymentConfig.advanced.invalidJson', 'Advanced settings must be valid JSON.'),
          'error',
        )
        throw err
      }
    }
    return value || {}
  }

  const buildPayload = () => {
    const payload = {
      gatewayProvider: formData.gatewayProvider,
      supportedCurrencies: formData.supportedCurrencies,
      settings: parseSettings(),
    }

    if (formData.gatewayProvider === 'stripe') {
      payload.cardPaymentsEnabled = Boolean(formData.cardPaymentsEnabled)
      payload.stripePublishableKey = formData.stripePublishableKey || null

      if (secretState.secretKeyAction === SECRET_ACTIONS.REPLACE) {
        payload.apiKey = secretState.secretKeyValue || null
      } else if (secretState.secretKeyAction === SECRET_ACTIONS.CLEAR) {
        payload.apiKey = null
      }

      if (secretState.webhookSecretAction === SECRET_ACTIONS.REPLACE) {
        payload.webhookSecret = secretState.webhookSecretValue || null
      } else if (secretState.webhookSecretAction === SECRET_ACTIONS.CLEAR) {
        payload.webhookSecret = null
      }

      // Backward compatibility: allow optional manual fields only when embed/custom provider selected
      payload.gatewayUrl = ''
      payload.embedCode = ''
    } else {
      payload.cardPaymentsEnabled = false
      payload.gatewayUrl = formData.gatewayUrl
      payload.embedCode = formData.embedCode
      payload.stripePublishableKey = null
      payload.apiKey = null
      payload.webhookSecret = null
    }

    return payload
  }

  const handleSave = async () => {
    try {
      const payload = buildPayload()

      if (paymentConfig?.id) {
        await dispatch(updatePaymentConfig({ id: paymentConfig.id, ...payload })).unwrap()
      } else {
        await dispatch(savePaymentConfig(payload)).unwrap()
      }

      setIsDirty(false)
      setSecretState((prev) => ({
        ...prev,
        secretKeyAction: SECRET_ACTIONS.KEEP,
        webhookSecretAction: SECRET_ACTIONS.KEEP,
        secretKeyValue: '',
        webhookSecretValue: '',
      }))

      Swal.fire(
        t('common.success', 'Success'),
        t('paymentConfig.save.success', 'Payment configuration saved successfully'),
        'success',
      )
    } catch (error) {
      Swal.fire(
        t('common.error', 'Error'),
        error.message || t('paymentConfig.save.error', 'Failed to save payment configuration'),
        'error',
      )
    }
  }

  const handleCancel = () => {
    dispatch(clearConfigError())
    if (paymentConfig) {
      setFormData({
        gatewayProvider: paymentConfig.gatewayProvider || 'stripe',
        gatewayUrl: paymentConfig.gatewayUrl || '',
        embedCode: paymentConfig.embedCode || '',
        supportedCurrencies: paymentConfig.supportedCurrencies || ['USD'],
        settings: paymentConfig.settings || {},
        cardPaymentsEnabled: Boolean(paymentConfig.cardPaymentsEnabled),
        stripePublishableKey: paymentConfig.stripePublishableKey || '',
      })
      setSecretState((prev) => ({
        ...prev,
        secretKeyAction: SECRET_ACTIONS.KEEP,
        webhookSecretAction: SECRET_ACTIONS.KEEP,
        secretKeyValue: '',
        webhookSecretValue: '',
      }))
    }
    setIsDirty(false)
  }

  const renderSecretRadios = (field, actionField, hasValue) => {
    const action = secretState[actionField]
    const valueField = actionField === 'secretKeyAction' ? 'secretKeyValue' : 'webhookSecretValue'
    return (
      <div className="d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
          <Checkbox
            type="radio"
            name={actionField}
            id={`${actionField}-keep`}
            label={
              hasValue
                ? t('paymentConfig.stripe.secret.keepExisting', 'Keep existing value')
                : t('paymentConfig.stripe.secret.noneStored', 'No value stored')
            }
            checked={action === SECRET_ACTIONS.KEEP}
            disabled={!hasValue}
            onChange={() => handleSecretActionChange(actionField, SECRET_ACTIONS.KEEP)}
          />
          <Checkbox
            type="radio"
            name={actionField}
            id={`${actionField}-replace`}
            label={t('paymentConfig.stripe.secret.replace', 'Replace with new value')}
            checked={action === SECRET_ACTIONS.REPLACE}
            onChange={() => handleSecretActionChange(actionField, SECRET_ACTIONS.REPLACE)}
          />
          <Checkbox
            type="radio"
            name={actionField}
            id={`${actionField}-clear`}
            label={t('paymentConfig.stripe.secret.clear', 'Remove value')}
            checked={action === SECRET_ACTIONS.CLEAR}
            onChange={() => handleSecretActionChange(actionField, SECRET_ACTIONS.CLEAR)}
          />
        </div>
        <Collapse in={action === SECRET_ACTIONS.REPLACE}>
          <Input
            type="password"
            autoComplete="off"
            value={secretState[valueField]}
            onChange={(e) => handleSecretValueChange(valueField, e.target.value)}
            placeholder={field === 'secret' ? 'sk_live_...' : 'whsec_...'}
          />
        </Collapse>
      </div>
    )
  }

  const getCurrenciesText = useMemo(
    () => () => (formData.supportedCurrencies || []).join(', '),
    [formData.supportedCurrencies],
  )

  const showLegacyFields = formData.gatewayProvider !== 'stripe'

  return (
    <Container fluid className="payment-config">
      <style>
        {`
          .payment-config .card-header .d-flex { gap: 0.5rem; flex-wrap: wrap; }
          .payment-config .card-header .d-flex > .btn { flex: 1 1 auto; min-height: 44px; }
          .payment-config .card-body .row + .row { margin-top: 0.5rem; }
          .payment-config textarea, .payment-config input, .payment-config select { min-height: 44px; }
        `}
      </style>

      <PageHeader
        title={t('paymentConfig.title', 'Payment Configuration')}
        subtitle={t(
          'paymentConfig.subtitle',
          'Configure payment gateway settings and embedded payment forms',
        )}
        icon={FaCogs}
      />

      {configError && (
        <Alert
          status="error"
          className="mb-3"
          dismissible
          onClose={() => dispatch(clearConfigError())}
        >
          {configError}
        </Alert>
      )}

      <Card>
        <CardHeader className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <Icon as={Settings} />
            <div>
              <h5 className="mb-0">
                {t('paymentConfig.gateway.title', 'Payment Gateway Settings')}
              </h5>
              <small className="text-muted">
                {t(
                  'paymentConfig.gateway.subtitle',
                  'Manage how customers submit payments to your business',
                )}
              </small>
            </div>
          <div className="d-flex gap-2">
            <Button
              colorScheme="gray"
              variant="outline"
              disabled={!isDirty || configLoading}
              onClick={handleCancel}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="blue" disabled={configLoading} onClick={handleSave}>
              {configLoading ? (
                <Spinner size="sm" className="me-2" />
              ) : (
                <Icon as={Save} className="me-2" />
              )}
              {t('common.saveChanges', 'Save Changes')}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <FormControl>
            <Flex className="mb-4">
              <Box md={6}>
                <FormLabel htmlFor="gatewayProvider">
                  {t('paymentConfig.gateway.provider', 'Gateway Provider')}
                </FormLabel>
                <Select
                  id="gatewayProvider"
                  value={formData.gatewayProvider}
                  onChange={(e) => handleInputChange('gatewayProvider', e.target.value)}
                >
                  <option value="stripe">{t('paymentConfig.providers.stripe', 'Stripe')}</option>
                  <option value="custom">{t('paymentConfig.providers.custom', 'Custom')}</option>
                </Select>
              </Box>
              <Box md={6}>
                <FormLabel htmlFor="supportedCurrencies">
                  {t('paymentConfig.currencies.label', 'Supported Currencies')}
                </FormLabel>
                <Input
                  id="supportedCurrencies"
                  type="text"
                  value={getCurrenciesText()}
                  onChange={(e) => handleCurrenciesChange(e.target.value)}
                  placeholder={t('paymentConfig.currencies.placeholder', 'USD, EUR, CAD')}
                />
                <small className="text-muted">
                  {t('paymentConfig.currencies.help', 'Separate multiple currencies with commas')}
                </small>
              </Box>
            </Flex>

            <Card className="mb-4">
              <CardHeader className="d-flex align-items-center gap-2">
                <FaCreditCard />
                <span>{t('paymentConfig.stripe.cardTitle', 'Stripe Card Payments')}</span>
              </CardHeader>
              <CardBody className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">
                      {t('paymentConfig.stripe.enableLabel', 'Enable card payments with Stripe')}
                    </h6>
                    <small className="text-muted">
                      {t(
                        'paymentConfig.stripe.enableHelp',
                        'Customers will pay using Stripe Payment Intents.',
                      )}
                    </small>
                  </div>
                  <Switch
                    id="cardPaymentsEnabled"
                    checked={formData.cardPaymentsEnabled}
                    onChange={(e) => handleInputChange('cardPaymentsEnabled', e.target.checked)}
                    label=""
                  />
                </div>

                <Collapse in={formData.cardPaymentsEnabled}>
                  <Flex className="mb-3">
                    <Box md={6}>
                      <FormLabel htmlFor="stripePublishableKey">
                        {t('paymentConfig.stripe.publishableKey', 'Publishable key')}
                      </FormLabel>
                      <Input
                        id="stripePublishableKey"
                        autoComplete="off"
                        value={formData.stripePublishableKey}
                        onChange={(e) =>
                          handleInputChange('stripePublishableKey', e.target.value.trim())
                        }
                        placeholder="pk_live_..."
                      />
                    </Box>
                  </Flex>

                  <Flex className="mb-3">
                    <Box md={6}>
                      <FormLabel>{t('paymentConfig.stripe.secretKey', 'Secret key')}</FormLabel>
                      {renderSecretRadios('secret', 'secretKeyAction', secretState.hasSecretKey)}
                    </Box>
                    <Box md={6}>
                      <FormLabel>
                        {t('paymentConfig.stripe.webhookSecret', 'Webhook signing secret')}
                      </FormLabel>
                      {renderSecretRadios(
                        'webhook',
                        'webhookSecretAction',
                        secretState.hasWebhookSecret,
                      )}
                    </Box>
                  </Flex>

                  <Alert status="info" className="mb-0">
                    {t(
                      'paymentConfig.stripe.securityNote',
                      'Secrets are stored server-side. Choose “Replace” to update them, or “Remove” to clear the value.',
                    )}
                  </Alert>
                </Collapse>
              </CardBody>
            </Card>

            {showLegacyFields && (
              <>
                <Flex className="mb-3">
                  <Box md={12}>
                    <FormLabel htmlFor="gatewayUrl">
                      {t('paymentConfig.gateway.url', 'Gateway URL')} *
                    </FormLabel>
                    <Input
                      id="gatewayUrl"
                      type="url"
                      value={formData.gatewayUrl}
                      onChange={(e) => handleInputChange('gatewayUrl', e.target.value)}
                      placeholder={t(
                        'paymentConfig.gateway.urlPlaceholder',
                        'https://your-payment-gateway.com/checkout',
                      )}
                      required
                    />
                    <small className="text-muted">
                      {t(
                        'paymentConfig.gateway.urlHelp',
                        'The URL where customers will be redirected to make payments',
                      )}
                    </small>
                  </Box>
                </Flex>

                <Flex className="mb-3">
                  <Box md={12}>
                    <FormLabel htmlFor="embedCode">
                      {t('paymentConfig.embed.title', 'Embedded Payment Form Code')}
                    </FormLabel>
                    <Textarea
                      id="embedCode"
                      rows={8}
                      value={formData.embedCode}
                      onChange={(e) => handleInputChange('embedCode', e.target.value)}
                      placeholder={t(
                        'paymentConfig.embed.placeholder',
                        "Paste your payment gateway's embed code here...",
                      )}
                    />
                    <small className="text-muted">
                      {t(
                        'paymentConfig.embed.help',
                        'Optional: HTML/JavaScript code to embed payment forms directly in your pages',
                      )}
                    </small>
                  </Box>
                </Flex>
              </>
            )}

            <Flex className="mb-3">
              <Box md={12}>
                <FormLabel htmlFor="settings">
                  {t('paymentConfig.advanced.title', 'Advanced Settings (JSON)')}
                </FormLabel>
                <Textarea
                  id="settings"
                  rows={6}
                  value={
                    typeof formData.settings === 'object'
                      ? JSON.stringify(formData.settings, null, 2)
                      : formData.settings
                  }
                  onChange={(e) => handleInputChange('settings', e.target.value)}
                  placeholder={`{\n  "theme": "light",\n  "locale": "en",\n  "allowedPaymentMethods": ["card", "bank_transfer"]\n}`}
                />
                <small className="text-muted">
                  {t(
                    'paymentConfig.advanced.help',
                    'Additional configuration options in JSON format',
                  )}
                </small>
              </Box>
            </Flex>
          </FormControl>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h5 className="mb-0">{t('paymentConfig.preview.title', 'Configuration Preview')}</h5>
        </CardHeader>
        <CardBody>
          <div className="border rounded p-3 bg-light">
            <div className="row">
              <div className="col-md-6">
                <strong>{t('paymentConfig.gateway.provider', 'Provider')}:</strong>{' '}
                {formData.gatewayProvider}
              </div>
              <div className="col-md-6">
                <strong>{t('paymentConfig.currencies.label', 'Currencies')}:</strong>{' '}
                {getCurrenciesText()}
              </div>
            {formData.gatewayProvider === 'stripe' ? (
              <div className="mt-3">
                <div>
                  <strong>{t('paymentConfig.stripe.publishableKey', 'Publishable key')}:</strong>
                  <br />
                  <code className="text-break">
                    {formData.stripePublishableKey ||
                      t('paymentConfig.preview.notSet', 'Not configured')}
                  </code>
                </div>
                <div className="mt-2">
                  <strong>{t('paymentConfig.stripe.cardStatus', 'Card payments enabled')}:</strong>{' '}
                  {formData.cardPaymentsEnabled ? t('common.yes', 'Yes') : t('common.no', 'No')}
                </div>
            ) : (
              <div className="mt-2">
                <strong>{t('paymentConfig.gateway.url', 'Gateway URL')}:</strong>
                <br />
                <code className="text-break">
                  {formData.gatewayUrl || t('paymentConfig.preview.notSet', 'Not configured')}
                </code>
              </div>
            )}
            {showLegacyFields && formData.embedCode && (
              <div className="mt-2">
                <strong>{t('paymentConfig.embed.title', 'Embedded Payment Form Code')}:</strong>
                <br />
                <small className="text-muted">
                  {t('paymentConfig.preview.embedConfigured', 'Embedded payment form configured')}
                </small>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </Container>
  )
}

export default PaymentConfiguration
