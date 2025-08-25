const crypto = require('crypto');
const env = require('../config/env');
const { Proposals, ProposalSession, Customer } = require('../models');
const { logActivity } = require('../utils/activityLogger');

function generateToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function ttlMinutesToMs(mins) {
  const ttl = Number(mins);
  return Number.isFinite(ttl) ? ttl * 60 * 1000 : 24 * 60 * 60 * 1000; // default 24h
}

// POST /api/proposals/:id/sessions
// Auth required (contractor/admin). Creates a one-time token session.
async function createSession(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const proposalId = Number(req.params.id);
    if (!Number.isInteger(proposalId) || proposalId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid proposal id' });
    }

    // Scope: ensure this user can access this proposal (group scoping already applied at route level)
    const proposal = await Proposals.findByPk(proposalId);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

  // Compute expiry from env
    const ttlMs = ttlMinutesToMs(env.PUBLIC_PROPOSAL_TOKEN_TTL_MIN);
    const expiresAt = new Date(Date.now() + ttlMs);

    // Customer email enrichment (optional)
    let customerEmail = null;
    if (proposal.customerId) {
      const customer = await Customer.findByPk(proposal.customerId);
      customerEmail = customer?.email || null;
    }

    // Generate unique token
    let token;
    for (let i = 0; i < 3; i++) {
      token = generateToken(24);
      const existing = await ProposalSession.findOne({ where: { token } });
      if (!existing) break;
      token = null;
    }
    if (!token) return res.status(500).json({ success: false, message: 'Failed to generate session token' });

    const session = await ProposalSession.create({
      proposal_id: proposalId,
      token,
      expires_at: expiresAt,
      created_by_user_id: user.id || null,
      customer_email: customerEmail,
    });

    // Mark proposal as sent (and set sent_at) if not already
    const before = proposal.toJSON();
    const update = {};
    if (!proposal.sent_at) update.sent_at = new Date();
    if (!proposal.status || proposal.status.toLowerCase() === 'draft') update.status = 'sent';
    if (Object.keys(update).length > 0) {
      await proposal.update(update);
      await logActivity({
        actorId: user.id,
        action: 'proposal.send.share',
        targetType: 'Proposal',
        targetId: proposalId,
        diff: { before: { status: before.status, sent_at: before.sent_at }, after: { status: proposal.status, sent_at: proposal.sent_at } }
      });
    }

    await logActivity({
      actorId: user.id,
      action: 'proposal.session.create',
      targetType: 'Proposal',
      targetId: proposalId,
      diff: { sessionId: session.id, expires_at: session.expires_at }
    });

    return res.status(201).json({ success: true, data: { id: session.id, token: session.token, expires_at: session.expires_at } });
  } catch (error) {
    console.error('Error creating proposal session:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { createSession };
