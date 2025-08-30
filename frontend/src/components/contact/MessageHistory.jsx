import React, { useEffect, useMemo } from 'react'
import { CCard, CCardBody, CListGroup, CListGroupItem, CPagination, CPaginationItem, CBadge } from '@coreui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const MessageHistory = ({ loading, threads, page, totalPages, onPageChange, onSelect, isAdmin, groupByUser = false, onSelectUser }) => {
  const { t } = useTranslation()
  const grouped = useMemo(() => {
    if (!groupByUser || !isAdmin || !Array.isArray(threads)) return []
    const map = new Map()
    for (const th of threads) {
      const userId = th.owner?.id || 0
      const name = th.owner?.name || t('contact.history.unknownUser')
      const unread = Number(th.unreadCount) || 0
      const lastAt = new Date(th.last_message_at || th.updatedAt || 0).getTime()
      const entry = map.get(userId) || { userId, name, unread: 0, lastAt: 0, lastSubject: '' }
      entry.unread += unread
      if (lastAt > entry.lastAt) { entry.lastAt = lastAt; entry.lastSubject = th.subject }
      map.set(userId, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt)
  }, [groupByUser, isAdmin, threads, t])
  useEffect(() => { /* could auto-load page 1 from parent */ }, [])
  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <PageHeader title={t('contact.history.title')} subtitle={t('contact.history.subtitle')} mobileLayout="compact" />
        {loading ? (
          <div className="py-3 text-center text-muted">{t('common.loading')}</div>
        ) : (
          <>
            {(groupByUser && (!grouped || grouped.length === 0)) || (!groupByUser && (!threads || threads.length === 0)) ? (
              <div className="py-3 text-center text-muted">{t('contact.history.empty')}</div>
            ) : (
              <CListGroup>
                {groupByUser ? (
                  grouped.map((g) => (
                    <CListGroupItem key={g.userId} className="d-flex justify-content-between align-items-center" role="button" onClick={() => onSelectUser && onSelectUser(g.userId)}>
                      <div>
                        <div className="fw-semibold">{g.name}</div>
                        {g.lastAt > 0 && (
                          <div className="small text-muted">{new Date(g.lastAt).toLocaleString()} • {g.lastSubject}</div>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {Number(g.unread) > 0 && (
                          <CBadge color="danger">{g.unread}</CBadge>
                        )}
                      </div>
                    </CListGroupItem>
                  ))
                ) : (
                  threads.map((tItem) => (
                    <CListGroupItem key={tItem.id} className="d-flex justify-content-between align-items-center" role="button" onClick={() => onSelect(tItem.id)}>
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="fw-semibold">{tItem.subject}</span>
                          {isAdmin && (
                            <CBadge color="secondary">{tItem.owner?.name || t('contact.history.unknownUser')}</CBadge>
                          )}
                          <span className="small text-muted">{new Date(tItem.last_message_at || tItem.updatedAt).toLocaleString()}</span>
                          {Number(tItem.unreadCount) > 0 && (
                            <CBadge color="danger">{t('common.new') || 'New'}</CBadge>
                          )}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {Number(tItem.unreadCount) > 0 && (
                          <CBadge color="danger">{tItem.unreadCount}</CBadge>
                        )}
                        <CBadge color={tItem.status === 'open' ? 'success' : 'secondary'}>{t('contact.status.' + tItem.status)}</CBadge>
                      </div>
                    </CListGroupItem>
                  ))
                )}
              </CListGroup>
            )}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <CPagination size="sm">
                  <CPaginationItem disabled={page === 1} onClick={() => onPageChange(page - 1)}>«</CPaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <CPaginationItem key={i+1} active={i+1 === page} onClick={() => onPageChange(i+1)}>{i+1}</CPaginationItem>
                  ))}
                  <CPaginationItem disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>»</CPaginationItem>
                </CPagination>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default MessageHistory
