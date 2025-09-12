const { Op, Sequelize } = require('sequelize');
const { Proposals } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const Customer = require('../models/Customer'); // Assuming the Customer model is in the models folder

const fetchCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { group_id } = req.query;
    const user = req.user;

    // Build where clause
    let whereClause = { status: 1 };
    
    // Apply user/group scoping
    if (user.group_id && user.group && user.group.group_type === 'contractor') {
      // Contractors can only see their own customers (user-specific)
      whereClause.created_by_user_id = user.id;
    } else if (group_id) {
      // Admins can filter by specific group
      whereClause.group_id = group_id;
    }
    // If no group_id specified and user is admin, show all customers

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Proposals,
          as: 'Proposals',
          attributes: [],
          where: { isDeleted: false },
          required: false,
        },
      ],
      attributes: {
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("Proposals.id")), "proposalCount"]
        ],
      },
      group: ['Customer.id'],
      subQuery: false,
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    res.json({
      data: rows,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching customers', error });
  }
};




// fetch sinle  customers
const fetchSingleCustomer = async (req, res) => {
  const customerId = req.params.id;
  const user = req.user;
  
  try {
    // Build where clause with contractor scoping
    let whereClause = { id: customerId };
    
    // Apply user scoping for contractors
    if (user.group_id && user.group && user.group.group_type === 'contractor') {
      whereClause.created_by_user_id = user.id;
    }
    
    const customer = await Customer.findOne({ where: whereClause });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching customer', error });
  }
}


// Add a new customer
const addCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      aptOrSuite,
      city,
      state,
      zipCode,
      homePhone,
      mobile,
      leadSource,
      customerType,
      defaultDiscount,
      companyName,
      note,
    } = req.body;

    // Get user info from JWT token (added by auth middleware)
    const userId = req.user?.id;
    const userGroupId = req.user?.group_id;

    // Create a new customer entry
    const newCustomer = await Customer.create({
      name,
      email,
      address,
      aptOrSuite,
      city,
      state,
      zipCode,
      homePhone,
      mobile,
      leadSource,
      customerType,
      defaultDiscount,
      companyName,
      note,
      created_by_user_id: userId,
      group_id: userGroupId,
    });

    // Audit: customer.create
    await logActivity({
      actorId: userId,
      action: 'customer.create',
      targetType: 'Customer',
      targetId: newCustomer.id,
      diff: { after: newCustomer.toJSON() }
    });

    // Respond with success
    return res.status(201).json({
      message: 'Customer added successfully',
      customer: newCustomer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error adding customer', error });
  }
};

// update customers
const updateCustomer = async (req, res) => {
  const { id } = req.params;

    const {
      name,
      email,
      mobile,
      homePhone,
      address,
      aptOrSuite,
      city,
      state,
      zipCode,
      note,
      companyName,
      customerType,
      leadSource,
      defaultDiscount,
    } = req.body;

  try {
    // Get user info from JWT token (added by auth middleware)
    const userId = req.user?.id;
    const userGroupId = req.user?.group_id;

    // Build where clause for security - contractors can only update their own customers
    let whereClause = { id };
    if (req.user?.group_id && req.user?.group && req.user.group.group_type === 'contractor') {
      whereClause.created_by_user_id = userId;
    }

    const customer = await Customer.findOne({ where: whereClause });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or access denied' });
    }
    
  // Update fields
  const before = customer.toJSON();
    customer.name = name;
    customer.email = email;
    customer.mobile = mobile;
    customer.homePhone = homePhone;
    customer.address = address;
    customer.aptOrSuite = aptOrSuite;
    customer.city = city;
    customer.state = state;
    customer.zipCode = zipCode;
    customer.note = note;
    customer.companyName = companyName;
    customer.customerType = customerType;
    customer.leadSource = leadSource;
    customer.defaultDiscount = defaultDiscount;
    
    await customer.save();

    // Audit: customer.update
    await logActivity({
      actorId: userId,
      action: 'customer.update',
      targetType: 'Customer',
      targetId: customer.id,
      diff: { before, after: customer.toJSON() }
    });
    return res.json({ message: 'Customer updated successfully', customer });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching customer', error });
  }


}



const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Fetch the customer first (only active ones)
    const customer = await Customer.findOne({ where: { id, status: 1 } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Admin / super_admin can delete any customer
    const isAdmin = ['admin', 'super_admin'].includes(user.role);

    if (!isAdmin) {
      // Must belong to a contractor group
      if (!user.group_id || !user.group || user.group.group_type !== 'contractor') {
        return res.status(403).json({ message: 'Access denied: not a contractor user' });
      }

      // Enforce same group ownership
      if (String(customer.group_id) !== String(user.group_id)) {
        return res.status(403).json({ message: 'Access denied: different contractor group' });
      }

      // Enforce that only the creator can delete their own customer
      if (String(customer.created_by_user_id) !== String(user.id)) {
        return res.status(403).json({ message: 'Access denied: only the creator can delete this customer' });
      }
    }

    // Soft delete by status flag (paranoid already provides deleted_at if using destroy). Keeping existing pattern.
    customer.status = 0;
    await customer.save();

    await logActivity({
      actorId: user.id,
      action: 'customer.delete',
      targetType: 'Customer',
      targetId: id,
      diff: { before: { status: 1 }, after: { status: 0 } }
    });

    return res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    return res.status(500).json({ message: 'Error deleting customer', error });
  }
};



module.exports = {
  addCustomer,
  fetchCustomer,
  deleteCustomer,
  fetchSingleCustomer,
  updateCustomer
};
