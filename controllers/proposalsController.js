const { Customer, Proposals, User, Location, ProposalSession, UserGroup } = require('../models/index');
const Order = require('../models/Order');
const { Manufacturer } = require('../models/Manufacturers');
const ManufacturerCatalogData = require('../models/manufacturerCatalogData');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');
const { nextCandidate } = require('../utils/numbering');

// Helper to robustly parse JSON-like inputs (handles double-encoded strings)
const robustParse = (val) => {
    let out = val;
    try {
        if (typeof out === 'string') out = JSON.parse(out);
        if (typeof out === 'string') out = JSON.parse(out);
    } catch (_) {}
    return out;
};

// Normalize manufacturersData for storage to ensure no double-encoding and that modifications are numeric
const normalizeManufacturersDataForStorage = (manufacturersData) => {
    const toNum = (v) => Number(String(v ?? 0).toString().replace(/[^0-9.\-]/g, '')) || 0;
    const arr = robustParse(manufacturersData);
    if (!Array.isArray(arr)) return arr;
    return arr.map((entry) => {
        const e = { ...entry };
        // Normalize items and their modifications
        if (Array.isArray(e.items)) {
            e.items = e.items.map((it) => {
                const item = { ...it };
                if (Array.isArray(item.modifications)) {
                    item.modifications = item.modifications.map((m) => ({
                        ...m,
                        price: toNum(m.price ?? m.cost ?? m.amount ?? 0),
                        qty: Number(m.qty ?? m.quantity ?? 1) || 1,
                    }));
                }
                // Keep totals consistent if present
                if (typeof item.modificationsTotal !== 'undefined' && Array.isArray(item.modifications)) {
                    item.modificationsTotal = item.modifications.reduce((s, mm) => s + (toNum(mm.price) * (Number(mm.qty) || 1)), 0);
                }
                return item;
            });
        }
        // Ensure summary.modificationsCost exists and is numeric
        if (e.summary && typeof e.summary === 'object') {
            const itemsMods = Array.isArray(e.items)
                ? e.items.reduce((sum, it) => sum + ((Array.isArray(it.modifications)
                    ? it.modifications.reduce((s, m) => s + (toNum(m.price) * (Number(m.qty) || 1)), 0)
                    : 0)), 0)
                : 0;
            if (e.summary.modificationsCost == null) {
                e.summary.modificationsCost = Number(itemsMods.toFixed(2));
            } else {
                e.summary.modificationsCost = toNum(e.summary.modificationsCost);
                if (e.summary.modificationsCost === 0 && itemsMods > 0) {
                    e.summary.modificationsCost = Number(itemsMods.toFixed(2));
                }
            }
        }
        return e;
    });
};

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
        console.log('🎯 [DEBUG] saveProposal called:', {
            action: req.body?.action,
            proposalId: req.body?.formData?.id,
            customerId: req.body?.formData?.customerId,
            customerName: req.body?.formData?.customerName,
            status: req.body?.formData?.status,
            userId: req.user?.id,
            userGroup: req.user?.group_id,
            timestamp: new Date().toISOString()
        });

    const { action, formData } = req.body;
        const isDev = process.env.NODE_ENV !== 'production';

        // Extract user information from token
        const user = req.user;
        if (!user) {
            console.log('❌ [DEBUG] User not authenticated');
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

        // Debug: Log raw manufacturersData before normalization
        if (formData && formData.manufacturersData !== undefined) {
            console.log('🔍 [DEBUG] Raw manufacturersData before normalization:', JSON.stringify(formData.manufacturersData, null, 2));
            if (Array.isArray(formData.manufacturersData) && formData.manufacturersData[0]) {
                const first = formData.manufacturersData[0];
                console.log('🔍 [DEBUG] First manufacturer items before normalization:', first.items?.length || 'no items');
                if (Array.isArray(first.items)) {
                    first.items.forEach((item, i) => {
                        console.log(`🔍 [DEBUG] Item ${i} modifications:`, Array.isArray(item.modifications) ? item.modifications.length : 'none');
                    });
                }
                console.log('🔍 [DEBUG] First manufacturer summary.modificationsCost before normalization:', first.summary?.modificationsCost);
            }
        }

        // Normalize manufacturersData to avoid double-encoding and ensure numeric modification fields
        try {
            if (formData && formData.manufacturersData !== undefined) {
                formData.manufacturersData = normalizeManufacturersDataForStorage(formData.manufacturersData);
            }
        } catch (_) {}

        // Compute proposal number (daily unique) with small retry loop on dup
        const assignProposalNumber = async () => {
            const maxAttempts = 5;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const cand = await nextCandidate('proposal');
                const fields = {
                    proposal_number: cand.number,
                    proposal_number_date: cand.dateOnly,
                    proposal_number_seq: cand.seq,
                };
                try {
                    return { ok: true, fields };
                } catch (_) {}
            }
            return { ok: false };
        };

        const numbering = await assignProposalNumber();

        // Determine contractor role once for clarity
        const isContractor = user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor');

        const dataToSave = {
            ...formData,
            customerId,
            // Only set owner_group_id for contractor users to satisfy FK constraints
            owner_group_id: isContractor ? user.group_id : null,
            created_by_user_id: user.id,
            ...(numbering.ok ? numbering.fields : {})
        };
        let proposal = null;
        {
            const maxAttempts = 5;
            let lastErr = null;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    proposal = await Proposals.create(dataToSave);
                    break;
                } catch (e) {
                    const msg = String(e?.message || e);
                    const dup = msg.includes('Duplicate entry') && (msg.includes('uniq_proposals_number_date_seq') || msg.includes('uniq_proposals_proposal_number'));
                    if (dup) {
                        // regenerate and retry
                        const cand = await nextCandidate('proposal');
                        dataToSave.proposal_number = cand.number;
                        dataToSave.proposal_number_date = cand.dateOnly;
                        dataToSave.proposal_number_seq = cand.seq;
                        lastErr = e;
                        continue;
                    }
                    lastErr = e;
                    break;
                }
            }
            if (!proposal) {
                throw lastErr || new Error('Failed to create proposal with number');
            }
        }

        // Audit: proposal.create
        await logActivity({
            actorId: user.id,
            action: 'proposal.create',
            targetType: 'Proposal',
            targetId: proposal.id,
            diff: { after: proposal.toJSON() }
        });

        // If caller requested immediate acceptance from create screen, delegate to accept flow
        if ((action && action.toLowerCase() === 'accept') || (formData && String(formData.status).toLowerCase() === 'accepted')) {
            try {
                // Reuse the robust acceptProposal logic (ensures modifications are included)
                req.params = { ...(req.params || {}), id: String(proposal.id) };
                return await acceptProposal(req, res);
            } catch (e) {
                console.error('❌ [DEBUG] accept-on-create failed:', e.message);
                // Fall back to returning the created proposal
                return res.status(200).json({ success: true, data: proposal, warning: 'accept-on-create failed; proposal created only' });
            }
        }

        res.status(200).json({ success: true, data: proposal });
    } catch (error) {
        console.error('Error saving proposal:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error });
    }
};

