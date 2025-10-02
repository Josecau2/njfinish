import StandardCard from '../StandardCard'
import React from 'react'
import { CardBody, Flex, Stack, Text, Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const Line = ({ label, value, visible = true }) => {
  if (!visible || !value) return null

  return (
    <Flex justify="space-between" align="center" py={2} borderBottomWidth="1px" borderColor="gray.100">
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontWeight="semibold" color="gray.800" maxW="60%" textAlign="right" noOfLines={2}>
        {value}
      </Text>
    </Flex>
  )
}

const ContactInfoCard = ({ loading, info }) => {
  const { t } = useTranslation()

  return (
    <StandardCard borderRadius="lg" boxShadow="sm">
      <CardBody>
        <PageHeader
          title={t('contact.info.title')}
          subtitle={t('contact.info.subtitle')}
          mobileLayout="compact"
          cardClassName="mb-3"
        />

        {loading ? (
          <Box py={4} textAlign="center">
            <Text color="gray.500" fontSize="sm">
              {t('common.loading')}
            </Text>
          </Box>
        ) : (
          <Stack spacing={0}>
            <Line label={t('contact.info.companyName')} value={info?.companyName} visible={info?.showCompanyName} />
            <Line label={t('contact.info.email')} value={info?.email} visible={info?.showEmail} />
            <Line label={t('contact.info.phone')} value={info?.phone} visible={info?.showPhone} />
            <Line label={t('contact.info.address')} value={info?.address} visible={info?.showAddress} />
            <Line label={t('contact.info.website')} value={info?.website} visible={info?.showWebsite} />
            <Line label={t('contact.info.hours')} value={info?.hours} visible={info?.showHours} />

            {info?.notes && info?.showNotes && (
              <Box mt={3} pt={2} borderTopWidth="1px" borderColor="gray.100">
                <Text fontSize="sm" color="gray.500" mb={1}>
                  {t('contact.info.notes')}
                </Text>
                <Text fontWeight="semibold" color="gray.800">
                  {info?.notes}
                </Text>
              </Box>
            )}
          </Stack>
        )}
      </CardBody>
    </StandardCard>
  )
}

export default ContactInfoCard
