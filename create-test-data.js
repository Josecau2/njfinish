const { UserGroup, User, Customer, Proposals } = require('./models');

async function createTestData() {
  try {
    console.log('=== Creating Test Contractor Data ===');

    // Create contractor groups
    const contractors = await Promise.all([
      UserGroup.create({
        name: 'ABC Construction',
        group_type: 'contractor',
        modules: {
          dashboard: true,
          proposals: true,
          customers: true,
          resources: false
        },
        contractor_settings: {
          allow_subcontractors: false,
          max_users: 10,
          billing_method: 'monthly'
        }
      }),
      UserGroup.create({
        name: 'Elite Builders',
        group_type: 'contractor',
        modules: {
          dashboard: true,
          proposals: true,
          customers: true,
          resources: true
        },
        contractor_settings: {
          allow_subcontractors: true,
          max_users: 25,
          billing_method: 'annual'
        }
      }),
      UserGroup.create({
        name: 'Quick Fix LLC',
        group_type: 'contractor',
        modules: {
          dashboard: true,
          proposals: false,
          customers: true,
          resources: false
        },
        contractor_settings: {
          allow_subcontractors: false,
          max_users: 5,
          billing_method: 'per_project'
        }
      })
    ]);

    console.log('✅ Created contractor groups:', contractors.map(c => `${c.name} (ID: ${c.id})`));

    // Create users for each contractor
    for (let contractor of contractors) {
      const userCount = Math.floor(Math.random() * 5) + 1; // 1-5 users per contractor
      const timestamp = Date.now();
      
      for (let i = 0; i < userCount; i++) {
        await User.create({
          username: `user${contractor.id}_${timestamp}_${i + 1}`,
          email: `user${timestamp}_${i + 1}@${contractor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          password: 'hashed_password_here',
          first_name: `User${i + 1}`,
          last_name: contractor.name.split(' ')[0],
          role: 'contractor_user',
          group_id: contractor.id
        });
      }
      
      console.log(`✅ Created ${userCount} users for ${contractor.name}`);
    }

    // Create customers for each contractor
    for (let contractor of contractors) {
      const customerCount = Math.floor(Math.random() * 8) + 2; // 2-9 customers per contractor
      const timestamp = Date.now();
      
      for (let i = 0; i < customerCount; i++) {
        await Customer.create({
          name: `Customer ${contractor.id}-${timestamp}-${i + 1}`,
          email: `customer${timestamp}_${i + 1}@contractor${contractor.id}.com`,
          phone: `555-${contractor.id}${String(i + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
          address: `${100 + i} Main Street`,
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          group_id: contractor.id
        });
      }
      
      console.log(`✅ Created ${customerCount} customers for ${contractor.name}`);
    }

    // Create proposals for each contractor
    for (let contractor of contractors) {
      const customers = await Customer.findAll({ where: { group_id: contractor.id } });
      const proposalCount = Math.floor(Math.random() * 10) + 3; // 3-12 proposals per contractor
      
      const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed'];
      
      for (let i = 0; i < proposalCount; i++) {
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        
        await Proposals.create({
          title: `Project ${contractor.id}-${i + 1}`,
          description: `Sample project description for ${contractor.name}`,
          total_amount: Math.floor(Math.random() * 50000) + 5000,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          customer_id: randomCustomer.id,
          group_id: contractor.id,
          version: 1
        });
      }
      
      console.log(`✅ Created ${proposalCount} proposals for ${contractor.name}`);
    }

    console.log('\n🎉 Test data creation complete!');
    console.log('\nSummary:');
    
    const totalContractors = await UserGroup.count({ where: { group_type: 'contractor' } });
    const totalUsers = await User.count({ where: { group_id: { [require('sequelize').Op.ne]: null } } });
    const totalCustomers = await Customer.count({ where: { group_id: { [require('sequelize').Op.ne]: null } } });
    const totalProposals = await Proposals.count();
    
    console.log(`- Total Contractors: ${totalContractors}`);
    console.log(`- Total Users: ${totalUsers}`);
    console.log(`- Total Customers: ${totalCustomers}`);
    console.log(`- Total Proposals: ${totalProposals}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
