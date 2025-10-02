import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Badge, Box, Button, CardBody, Container, Flex, FormLabel, Icon, IconButton, Input, InputGroup, InputRightAddon, Radio, RadioGroup, Spinner, Stack, Text, Tooltip, useToast } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import StandardCard from '../../../components/StandardCard'
import { motion } from 'framer-motion'
import { Check, Coins, HelpCircle, Percent, Plus, Save, Trash, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import PageHeader from '../../../components/PageHeader'
import { addTax, deleteTax, fetchTaxes, setDefaultTax } from '../../../store/slices/taxSlice'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const TaxesPage = () => {
  const dispatch = useDispatch()
  const toast = useToast()
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
      newTaxInputRefs.current[newTaxes.length - 1]?.focus()
    }
  }, [newTaxes.length])

  const handleNewTaxChange = (index, field, value) => {
    setNewTaxes((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddTaxRow = () => {
    if (newTaxes.length > 0) {
      const lastTax = newTaxes[newTaxes.length - 1]
      if (!lastTax.label.trim() || !lastTax.value.trim()) {
        toast({
          title: t('settings.taxes.alerts.completeFieldsTitle', 'Complete fields'),
          description: t('settings.taxes.alerts.completeFields'),
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }
    }

    setNewTaxes((prev) => [...prev, { label: '', value: '' }])
  }

  const handleSaveNewTax = async (index) => {
    try {
      const tax = newTaxes[index]
      await dispatch(addTax(tax)).unwrap()
      setNewTaxes((prev) => prev.filter((_, i) => i !== index))
      toast({
        title: t('settings.taxes.alerts.addSuccessTitle', 'Tax added'),
        description: t('settings.taxes.alerts.addSuccess', 'The tax was added successfully.'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: t('settings.taxes.alerts.addFailedTitle', 'Unable to add tax'),
        description: t('settings.taxes.alerts.addFailed'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteTax(id)).unwrap()
      toast({
        title: t('settings.taxes.alerts.deleteSuccessTitle', 'Tax removed'),
        description: t('settings.taxes.alerts.deleteSuccess', 'The tax was deleted.'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: t('settings.taxes.alerts.deleteFailedTitle', 'Unable to delete tax'),
        description: t('settings.taxes.alerts.deleteFailed', 'Please try again.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const handleDefaultChange = (id) => {
    dispatch(setDefaultTax(id))
  }

  const handleCancelNewTax = (index) => {
    setNewTaxes((prev) => prev.filter((_, i) => i !== index))
  }

  const defaultTaxId = taxes.find((tax) => tax.isDefault)?.id

  const headerActions = [
    <Button
      key="add-tax"
      leftIcon={<Icon as={Plus} boxSize={ICON_BOX_MD} aria-hidden="true" />}
      colorScheme="brand"
      onClick={handleAddTaxRow}
      as={motion.button}
      whileTap={{ scale: 0.98 }}
      minH="44px"
      isDisabled={
        newTaxes.length > 0 &&
        (!newTaxes[newTaxes.length - 1].label.trim() || !newTaxes[newTaxes.length - 1].value.trim())
      }
    >
      {t('settings.taxes.addTax')}
    </Button>,
  ]

  return (
    <PageContainer>
      <PageHeader
        icon={Coins}
        title={t('settings.taxes.header')}
        subtitle={t('settings.taxes.subtitle')}
        actions={headerActions}
      />

      <StandardCard mb={6}>
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'flex-start', md: 'center' }}>
            <Tooltip label={t('settings.taxes.help.tooltip')} placement="bottom-start">
              <Flex align="center" gap={4} color="gray.500">
                <Icon as={HelpCircle} boxSize={ICON_BOX_MD} aria-hidden="true" />
                <Text fontSize="sm">{t('settings.taxes.help.hover')}</Text>
              </Flex>
            </Tooltip>
            <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
              {t('settings.taxes.stats.total', { count: taxes?.length || 0 })}
            </Badge>
          </Flex>
        </CardBody>
      </StandardCard>

      <StandardCard>
        <CardBody>
          {loading ? (
            <Flex align="center" justify="center" py={12}>
              <Spinner size="lg" color="brand.500" />
            </Flex>
          ) : taxes.length > 0 ? (
            <Stack spacing={4}>
              <RadioGroup
                value={defaultTaxId ? defaultTaxId.toString() : ''}
                onChange={(value) => handleDefaultChange(Number(value))}
              >
                <Stack spacing={4}>
                  {taxes.map((tax) => (
                    <Box key={tax.id} borderWidth="1px" borderRadius="lg" p={4} bg="gray.50" _dark={{ bg: 'gray.800' }}>
                      <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'center' }}>
                        <Box flex={{ base: 1, md: 2 }}>
                          <FormLabel fontSize="sm" color="gray.500" mb={1}>
                            {t('settings.taxes.fields.taxLabel')}
                          </FormLabel>
                          <Text fontWeight="semibold" fontSize="md">
                            {tax.label || t('common.na')}
                          </Text>
                        </Box>

                        <Box flex={{ base: 1, md: 1 }}>
                          <FormLabel fontSize="sm" color="gray.500" mb={1}>
                            {t('settings.taxes.fields.taxRate')}
                          </FormLabel>
                          <InputGroup size="sm">
                            <Input value={tax.value} readOnly fontWeight="medium" />
                            <InputRightAddon>
                              <Icon as={Percent} boxSize={ICON_BOX_MD} aria-hidden="true" />
                            </InputRightAddon>
                          </InputGroup>
                        </Box>

                        <Box flex={{ base: 1, md: 1 }}>
                          <FormLabel fontSize="sm" color="gray.500" mb={1}>
                            {t('settings.taxes.fields.default')}
                          </FormLabel>
                          {tax.isDefault ? (
                            <Badge colorScheme="green" borderRadius="full" px={3} py={1} display="inline-flex" alignItems="center" gap={4}>
                              <Icon as={Check} boxSize={ICON_BOX_MD} aria-hidden="true" />
                              {t('settings.taxes.fields.defaultBadge')}
                            </Badge>
                          ) : (
                            <Tooltip label={t('settings.taxes.fields.setDefault')}>
                              <Radio value={tax.id.toString()} aria-label={t('settings.taxes.fields.setDefault')} />
                            </Tooltip>
                          )}
                        </Box>

                        <Flex justify={{ base: 'flex-start', md: 'flex-end' }} flex={{ base: 1, md: 1 }}>
                          <IconButton size="lg" aria-label={t('settings.taxes.fields.actions')}
                            icon={<Icon as={Trash} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                            variant="outline"
                            colorScheme="red"
                            onClick={() => handleDelete(tax.id)}
                            as={motion.button}
                            whileTap={{ scale: 0.96 }}
                          />
                        </Flex>
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              </RadioGroup>
            </Stack>
          ) : (
            <Flex direction="column" align="center" justify="center" py={12} color="gray.500" gap={4}>
              <Icon as={Coins} boxSize={12} opacity={0.2} aria-hidden="true" />
              <Text fontSize="lg" fontWeight="semibold">
                {t('settings.taxes.empty.title')}
              </Text>
              <Text fontSize="sm">{t('settings.taxes.empty.subtitle')}</Text>
            </Flex>
          )}

          {newTaxes.length > 0 && (
            <Box mt={10} borderTopWidth="1px" borderColor="gray.200" pt={6}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={4}>
                {t('settings.taxes.new.title')}
              </Text>
              <Stack spacing={4}>
                {newTaxes.map((tax, index) => (
                  <Box
                    key={`new-tax-${index}`}
                    borderWidth="1px"
                    borderRadius="lg"
                    borderStyle="dashed"
                    borderColor="yellow.400"
                    bg="yellow.50"
                    _dark={{ bg: 'yellow.900' }}
                    p={4}
                  >
                    <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'flex-end' }}>
                      <Box flex={{ base: 1, md: 2 }}>
                        <FormLabel fontSize="sm" color="gray.600" mb={1}>
                          {t('settings.taxes.new.taxLabelRequired')}
                        </FormLabel>
                        <Input
                          value={tax.label}
                          onChange={(event) => handleNewTaxChange(index, 'label', event.target.value)}
                          placeholder={t('settings.taxes.new.placeholderLabel')}
                          ref={(element) => {
                            newTaxInputRefs.current[index] = element
                          }}
                        />
                      </Box>

                      <Box flex={{ base: 1, md: 1 }}>
                        <FormLabel fontSize="sm" color="gray.600" mb={1}>
                          {t('settings.taxes.new.taxRateRequired')}
                        </FormLabel>
                        <InputGroup>
                          <Input
                            type="number"
                            value={tax.value}
                            onChange={(event) => handleNewTaxChange(index, 'value', event.target.value)}
                            placeholder={t('settings.taxes.new.placeholderRate')}
                            min={0}
                            max={100}
                            step="0.01"
                          />
                          <InputRightAddon>
                            <Icon as={Percent} boxSize={ICON_BOX_MD} aria-hidden="true" />
                          </InputRightAddon>
                        </InputGroup>
                      </Box>

                      <Flex gap={4} flex={{ base: 1, md: '0 0 220px' }}>
                        <Button
                          colorScheme="green"
                          flex={1}
                          onClick={() => handleSaveNewTax(index)}
                          isDisabled={!tax.label.trim() || !tax.value.trim()}
                          leftIcon={<Icon as={Save} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                          as={motion.button}
                          whileTap={{ scale: 0.98 }}
                        >
                          {t('settings.taxes.new.save')}
                        </Button>
                        <Button
                          variant="outline"
                          flex={1}
                          onClick={() => handleCancelNewTax(index)}
                          leftIcon={<Icon as={X} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                          as={motion.button}
                          whileTap={{ scale: 0.98 }}
                        >
                          {t('settings.taxes.new.cancel')}
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardBody>
      </StandardCard>
    </PageContainer>
  )
}

export default TaxesPage
