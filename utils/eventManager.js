const EventEmitter = require('events');
const notificationController = require('../controllers/notificationController');
const { logActivity } = require('./activityLogger');
const { User, Proposals, Manufacturer } = require('../models');
const { sendMail } = require('./mail');
const { getPuppeteer } = require('./puppeteerLauncher');
const { escapeHtml, buildPdfHeader, getPdfStyles } = require('./pdfStylingHelpers');
const PdfCustomization = require('../models/PdfCustomization');

class EventManager extends EventEmitter {
    constructor() {
        super();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for proposal acceptance events
        this.on('proposal.accepted', this.handleProposalAccepted.bind(this));
    }

    async handleProposalAccepted(eventData) {
        try {
            console.log('🎉 Proposal Accepted Event:', {
                proposalId: eventData.proposalId,
                ownerGroupId: eventData.ownerGroupId,
                total: eventData.total,
                customer: eventData.customerSummary,
                acceptedBy: eventData.acceptedBy,
                acceptedAt: eventData.acceptedAt,
                isExternalAcceptance: eventData.isExternalAcceptance
            });

            // Here you can add additional logic for proposal acceptance:
            // - Send notification emails
            // - Update analytics/reports
            // - Trigger workflow automations
            // - Log to audit trail
            // - Integrate with external systems

            // Example: Log acceptance to audit trail
            await this.logProposalAcceptance(eventData);

            // Example: Send notifications
            await this.sendAcceptanceNotifications(eventData);

            // Auto-email manufacturer if configured, unless explicitly suppressed by caller
            if (!eventData?.suppressManufacturerEmail) {
                await this.autoEmailManufacturerOnAccept(eventData).catch((e) => {
                    console.error('autoEmailManufacturerOnAccept (event) failed:', e?.message || e);
                });
            } else {
                console.log('✉️  Manufacturer email send suppressed by eventData flag');
            }

        } catch (error) {
            console.error('Error handling proposal.accepted event:', error);
        }
    }

    async logProposalAcceptance(eventData) {
        // TODO: Implement audit logging
        console.log('📝 Logging proposal acceptance to audit trail...');

        // Example audit log entry
        const auditEntry = {
            event_type: 'proposal.accepted',
            proposal_id: eventData.proposalId,
            owner_group_id: eventData.ownerGroupId,
            accepted_by: eventData.acceptedBy,
            accepted_at: eventData.acceptedAt,
            total_amount: eventData.total,
            customer_id: eventData.customerSummary?.id,
            is_external_acceptance: eventData.isExternalAcceptance,
            timestamp: new Date()
        };

        console.log('Audit entry created:', auditEntry);
        // Persist lightweight activity
        await logActivity({
            actorId: typeof eventData.acceptedBy === 'number' ? eventData.acceptedBy : null,
            actorLabel: typeof eventData.acceptedBy === 'string' ? eventData.acceptedBy : undefined,
            action: 'proposal.accept.event',
            targetType: 'Proposal',
            targetId: eventData.proposalId,
            diff: auditEntry
        });
    }

    async sendAcceptanceNotifications(eventData) {
        try {
            console.log('📧 Creating acceptance notifications...');

            // Idempotency guard: avoid creating duplicate notifications for same proposal acceptance
            if (!this._acceptanceNotificationCache) this._acceptanceNotificationCache = new Set();
            const cacheKey = `proposal.accepted:${eventData.proposalId}`;
            if (this._acceptanceNotificationCache.has(cacheKey)) {
                console.log('⚠️ Skipping duplicate acceptance notification for proposal', eventData.proposalId);
                return;
            }

            // Get admin users who should be notified
            const adminUsers = await notificationController.getAdminUsers();

            if (adminUsers.length === 0) {
                console.log('No admin users found for notifications');
                return;
            }

            const notificationData = {
                type: 'proposal_accepted',
                title: 'Proposal Accepted',
                message: `Proposal #${eventData.proposalId} for ${eventData.customerSummary?.name || 'Unknown Customer'} has been accepted (Total: $${eventData.total})`,
                payload: {
                    proposalId: eventData.proposalId,
                    customerName: eventData.customerSummary?.name,
                    customerId: eventData.customerSummary?.id,
                    total: eventData.total,
                    ownerGroupId: eventData.ownerGroupId,
                    acceptedBy: eventData.acceptedBy,
                    acceptedAt: eventData.acceptedAt,
                    isExternalAcceptance: eventData.isExternalAcceptance
                },
                priority: 'high',
                action_url: `/proposals/${eventData.proposalId}`,
                created_by: eventData.acceptedBy || null
            };

            // Create notifications for all admin users
            const adminUserIds = adminUsers.map(user => user.id);
            await notificationController.createNotificationsForUsers(adminUserIds, notificationData);
            this._acceptanceNotificationCache.add(cacheKey);

            console.log(`✅ Created notifications for ${adminUsers.length} admin users`);

            // Optionally notify contractor group users (owner group members)
            if (eventData.ownerGroupId) {
                const groupUsers = await User.findAll({ where: { group_id: eventData.ownerGroupId, isDeleted: false }, attributes: ['id'] });
                const groupUserIds = groupUsers.map(u => u.id).filter(id => !adminUserIds.includes(id)); // avoid duplicates
                if (groupUserIds.length > 0) {
                    const contractorNotification = { ...notificationData, priority: 'medium' };
                    await notificationController.createNotificationsForUsers(groupUserIds, contractorNotification);
                    console.log(`👥 Also notified ${groupUserIds.length} contractor group users`);
                }
            }

        } catch (error) {
            console.error('Error creating acceptance notifications:', error);
        }
    }

