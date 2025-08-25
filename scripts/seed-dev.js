// Seed data for local testing
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const eventManager = require('../utils/eventManager');
const sequelize = require('../config/db');
const {
  User,
  UserGroup,
  Customer,
  Proposals: Proposal,
  ResourceLink
} = require('../models');

async function ensureAdmin() {
  const [admin, created] = await User.findOrCreate({
    where: { email: 'admin@example.com' },
    defaults: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('AdminPass123!', 10),
      role: 'Admin'
    }
  });
  console.log(created ? '✓ Created admin user admin@example.com / AdminPass123!' : '• Admin user exists');
  return admin;
}

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('Seeding dev data...');

    // 1) Contractor group with all modules enabled
    const [group, groupCreated] = await UserGroup.findOrCreate({
      where: { name: 'Acme Contractors', group_type: 'contractor' },
      defaults: {
        name: 'Acme Contractors',
        group_type: 'contractor',
        modules: { dashboard: true, proposals: true, customers: true, resources: true },
        contractor_settings: { price_multiplier: 1.0 }
      }
    });
    console.log(groupCreated ? `✓ Created contractor group ${group.name} (#${group.id})` : `• Contractor group exists (#${group.id})`);

    // 2) Two contractor users
    const [contractor1] = await User.findOrCreate({
      where: { email: 'contractor1@example.com' },
      defaults: {
        name: 'Casey Contractor',
        email: 'contractor1@example.com',
        password: await bcrypt.hash('ContractorPass1!', 10),
        role: 'User',
        group_id: group.id
      }
    });
    if (contractor1.group_id !== group.id) { await contractor1.update({ group_id: group.id }); }

    const [contractor2] = await User.findOrCreate({
      where: { email: 'contractor2@example.com' },
      defaults: {
        name: 'Riley Contractor',
        email: 'contractor2@example.com',
        password: await bcrypt.hash('ContractorPass2!', 10),
        role: 'User',
        group_id: group.id
      }
    });
    if (contractor2.group_id !== group.id) { await contractor2.update({ group_id: group.id }); }
    console.log('✓ Ensured 2 contractor users');

    // 3) Three customers for the contractor group
    const customers = [];
    const c1 = await Customer.findOrCreate({
      where: { email: 'john@example.com' },
      defaults: { name: 'John Doe', email: 'john@example.com', phone: '555-0001', group_id: group.id, created_by_user_id: contractor1.id }
    });
    customers.push(c1[0]);
    const c2 = await Customer.findOrCreate({
      where: { email: 'jane@example.com' },
      defaults: { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0002', group_id: group.id, created_by_user_id: contractor1.id }
    });
    customers.push(c2[0]);
    const c3 = await Customer.findOrCreate({
      where: { email: 'office@acme.com' },
      defaults: { name: 'Acme Holdings', email: 'office@acme.com', phone: '555-0003', group_id: group.id, created_by_user_id: contractor2.id }
    });
    customers.push(c3[0]);
    // Ensure group assignment
    for (const cust of customers) { if (cust.group_id !== group.id) await cust.update({ group_id: group.id }); }
    console.log('✓ Ensured 3 customers');

    // 4) Five proposals across statuses (one accepted)
    const existingCount = await Proposal.count({ where: { owner_group_id: group.id } });
    const proposals = [];
    if (existingCount < 5) {
      const statuses = ['draft', 'sent', 'accepted', 'rejected', 'Proposal done'];
      for (let i = 0; i < 5 - existingCount; i++) {
        const status = statuses[i % statuses.length];
        const cust = customers[i % customers.length];
        const base = {
          customerId: cust.id,
          designer: contractor1.id,
          description: `Test proposal #${existingCount + i + 1} for ${cust.name}`,
          owner_group_id: group.id,
          type: 'Standard',
          date: new Date(),
        };
        if (status === 'accepted') {
          base.accepted_at = new Date();
          base.accepted_by = 'QA Seeder';
        }
        proposals.push(await Proposal.create({ ...base, status }));
      }
      console.log('✓ Created proposals to reach 5 total');
    } else {
      const found = await Proposal.findAll({ where: { owner_group_id: group.id }, limit: 5 });
      proposals.push(...found);
      console.log('• Found existing proposals (>=5)');
    }

    // 5) A couple of resources visible to contractor
    await ResourceLink.findOrCreate({
      where: { url: 'https://example.com/handbook.pdf' },
      defaults: {
        title: 'Contractor Handbook', url: 'https://example.com/handbook.pdf', type: 'pdf', visible_to_group_types: ['contractor']
      }
    });
    await ResourceLink.findOrCreate({
      where: { url: 'https://example.com/install.mp4' },
      defaults: {
        title: 'Installation Video', url: 'https://example.com/install.mp4', type: 'video', visible_to_group_types: ['contractor']
      }
    });
    console.log('✓ Ensured contractor resources');

    // 6) Ensure admin exists and simulate a proposal acceptance event
    const admin = await ensureAdmin();
    let accepted = proposals.find(p => p.status === 'accepted');
    if (!accepted) {
      accepted = proposals[0];
      await accepted.update({ status: 'accepted', accepted_at: new Date(), accepted_by: 'QA Seeder' });
      console.log('• Converted one proposal to accepted');
    }

    // Emit domain event to create notifications for admins
    const acceptedCustomer = customers.find(c => c.id === accepted.customerId) || customers[0];
    eventManager.emitProposalAccepted({
      proposalId: accepted.id,
      ownerGroupId: accepted.owner_group_id,
      total: 100,
      customerSummary: { id: acceptedCustomer.id, name: acceptedCustomer.name },
      acceptedBy: 'QA Seeder',
      acceptedAt: accepted.accepted_at || new Date(),
      isExternalAcceptance: false
    });
    console.log('✓ Emitted proposal.accepted event to create admin notifications');

    console.log('\nSeed complete. Logins:');
    console.log('Admin: admin@example.com / AdminPass123!');
    console.log('Contractor 1: contractor1@example.com / ContractorPass1!');
    console.log('Contractor 2: contractor2@example.com / ContractorPass2!');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

run();
