const { Customer, Proposals, User, Location, ProposalSession, UserGroup } = require('../models/index');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

// Helper function to validate status transitions
const validateStatusTransition = (currentStatus, newStatus, action) => {
    console.log(`🔍 Validating transition: "${currentStatus}" → "${newStatus}" (action: ${action})`);
    
    // TEMPORARY FIX: Allow transitions from draft to Proposal accepted
    if ((currentStatus === 'draft' || currentStatus === 'Draft') && newStatus === 'Proposal accepted') {
        console.log('✅ Allowing draft → Proposal accepted transition (temporary fix)');
        return true;
    }
    
    // Define all workflow statuses that should allow free transitions between each other
    const workflowStatuses = [
        'Draft', 'draft', // Include both cases
        'Follow up 1', 'Follow up 2', 'Follow up 3',
        'Measurement Scheduled', 'Measurement done', 
        'Design done', 'Proposal done',
        'Proposal accepted', 'Proposal rejected',
        'sent', 'accepted', 'rejected', // Legacy statuses
        'Proposal sent' // Add other common statuses
    ];

    // If both statuses are workflow statuses, allow the transition
    if (workflowStatuses.includes(currentStatus) && workflowStatuses.includes(newStatus)) {
        console.log('✅ Both statuses are in workflow - allowing transition');
        return true;
    }

    // If status is the same, allow it (no change)
    if (currentStatus === newStatus) {
        console.log('✅ Status unchanged - allowing');
        return true;
    }

    // For any other cases, use the legacy validation system with improvements
    const validTransitions = {
        'draft': ['sent', 'rejected', 'accepted', 'Proposal accepted'], // Allow direct acceptance from draft
        'Draft': ['sent', 'rejected', 'accepted', 'Proposal accepted'], // Allow direct acceptance from Draft
        'sent': ['accepted', 'rejected', 'expired', 'Proposal accepted', 'Proposal rejected'],
        'accepted': [], // Cannot change from accepted
        'rejected': ['draft', 'Draft'], // Can restart from rejected
        'expired': ['draft', 'Draft'] // Can restart from expired
    };

    // Check direct transitions first (exact string match)
    if (validTransitions[currentStatus]?.includes(newStatus)) {
        console.log('✅ Direct transition allowed');
        return true;
    }

    // Legacy status support with case insensitive handling
    const normalizeStatus = (status) => {
        if (!status) return 'draft';
        
        // Handle new workflow statuses
        if (status === 'Proposal accepted') return 'accepted';
        if (status === 'Proposal rejected') return 'rejected';
        
        // Handle case variations
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'draft') return 'draft';
        
        return lowerStatus;
    };

    const normalizedCurrent = normalizeStatus(currentStatus);
    const normalizedNew = normalizeStatus(newStatus);
    
    console.log(`🔍 Normalized: "${normalizedCurrent}" → "${normalizedNew}"`);
    
    // Check if transition is valid
    const isValid = validTransitions[normalizedCurrent]?.includes(normalizedNew) || 
                   validTransitions[currentStatus]?.includes(newStatus) || // Check exact match too
                   normalizedCurrent === normalizedNew;
    
    console.log(`${isValid ? '✅' : '❌'} Transition result: ${isValid}`);
    return isValid;
};

