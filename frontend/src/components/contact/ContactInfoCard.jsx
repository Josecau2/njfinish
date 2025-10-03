import StandardCard from '../StandardCard'
import React from 'react'
import { CardBody, Flex, Stack, Text, Box, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const Line = ({ label, value, visible = true }) => {
  if (!visible || !value) return null

  return (
    <Flex justify="space-between" align="center" py={2} borderBottomWidth="1px" borderColor={useColorModeValue("gray.100","gray.700")}>
      <Text fontSize="sm" color={useColorModeValue("gray.500","gray.400")}>
        {label}
      </Text>
      <Text fontWeight="semibold" color={useColorModeValue("gray.800","gray.200")} maxW="60%" textAlign="right" noOfLines={2}>
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
            <Text color={useColorModeValue("gray.500","gray.400")} fontSize="sm">
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
              <Box mt={3} pt={2} borderTopWidth="1px" borderColor={useColorModeValue("gray.100","gray.700")}>
                <Text fontSize="sm" color={useColorModeValue("gray.500","gray.400")} mb={1}>
                  {t('contact.info.notes')}
                </Text>
                <Text fontWeight="semibold" color={useColorModeValue("gray.800","gray.200")}>
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
