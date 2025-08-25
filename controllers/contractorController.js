const { UserGroup, User, Customer, Proposals } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Ensure all models and associations are loaded
require('../models/index');

const contractorController = {
  // Get all contractor groups with statistics
  async fetchContractors(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Fetch contractor groups with counts
    const contractors = await UserGroup.findAll({
        where: {
          group_type: 'contractor'
        },
        attributes: [
          'id',
          'name',
      // createdAt is the actual timestamp column; we'll later add a created_at alias in JS to avoid DB-specific issues
      'createdAt',
      // modules JSON; omit contractor_settings here to avoid unknown column errors on older DBs
      'modules',
          // Count related records
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM users AS u
              WHERE u.group_id = user_groups.id
              AND u.isDeleted = 0
            )`),
            'user_count'
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM customers AS c
              WHERE c.group_id = user_groups.id
              AND c.deleted_at IS NULL
            )`),
            'customer_count'
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM proposals AS p
              WHERE p.owner_group_id = user_groups.id
              AND p.isDeleted = 0
            )`),
            'proposal_count'
          ]
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      // Get total count for pagination
      const totalCount = await UserGroup.count({
        where: {
          group_type: 'contractor'
        }
      });

      const totalPages = Math.ceil(totalCount / limit);

      // Add created_at alias at the JS layer for frontend compatibility
      const data = contractors.map(c => {
        const obj = c.toJSON();
        if (!obj.created_at) {
          obj.created_at = obj.createdAt;
        }
        return obj;
      });

      res.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching contractors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contractors',
        error: error.message
      });
    }
  },

  // Get single contractor with detailed information
  async fetchContractor(req, res) {
    try {
      const { groupId } = req.params;

  const contractor = await UserGroup.findOne({
        where: {
          id: groupId,
          group_type: 'contractor'
        },
        include: [
          {
            model: User,
            as: 'users',
    attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    where: { isDeleted: false },
            required: false
          }
        ]
      });

      if (!contractor) {
        return res.status(404).json({
          success: false,
          message: 'Contractor not found'
        });
      }

      // Get additional statistics
      const [customerCount, proposalCount] = await Promise.all([
        Customer.count({
          where: {
            group_id: groupId,
            deleted_at: null
          }
        }),
        Proposals.count({
          where: {
            owner_group_id: groupId,
            isDeleted: false
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          ...contractor.toJSON(),
          stats: {
            user_count: contractor.users?.length || 0,
            customer_count: customerCount,
            proposal_count: proposalCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching contractor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contractor',
        error: error.message
      });
    }
  },

  // Get proposals for a specific contractor group
  async fetchContractorProposals(req, res) {
    try {
      const { groupId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const search = req.query.search;
      const offset = (page - 1) * limit;

      // Build where clause
      const where = {
        owner_group_id: groupId,
        isDeleted: false
      };

      // Add status filter if provided
      if (status && status !== 'all') {
        where.status = status;
      }

      // Build include clause with search
      const include = [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
          where: search ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        }
      ];

      // Add search to proposals if provided
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Fetch proposals with customer information
      const proposals = await Proposals.findAndCountAll({
        where,
        include,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(proposals.count / limit);

      res.json({
        success: true,
        data: proposals.rows,
        pagination: {
          page,
          limit,
          total: proposals.count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching contractor proposals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contractor proposals',
        error: error.message
      });
    }
  },

  // Get customers for a specific contractor group
  async fetchContractorCustomers(req, res) {
    try {
      const { groupId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const offset = (page - 1) * limit;

      // Build where clause
      const where = {
        group_id: groupId,
        deleted_at: null
      };

      // Add search filter if provided
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      // Fetch customers with proposal count
      const customers = await Customer.findAndCountAll({
        where,
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'address',
          'city',
          'state',
          'zipCode',
          'createdAt',
          // Count proposals for each customer
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM proposals AS p
              WHERE p.customerId = Customer.id
              AND p.isDeleted = 0
            )`),
            'proposal_count'
          ]
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(customers.count / limit);

      res.json({
        success: true,
        data: customers.rows,
        pagination: {
          page,
          limit,
          total: customers.count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching contractor customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contractor customers',
        error: error.message
      });
    }
  },

  // Get single proposal details (for modal view)
  async fetchProposalDetails(req, res) {
    try {
      const { proposalId } = req.params;

      const proposal = await Proposals.findOne({
        where: {
          id: proposalId,
          isDeleted: false
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'zipCode'],
            required: false
          }
        ]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found'
        });
      }

      res.json({
        success: true,
        data: proposal
      });
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch proposal details',
        error: error.message
      });
    }
  }
};

module.exports = contractorController;
