const EventEmitter = require('events');
const notificationController = require('../controllers/notificationController');
const { logActivity } = require('./activityLogger');
const { User } = require('../models');

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
