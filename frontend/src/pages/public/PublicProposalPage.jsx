import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CCard, CCardBody, CCardHeader, CAlert, CButton, CSpinner } from '@coreui/react';
import { notifyError, notifySuccess } from '../../helpers/notify';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function PublicProposalPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function fetchProposal() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/proposals/by-token/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load proposal');
        setProposal(json.data);
      } catch (err) {
        setError(err.message || 'Failed to load proposal');
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchProposal();
  }, [token]);

  const isLocked = proposal?.is_locked || proposal?.status === 'accepted';
  const total = useMemo(() => proposal?.totals ?? proposal?.manufacturersData?.totalPrice ?? null, [proposal]);

  async function onAccept() {
    if (!proposal) return;
    setAccepting(true);
    try {
      const res = await fetch(`${API_URL}/api/public/proposals/${proposal.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to accept proposal');
      notifySuccess('Proposal accepted. Thank you!');
      // Reload to reflect locked state
      setProposal((p) => ({ ...p, status: 'accepted', is_locked: true, accepted_at: new Date().toISOString() }));
    } catch (err) {
      notifyError(err.message || 'Could not accept proposal');
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return <div className="d-flex justify-content-center p-5"><CSpinner color="primary" /></div>;
  }

  if (error) {
    return (
      <div className="container py-5">
        <CAlert color="danger">{error}</CAlert>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container py-5">
        <CAlert color="warning">No proposal found for this link.</CAlert>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <CCard className="shadow-sm">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Quote #{proposal.id}</h5>
              {proposal?.customer?.name && <small className="text-muted">for {proposal.customer.name}</small>}
            </div>
            {isLocked && <span className="badge bg-success">Accepted</span>}
          </div>
        </CCardHeader>
        <CCardBody>
          {proposal.description && (
            <div className="mb-3">
              <h6>Description</h6>
              <p className="mb-0">{proposal.description}</p>
            </div>
          )}

          {typeof total === 'number' && (
            <div className="mb-3">
              <h6>Total</h6>
              <p className="fs-4 fw-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          )}

          {/* Minimal summary of items if present */}
          {proposal.manufacturersData?.items?.length > 0 && (
            <div className="mb-3">
              <h6>Summary</h6>
              <ul className="mb-0">
                {proposal.manufacturersData.items.slice(0, 10).map((it, idx) => (
                  <li key={idx}>{it.description || it.code || 'Item'}{it.qty ? ` × ${it.qty}` : ''}</li>
                ))}
                {proposal.manufacturersData.items.length > 10 && <li>…</li>}
              </ul>
            </div>
          )}

          <div className="mt-4 d-flex gap-2">
            <CButton color="success" disabled={isLocked || accepting} onClick={onAccept}>
              {accepting ? 'Accepting…' : (isLocked ? 'Already accepted' : 'Accept')}
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
}
