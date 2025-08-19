const { Op, Sequelize } = require('sequelize');
const { Proposals } = require('../models');
const Customer = require('../models/Customer'); // Assuming the Customer model is in the models folder

const fetchCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      where: { status: 1 },
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
  try {
   const customer = await Customer.findByPk(customerId); // OR use findOne if needed
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
   const customer = await Customer.findByPk(id);
    res.json(customer);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    // Update fields
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
      return res.json({ message: 'Customer updated successfully', customer });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching customer', error });
  }


}



const deleteCustomer = async (req, res) => {
  const { id } = req.params; // Get the customer ID from the request parameters

  try {
    // Update the status of the customer to 0 where the customer ID matches
    const updatedCustomer = await Customer.update(
      { status: 0 }, // Set status to 0
      { where: { id } } // Find the customer with the specified ID
    );

    // If no customer was found to update
    if (updatedCustomer[0] === 0) {
      return res.status(404).json({ message: 'Customer not found or status already updated' });
    }

    // Send success response
    res.json({ message: 'Customer status updated successfully' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating customer status', error });
  }
};



module.exports = {
  addCustomer,
  fetchCustomer,
  deleteCustomer,
  fetchSingleCustomer,
  updateCustomer
};