        // Build a styled, no-price HTML similar to proposal PDF (suppressed prices)
    async buildNoPriceOrderHtml(snapshot) {
        // Fetch PDF customization for consistent branding
        let pdfCustomization = {};
        try {
            const pdfConfig = await PdfCustomization.findOne({ order: [['updatedAt', 'DESC']] });
            if (pdfConfig) {
                pdfCustomization = pdfConfig.toJSON();
            }
        } catch (err) {
            console.warn('Failed to fetch PDF customization for order PDF:', err?.message);
        }

        const info = snapshot?.info || {};
        const m = (snapshot?.manufacturers && snapshot.manufacturers[0]) || {};
        const items = Array.isArray(m.items) ? m.items : Array.isArray(snapshot?.items) ? snapshot.items : [];

        const cols = ['no', 'qty', 'item', 'assembled', 'hingeSide', 'exposedSide'];
        const headerCell = (txt, right) => `<th style="border:1px solid #e5e7eb;padding:8px 10px;${right?'text-align:right;':''}">${txt}</th>`;
        const cell = (txt, right) => `<td style="border:1px solid #e5e7eb;padding:7px 10px;font-size:9.5px;${right?'text-align:right;':''}">${txt}</td>`;

        const yes = 'Yes', no = 'No', na = 'N/A';
        const rows = items.map((it, i) => {
            const assembled = it.isRowAssembled ? yes : no;
            return `<tr>
                ${cell(i+1)}
                ${cell(Number(it.quantity || it.qty || 1))}
                ${cell(escapeHtml(it.sku || it.code || it.name || ''))}
                ${cell(assembled)}
                ${cell(escapeHtml(it.hingeSide || na))}
                ${cell(escapeHtml(it.exposedSide || na))}
            </tr>`;
        }).join('');

        const header = buildPdfHeader({
            pdfCustomization,
            title: `Order ${escapeHtml(info.orderNumber || '')}`,
            apiUrl: process.env.API_URL || '',
            uploadBase: process.env.API_URL || '',
            t: (key, defaultValue) => defaultValue || key,
        });

        const styles = getPdfStyles(pdfCustomization);

        return `<!doctype html><html><head><meta charset="utf-8"/>
            <title>Order ${escapeHtml(info.orderNumber || '')} for ${escapeHtml(info.manufacturerName || m.name || 'Manufacturer')}</title>
            ${styles}
        </head><body>
            <div class="page-wrapper">
                ${header}
                <div class="content-wrapper">
                    <h1 style="font-size:18px;margin:0 0 16px;color:#111827;">Order ${escapeHtml(info.orderNumber || '')}</h1>
                    <div style="margin:6px 0 20px;font-size:11px;">
                        <div style="margin-bottom:6px;"><strong>Customer:</strong> ${escapeHtml(info.customerName || 'N/A')}</div>
                        <div style="margin-bottom:6px;"><strong>Order #:</strong> ${escapeHtml(info.orderNumber || 'N/A')}</div>
                        <div style="margin-bottom:6px;"><strong>Description:</strong> ${escapeHtml(info.description || 'N/A')}</div>
                        <div style="margin-bottom:6px;"><strong>Accepted At:</strong> ${escapeHtml(info.acceptedAt || info.dateAccepted || '')}</div>
                        <div style="margin-bottom:6px;"><strong>Manufacturer:</strong> ${escapeHtml(info.manufacturerName || m.name || '')}</div>
                        <div style="margin-bottom:6px;"><strong>Style:</strong> ${escapeHtml(m.styleName || info.styleName || '')}</div>
                    </div>
                    <table class="items-table">
                        <thead><tr>
                            ${headerCell('No.')}
                            ${headerCell('Qty')}
                            ${headerCell('Item')}
                            ${headerCell('Assembled')}
                            ${headerCell('Hinge Side')}
                            ${headerCell('Exposed Side')}
                        </tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </body></html>`;
    }

