import { useEffect, useRef, useState } from 'react'
import { Input, FormLabel, Checkbox, Container, Flex, Box, Tooltip, Card, CardHeader, CardBody, Badge, Spinner, Icon } from '@chakra-ui/react'
import { Trash, Plus, Save, X, Check } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addTax, fetchTaxes, deleteTax, setDefaultTax } from '../../../store/slices/taxSlice'
import { CiCircleQuestion } from 'react-icons/ci'
import { FaCoins, FaPercent } from 'react-icons/fa6'
import PageHeader from '../../../components/PageHeader'
import { useTranslation } from 'react-i18next'
import CButton from '../../../components/ui/CButton'
import { CInputGroup, CInputGroupText } from '@coreui/react'

const TaxesPage = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { taxes, loading } = useSelector((state) => state.taxes)
  const [newTaxes, setNewTaxes] = useState([])
  const newTaxInputRefs = useRef([])

  useEffect(() => {
    dispatch(fetchTaxes())
  }, [dispatch])

  useEffect(() => {
    newTaxInputRefs.current = newTaxInputRefs.current.slice(0, newTaxes.length)
  }, [newTaxes.length])

  useEffect(() => {
    if (newTaxes.length > 0) {
      const lastInput = newTaxInputRefs.current[newTaxes.length - 1]
      lastInput?.focus()
    }
  }, [newTaxes.length])

  const handleNewTaxChange = (index, field, val) => {
    const updated = [...newTaxes]
    updated[index][field] = val
    setNewTaxes(updated)
  }

  const handleAddTaxRow = () => {
    if (newTaxes.length === 0) {
      setNewTaxes([{ label: '', value: '' }])
      return
    }

    const lastTax = newTaxes[newTaxes.length - 1]
    if (!lastTax.label.trim() || !lastTax.value.trim()) {
      alert(t('settings.taxes.alerts.completeFields'))
      return
    }

    setNewTaxes((prev) => [...prev, { label: '', value: '' }])
  }

  const handleSaveNewTax = async (index) => {
    try {
      const tax = newTaxes[index]
      await dispatch(addTax(tax)).unwrap()
      setNewTaxes((prev) => prev.filter((_, i) => i !== index))
    } catch (error) {
      alert(t('settings.taxes.alerts.addFailed'))
    }
  }

  const handleDelete = (id) => {
    dispatch(deleteTax(id))
  }

  const handleDefaultChange = (id) => {
    dispatch(setDefaultTax(id))
  }

  const handleCancelNewTax = (index) => {
    setNewTaxes((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Container
      fluid
      className="p-2 m-2"
      style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
    >
      <style>{`
        .settings-taxes .btn, .btn { min-height: 44px; }
      `}</style>
      {/* Header Section */}
      <PageHeader
        icon={FaCoins}
        title={t('settings.taxes.header')}
        subtitle={t('settings.taxes.subtitle')}
        rightContent={
          <CButton
            status="light"
            className="shadow-sm px-4 fw-semibold"
            onClick={handleAddTaxRow}
            disabled={
              newTaxes.length > 0 &&
              (!newTaxes[newTaxes.length - 1].label.trim() ||
                !newTaxes[newTaxes.length - 1].value.trim())
            }
            style={{
              borderRadius: '5px',
              border: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon as={Plus} className="me-2" />
            {t('settings.taxes.addTax')}
          </CButton>
        }
      />

      {/* Stats Card */}
      <Card className="border-0 shadow-sm mb-1">
        <CardBody>
          <Flex className="align-items-center">
            <Box md={6}>
              <div className="d-flex align-items-center gap-3">
                <Tooltip content={t('settings.taxes.help.tooltip')} placement="bottom">
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <CiCircleQuestion style={{ fontSize: '20px', cursor: 'pointer' }} />
                    <small>{t('settings.taxes.help.hover')}</small>
                  </div>
                </Tooltip>
              </div>
            </Box>
            <Box md={6} className="text-md-end mt-3 mt-md-0">
              <div className="d-flex justify-content-md-end align-items-center gap-3">
                <Badge
                  status="info"
                  className="px-3 py-2"
                  style={{
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  {t('settings.taxes.stats.total', { count: taxes?.length || 0 })}
                </Badge>
                <Badge
                  status="success"
                  className="px-3 py-2"
                  style={{
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  {t('settings.taxes.stats.defaultCount', {
                    count: taxes?.filter((tax) => tax.isDefault).length || 0,
                  })}
                </Badge>
              </div>
            </Box>
          </Flex>
        </CardBody>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border-0 shadow-sm">
          <CardBody className="text-center py-5">
            <Spinner colorScheme="blue" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('settings.taxes.loading')}</p>
          </CardBody>
        </Card>
      )}

      {/* Taxes List */}
      {!loading && (
        <Card className="border-0 shadow-sm">
          <CardBody className="p-0">
            {/* Existing Taxes */}
            {taxes?.length > 0 ? (
              <div className="p-3">
                <h6 className="text-muted fw-semibold mb-3 px-2">
                  {t('settings.taxes.existing.title')}
                </h6>
                {taxes.map((tax, index) => (
                  <div
                    key={tax.id}
                    className="mb-3"
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '12px',
                      border: '1px solid #e3e6f0',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    <div className="p-4">
                      <Flex className="align-items-center">
                        <Box xs={12} md={4} className="mb-3 mb-md-0">
                          <FormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.fields.taxLabel')}
                          </FormLabel>
                          <Input
                            value={tax.label}
                            readOnly
                            className="fw-medium"
                            style={{
                              backgroundColor: 'white',
                              border: '1px solid #dee2e6',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                          />
                        </Box>

                        <Box xs={12} md={3} className="mb-3 mb-md-0">
                          <FormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.fields.taxRate')}
                          </FormLabel>
                          <CInputGroup>
                            <Input
                              value={tax.value}
                              readOnly
                              className="fw-medium text-center"
                              style={{
                                backgroundColor: 'white',
                                border: '1px solid #dee2e6',
                                fontSize: '14px',
                              }}
                            />
                            <CInputGroupText
                              style={{
                                backgroundColor: '#e9ecef',
                                border: '1px solid #dee2e6',
                                borderLeft: 'none',
                              }}
                            >
                              <FaPercent size="12" />
                            </CInputGroupText>
                          </CInputGroup>
                        </Box>

                        <Box xs={6} md={2} className="mb-3 mb-md-0 text-center">
                          <FormLabel className="mb-2 fw-semibold text-dark d-block">
                            {t('settings.taxes.fields.default')}
                          </FormLabel>
                          <div
                            className="d-flex justify-content-center align-items-center"
                            style={{ height: '38px' }}
                          >
                            {tax.isDefault ? (
                              <Badge
                                status="success"
                                className="px-3 py-2"
                                style={{
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                }}
                              >
                                <Icon as={Check} className="me-1" size="sm" />
                                {t('settings.taxes.fields.defaultBadge')}
                              </Badge>
                            ) : (
                              <Tooltip
                                content={t('settings.taxes.fields.setDefault')}
                                placement="top"
                              >
                                <Checkbox
                                  type="radio"
                                  name="defaultTax"
                                  checked={tax.isDefault}
                                  onChange={() => handleDefaultChange(tax.id)}
                                  id={`defaultTax-${tax.id}`}
                                  style={{ transform: 'scale(1.2)' }}
                                />
                              </Tooltip>
                            )}
                          </div>
                        </Box>

                        <Box xs={6} md={3} className="text-center">
                          <FormLabel className="mb-2 fw-semibold text-dark d-block">
                            {t('settings.taxes.fields.actions')}
                          </FormLabel>
                          <CButton
                            status="light"
                            size="sm"
                            className="p-2"
                            onClick={() => handleDelete(tax.id)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #e3e6f0',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffe6e6'
                              e.currentTarget.style.borderColor = '#dc3545'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ''
                              e.currentTarget.style.borderColor = '#e3e6f0'
                            }}
                          >
                            <Icon as={Trash} size="sm" style={{ color: '#dc3545' }} />
                          </CButton>
                        </Box>
                      </Flex>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-5">
                  <FaCoins className="text-muted mb-3" style={{ fontSize: '48px', opacity: 0.3 }} />
                  <p className="text-muted mb-1 fs-5">{t('settings.taxes.empty.title')}</p>
                  <small className="text-muted">{t('settings.taxes.empty.subtitle')}</small>
                </div>
              )
            )}

            {/* New Tax Forms */}
            {newTaxes.length > 0 ? (
              <div className="p-3 border-top border-light">
                <h6 className="text-muted fw-semibold mb-3 px-2">
                  {t('settings.taxes.new.title')}
                </h6>
                {newTaxes.map((tax, i) => (
                  <div
                    key={i}
                    className="mb-3"
                    style={{
                      backgroundColor: '#fff7e6',
                      borderRadius: '12px',
                      border: '2px dashed #ffc107',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div className="p-4">
                      <Flex className="align-items-end">
                        <Box xs={12} md={4} className="mb-3 mb-md-0">
                          <FormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.new.taxLabelRequired')}
                          </FormLabel>
                          <Input
                            value={tax.label}
                            onChange={(e) => handleNewTaxChange(i, 'label', e.target.value)}
                            placeholder={t('settings.taxes.new.placeholderLabel')}
                            ref={(element) => {
                              newTaxInputRefs.current[i] = element
                            }}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #ffc107',
                              fontSize: '14px',
                              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)',
                            }}
                          />
                        </Box>

                        <Box xs={12} md={3} className="mb-3 mb-md-0">
                          <FormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.new.taxRateRequired')}
                          </FormLabel>
                          <CInputGroup>
                            <Input
                              type="number"
                              value={tax.value}
                              onChange={(e) => handleNewTaxChange(i, 'value', e.target.value)}
                              placeholder={t('settings.taxes.new.placeholderRate')}
                              min={0}
                              max={100}
                              step="0.01"
                              style={{
                                borderRadius: '8px 0 0 8px',
                                border: '1px solid #ffc107',
                                fontSize: '14px',
                              }}
                            />
                            <CInputGroupText
                              style={{
                                backgroundColor: '#ffc107',
                                border: '1px solid #ffc107',
                                borderRadius: '0 8px 8px 0',
                                color: 'white',
                                fontWeight: '600',
                              }}
                            >
                              <FaPercent size="12" />
                            </CInputGroupText>
                          </CInputGroup>
                        </Box>

                        <Box xs={12} md={5}>
                          <div className="d-flex gap-2">
                            <CButton
                              status="success"
                              onClick={() => handleSaveNewTax(i)}
                              className="flex-grow-1"
                              disabled={!tax.label.trim() || !tax.value.trim()}
                              style={{
                                borderRadius: '8px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(72, 180, 97, 0.3)',
                              }}
                            >
                              <Icon as={Save} className="me-2" />
                              {t('settings.taxes.new.save')}
                            </CButton>
                            <CButton
                              status="light"
                              variant="outline"
                              onClick={() => handleCancelNewTax(i)}
                              className="flex-grow-1"
                              style={{
                                borderRadius: '8px',
                                fontWeight: '600',
                                borderColor: '#6c757d',
                                color: '#495057',
                              }}
                            >
                              <Icon as={X} className="me-2" />
                              {t('settings.taxes.new.cancel')}
                            </CButton>
                          </div>
                        </Box>
                      </Flex>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>
      )}
    </Container>
  )
}

export default TaxesPage