const getProposal = async (req, res) => {
    try {
    const { group_id } = req.query;
    const mineFlag = (req.query.mine || '').toString().toLowerCase() === 'true';
    // Additional optional filters
    const lockedFilter = (req.query.locked || '').toString().toLowerCase();
    const statusFilter = (req.query.status || '').toString();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
        const user = req.user;

        // Build where clause
        let whereClause = { isDeleted: false };

        // Role flags
        const role = (user?.role || '').toString().toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';
        const isContractor = user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor');

        // Apply user/group scoping
        if (isAdmin) {
            // Admins can see all; optionally self-scope or filter by group
            if (mineFlag) {
                whereClause.accepted_by = { [Op.in]: [user.id, String(user.id)] };
            } else if (group_id) {
                whereClause.owner_group_id = group_id;
            }
        } else if (isContractor) {
            // Contractors only see their own (created by them)
            whereClause.created_by_user_id = user.id;
        } else {
            // Non-admin staff see only proposals they accepted
            whereClause.accepted_by = { [Op.in]: [user.id, String(user.id)] };
        }
        // If no group_id specified and user is admin, show all proposals

        // Apply locked filter if requested
        if (lockedFilter === 'true') {
            whereClause.is_locked = true;
        } else if (lockedFilter === 'false') {
            whereClause.is_locked = { [Op.not]: true };
        }

        // Apply status filter if provided (supports comma-separated list)
        if (statusFilter) {
            let statuses = statusFilter.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean);
            // Backward compatibility: if 'accepted' requested, also include legacy 'Proposal accepted'
            if (statuses.includes('accepted') && !statuses.includes('Proposal accepted')) {
                statuses.push('Proposal accepted');
            }
            whereClause.status = { [Op.in]: statuses };
        }

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
                },
                // Include contractor (owner) minimal info for admin list display
                {
                    model: User,
                    as: 'Owner',
                    attributes: ['id', 'name', 'email'],
                    include: [
                        {
                            model: UserGroup,
                            as: 'group',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                // Also include ownerGroup directly (contractor group) for legacy rows where created_by_user_id is null
                {
                    model: UserGroup,
                    as: 'ownerGroup',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Convert Sequelize instances to plain JSON objects to ensure associations are serialized
        const plainRows = rows.map(row => row.toJSON());

        res.status(200).json({
            success: true,
            data: plainRows,
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
        const role = (user?.role || '').toString().toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';

        const proposal = await Proposals.findByPk(id);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposals not found' });
        }

        // Check if proposal is locked (admins can bypass)
        if (proposal.is_locked && !(isAdmin || req.isAdminBypass)) {
            return res.status(403).json({
                message: 'Proposal is locked and cannot be deleted.'
            });
        }

        // For contractors, verify they own this proposal (admins can bypass)
        if (!isAdmin && !(req.isAdminBypass)) {
            if (user.group_id && user.group && user.group.type === 'contractor') {
                if (proposal.owner_group_id !== user.group_id) {
                    return res.status(403).json({
                        message: 'Cannot delete proposal from different contractor group'
                    });
                }
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

        // Visibility enforcement for single proposal
        const role = (user?.role || '').toString().toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';
        const isContractor = user.group_id && user.group && (user.group.group_type === 'contractor' || user.group.type === 'contractor');
        if (!isAdmin) {
            if (isContractor) {
                if (proposal.created_by_user_id !== user.id) {
                    return res.status(403).json({ message: 'Cannot access proposal created by different user' });
                }
            } else {
                const acceptedBy = proposal.accepted_by;
                if (!(acceptedBy === user.id || acceptedBy === String(user.id))) {
                    return res.status(403).json({ message: 'Cannot access proposal not accepted by you' });
                }
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

        // Normalize manufacturersData before further processing to avoid double-encoding and ensure numeric modification fields
        try {
            if (formData && formData.manufacturersData !== undefined) {
                formData.manufacturersData = normalizeManufacturersDataForStorage(formData.manufacturersData);
            }
        } catch (_) {}

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
        console.log(`📋 [PROPOSAL DEBUG] Action processing for proposal ${id}:`, {
            action,
            currentStatus: existingProposal.status,
            userId: user.id,
            timestamp: new Date().toISOString()
        });

        if (action === 'reject') {
            console.log(`❌ [PROPOSAL DEBUG] Processing REJECT action for proposal ${id}`);
            formData.status = 'rejected';
        } else if (action === 'accept') {
            console.log(`✅ [PROPOSAL DEBUG] Processing ACCEPT action for proposal ${id}:`, {
                willSetStatus: 'accepted',
                willSetAcceptedAt: new Date(),
                willSetAcceptedBy: user.id,
                willLock: true
            });
            formData.status = 'accepted';
            formData.accepted_at = new Date();
            formData.accepted_by = user.id;
            formData.is_locked = true; // Lock proposal when accepted

            // Validate sub-type requirements before accepting proposal
            try {
                console.log('🔍 [DEBUG] Validating sub-type requirements for proposal:', id);
                const { validateSubTypeRequirements } = require('../utils/subTypeValidation');

                // Use the formData if available, otherwise use existing proposal data
                let manufacturersDataToValidate = formData.manufacturersData || existingProposal.manufacturersData;
                if (typeof manufacturersDataToValidate === 'string') {
                    try {
                        manufacturersDataToValidate = JSON.parse(manufacturersDataToValidate);
                    } catch (e) {
                        console.warn('Failed to parse manufacturersData for sub-type validation:', e.message);
                        manufacturersDataToValidate = [];
                    }
                }

                if (Array.isArray(manufacturersDataToValidate) && manufacturersDataToValidate.length > 0) {
                    // Get the first manufacturer data (or iterate through all if needed)
                    const firstManufacturerData = manufacturersDataToValidate[0];
                    const manufacturerId = firstManufacturerData.manufacturer;
                    const items = firstManufacturerData.items || [];

                    if (manufacturerId && items.length > 0) {
                        const validation = await validateSubTypeRequirements(items, manufacturerId);

                        if (!validation.isValid) {
                            console.log('❌ [DEBUG] Sub-type validation failed:', validation.missingRequirements);

                            // Format error message for user
                            const missingItems = validation.missingRequirements.map(req =>
                                `${req.itemName} (${req.itemCode}) is missing ${req.requirement} selection (required by sub-type: ${req.subTypes})`
                            ).join('; ');

                            return res.status(400).json({
                                success: false,
                                message: `Cannot accept proposal: Missing required selections. ${missingItems}`,
                                missingRequirements: validation.missingRequirements
                            });
                        }

                        console.log('✅ [DEBUG] Sub-type validation passed');
                    }
                }
            } catch (validationError) {
                console.error('❌ [DEBUG] Sub-type validation error (allowing proposal to proceed):', validationError.message);
                // Don't block the proposal acceptance due to validation errors
                // Log for investigation but continue with acceptance
            }

            // Create order for accepted proposal
            try {
                console.log('🏗️ [DEBUG] Creating order for accepted proposal via updateProposal:', id);

                // Ensure orders table/columns exist
                try { const { ensureOrdersSchema } = require('./ordersController'); await ensureOrdersSchema(); } catch (_) {}

                // Extract order creation data from the latest manufacturersData (formData first, then DB)
                let raw = (formData && formData.manufacturersData !== undefined)
                    ? formData.manufacturersData
                    : existingProposal.manufacturersData;
                try {
                    raw = robustParse(raw);
                } catch (_) {}

                let chosen = null;
                if (raw && Array.isArray(raw)) {
                    const candidates = raw.filter((b) => b && (Array.isArray(b.items) || b.summary));
                    chosen = candidates[0] || raw[0] || null;
                } else if (raw && typeof raw === 'object') {
                    if (Array.isArray(raw.manufacturersData)) {
                        const candidates = raw.manufacturersData.filter((b) => b && (Array.isArray(b.items) || b.summary));
                        chosen = candidates[0] || raw.manufacturersData[0] || null;
                    } else {
                        chosen = raw;
                    }
                }

                let normalizedSnapshot = null;
                let grandTotalCents = null;
                let manufacturerId = null;
                let styleId = null;
                let actualManufacturerName = null;
                let actualStyleName = null;

                if (chosen && typeof chosen === 'object') {
                    const summary = chosen.summary || {};
                    const gt = Number(summary.grandTotal || 0);
                    grandTotalCents = Number.isFinite(gt) ? Math.round(gt * 100) : null;
                    manufacturerId = chosen.manufacturer ?? chosen.manufacturerId ?? null;
                    styleId = (typeof chosen.selectedStyle === 'number' || typeof chosen.selectedStyle === 'string') ? chosen.selectedStyle : null;

                    // Resolve manufacturer and style names from DB
                    if (manufacturerId) {
                        try {
                            const manufacturer = await Manufacturer.findByPk(manufacturerId, { attributes: ['name'] });
                            actualManufacturerName = manufacturer?.name || null;
                        } catch (_) {
                            actualManufacturerName = chosen.manufacturerName || chosen?.manufacturerData?.name || null;
                        }
                    }

                    if (styleId) {
                        try {
                            const catalogItem = await ManufacturerCatalogData.findByPk(styleId, { attributes: ['style'] });
                            actualStyleName = catalogItem?.style || null;
                        } catch (_) {
                            actualStyleName = chosen.styleName || chosen.style || null;
                        }
                    }

                    // Create comprehensive snapshot with all required data
                    const toNum = (v) => Number(String(v || 0).toString().replace(/[^0-9.\-]/g, '')) || 0;
                    const toCents = (n) => Math.round(Number(n || 0) * 100);

                    let priceSummaryDecimals = {
                        cabinets: toNum(summary.cabinets ?? summary.cabinetsTotal ?? summary.cabinetsCost),
                        assemblyFee: toNum(summary.assemblyFee ?? summary.assembly),
                        modifications: toNum(summary.modifications ?? summary.modificationsCost ?? summary.modificationsTotal),
                        styleTotal: toNum(summary.styleTotal),
                        discountPercent: toNum(summary.discountPercent ?? summary.discount),
                        discountAmount: toNum(summary.discountAmount),
                        total: toNum(summary.total ?? summary.totalAfterDiscount ?? summary.subtotal),
                        deliveryFee: toNum(summary.deliveryFee ?? summary.delivery),
                        taxRate: toNum(summary.taxRate ?? summary.taxRatePct ?? summary.tax_rate),
                        tax: toNum(summary.tax ?? summary.taxAmount),
                        grandTotal: toNum(summary.grandTotal ?? summary.finalTotal)
                    };

                    const items = Array.isArray(chosen.items) ? chosen.items.map(item => {
                        // Normalize modifications array: ensure price (number) and qty
                        let normalizedMods = [];
                        try {
                            if (Array.isArray(item.modifications)) {
                                normalizedMods = item.modifications.map((m) => ({
                                    // Common identifiers
                                    id: m.id || m.modificationId || undefined,
                                    name: m.name || m.templateName || m.description || 'Modification',
                                    description: m.description || m.name || m.templateName || undefined,
                                    // Price normalization: prefer numeric price; fallback from cost
                                    price: toNum(m.price ?? m.cost ?? m.amount ?? 0),
                                    qty: Number(m.qty || m.quantity || 1),
                                    selectedOptions: m.selectedOptions || m.options || undefined,
                                    attachments: Array.isArray(m.attachments) ? m.attachments : undefined
                                })).filter(mm => Number.isFinite(mm.price));
                            }
                        } catch (_) {}

                        return ({
                            id: item.id || item.itemId,
                            name: item.name || item.itemName || item.description,
                            sku: item.sku || item.code,
                            price: toNum(item.price || item.cost || item.unitPrice || 0),
                            quantity: Number(item.quantity || item.qty || 1),
                            total: toNum(item.total || item.totalPrice || (item.price * item.quantity) || 0),
                            taxable: Boolean(item.taxable ?? item.isTaxable ?? true),
                            category: item.category || item.type,
                            dimensions: item.dimensions || item.size,
                            notes: item.notes || item.description || item.comments,
                            modifications: normalizedMods,
                            // Convenience: computed mods total for UI fallbacks
                            modificationsTotal: normalizedMods.reduce((s, m) => s + (m.price * (m.qty || 1)), 0),
                            hingeSide: item.hingeSide || null,
                            exposedSide: item.exposedSide || null,
                            includeAssemblyFee: Boolean(item.includeAssemblyFee),
                            isRowAssembled: Boolean(item.isRowAssembled)
                        });
                    }) : [];

                    // Fallback: derive modifications total from items if summary is missing/zero
                    try {
                        const itemsModsSum = Array.isArray(items)
                            ? items.reduce((sum, it) => sum + (Number(it.modificationsTotal || 0)), 0)
                            : 0;
                        if ((!priceSummaryDecimals.modifications || priceSummaryDecimals.modifications === 0) && itemsModsSum > 0) {
                            priceSummaryDecimals = { ...priceSummaryDecimals, modifications: itemsModsSum };
                        }
                    } catch (_) {}

                    const customItems = Array.isArray(chosen.customItems) ? chosen.customItems.map(item => ({
                        name: item.name || item.itemName || 'Custom Item',
                        price: toNum(item.price || item.cost || 0),
                        taxable: Boolean(item.taxable ?? item.isTaxable ?? true),
                        quantity: Number(item.quantity || item.qty || 1),
                        description: item.description || item.desc || null
                    })) : [];

                    // Ensure manufacturer summary carries normalized keys (esp. modificationsCost)
                    const mergedSummary = { ...summary };
                    if (mergedSummary.modificationsCost == null) mergedSummary.modificationsCost = priceSummaryDecimals.modifications;
                    if (mergedSummary.taxAmount == null) mergedSummary.taxAmount = priceSummaryDecimals.tax;
                    if (mergedSummary.total == null) mergedSummary.total = priceSummaryDecimals.total;

                    normalizedSnapshot = {
                        info: {
                            customerName: customerName || existingProposal.customer?.name || 'N/A',
                            customerId: customerId || existingProposal.customerId || null,
                            description: existingProposal.description || 'N/A',
                            dateAccepted: formData.accepted_at.toISOString(),
                            acceptedAt: formData.accepted_at.toISOString(),
                            designerId: existingProposal.designer || null,
                            createdByUserId: existingProposal.created_by_user_id || null,
                            createdByName: user.name || user.email || 'N/A',
                            userName: user.name || user.email || 'N/A',
                            manufacturerName: actualManufacturerName || 'N/A',
                            selectedStyle: actualStyleName || 'N/A',
                            styleName: actualStyleName || 'N/A',
                        },
                        manufacturers: [{
                            ...chosen,
                            // Ensure per-manufacturer summary has normalized keys too
                            summary: mergedSummary,
                            items
                        }],
                        items: items,
                        customItems: customItems,
                        pricingSummary: {
                            cabinetsParts: priceSummaryDecimals.cabinets,
                            assemblyFee: priceSummaryDecimals.assemblyFee,
                            modifications: priceSummaryDecimals.modifications,
                            styleTotal: priceSummaryDecimals.styleTotal,
                            discountPercent: priceSummaryDecimals.discountPercent,
                            discountAmount: priceSummaryDecimals.discountAmount,
                            total: priceSummaryDecimals.total,
                            deliveryFee: priceSummaryDecimals.deliveryFee,
                            taxRate: priceSummaryDecimals.taxRate,
                            tax: priceSummaryDecimals.tax,
                            grandTotal: priceSummaryDecimals.grandTotal
                        },
                        // Root summary that frontend reads for totals
                        summary: {
                            cabinets: priceSummaryDecimals.cabinets,
                            assemblyFee: priceSummaryDecimals.assemblyFee,
                            modificationsCost: priceSummaryDecimals.modifications,
                            styleTotal: priceSummaryDecimals.styleTotal,
                            discountPercent: priceSummaryDecimals.discountPercent,
                            discountAmount: priceSummaryDecimals.discountAmount,
                            total: priceSummaryDecimals.total,
                            deliveryFee: priceSummaryDecimals.deliveryFee,
                            taxRate: priceSummaryDecimals.taxRate,
                            taxAmount: priceSummaryDecimals.tax,
                            grandTotal: priceSummaryDecimals.grandTotal
                        }
                    };
                }

                // Create the order with comprehensive data
                // Assign order number and include in snapshot for display
                const cand = await nextCandidate('order');
                if (normalizedSnapshot && typeof normalizedSnapshot === 'object') {
                    normalizedSnapshot.info = { ...(normalizedSnapshot.info || {}), orderNumber: cand.number };
                }
                const createdOrder = await Order.create({
                    proposal_id: existingProposal.id,
                    owner_group_id: existingProposal.owner_group_id || null,
                    customer_id: customerId || existingProposal.customerId || null,
                    manufacturer_id: manufacturerId,
                    style_id: (typeof styleId === 'number') ? styleId : null,
                    style_name: actualStyleName,
                    status: 'new',
                    accepted_at: formData.accepted_at,
                    accepted_by_user_id: user.id,
                    accepted_by_label: user.name || user.email || String(user.id),
                    grand_total_cents: grandTotalCents,
                    snapshot: normalizedSnapshot || { info: { note: 'Order created via updateProposal accept action' } },
                    order_number: cand.number,
                    order_number_date: cand.dateOnly,
                    order_number_seq: cand.seq
                });

                console.log('✅ [DEBUG] Order created successfully via updateProposal for proposal:', id);

                // Attempt to auto-email manufacturer with saved configuration (mode/subject/template)
                let manufacturerEmailResult = null;
                try {
                    const eventManager = require('../utils/eventManager');
                    const noSend = String(req.query?.noSend || req.body?.noSend).toLowerCase() === '1' || String(req.body?.noSend).toLowerCase() === 'true';
                    manufacturerEmailResult = await eventManager.autoEmailManufacturerOnAccept({ proposalId: existingProposal.id }, { noSend });
                } catch (e) {
                    manufacturerEmailResult = { attempted: true, sent: false, error: e?.message || String(e) };
                }

                // Emit proposal.accepted event for notifications; suppress manufacturer email to avoid duplicate send
                try {
                    const eventData = {
                        proposalId: existingProposal.id,
                        ownerGroupId: existingProposal.owner_group_id,
                        total: normalizedSnapshot?.summary?.grandTotal || null,
                        customerSummary: {
                            id: customerId || existingProposal.customerId || null,
                            name: customerName || null,
                            email: null
                        },
                        acceptedBy: user.id,
                        acceptedAt: formData.accepted_at,
                        isExternalAcceptance: false,
                        suppressManufacturerEmail: true
                    };
                    process.emit('proposal.accepted', eventData);
                } catch (_) {}

                // Stash for response augmentation below
                if (!res.locals) res.locals = {};
                res.locals.createdOrderId = createdOrder?.id || null;
                res.locals.manufacturerEmailResult = manufacturerEmailResult;
            } catch (orderErr) {
                console.error('❌ [DEBUG] Order creation failed in updateProposal:', {
                    error: orderErr.message,
                    stack: orderErr.stack,
                    proposalId: id
                });
                // Don't fail the proposal update if order creation fails
            }
        } else if (action === 'send') {
            console.log(`📤 [PROPOSAL DEBUG] Processing SEND action for proposal ${id}`);
            formData.status = 'sent';
            formData.sent_at = new Date();
        } else if (action === 'expire') {
            console.log(`⏰ [PROPOSAL DEBUG] Processing EXPIRE action for proposal ${id}`);
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
        console.log(`💾 [PROPOSAL DEBUG] About to update proposal ${id}:`, {
            fieldsToUpdate: Object.keys(fieldsToUpdate),
            statusChange: existingProposal.status + ' → ' + fieldsToUpdate.status,
            customerId: fieldsToUpdate.customerId,
            action,
            timestamp: new Date().toISOString()
        });

    const before = existingProposal.toJSON();
    const [updatedRows] = await Proposals.update(fieldsToUpdate, {
            where: { id },
        });

        console.log(`✅ [PROPOSAL DEBUG] Proposal ${id} update result:`, {
            updatedRows,
            success: updatedRows > 0,
            timestamp: new Date().toISOString()
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

        // Augment response with manufacturerEmail result/orderId when acceptance path was used
        const extra = {};
        if (action === 'accept') {
            if (res.locals?.manufacturerEmailResult !== undefined) extra.manufacturerEmail = res.locals.manufacturerEmailResult;
            if (res.locals?.createdOrderId) extra.orderId = res.locals.createdOrderId;
        }
        res.status(200).json({ success: true, data: updatedProposal, ...extra });
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

        // If accepting proposal, create an order (same logic as acceptProposal endpoint)
        if (action === 'accept') {
            try {
                console.log('🏗️ [DEBUG] Creating order for accepted proposal via updateProposalStatus:', id);

                // Ensure orders table/columns exist
                try { const { ensureOrdersSchema } = require('./ordersController'); await ensureOrdersSchema(); } catch (_) {}

                // Find the updated proposal with customer data
                const fullProposal = await Proposals.findByPk(id, {
                    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }]
                });

                // Use the same order creation logic as acceptProposal
                let raw = fullProposal.manufacturersData;
                try {
                    if (typeof raw === 'string') raw = JSON.parse(raw);
                } catch (_) {}

                let chosen = null;
                if (raw && Array.isArray(raw)) {
                    const candidates = raw.filter((b) => b && (Array.isArray(b.items) || b.summary));
                    chosen = candidates[0] || raw[0] || null;
                } else if (raw && typeof raw === 'object') {
                    if (Array.isArray(raw.manufacturersData)) {
                        const candidates = raw.manufacturersData.filter((b) => b && (Array.isArray(b.items) || b.summary));
                        chosen = candidates[0] || raw.manufacturersData[0] || null;
                    } else {
                        chosen = raw;
                    }
                }

                let normalizedSnapshot = null;
                let grandTotalCents = null;
                let manufacturerId = null;
                let styleId = null;
                let actualManufacturerName = null;
                let actualStyleName = null;

                if (chosen && typeof chosen === 'object') {
                    const summary = chosen.summary || {};
                    const gt = Number(summary.grandTotal || 0);
                    grandTotalCents = Number.isFinite(gt) ? Math.round(gt * 100) : null;
                    manufacturerId = chosen.manufacturer ?? chosen.manufacturerId ?? null;
                    styleId = (typeof chosen.selectedStyle === 'number' || typeof chosen.selectedStyle === 'string') ? chosen.selectedStyle : null;

                    // Resolve manufacturer and style names from DB
                    if (manufacturerId) {
                        try {
                            const manufacturer = await Manufacturer.findByPk(manufacturerId, { attributes: ['name'] });
                            actualManufacturerName = manufacturer?.name || null;
                        } catch (_) {
                            actualManufacturerName = chosen.manufacturerName || chosen?.manufacturerData?.name || null;
                        }
                    }

                    if (styleId) {
                        try {
                            const catalogItem = await ManufacturerCatalogData.findByPk(styleId, { attributes: ['style'] });
                            actualStyleName = catalogItem?.style || null;
                        } catch (_) {
                            actualStyleName = chosen.styleName || chosen.style || null;
                        }
                    }

                    // Create basic snapshot
                    normalizedSnapshot = {
                        info: {
                            customerName: fullProposal.customer?.name || 'N/A',
                            customerId: fullProposal.customerId || null,
                            description: fullProposal.description || 'N/A',
                            dateAccepted: updateData.accepted_at.toISOString(),
                            acceptedAt: updateData.accepted_at.toISOString(),
                            designerId: fullProposal.designer || null,
                            createdByUserId: fullProposal.created_by_user_id || null,
                            manufacturerName: actualManufacturerName || 'N/A',
                            selectedStyle: actualStyleName || 'N/A',
                            styleName: actualStyleName || 'N/A',
                        },
                        manufacturers: [chosen],
                        items: Array.isArray(chosen.items) ? chosen.items : [],
                        customItems: Array.isArray(chosen.customItems) ? chosen.customItems : [],
                        summary: summary
                    };
                }

                // Create the order
                const cand = await nextCandidate('order');
                if (normalizedSnapshot && typeof normalizedSnapshot === 'object') {
                    normalizedSnapshot.info = { ...(normalizedSnapshot.info || {}), orderNumber: cand.number };
                }
                const createdOrder = await Order.create({
                    proposal_id: fullProposal.id,
                    owner_group_id: fullProposal.owner_group_id || null,
                    customer_id: fullProposal.customerId || null,
                    manufacturer_id: manufacturerId,
                    style_id: (typeof styleId === 'number') ? styleId : null,
                    style_name: actualStyleName,
                    status: 'new',
                    accepted_at: updateData.accepted_at,
                    accepted_by_user_id: user.id,
                    accepted_by_label: user.name || user.email || String(user.id),
                    grand_total_cents: grandTotalCents,
                    snapshot: normalizedSnapshot || { info: { note: 'Order created via updateProposalStatus' } },
                    order_number: cand.number,
                    order_number_date: cand.dateOnly,
                    order_number_seq: cand.seq
                });

                console.log('✅ [DEBUG] Order created successfully via updateProposalStatus for proposal:', id);

                // Attempt manufacturer email send using saved configuration
                let manufacturerEmailResult = null;
                try {
                    const eventManager = require('../utils/eventManager');
                    const noSend = String(req.query?.noSend || req.body?.noSend).toLowerCase() === '1' || String(req.body?.noSend).toLowerCase() === 'true';
                    manufacturerEmailResult = await eventManager.autoEmailManufacturerOnAccept({ proposalId: id }, { noSend });
                } catch (e) {
                    manufacturerEmailResult = { attempted: true, sent: false, error: e?.message || String(e) };
                }

                // Emit event (notifications/analytics); suppress manufacturer email to avoid duplicate send
                try {
                    const eventData = {
                        proposalId: id,
                        ownerGroupId: fullProposal.owner_group_id,
                        total: normalizedSnapshot?.summary?.grandTotal || null,
                        customerSummary: {
                            id: fullProposal.customer?.id,
                            name: fullProposal.customer?.name,
                            email: fullProposal.customer?.email
                        },
                        acceptedBy: user.id,
                        acceptedAt: updateData.accepted_at,
                        isExternalAcceptance: false,
                        suppressManufacturerEmail: true
                    };
                    process.emit('proposal.accepted', eventData);
                } catch (_) {}

                if (!res.locals) res.locals = {};
                res.locals.createdOrderId = createdOrder?.id || null;
                res.locals.manufacturerEmailResult = manufacturerEmailResult;
            } catch (orderErr) {
                console.error('❌ [DEBUG] Order creation failed in updateProposalStatus:', {
                    error: orderErr.message,
                    proposalId: id
                });
                // Don't fail the status update if order creation fails
            }
        }

        // Audit: proposal.update.status
        await logActivity({
            actorId: user.id,
            action: 'proposal.update.status',
            targetType: 'Proposal',
            targetId: proposal.id,
            diff: { before, after: proposal.toJSON(), action, newStatus }
        });

        const extra = {};
        if (action === 'accept') {
            if (res.locals?.manufacturerEmailResult !== undefined) extra.manufacturerEmail = res.locals.manufacturerEmailResult;
            if (res.locals?.createdOrderId) extra.orderId = res.locals.createdOrderId;
        }
        res.status(200).json({ success: true, data: proposal, message: `Proposal status updated to ${newStatus}` , ...extra});
    } catch (error) {
        console.error('Error updating proposal status:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

const acceptProposal = async (req, res) => {
    try {
        console.log('🎯 [DEBUG] acceptProposal called:', {
            proposalId: req.params.id,
            userAuth: !!req.user,
            userId: req.user?.id,
            userGroup: req.user?.group_id,
            requestBody: req.body,
            timestamp: new Date().toISOString()
        });

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
            console.log('❌ [DEBUG] Proposal not found:', { proposalId: id });
            return res.status(404).json({
                success: false,
                message: 'Proposal not found.'
            });
        }

        console.log('✅ [DEBUG] Proposal found:', {
            proposalId: proposal.id,
            currentStatus: proposal.status,
            isLocked: proposal.is_locked,
            customerId: proposal.customerId,
            customerName: proposal.customer?.name
        });

        // Check if proposal is already accepted or locked
        if (proposal.status === 'accepted' || proposal.is_locked) {
            console.log('⚠️ [DEBUG] Proposal already accepted/locked:', {
                status: proposal.status,
                isLocked: proposal.is_locked
            });
            return res.status(400).json({
                success: false,
                message: 'Proposal is already accepted or locked.'
            });
        }

    // Allow acceptance from common workflow statuses (Draft/sent/etc.)
    // Historical implementations allowed direct acceptance from Draft as well.
    // Keep this permissive to avoid blocking real-world flows.
    // If you need to enforce stricter rules, add them here.

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

        console.log('📝 [DEBUG] Acceptance data prepared:', {
            acceptedBy,
            isExternalAcceptance,
            acceptanceData
        });

        // Validate sub-type requirements before accepting proposal
        try {
            console.log('🔍 [DEBUG] Validating sub-type requirements for proposal:', id);
            const { validateSubTypeRequirements } = require('../utils/subTypeValidation');

            // Extract manufacturersData to check for sub-type requirements
            let manufacturersData = proposal.manufacturersData;
            if (typeof manufacturersData === 'string') {
                try {
                    manufacturersData = JSON.parse(manufacturersData);
                } catch (e) {
                    console.warn('Failed to parse manufacturersData for sub-type validation:', e.message);
                    manufacturersData = [];
                }
            }

            if (Array.isArray(manufacturersData) && manufacturersData.length > 0) {
                // Get the first manufacturer data (or iterate through all if needed)
                const firstManufacturerData = manufacturersData[0];
                const manufacturerId = firstManufacturerData.manufacturer;
                const items = firstManufacturerData.items || [];

                if (manufacturerId && items.length > 0) {
                    const validation = await validateSubTypeRequirements(items, manufacturerId);

                    if (!validation.isValid) {
                        console.log('❌ [DEBUG] Sub-type validation failed:', validation.missingRequirements);

                        // Format error message for user
                        const missingItems = validation.missingRequirements.map(req =>
                            `${req.itemName} (${req.itemCode}) is missing ${req.requirement} selection (required by sub-type: ${req.subTypes})`
                        ).join('; ');

                        return res.status(400).json({
                            success: false,
                            message: `Cannot accept proposal: Missing required selections. ${missingItems}`,
                            missingRequirements: validation.missingRequirements
                        });
                    }

                    console.log('✅ [DEBUG] Sub-type validation passed');
                }
            }
        } catch (validationError) {
            console.error('❌ [DEBUG] Sub-type validation error (allowing proposal to proceed):', validationError.message);
            // Don't block the proposal acceptance due to validation errors
            // Log for investigation but continue with acceptance
        }

        // Update proposal atomically
        await proposal.update(acceptanceData);
        console.log('✅ [DEBUG] Proposal updated with acceptance data');

        // Audit: proposal.accept
        await logActivity({
            actorId: typeof acceptedBy === 'number' ? acceptedBy : null,
            actorLabel: typeof acceptedBy === 'string' ? acceptedBy : undefined,
            action: 'proposal.accept',
            targetType: 'Proposal',
            targetId: proposal.id,
            diff: { after: { status: 'accepted', accepted_at: acceptanceData.accepted_at, accepted_by: acceptedBy, is_locked: true } }
        });

        // Create Order snapshot (single selected style only)
        try {
            console.log('🏗️ [DEBUG] Starting Order creation for proposal:', id);
            // Ensure orders table/columns exist in environments without full migrations
            try { const { ensureOrdersSchema } = require('./ordersController'); await ensureOrdersSchema(); } catch (_) {}

            console.log('📊 [DEBUG] Raw manufacturersData:', {
                type: typeof proposal.manufacturersData,
                isArray: Array.isArray(proposal.manufacturersData),
                content: proposal.manufacturersData
            });

            // manufacturersData can be stored as JSON string, array, or object with manufacturersData field
            let raw = proposal.manufacturersData;
            console.log('🔍 [DEBUG] Raw manufacturersData type and content:', {
                type: typeof raw,
                isString: typeof raw === 'string',
                length: raw?.length,
                firstChars: typeof raw === 'string' ? raw.substring(0, 100) : 'not string'
            });

            try {
                if (typeof raw === 'string') {
                    raw = JSON.parse(raw);
                    // Handle double-encoded JSON (common issue)
                    if (typeof raw === 'string') {
                        console.log('🔍 [DEBUG] Double-encoded JSON detected, parsing again...');
                        raw = JSON.parse(raw);
                    }
                }
            } catch (parseErr) {
                console.error('❌ [DEBUG] Failed to parse manufacturersData:', parseErr.message);
            }

            console.log('🔍 [DEBUG] Parsed raw data:', {
                type: typeof raw,
                isArray: Array.isArray(raw),
                length: Array.isArray(raw) ? raw.length : 'not array',
                hasManufacturersData: raw?.manufacturersData ? 'yes' : 'no'
            });

            let chosen = null;
            if (raw && Array.isArray(raw)) {
                console.log('🔍 [DEBUG] Processing as array, checking candidates...');
                const candidates = raw.filter((b) => {
                    const hasItems = Array.isArray(b.items);
                    const hasSummary = !!b.summary;
                    console.log('🔍 [DEBUG] Candidate check:', {
                        hasItems,
                        hasSummary,
                        itemsLength: hasItems ? b.items.length : 'not array',
                        summaryKeys: hasSummary ? Object.keys(b.summary) : 'no summary'
                    });
                    return b && (hasItems || hasSummary);
                });
                console.log('🔍 [DEBUG] Found candidates:', candidates.length);
                chosen = candidates[0] || raw[0] || null;
                console.log('🔍 [DEBUG] Chosen from candidates:', !!chosen);
            } else if (raw && typeof raw === 'object') {
                if (Array.isArray(raw.manufacturersData)) {
                    const candidates = raw.manufacturersData.filter((b) => b && (Array.isArray(b.items) || b.summary));
                    chosen = candidates[0] || raw.manufacturersData[0] || null;
                } else {
                    // Already a single-manufacturer shape
                    chosen = raw;
                }
            }

            // Build normalized snapshot with a single manufacturer block
            let normalizedSnapshot = null;
            let grandTotalCents = null;
            let styleId = null;
            let styleName = null;
            let manufacturerId = null;
            let actualManufacturerName = null;
            let actualStyleName = null;

            // If no valid candidate was found above, fall back to the first block if present
            if (!chosen && raw && Array.isArray(raw) && raw.length > 0) {
                chosen = raw[0];
                console.log('🧯 [DEBUG] Fallback chosen block (no items/summary present).');
            } else if (!chosen && raw && typeof raw === 'object' && Array.isArray(raw.manufacturersData) && raw.manufacturersData.length > 0) {
                chosen = raw.manufacturersData[0];
                console.log('🧯 [DEBUG] Fallback chosen block from manufacturersData[0].');
            }

            if (chosen && typeof chosen === 'object') {
                // Compute metadata
                const summary = chosen.summary || {};
                const gt = Number(summary.grandTotal || 0);
                grandTotalCents = Number.isFinite(gt) ? Math.round(gt * 100) : null;
                manufacturerId = chosen.manufacturer ?? chosen.manufacturerId ?? null;
                styleId = (typeof chosen.selectedStyle === 'number' || typeof chosen.selectedStyle === 'string') ? chosen.selectedStyle : null;

                // Fetch actual manufacturer name from database instead of using potentially corrupted frontend data
                if (manufacturerId) {
                    try {
                        const manufacturer = await Manufacturer.findByPk(manufacturerId, {
                            attributes: ['name']
                        });
                        actualManufacturerName = manufacturer?.name || null;
                        console.log('🏢 [DEBUG] Resolved manufacturer name from DB:', {
                            manufacturerId,
                            actualName: actualManufacturerName,
                            frontendName: chosen.manufacturerName || chosen?.manufacturerData?.name || chosen?.manufacturer?.name || chosen.name
                        });
                    } catch (err) {
                        console.error('❌ [DEBUG] Failed to fetch manufacturer name:', err);
                        actualManufacturerName = chosen.manufacturerName || chosen?.manufacturerData?.name || chosen?.manufacturer?.name || chosen.name;
                    }
                } else {
                    actualManufacturerName = chosen.manufacturerName || chosen?.manufacturerData?.name || chosen?.manufacturer?.name || chosen.name;
                }

                // Fetch actual style name from database instead of using potentially corrupted frontend data
                if (styleId) {
                    try {
                        const catalogItem = await ManufacturerCatalogData.findByPk(styleId, {
                            attributes: ['style']
                        });
                        actualStyleName = catalogItem?.style || null;
                        console.log('🎨 [DEBUG] Resolved style name from DB:', {
                            styleId,
                            actualStyle: actualStyleName,
                            frontendStyle: chosen.styleName || chosen.style || chosen.selectedStyleName || chosen.versionName
                        });
                    } catch (err) {
                        console.error('❌ [DEBUG] Failed to fetch style name:', err);
                        actualStyleName = chosen.styleName || chosen.style || chosen.selectedStyleName || chosen.versionName || null;
                    }
                } else {
                    actualStyleName = chosen.styleName || chosen.style || chosen.selectedStyleName || chosen.versionName || null;
                }

                // Prepare header info snapshot with complete metadata
                const acceptedAtISO = acceptanceData.accepted_at ? new Date(acceptanceData.accepted_at).toISOString() : new Date().toISOString();

                // Resolve created by user name
                let createdByName = null;
                try {
                    if (proposal?.created_by_user_id) {
                        const creator = await User.findByPk(proposal.created_by_user_id, { attributes: ['id', 'name', 'email'] });
                        createdByName = creator?.name || creator?.email || String(proposal.created_by_user_id);
                    }
                } catch (_) {}

                // Resolve designer name if specified
                let designerName = null;
                try {
                    if (proposal?.designer) {
                        const designer = await User.findByPk(proposal.designer, { attributes: ['id', 'name', 'email'] });
                        designerName = designer?.name || designer?.email || String(proposal.designer);
                    }
                } catch (_) {}

                // Normalize price summary from the UI into both decimals and cents
                const toNum = (v) => Number(String(v || 0).toString().replace(/[^0-9.\-]/g, '')) || 0;
                const toCents = (n) => Math.round(Number(n || 0) * 100);

                // Extract comprehensive pricing details matching the UI table structure
                let priceSummaryDecimals = {
                    cabinets: toNum(summary.cabinets ?? summary.cabinetsTotal ?? summary.cabinetsCost),
                    assemblyFee: toNum(summary.assemblyFee ?? summary.assembly),
                    modifications: toNum(summary.modifications ?? summary.modificationsCost ?? summary.modificationsTotal),
                    styleTotal: toNum(summary.styleTotal),
                    discountPercent: toNum(summary.discountPercent ?? summary.discount),
                    discountAmount: toNum(summary.discountAmount),
                    total: toNum(summary.total ?? summary.totalAfterDiscount ?? summary.subtotal),
                    deliveryFee: toNum(summary.deliveryFee ?? summary.delivery),
                    taxRate: toNum(summary.taxRate ?? summary.taxRatePct ?? summary.tax_rate),
                    tax: toNum(summary.tax ?? summary.taxAmount),
                    grandTotal: toNum(summary.grandTotal ?? summary.finalTotal)
                };

                const priceSummaryCents = {
                    cabinetsCents: toCents(priceSummaryDecimals.cabinets),
                    assemblyCents: toCents(priceSummaryDecimals.assemblyFee),
                    modsCents: toCents(priceSummaryDecimals.modifications),
                    styleTotalCents: toCents(priceSummaryDecimals.styleTotal),
                    discountCents: toCents(priceSummaryDecimals.discountAmount),
                    totalAfterDiscountCents: toCents(priceSummaryDecimals.total),
                    deliveryCents: toCents(priceSummaryDecimals.deliveryFee),
                    taxCents: toCents(priceSummaryDecimals.tax),
                    grandTotalCents: toCents(priceSummaryDecimals.grandTotal),
                    taxRatePct: priceSummaryDecimals.taxRate
                };

                // Extract custom items with full details
                const customItems = Array.isArray(chosen.customItems) ? chosen.customItems.map(item => ({
                    name: item.name || item.itemName || 'Custom Item',
                    price: toNum(item.price || item.cost || 0),
                    taxable: Boolean(item.taxable ?? item.isTaxable ?? true),
                    quantity: Number(item.quantity || item.qty || 1),
                    description: item.description || item.desc || null
                })) : [];

                // Extract regular items with full details (including normalized modifications)
                const items = Array.isArray(chosen.items) ? chosen.items.map(item => {
                    let normalizedMods = [];
                    try {
                        if (Array.isArray(item.modifications)) {
                            normalizedMods = item.modifications.map((m) => ({
                                id: m.id || m.modificationId || undefined,
                                name: m.name || m.templateName || m.description || 'Modification',
                                description: m.description || m.name || m.templateName || undefined,
                                price: toNum(m.price ?? m.cost ?? m.amount ?? 0),
                                qty: Number(m.qty || m.quantity || 1),
                                selectedOptions: m.selectedOptions || m.options || undefined,
                                attachments: Array.isArray(m.attachments) ? m.attachments : undefined
                            })).filter(mm => Number.isFinite(mm.price));
                        }
                    } catch (_) {}

                    return ({
                        id: item.id || item.itemId,
                        name: item.name || item.itemName || item.description,
                        sku: item.sku || item.code,
                        price: toNum(item.price || item.cost || item.unitPrice || 0),
                        quantity: Number(item.quantity || item.qty || 1),
                        total: toNum(item.total || item.totalPrice || (item.price * item.quantity) || 0),
                        taxable: Boolean(item.taxable ?? item.isTaxable ?? true),
                        category: item.category || item.type,
                        dimensions: item.dimensions || item.size,
                        notes: item.notes || item.description || item.comments,
                        modifications: normalizedMods,
                        modificationsTotal: normalizedMods.reduce((s, m) => s + (m.price * (m.qty || 1)), 0),
                        hingeSide: item.hingeSide || null,
                        exposedSide: item.exposedSide || null,
                        includeAssemblyFee: Boolean(item.includeAssemblyFee),
                        isRowAssembled: Boolean(item.isRowAssembled)
                    });
                }) : [];

                // Fallback: if summary mods are missing/zero but items contain modifications, derive it from items
                try {
                    const itemsModsSum = Array.isArray(items)
                        ? items.reduce((sum, it) => sum + (Number(it.modificationsTotal || 0)), 0)
                        : 0;
                    if ((!priceSummaryDecimals.modifications || priceSummaryDecimals.modifications === 0) && itemsModsSum > 0) {
                        priceSummaryDecimals = { ...priceSummaryDecimals, modifications: itemsModsSum };
                    }
                } catch (_) {}

                // Keep only essential fields for the selected manufacturer block
                const pruned = {
                    manufacturer: manufacturerId,
                    manufacturerName: actualManufacturerName,
                    selectedStyle: styleId,
                    styleName: actualStyleName,
                    styleColor: chosen.styleColor || chosen.selectedStyleColor || chosen.styleVariant || chosen.colorName || chosen.color || null,
                    items: items,
                    customItems: customItems,
                    summary: { ...summary, _decimals: priceSummaryDecimals, _cents: priceSummaryCents },
                };

                // Ensure manufacturer summary carries normalized keys (esp. modificationsCost)
                const mergedSummary = { ...summary };
                if (mergedSummary.modificationsCost == null) mergedSummary.modificationsCost = priceSummaryDecimals.modifications;
                if (mergedSummary.taxAmount == null) mergedSummary.taxAmount = priceSummaryDecimals.tax;
                if (mergedSummary.total == null) mergedSummary.total = priceSummaryDecimals.total;

                normalizedSnapshot = {
                    info: {
                        customerName: proposal.customer?.name || 'N/A',
                        customerId: proposal.customerId || null,
                        description: proposal.description || 'N/A',
                        dateAccepted: acceptedAtISO,
                        acceptedAt: acceptedAtISO,
                        designerId: proposal.designer || null,
                        designerName: designerName || 'N/A',
                        createdByUserId: proposal.created_by_user_id || null,
                        createdByName: createdByName || 'N/A',
                        userName: createdByName || acceptedBy || 'N/A',
                        manufacturerName: actualManufacturerName || 'N/A',
                        selectedStyle: actualStyleName || 'N/A',
                        styleName: actualStyleName || 'N/A',
                    },
                    manufacturers: [{
                        ...pruned,
                        summary: mergedSummary,
                        items
                    }],
                    items: items,
                    customItems: customItems,
                    pricingSummary: {
                        cabinetsParts: priceSummaryDecimals.cabinets,
                        assemblyFee: priceSummaryDecimals.assemblyFee,
                        modifications: priceSummaryDecimals.modifications,
                        styleTotal: priceSummaryDecimals.styleTotal,
                        discountPercent: priceSummaryDecimals.discountPercent,
                        discountAmount: priceSummaryDecimals.discountAmount,
                        total: priceSummaryDecimals.total,
                        deliveryFee: priceSummaryDecimals.deliveryFee,
                        taxRate: priceSummaryDecimals.taxRate,
                        tax: priceSummaryDecimals.tax,
                        grandTotal: priceSummaryDecimals.grandTotal
                    },
                    priceSummary: { decimals: priceSummaryDecimals, cents: priceSummaryCents },
                    summary: {
                        cabinets: priceSummaryDecimals.cabinets,
                        assemblyFee: priceSummaryDecimals.assemblyFee,
                        modificationsCost: priceSummaryDecimals.modifications,
                        styleTotal: priceSummaryDecimals.styleTotal,
                        discountPercent: priceSummaryDecimals.discountPercent,
                        discountAmount: priceSummaryDecimals.discountAmount,
                        total: priceSummaryDecimals.total,
                        deliveryFee: priceSummaryDecimals.deliveryFee,
                        taxRate: priceSummaryDecimals.taxRate,
                        taxAmount: priceSummaryDecimals.tax,
                        grandTotal: priceSummaryDecimals.grandTotal
                    },
                };

                console.log('📋 [DEBUG] Enhanced snapshot created:', {
                    customerName: normalizedSnapshot.info.customerName,
                    description: normalizedSnapshot.info.description,
                    dateAccepted: normalizedSnapshot.info.dateAccepted,
                    designerName: normalizedSnapshot.info.designerName,
                    createdByName: normalizedSnapshot.info.createdByName,
                    manufacturerName: normalizedSnapshot.info.manufacturerName,
                    selectedStyle: normalizedSnapshot.info.selectedStyle,
                    itemsCount: items.length,
                    customItemsCount: customItems.length,
                    grandTotal: priceSummaryDecimals.grandTotal
                });
            }

            console.log('📋 [DEBUG] Order creation data:', {
                proposal_id: proposal.id,
                owner_group_id: proposal.owner_group_id,
                customer_id: proposal.customerId,
                manufacturerId,
                styleId,
                actualManufacturerName,
                actualStyleName,
                grandTotalCents,
                snapshotSize: normalizedSnapshot ? JSON.stringify(normalizedSnapshot).length : 0,
                hasChosen: !!chosen
            });

            // Ensure we always have a minimal snapshot payload even if upstream data is sparse
            const snapshotPayload = normalizedSnapshot || { manufacturers: [], items: [], summary: {} };

            const cand = await nextCandidate('order');
            if (snapshotPayload && typeof snapshotPayload === 'object') {
                snapshotPayload.info = { ...(snapshotPayload.info || {}), orderNumber: cand.number };
            }
            const createdOrder = await Order.create({
                proposal_id: proposal.id,
                owner_group_id: proposal.owner_group_id || null,
                customer_id: proposal.customerId || null,
                manufacturer_id: manufacturerId,
                style_id: (typeof styleId === 'number') ? styleId : null,
                style_name: actualStyleName,
                status: 'new',
                accepted_at: acceptanceData.accepted_at,
                accepted_by_user_id: typeof acceptedBy === 'number' ? acceptedBy : null,
                accepted_by_label: typeof acceptedBy === 'string' ? acceptedBy : null,
                grand_total_cents: grandTotalCents,
                snapshot: snapshotPayload,
                order_number: cand.number,
                order_number_date: cand.dateOnly,
                order_number_seq: cand.seq
            });

            console.log('✅ [DEBUG] Order created successfully', {
                orderId: createdOrder?.id,
                createdAt: createdOrder?.createdAt,
                manufacturer_id: createdOrder?.manufacturer_id,
                style_name: createdOrder?.style_name
            });
        } catch (orderErr) {
            console.error('❌ [DEBUG] Order creation failed:', {
                error: orderErr.message,
                stack: orderErr.stack,
                proposalId: id
            });
            // Continue; order creation failure should not block acceptance response
        }

        // Double-check an order exists for this proposal; if not, create a minimal fallback
        try {
            let exists = await Order.findOne({ where: { proposal_id: proposal.id } });
            if (!exists) {
                console.warn('🛟 [DEBUG] No order found after acceptance; creating fallback order record.', { proposalId: proposal.id });
                const cand2 = await nextCandidate('order');
                const fallbackSnap = { info: { note: 'fallback minimal order snapshot', orderNumber: cand2.number } };
                await Order.create({
                    proposal_id: proposal.id,
                    owner_group_id: proposal.owner_group_id || null,
                    customer_id: proposal.customerId || null,
                    manufacturer_id: null,
                    style_id: null,
                    style_name: null,
                    status: 'new',
                    accepted_at: new Date(),
                    accepted_by_user_id: typeof acceptedBy === 'number' ? acceptedBy : null,
                    accepted_by_label: typeof acceptedBy === 'string' ? acceptedBy : null,
                    grand_total_cents: null,
                    snapshot: fallbackSnap,
                    order_number: cand2.number,
                    order_number_date: cand2.dateOnly,
                    order_number_seq: cand2.seq
                });
                console.warn('🛟 [DEBUG] Fallback order created.');
                exists = await Order.findOne({ where: { proposal_id: proposal.id } });
            }
            // Attach lightweight order summary to response locals for caller use
            if (!res.locals) res.locals = {};
            res.locals.createdOrder = exists;
        } catch (verifyErr) {
            console.error('❌ [DEBUG] Order verification/creation fallback failed:', { error: verifyErr.message, stack: verifyErr.stack });
        }

        // Emit proposal.accepted domain event (allow caller to suppress manufacturer email from event path)
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
            isExternalAcceptance: isExternalAcceptance,
            // We'll send manufacturer email directly here to capture status in response
            // and prevent duplicate send via the event listener.
            suppressManufacturerEmail: true
        };

        console.log('🎉 [DEBUG] Emitting proposal.accepted event:', eventData);

        // Send manufacturer order email directly so we can report status back to client
        let manufacturerEmailResult = null;
        try {
            const eventManager = require('../utils/eventManager');
            const noSend = String(req.query?.noSend || req.body?.noSend).toLowerCase() === '1' || String(req.body?.noSend).toLowerCase() === 'true';
            manufacturerEmailResult = await eventManager.autoEmailManufacturerOnAccept({ proposalId: proposal.id }, { noSend });
        } catch (e) {
            manufacturerEmailResult = { attempted: true, sent: false, error: e?.message || String(e) };
        }

        // Emit event (using process.emit for in-process events). We suppress manufacturer email inside handler via flag above.
        process.emit('proposal.accepted', eventData);

        console.log('✅ [DEBUG] Proposal acceptance completed successfully');

        // Send response including order summary when available
        return res.status(200).json({
            success: true,
            message: 'Proposal accepted and converted to order',
            proposalId: proposal.id,
            orderId: (res.locals && res.locals.createdOrder) ? res.locals.createdOrder.id : null,
            order: (res.locals && res.locals.createdOrder) ? res.locals.createdOrder : null,
            data: proposal,
            eventData: eventData,
            manufacturerEmail: manufacturerEmailResult
        });

    } catch (error) {
        console.error('❌ [DEBUG] Error accepting proposal:', {
            error: error.message,
            stack: error.stack,
            proposalId: req.params.id,
            timestamp: new Date().toISOString()
        });
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
