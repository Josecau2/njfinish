import { Table, Tbody, Td, Th, Thead, Tr, useColorModeValue, useToast } from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { CardBody, Flex, Box, FormControl, Textarea, Badge, Button, HStack, Text } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import PageHeader from '../../../components/PageHeader'
import PageContainer from '../../../components/PageContainer'
import { useTranslation } from 'react-i18next'
import { getLatestTerms, saveTerms, getAcceptance } from '../../../helpers/termsApi'
import { isAdmin as isAdminCheck } from '../../../helpers/permissions'


const TermsPage = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const user = useSelector((s) => s.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])

  // Color mode values
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')

  const [content, setContent] = useState('')
  const [version, setVersion] = useState(null)
  const [saving, setSaving] = useState(false)
  const [acceptance, setAcceptance] = useState({ version: null, users: [] })

  const load = async () => {
    try {
      const res = await getLatestTerms()
      const terms = res?.data?.data
      if (terms) {
        setContent(terms.content || '')
        setVersion(terms.version)
      } else {
        setContent('')
        setVersion(null)
      }
      if (isAdmin) {
        const acc = await getAcceptance()
        setAcceptance(acc?.data?.data || { version: null, users: [] })
      }
    } catch (e) {
      setContent('')
      setVersion(null)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSave = async (bumpVersion) => {
    if (!isAdmin) return
    setSaving(true)
    try {
      await saveTerms({ content, bumpVersion: bumpVersion ? true : false })
      // Success feedback
      toast({
        title: bumpVersion
          ? t('settings.terms.publishedTitle', 'Published')
          : t('common.saved', 'Saved'),
        description: bumpVersion
          ? t(
              'settings.terms.publishedMessage',
              'A new version of your Terms & Conditions has been published.',
            )
          : t('settings.terms.updatedMessage', 'Your Terms & Conditions have been updated.'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      await load()
    } catch (error) {
      console.error('Save terms error:', error)
      toast({
        title: t('common.error', 'Error'),
        description:
          error?.response?.data?.message ||
          t('settings.terms.saveError', 'Failed to save terms. Please try again.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return null

  return (
    <PageContainer>
    <>
      <style>{`
        .settings-terms .btn, .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('settings.terms.title', 'Terms & Conditions')}
        subtitle={t('settings.terms.subtitle', 'Edit terms and track acceptance')}
      />
      <Flex>
        <Box lg={6}>
          <StandardCard>
            <CardBody>
              <h6>{t('settings.terms.editor', 'Editor')}</h6>
              <FormControl>
                <Textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('settings.terms.placeholder', 'Enter terms and conditions...')}
                />
                <HStack mt={3} gap={2}>
                  <Button colorScheme="brand" isDisabled={saving} onClick={() => onSave(false)} minH="44px">
                    {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </Button>
                  <Button
                    colorScheme="orange"
                    variant="outline"
                    isDisabled={saving}
                    onClick={() => onSave(true)}
                    minH="44px"
                  >
                    {t('settings.terms.publishNew', 'Publish as new version')}
                  </Button>
                </HStack>
                {version && (
                  <Text color={iconGray500} mt={2} fontSize="sm">
                    {t('settings.terms.currentVersion', 'Current version')}: {version}
                  </Text>
                )}
              </FormControl>
            </CardBody>
          </StandardCard>
        </Box>
        <Box lg={6}>
          <StandardCard>
            <CardBody>
              <h6>{t('settings.terms.acceptance', 'Acceptance')}</h6>
              <Text color={iconGray500} fontSize="sm" mb={2}>
                {t('settings.terms.version', 'Version')}: {acceptance?.version ?? '-'}
              </Text>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t('common.user', 'User')}</Th>
                    <Th>{t('common.email', 'Email')}</Th>
                    <Th>
                      {t('settings.terms.status', 'Status')}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(acceptance.users || []).map((u) => (
                    <Tr key={u.id}>
                      <Td>{u.name || '-'}</Td>
                      <Td>{u.email || '-'}</Td>
                      <Td>
                        {u.accepted ? (
                          <Badge colorScheme="green">
                            {t('settings.terms.accepted', 'Accepted')}
                          </Badge>
                        ) : (
                          <Badge colorScheme="gray">
                            {t('settings.terms.pending', 'Pending')}
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </StandardCard>
        </Box>
      </Flex>
    </>
    </PageContainer>
  )
}

export default TermsPage