    async generateNoPricePdf(snapshot) {
        const html = await this.buildNoPriceOrderHtml(snapshot);
        const { puppeteer, launchOptions } = getPuppeteer();
        const browser = await puppeteer.launch(launchOptions);
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } });
            return pdf;
        } finally {
            await browser.close();
        }
    }

    async autoEmailManufacturerOnAccept(eventData, options = {}) {
        try {
            const orderModel = require('../models/Order');
            const order = await orderModel.findOne({ where: { proposal_id: eventData.proposalId } });
            if (!order || !order.snapshot) return { attempted: false, sent: false, reason: 'no-order-or-snapshot' };
            const snapshot = typeof order.snapshot === 'string' ? (() => { try { return JSON.parse(order.snapshot); } catch (_) { return null; } })() : order.snapshot;
            if (!snapshot) return { attempted: false, sent: false, reason: 'invalid-snapshot' };

            const manufacturerId = order.manufacturer_id || (snapshot.manufacturers && snapshot.manufacturers[0] && snapshot.manufacturers[0].manufacturer) || null;
            if (!manufacturerId) return { attempted: false, sent: false, reason: 'no-manufacturer-id' };
            const manufacturer = await Manufacturer.findByPk(manufacturerId);
            if (!manufacturer) return { attempted: false, sent: false, reason: 'manufacturer-not-found' };

            const auto = (manufacturer.autoEmailOnAccept === null || manufacturer.autoEmailOnAccept === undefined) ? true : !!manufacturer.autoEmailOnAccept;
            if (!auto) return { attempted: false, sent: false, reason: 'auto-disabled' };

            const to = manufacturer.email;
            if (!to) return { attempted: true, sent: false, reason: 'missing-recipient' };
            const mode = (manufacturer.orderEmailMode || 'pdf').toLowerCase();
            // Build subject and include normalized order number when available
            const orderNumForSubject = order.order_number || (snapshot?.info && snapshot.info.orderNumber) || null;
            let subject = manufacturer.orderEmailSubject || `New order for ${manufacturer.name}`;
            if (orderNumForSubject) {
                // Replace placeholder tokens if present
                subject = subject.replace(/\{orderNumber\}|\{ORDER_NUMBER\}/g, orderNumForSubject);
                // If no placeholder and number not already present, append it
                if (!subject.includes(orderNumForSubject)) {
                    subject += ` — ${orderNumForSubject}`;
                }
            }
            const template = manufacturer.orderEmailTemplate || 'Please find the attached order PDF. No pricing information is included.';

            const attachments = [];
            let html = undefined;

            // Ensure snapshot has info.orderNumber/manufacturerName for PDF rendering
            try {
                const enriched = typeof snapshot === 'object' && snapshot ? snapshot : {};
                if (!enriched.info || typeof enriched.info !== 'object') enriched.info = {};
                if (!enriched.info.orderNumber) {
                    enriched.info.orderNumber = order.order_number || null;
                }
                if (!enriched.info.manufacturerName) {
                    enriched.info.manufacturerName = manufacturer.name || null;
                }
            } catch (_) { /* non-fatal */ }
            if (mode === 'pdf' || mode === 'both') {
                const pdf = await this.generateNoPricePdf(snapshot);
                if (pdf && pdf.length > 1000) {
                    // Prefer normalized order number in filename when available
                    const orderNum = order.order_number || (snapshot?.info && snapshot.info.orderNumber) || null;
                    const fileBase = orderNum ? `Order-${orderNum}` : `Order-${order.id || eventData.proposalId}`;
                    attachments.push({ filename: `${fileBase}.pdf`, content: pdf, contentType: 'application/pdf' });
                }
            }
            if (mode === 'plain' || mode === 'both') {
                html = template;
            }
            if (attachments.length === 0 && !html) return { attempted: true, sent: false, reason: 'nothing-to-send', to, mode };

            // noSend option for tests/safe runs
            if (options.noSend) {
                console.log('🧪 [noSend] Would send manufacturer email to', to, 'mode=', mode, 'attachments=', attachments.length);
                return { attempted: true, sent: false, simulated: true, to, mode, attachmentsPrepared: attachments.length, hasHtml: !!html };
            }

            await sendMail({ to, subject, html, attachments });
            console.log('📧 Sent manufacturer order email to', to, 'mode=', mode);
            return { attempted: true, sent: true, to, mode };
        } catch (err) {
            console.error('autoEmailManufacturerOnAccept error:', err?.message || err);
            return { attempted: true, sent: false, error: err?.message || String(err) };
        }
    }

    // Method to emit proposal acceptance event
    emitProposalAccepted(eventData) {
        this.emit('proposal.accepted', eventData);
    }
}

// Create singleton instance
const eventManager = new EventManager();

// Set up global process event listener to bridge with controller events
process.on('proposal.accepted', (eventData) => {
    eventManager.emitProposalAccepted(eventData);
});

module.exports = eventManager;