const saveProposal = async (req, res) => {
    try {
        const { action, formData } = req.body;
        const isDev = process.env.NODE_ENV !== 'production';

        // Extract user information from token
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        let { customerId, customerName, customerEmail } = formData;

        if (!customerId && customerName && customerEmail) {
            let existingUser = await Customer.findOne({ where: { email: customerEmail } });

            if (!existingUser) {
                // Create customer with group scoping if user is a contractor
                const customerData = {
                    name: customerName,
                    email: customerEmail,
                };
                
                // Add group scoping for contractors
                if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
                    customerData.group_id = user.group_id;
                    customerData.created_by_user_id = user.id;
                }
                
                const newUser = await Customer.create(customerData);
                customerId = newUser.id;
                // Audit: customer.create (via proposal.create)
                await logActivity({
                    actorId: user.id,
                    action: 'customer.create',
                    targetType: 'Customer',
                    targetId: newUser.id,
                    diff: { after: newUser.toJSON(), via: 'proposal.create' }
                });
            } else {
                // For contractors, verify they can access this customer
                if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
                    if (existingUser.group_id !== user.group_id) {
                        return res.status(403).json({ 
                            success: false, 
                            message: 'Cannot access customer from different contractor group' 
                        });
                    }
                }
                customerId = existingUser.id;
            }
        }

        // For contractors, verify customer access if customerId is provided
    if (customerId && user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            const customer = await Customer.findByPk(customerId);
            if (customer && customer.group_id !== user.group_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cannot access customer from different contractor group' 
                });
            }
        }


        if (customerId == "" || customerId == null) {
            formData.customerId = null;
        }


        if (!formData.status || formData.status.trim() === '') {
            formData.status = 'Draft';
        }

        if (!formData.date || formData.date.trim() === '') {
            formData.date = new Date();
        }

        // Set default type for proposals if not specified
        if (formData.type === undefined || formData.type === null || formData.type === '') {
            formData.type = 0;
        }

        // ['followUp1Date', 'followUp2Date', 'followUp3Date', 'location', 'salesRep', 'leadSource', 'designer', 'manufacturerId'].forEach((field) => {
        ['location', 'salesRep', 'leadSource', 'designer', 'manufacturerId'].forEach((field) => {
            const dateVal = formData[field];
            if (!dateVal || isNaN(new Date(dateVal))) {
                formData[field] = null;
            }
        });

        // Contractors cannot set designer field - admin only
        if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            delete formData.designer; // Remove designer assignment for contractors
        }

        if (!customerId) {
            customerId = null;
        }

        const dataToSave = {
            ...formData,
            customerId,
            owner_group_id: user.group_id || null, // Set owner group for contractors
            created_by_user_id: user.id,
        };

        const proposal = await Proposals.create(dataToSave);

        // Audit: proposal.create
        await logActivity({
            actorId: user.id,
            action: 'proposal.create',
            targetType: 'Proposal',
            targetId: proposal.id,
            diff: { after: proposal.toJSON() }
        });

        res.status(200).json({ success: true, data: proposal });
    } catch (error) {
        console.error('Error saving proposal:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error });
    }
};

