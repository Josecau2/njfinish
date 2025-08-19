const { Customer, Proposals, User, Location } = require('../models/index');

const saveProposal = async (req, res) => {
    try {
        const { action, formData } = req.body;
        console.log('action', action);
        console.log('formData', formData);

        let { customerId, customerName, customerEmail } = formData;

        if (!customerId && customerName && customerEmail) {
            let existingUser = await Customer.findOne({ where: { email: customerEmail } });

            if (!existingUser) {
                const newUser = await Customer.create({
                    name: customerName,
                    email: customerEmail,
                });
                customerId = newUser.id;
            } else {
                customerId = existingUser.id;
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

        ['followUp1Date', 'followUp2Date', 'followUp3Date', 'location', 'salesRep', 'leadSource', 'type', 'designer', 'manufacturerId'].forEach((field) => {
            const dateVal = formData[field];
            if (!dateVal || isNaN(new Date(dateVal))) {
                formData[field] = null;
            }
        });

        if (!customerId) {
            customerId = null;
        }

        const dataToSave = {
            ...formData,
            customerId,
        };

        const proposal = await Proposals.create(dataToSave);

        res.status(200).json({ success: true, data: proposal });
    } catch (error) {
        console.error('Error saving proposal:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error });
    }
};

const getProposal = async (req, res) => {
    try {
        const proposals = await Proposals.findAll({
            where: { isDeleted: false, type: 0 },
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

const deleteProposals = async (req, res) => {
    try {
        const { id } = req.params;

        const proposal = await Proposals.findByPk(id);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposals not found' });
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
        const proposal = await Proposals.findByPk(proposalId);

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
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
        console.log('action', action);
        console.log('formData', formData);
        let { id, customerId, customerName, customerEmail } = formData;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Proposal ID is required for update.' });
        }

        // Customer creation / lookup
        if (!customerId && customerName && customerEmail) {
            const existingUser = await Customer.findOne({ where: { email: customerEmail } });

            if (!existingUser) {
                const newUser = await Customer.create({
                    name: customerName,
                    email: customerEmail,
                });
                customerId = newUser.id;
            } else {
                customerId = existingUser.id;
            }
        }

        if (!customerId) {
            formData.customerId = 0;
        }

        // Update status based on action
        if (action === 'reject') {
            formData.status = 'Proposal rejected';
        }

        if (!formData.status || formData.status.trim() === '') {
            formData.status = 'Draft';
        }

        if (!formData.date || formData.date.trim() === '') {
            formData.date = new Date();
        }

        // Clear invalid date or nullable fields
        ['followUp1Date', 'followUp2Date', 'followUp3Date', 'location', 'salesRep', 'leadSource', 'type', 'designer', 'manufacturerId'].forEach((field) => {
            const val = formData[field];
            if (!val || isNaN(new Date(val))) {
                formData[field] = null;
            }
        });

        // Exclude fields that should not be updated
        const { createdAt, updatedAt, ...fieldsToUpdate } = formData;

        // Ensure customerId is correctly updated
        fieldsToUpdate.customerId = customerId;

        // Perform update
        const [updatedRows] = await Proposals.update(fieldsToUpdate, {
            where: { id },
        });

        if (updatedRows === 0) {
            return res.status(404).json({ success: false, message: 'Proposal not found or no changes applied.' });
        }

        const updatedProposal = await Proposals.findByPk(id);

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


module.exports = {
    saveProposal,
    getProposal,
    deleteProposals,
    getProposalById,
    updateProposal,
    getContracts,
    getCounts,
    getLatestProposals
};
