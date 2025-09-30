import React, { useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'
import { isAdmin as isAdminCheck } from '../../helpers/permissions'

const ContactInfoEditor = ({ info, onSave }) => {
  const { t } = useTranslation()
  const user = useSelector((state) => state.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])

  const [form, setForm] = useState({
    companyName: info?.companyName || '',
    email: info?.email || '',
    phone: info?.phone || '',
    address: info?.address || '',
    website: info?.website || '',
    hours: info?.hours || '',
    notes: info?.notes || '',
    showCompanyName: info?.showCompanyName !== false,
    showEmail: info?.showEmail !== false,
    showPhone: info?.showPhone !== false,
    showAddress: info?.showAddress !== false,
    showWebsite: info?.showWebsite !== false,
    showHours: info?.showHours !== false,
    showNotes: info?.showNotes !== false,
  })

  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return null

  const visibilityControls = [
    { key: 'showCompanyName', label: t('contact.info.companyName') },
    { key: 'showEmail', label: t('contact.info.email') },
    { key: 'showPhone', label: t('contact.info.phone') },
    { key: 'showWebsite', label: t('contact.info.website') },
    { key: 'showAddress', label: t('contact.info.address') },
    { key: 'showHours', label: t('contact.info.hours') },
    { key: 'showNotes', label: t('contact.info.notes') },
  ]

  const detailFields = [
    {
      key: 'companyName',
      label: t('contact.info.companyName'),
      component: Input,
      isTextArea: false,
      visibleFlag: 'showCompanyName',
    },
    {
      key: 'email',
      label: t('contact.info.email'),
      component: Input,
      inputProps: { type: 'email' },
      visibleFlag: 'showEmail',
    },
    {
      key: 'phone',
      label: t('contact.info.phone'),
      component: Input,
      visibleFlag: 'showPhone',
    },
    {
      key: 'address',
      label: t('contact.info.address'),
      component: Textarea,
      visibleFlag: 'showAddress',
    },
    {
      key: 'website',
      label: t('contact.info.website'),
      component: Input,
      visibleFlag: 'showWebsite',
    },
    {
      key: 'hours',
      label: t('contact.info.hours'),
      component: Input,
      visibleFlag: 'showHours',
    },
    {
      key: 'notes',
      label: t('contact.info.notes'),
      component: Textarea,
      visibleFlag: 'showNotes',
    },
  ]

  return (
    <Card borderRadius="lg" boxShadow="sm">
      <CardBody>
        <PageHeader
          title={t('contact.editor.title')}
          subtitle={t('contact.editor.subtitle')}
          mobileLayout="compact"
        />

        <Box as="form" mt={4} onSubmit={handleSave}>
          <Box bg="gray.50" borderRadius="md" px={4} py={3} mb={6} borderWidth="1px" borderColor="gray.100">
            <HStack spacing={2} mb={3}>
              <Badge colorScheme="blue">{t('contact.editor.visibilityBadge', 'Settings')}</Badge>
              <Text fontWeight="semibold">{t('contact.editor.visibilitySettings')}</Text>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {visibilityControls.map(({ key, label }) => (
                <Checkbox key={key} name={key} isChecked={form[key]} onChange={handleChange}>
                  {label}
                </Checkbox>
              ))}
            </SimpleGrid>
          </Box>

          <Stack spacing={4}>
            {detailFields.map(({ key, label, component: FieldComponent, inputProps = {}, visibleFlag }) => {
              const hidden = !form[visibleFlag]
              return (
                <FormControl key={key} isDisabled={hidden}>
                  <FormLabel display="flex" alignItems="center" gap={2} fontWeight="semibold">
                    {label}
                    {hidden && (
                      <Badge colorScheme="gray" borderRadius="md">
                        {t('contact.editor.hidden', 'Hidden')}
                      </Badge>
                    )}
                  </FormLabel>
                  {(() => {
                    const sharedProps = {
                      name: key,
                      value: form[key],
                      onChange: handleChange,
                      ...inputProps,
                    }
                    if (FieldComponent === Textarea) {
                      sharedProps.rows = inputProps.rows ?? 3
                    }
                    return <FieldComponent {...sharedProps} />
                  })()}
                </FormControl>
              )
            })}
          </Stack>

          <Button type="submit" colorScheme="blue" mt={6} isLoading={saving}>
            {saving ? t('common.saving') : t('contact.editor.save')}
          </Button>
        </Box>
      </CardBody>
    </Card>
  )
}

export default ContactInfoEditor