const getProposal = async (req, res) => {
    try {
    const { group_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
        const user = req.user;
        
        // Build where clause
        let whereClause = { 
            isDeleted: false
        };
        
        // Apply user/group scoping
        if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            // Contractors can only see their own proposals (user-specific)
            whereClause.created_by_user_id = user.id;
        } else if (group_id) {
            // Admins can filter by specific group
            whereClause.owner_group_id = group_id;
        }
        // If no group_id specified and user is admin, show all proposals

        const { count, rows } = await Proposals.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'mobile', 'address']
                },
                {
                    model: User,
                    as: 'designerData',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Location,
                    as: 'locationData',
                    attributes: ['id', 'locationName', 'email', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({ 
            success: true, 
            data: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteProposals = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const proposal = await Proposals.findByPk(id);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposals not found' });
        }

        // Check if proposal is locked
        if (proposal.is_locked) {
            return res.status(403).json({ 
                message: 'Proposal is locked and cannot be deleted.' 
            });
        }

        // For contractors, verify they own this proposal
        if (user.group_id && user.group && user.group.type === 'contractor') {
            if (proposal.owner_group_id !== user.group_id) {
                return res.status(403).json({ 
                    message: 'Cannot delete proposal from different contractor group' 
                });
            }
        }

        proposal.isDeleted = true;
        await proposal.save();
        res.status(200).json({ message: 'Proposals deleted successfully' });
    } catch (err) {
        console.error('Delete Proposals Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getProposalById = async (req, res) => {
    try {
        const proposalId = req.params.id;
        const user = req.user;
        
        const proposal = await Proposals.findByPk(proposalId, {
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'phone', 'address']
                }
            ]
        });

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // For contractors, verify they own this proposal
    if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            if (proposal.created_by_user_id !== user.id) {
                return res.status(403).json({ 
                    message: 'Cannot access proposal created by different user' 
                });
            }
        }

        res.json(proposal);
    } catch (error) {
        console.error('Error fetching proposal by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateProposal = async (req, res) => {
    try {
    const { action, formData } = req.body;
    const isDev = process.env.NODE_ENV !== 'production';
    
        // Check if formData exists
        if (!formData) {
            return res.status(400).json({ success: false, message: 'formData is required for update.' });
        }
        
        let { id, customerId, customerName, customerEmail } = formData;

        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        if (!id) {
            return res.status(400).json({ success: false, message: 'Proposal ID is required for update.' });
        }

        // Find the proposal first to check permissions and lock status
    const existingProposal = await Proposals.findByPk(id);
        if (!existingProposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found.' });
        }

        // Check if proposal is locked
        if (existingProposal.is_locked) {
            return res.status(403).json({ 
                success: false, 
                message: 'Proposal is locked and cannot be edited.' 
            });
        }

        // For contractors, verify they own this proposal
    if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            if (existingProposal.owner_group_id !== user.group_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cannot access proposal from different contractor group' 
                });
            }
        }

        // Customer creation / lookup
        if (!customerId && customerName && customerEmail) {
            const existingUser = await Customer.findOne({ where: { email: customerEmail } });

            if (!existingUser) {
                // Create customer with group scoping if user is a contractor
                const customerData = {
                    name: customerName,
                    email: customerEmail,
                };
                
                // Add group scoping for contractors
                if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
                    customerData.group_id = user.group_id;
                    customerData.created_by_user_id = user.id;
                }
                
                const newUser = await Customer.create(customerData);
                customerId = newUser.id;
                // Audit: customer.create (via proposal.update)
                await logActivity({
                    actorId: user.id,
                    action: 'customer.create',
                    targetType: 'Customer',
                    targetId: newUser.id,
                    diff: { after: newUser.toJSON(), via: 'proposal.update' }
                });
            } else {
                // For contractors, verify they can access this customer
                if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
                    if (existingUser.group_id !== user.group_id) {
                        return res.status(403).json({ 
                            success: false, 
                            message: 'Cannot access customer from different contractor group' 
                        });
                    }
                }
                customerId = existingUser.id;
            }
        }

        // For contractors, verify customer access if customerId is provided
    if (customerId && user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            const customer = await Customer.findByPk(customerId);
            if (customer && customer.group_id !== user.group_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cannot access customer from different contractor group' 
                });
            }
        }

        if (!customerId) {
            formData.customerId = 0;
        }

        // Validate status transitions only if status is actually changing
        if (formData.status && formData.status !== existingProposal.status) {
            if (!validateStatusTransition(existingProposal.status, formData.status, action)) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid status transition from ${existingProposal.status} to ${formData.status}` 
                });
            }
        }

        // Update status based on action
        if (action === 'reject') {
            formData.status = 'rejected';
        } else if (action === 'accept') {
            formData.status = 'accepted';
            formData.accepted_at = new Date();
            formData.accepted_by = user.id;
            formData.is_locked = true; // Lock proposal when accepted
        } else if (action === 'send') {
            formData.status = 'sent';
            formData.sent_at = new Date();
        } else if (action === 'expire') {
            formData.status = 'expired';
        }

        // Set sent_at timestamp when status changes to sent (regardless of action)
        if (formData.status === 'sent' && (!existingProposal || existingProposal.status !== 'sent')) {
            formData.sent_at = new Date();
        }

        if (!formData.status || formData.status.trim() === '') {
            formData.status = 'Draft';
        }

        if (!formData.date || formData.date.trim() === '') {
            formData.date = new Date();
        }

        // Preserve type field for updates if it exists
        if (formData.type === undefined || formData.type === null || formData.type === '') {
            formData.type = existingProposal.type || 0;
        }

        // Clear invalid date or nullable fields (exclude type from this processing)
        // ['followUp1Date', 'followUp2Date', 'followUp3Date', 'location', 'salesRep', 'leadSource', 'designer', 'manufacturerId'].forEach((field) => {
        ['location', 'salesRep', 'leadSource', 'designer', 'manufacturerId'].forEach((field) => {
            const val = formData[field];
            if (!val || isNaN(new Date(val))) {
                formData[field] = null;
            }
        });

        // Contractors cannot set designer field - admin only
        if (user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor')) {
            delete formData.designer; // Remove designer assignment for contractors
        }

        // Exclude fields that should not be updated
        const { createdAt, updatedAt, ...fieldsToUpdate } = formData;

        // Ensure customerId is correctly updated
        fieldsToUpdate.customerId = customerId;

        // Perform update
    const before = existingProposal.toJSON();
    const [updatedRows] = await Proposals.update(fieldsToUpdate, {
            where: { id },
        });

        if (updatedRows === 0) {
            return res.status(404).json({ success: false, message: 'Proposal not found or no changes applied.' });
        }

        const updatedProposal = await Proposals.findByPk(id);

        // Audit: proposal.update
        await logActivity({
            actorId: user.id,
            action: 'proposal.update',
            targetType: 'Proposal',
            targetId: updatedProposal.id,
            diff: { before, after: updatedProposal.toJSON(), action }
        });

        res.status(200).json({ success: true, data: updatedProposal });
    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error });
    }
};


const getContracts = async (req, res) => {
    try {
        const proposals = await Proposals.findAll({
            where: { isDeleted: false, type: 1 },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'mobile', 'address']
                },
                {
                    model: User,
                    as: 'designerData',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Location,
                    as: 'locationData',
                    attributes: ['id', 'locationName', 'email', 'phone']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: proposals });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const getCounts = async (req, res) => {

    try {
        const activeProposalsCount = await Proposals.count({
            where: {
                isDeleted: false,
                type: '0'
            }
        });

        const activeOrdersCount = await Proposals.count({
            where: {
                isDeleted: false,
                type: '1'
            }
        });

        res.json({
            activeProposals: activeProposalsCount,
            activeOrders: activeOrdersCount
        });
    } catch (error) {
        console.error('Dashboard counts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateProposalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, status } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Find the proposal first to check permissions and lock status
        const proposal = await Proposals.findByPk(id);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found.' });
        }

        // Check if proposal is locked
        if (proposal.is_locked) {
            return res.status(403).json({ 
                success: false, 
                message: 'Proposal is locked and cannot be modified.' 
            });
        }

        // For contractors, verify they own this proposal
        if (user.group_id && user.group && user.group.type === 'contractor') {
            if (proposal.owner_group_id !== user.group_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Cannot modify proposal from different contractor group' 
                });
            }
        }

        let newStatus = status;
        const updateData = {};

        // Handle specific actions
        if (action === 'send') {
            newStatus = 'sent';
            updateData.sent_at = new Date();
        } else if (action === 'accept') {
            newStatus = 'accepted';
            updateData.accepted_at = new Date();
            updateData.accepted_by = user.id;
            updateData.is_locked = true;
        } else if (action === 'reject') {
            newStatus = 'rejected';
        } else if (action === 'expire') {
            newStatus = 'expired';
        }

        // Validate status transition
        if (!validateStatusTransition(proposal.status, newStatus, action)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status transition from ${proposal.status} to ${newStatus}` 
            });
        }

        updateData.status = newStatus;

        // Set timestamp when changing to sent status (if not already set by action)
        if (newStatus === 'sent' && !updateData.sent_at) {
            updateData.sent_at = new Date();
        }

        // Update the proposal
        const before = proposal.toJSON();
        await proposal.update(updateData);

        // Audit: proposal.update.status
        await logActivity({
            actorId: user.id,
            action: 'proposal.update.status',
            targetType: 'Proposal',
            targetId: proposal.id,
            diff: { before, after: proposal.toJSON(), action, newStatus }
        });

        res.status(200).json({ 
            success: true, 
            data: proposal,
            message: `Proposal status updated to ${newStatus}` 
        });
    } catch (error) {
        console.error('Error updating proposal status:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const acceptProposal = async (req, res) => {
    try {
        const { id } = req.params;
    const { external_signer_name, external_signer_email, session_token } = req.body;
        const user = req.user;

        // Find the proposal with related data
        const proposal = await Proposals.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'mobile', 'address']
                }
            ]
        });

        if (!proposal) {
            return res.status(404).json({ 
                success: false, 
                message: 'Proposal not found.' 
            });
        }

        // Check if proposal is already accepted or locked
        if (proposal.status === 'accepted' || proposal.is_locked) {
            return res.status(400).json({ 
                success: false, 
                message: 'Proposal is already accepted or locked.' 
            });
        }

        // Check if proposal can be accepted (must be in 'sent' status)
        if (proposal.status !== 'sent') {
            return res.status(400).json({ 
                success: false, 
                message: 'Proposal must be in "sent" status to be accepted.' 
            });
        }

        // Determine who is accepting the proposal
        let acceptedBy = null;
        let isExternalAcceptance = false;

        if (user) {
            // Internal user acceptance
            // For contractors, verify they own this proposal
            if (user.group_id && user.group && user.group.type === 'contractor') {
                if (proposal.owner_group_id !== user.group_id) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Cannot accept proposal from different contractor group' 
                    });
                }
            }
            acceptedBy = user.id;
        } else if (session_token) {
            // External acceptance via ProposalSession token
            const session = await ProposalSession.findOne({ where: { token: session_token, proposal_id: proposal.id } });
            if (!session) {
                return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
            }
            if (new Date(session.expires_at).getTime() < Date.now()) {
                return res.status(401).json({ success: false, message: 'Session token expired' });
            }
            acceptedBy = external_signer_name || session.customer_email || external_signer_email || 'external_signer';
            isExternalAcceptance = true;
        } else if (external_signer_name || external_signer_email) {
            // External customer acceptance
            acceptedBy = external_signer_name || external_signer_email;
            isExternalAcceptance = true;
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required for proposal acceptance' 
            });
        }

        // Prepare acceptance data
        const acceptanceData = {
            status: 'accepted',
            accepted_at: new Date(),
            accepted_by: acceptedBy,
            is_locked: true
        };

        // Update proposal atomically
        await proposal.update(acceptanceData);

        // Audit: proposal.accept
        await logActivity({
            actorId: typeof acceptedBy === 'number' ? acceptedBy : null,
            actorLabel: typeof acceptedBy === 'string' ? acceptedBy : undefined,
            action: 'proposal.accept',
            targetType: 'Proposal',
            targetId: proposal.id,
            diff: { after: { status: 'accepted', accepted_at: acceptanceData.accepted_at, accepted_by: acceptedBy, is_locked: true } }
        });

        // Emit proposal.accepted domain event
        const eventData = {
            proposalId: proposal.id,
            ownerGroupId: proposal.owner_group_id,
            total: proposal.manufacturersData?.totalPrice || proposal.total || 0,
            customerSummary: {
                id: proposal.customer?.id,
                name: proposal.customer?.name,
                email: proposal.customer?.email
            },
            acceptedBy: acceptedBy,
            acceptedAt: acceptanceData.accepted_at,
            isExternalAcceptance: isExternalAcceptance
        };

        // Emit event (using process.emit for in-process events)
        process.emit('proposal.accepted', eventData);

        res.status(200).json({ 
            success: true, 
            data: proposal,
            message: 'Proposal accepted successfully',
            eventData: eventData
        });

    } catch (error) {
        console.error('Error accepting proposal:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

// Public: get read-only proposal summary by session token
const getProposalPublicByToken = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token || typeof token !== 'string' || token.length < 10) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }

        const session = await ProposalSession.findOne({ where: { token } });
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (new Date(session.expires_at).getTime() < Date.now()) {
            return res.status(401).json({ success: false, message: 'Session expired' });
        }

        const proposal = await Proposals.findByPk(session.proposal_id, {
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
            ],
            attributes: ['id', 'description', 'status', 'is_locked', 'accepted_at', 'accepted_by', 'manufacturersData']
        });

        if (!proposal || proposal.isDeleted) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }

        // Do not expose internal fields beyond what is necessary
        return res.status(200).json({
            success: true,
            data: {
                id: proposal.id,
                description: proposal.description,
                status: proposal.status,
                is_locked: proposal.is_locked,
                accepted_at: proposal.accepted_at,
                accepted_by: proposal.accepted_by,
                totals: proposal.manufacturersData?.totalPrice || null,
                manufacturersData: proposal.manufacturersData || null,
                customer: proposal.customer ? { id: proposal.customer.id, name: proposal.customer.name, email: proposal.customer.email } : null,
                session: { id: session.id, expires_at: session.expires_at }
            }
        });
    } catch (error) {
        console.error('Error fetching public proposal by token:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getLatestProposals = async (req, res) => {
  try {
    const latestProposals = await Proposals.findAll({
      where: { isDeleted: false },
      order: [['updatedAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'customerId', 'description', 'status', 'createdAt']
    });

    res.json(latestProposals);
  } catch (error) {
    console.error('Error fetching latest proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get proposal details for admin view (with all related data)
const getProposalAdminDetails = async (req, res) => {
    try {
        const proposalId = req.params.id; // Changed from proposalId to id to match route
        const user = req.user;

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Only admins and group admins can access this endpoint
        if (user.role !== 'admin' && user.role !== 'group_admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const proposal = await Proposals.findOne({
            where: { id: proposalId },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'phone', 'address']
                },
                {
                    model: User,
                    as: 'Owner',
                    attributes: ['id', 'name', 'email'],
                    include: [
                        {
                            model: UserGroup,
                            as: 'group',
                            attributes: ['id', 'name', 'description']
                        }
                    ]
                }
            ]
        });

        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Proposal not found' });
        }

        // Parse JSON fields
        let parsedProposal = proposal.toJSON();
        
        // Parse items if it's a string
        if (typeof parsedProposal.items === 'string') {
            try {
                parsedProposal.items = JSON.parse(parsedProposal.items);
            } catch (error) {
                console.error('Error parsing proposal items:', error);
                parsedProposal.items = [];
            }
        }

        // Parse customizations if it's a string
        if (typeof parsedProposal.customizations === 'string') {
            try {
                parsedProposal.customizations = JSON.parse(parsedProposal.customizations);
            } catch (error) {
                console.error('Error parsing proposal customizations:', error);
                parsedProposal.customizations = {};
            }
        }

        // Add UserGroup information if available through Owner
        if (parsedProposal.Owner && parsedProposal.Owner.UserGroup) {
            parsedProposal.UserGroup = parsedProposal.Owner.UserGroup;
        }

        res.status(200).json({
            success: true,
            data: parsedProposal
        });

    } catch (error) {
        console.error('Error fetching proposal admin details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {
    saveProposal,
    getProposal,
    deleteProposals,
    getProposalById,
    updateProposal,
    updateProposalStatus,
    acceptProposal,
    getProposalPublicByToken,
    getContracts,
    getCounts,
    getLatestProposals,
    getProposalAdminDetails
};
