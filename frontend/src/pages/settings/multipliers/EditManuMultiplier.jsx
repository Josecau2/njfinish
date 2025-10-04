import React, { useEffect, useState } from 'react'
import { Box, CardBody, CardHeader, Checkbox, Flex, FormControl, Input, FormLabel, Spinner, Alert, Button } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import PageHeader from '../../../components/PageHeader'

// Mock data — replace this with your API call
const mockManufacturers = [
  { id: '1', name: 'Manufacturer One', email: 'one@example.com', multiplier: 1.5, enabled: true },
  { id: '2', name: 'Manufacturer Two', email: 'two@example.com', multiplier: 2.0, enabled: false },
]

const EditManuMultiplier = () => {
  const { t } = useTranslation()
  const { id: rawId } = useParams()
  const id = decodeParam(rawId)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    multiplier: '',
    enabled: false,
  })

  useEffect(() => {
    // Simulate fetching manufacturer by id
    const found = mockManufacturers.find((m) => m.id === id)
    if (found) {
      setFormData({
        name: found.name,
        email: found.email,
        multiplier: found.multiplier,
        enabled: found.enabled,
      })
      setLoading(false)
    } else {
      setError('Manufacturer not found')
      setLoading(false)
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simple validation
    if (!formData.name || !formData.email) {
      setError('Name and Email are required')
      return
    }
    setError(null)

    // TODO: Call API to update manufacturer here

    // Navigate back to manufacturer list or wherever
    navigate('/settings/manufacturers')
  }

  if (loading) return <Spinner mx="auto" display="block" />

  if (error)
    return (
      <Alert status="error">
        {error}
      </Alert>
    )

  return (
    <Box>

      <PageHeader
        title="Edit Manufacturer Multiplier"
        showBackButton={true}
        onBackClick={() => navigate('/settings/multipliers')}
      />

      <StandardCard style={{ maxWidth: '600px', margin: '20px auto' }}>
        <CardHeader>{t('settings.multipliers.editManufacturer')}</CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div>
              <FormLabel htmlFor="name">{t('settings.multipliers.form.name')}</FormLabel>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter manufacturer name"
              />
            </div>

            <div>
              <FormLabel htmlFor="email">{t('settings.multipliers.form.email')}</FormLabel>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter manufacturer email"
              />
            </div>

            <div>
              <FormLabel htmlFor="multiplier">{t('settings.multipliers.form.multiplier')}</FormLabel>
              <Input
                type="number"
                step="0.01"
                id="multiplier"
                name="multiplier"
                value={formData.multiplier}
                onChange={handleChange}
                placeholder="Enter multiplier"
              />
            </div>

            <FormControl mb={3}>
              <Checkbox
                id="enabled"
                name="enabled"
                isChecked={formData.enabled}
                onChange={handleChange}
              >
                Enabled
              </Checkbox>
            </FormControl>

            {error && <Alert status="error">{error}</Alert>}

            <Flex justifyContent="flex-end" gap={2}>
              <Button colorScheme="gray" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button colorScheme="brand" type="submit">
                Save Changes
              </Button>
            </Flex>
          </form>
        </CardBody>
      </StandardCard>
    </Box>
  )
}

export default EditManuMultiplier
