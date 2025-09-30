import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardBody, Flex, Box, FormControl, Textarea, Badge, Button } from '@chakra-ui/react'
import PageHeader from '../../../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { getLatestTerms, saveTerms, getAcceptance } from '../../../helpers/termsApi'
import { isAdmin as isAdminCheck } from '../../../helpers/permissions'
import Swal from 'sweetalert2'


const TermsPage = () => {
  const { t } = useTranslation()
  const user = useSelector((s) => s.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
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
      await Swal.fire({
        icon: 'success',
        title: bumpVersion
          ? t('settings.terms.publishedTitle', 'Published')
          : t('common.saved', 'Saved'),
        text: bumpVersion
          ? t(
              'settings.terms.publishedMessage',
              'A new version of your Terms & Conditions has been published.',
            )
          : t('settings.terms.updatedMessage', 'Your Terms & Conditions have been updated.'),
        timer: 1600,
        showConfirmButton: false,
      })
      await load()
    } catch (error) {
      console.error('Save terms error:', error)
      Swal.fire({
        icon: 'error',
        title: t('common.error', 'Error'),
        text:
          error?.response?.data?.message ||
          t('settings.terms.saveError', 'Failed to save terms. Please try again.'),
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <style>{`
        .settings-terms .btn, .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('settings.terms.title', 'Terms & Conditions')}
        subtitle={t('settings.terms.subtitle', 'Edit terms and track acceptance')}
      />
      <Flex className="g-3">
        <Box lg={6}>
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">{t('settings.terms.editor', 'Editor')}</h6>
              <FormControl>
                <Textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('settings.terms.placeholder', 'Enter terms and conditions...')}
                />
                <div className="mt-3 d-flex gap-2">
                  <Button colorScheme="blue" disabled={saving} onClick={() => onSave(false)}>
                    {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </Button>
                  <Button
                    status="warning"
                    variant="outline"
                    disabled={saving}
                    onClick={() => onSave(true)}
                  >
                    {t('settings.terms.publishNew', 'Publish as new version')}
                  </Button>
                </div>
                {version && (
                  <div className="text-muted mt-2 small">
                    {t('settings.terms.currentVersion', 'Current version')}: {version}
                  </div>
                )}
              </FormControl>
            </CardBody>
          </Card>
        </Box>
        <Box lg={6}>
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">{t('settings.terms.acceptance', 'Acceptance')}</h6>
              <div className="text-muted small mb-2">
                {t('settings.terms.version', 'Version')}: {acceptance?.version ?? '-'}
              </div>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t('common.user', 'User')}</Th>
                    <Th>{t('common.email', 'Email')}</Th>
                    <Th className="text-end">
                      {t('settings.terms.status', 'Status')}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(acceptance.users || []).map((u) => (
                    <Tr key={u.id}>
                      <Td>{u.name || '-'}</Td>
                      <Td>{u.email || '-'}</Td>
                      <Td className="text-end">
                        {u.accepted ? (
                          <Badge status="success">
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
          </Card>
        </Box>
      </Flex>
    </>
  )
}

export default TermsPage
