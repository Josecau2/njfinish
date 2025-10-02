#!/usr/bin/env node
/**
 * E2E-focused seeder that inspects the current database and only inserts
 * the records Playwright relies on when they are missing. Existing rows are
 * updated in place, avoiding duplicate content on repeated runs.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');

const sequelize = require('../config/db');
const models = require('../models');

const {
  User,
  UserRole,
  UserGroup,
  Location,
  Tax,
  Customer,
  Proposals: Proposal,
  Order,
  Payment,
  PaymentConfiguration,
  Notification,
  ResourceCategory,
  ResourceLink,
  Lead,
  Manufacturer,
  ManufacturerMultiplier,
  UserGroupMultiplier,
} = models;

const ADMIN_EMAIL = process.env.E2E_AUTH_EMAIL || 'joseca@symmetricalwolf.com';
const ADMIN_PASSWORD = process.env.E2E_AUTH_PASSWORD || 'admin123';

function mergeWhere(defaults, where) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(where)) {
    if (!(key in merged)) {
      merged[key] = value;
    }
  }
  return merged;
}

async function ensure(model, where, values, transaction) {
  const existing = await model.findOne({ where, transaction });
  if (existing) {
    await existing.update(mergeWhere(values, where), { transaction });
    return existing;
  }
  return model.create({ ...where, ...values }, { transaction });
}

async function ensureRole(role) {
  const [row] = await UserRole.findOrCreate({
    where: { role, userId: 0 },
    defaults: { role, userId: 0 },
  });
  return row;
}

async function seed() {
  await sequelize.authenticate();

  await sequelize.transaction(async (transaction) => {
    const adminRole = await ensureRole('Admin');
    const userRole = await ensureRole('User');
    const contractorRole = await ensureRole('Contractor');
    const manufacturerRole = await ensureRole('Manufacturers');

    const adminGroup = await ensure(
      UserGroup,
      { name: 'QA Administrators' },
      {
        group_type: 'standard',
        modules: { dashboard: true, proposals: true, customers: true, resources: true },
      },
      transaction,
    );

    const contractorGroup = await ensure(
      UserGroup,
      { name: 'QA Contractors' },
      {
        group_type: 'contractor',
        modules: { dashboard: true, proposals: true, customers: true, resources: true },
        contractor_settings: { price_multiplier: 1.1 },
      },
      transaction,
    );

    const location = await ensure(
      Location,
      { locationName: 'Hudson Showroom' },
      {
        address: '123 Waterfront Ave, Jersey City, NJ',
        website: 'https://demo.njcabinets.com',
        email: 'showroom@njcabinets.com',
        phone: '+1-201-555-0100',
        country: 'USA',
        timezone: 'America/New_York',
        isDeleted: false,
      },
      transaction,
    );

    await ensure(
      Tax,
      { label: 'NJ Sales Tax' },
      {
        value: 6.63,
        isDefault: true,
      },
      transaction,
    );

    const manufacturer = await ensure(
      Manufacturer,
      { name: 'Garden State Cabinets' },
      {
        email: 'orders@gardenstatecabs.com',
        phone: '+1-201-555-1111',
        address: '45 Industrial Way, Newark, NJ',
        website: 'https://gardenstatecabs.example',
        isPriceMSRP: true,
        costMultiplier: 2.35,
        instructions: 'Ship palettes to loading dock B. Notify 24h prior to delivery.',
        image: '/uploads/manufacturers/garden-state.png',
        assembledEtaDays: '21',
        unassembledEtaDays: '14',
        deliveryFee: 120.0,
        orderEmailSubject: 'Garden State Cabinets Order',
        orderEmailTemplate: '<p>Please see attached order PDF.</p>',
        orderEmailMode: 'pdf',
        autoEmailOnAccept: true,
        status: true,
      },
      transaction,
    );

    await ensure(
      ManufacturerMultiplier,
      { name: 'Default Garden State Multiplier' },
      {
        email: 'pricing@gardenstatecabs.com',
        multiplier: 1.0,
        enabled: true,
      },
      transaction,
    );

    await ensure(
      UserGroupMultiplier,
      { user_group_id: contractorGroup.id },
      { multiplier: '1.15', enabled: 1 },
      transaction,
    );

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUser = await ensure(
      User,
      { email: ADMIN_EMAIL },
      {
        name: 'Jose Symmetricalwolf',
        password: hashedPassword,
        role: 'Admin',
        location: 'HQ',
        group_id: adminGroup.id,
        isSalesRep: true,
        role_id: adminRole.id,
        isDeleted: false,
      },
      transaction,
    );

    const designerUser = await ensure(
      User,
      { email: 'designer.qa@njcabinets.com' },
      {
        name: 'Quinn Designer',
        password: hashedPassword,
        role: 'User',
        location: 'HQ',
        group_id: adminGroup.id,
        isSalesRep: true,
        role_id: userRole.id,
        isDeleted: false,
      },
      transaction,
    );

    const contractorUser = await ensure(
      User,
      { email: 'foreman.qa@contractors.com' },
      {
        name: 'Kai Foreman',
        password: hashedPassword,
        role: 'User',
        location: 'Field',
        group_id: contractorGroup.id,
        isSalesRep: false,
        role_id: contractorRole.id,
        isDeleted: false,
      },
      transaction,
    );

    const manufacturerUser = await ensure(
      User,
      { email: 'rep@gardenstatecabs.com' },
      {
        name: 'Morgan Manufacturer',
        password: hashedPassword,
        role: 'Manufacturers',
        location: 'Distribution',
        group_id: adminGroup.id,
        isSalesRep: false,
        role_id: manufacturerRole.id,
        isDeleted: false,
      },
      transaction,
    );

    const homeowner = await ensure(
      Customer,
      { email: 'homeowner.qa@example.com' },
      {
        name: 'Jamie Homeowner',
        phone: '201-555-2222',
        mobile: '201-555-3333',
        address: '12 River View Dr',
        city: 'Hoboken',
        state: 'NJ',
        zipCode: '07030',
        group_id: contractorGroup.id,
        created_by_user_id: contractorUser.id,
        customerType: 'Residential',
        leadSource: 'Website',
      },
      transaction,
    );

    const developer = await ensure(
      Customer,
      { email: 'developer.qa@example.com' },
      {
        name: 'Liberty Development LLC',
        phone: '201-555-4444',
        address: '88 Grand St',
        city: 'Jersey City',
        state: 'NJ',
        zipCode: '07302',
        group_id: contractorGroup.id,
        created_by_user_id: contractorUser.id,
        customerType: 'Commercial',
        leadSource: 'Referral',
      },
      transaction,
    );

    const proposalBlueprint = (
      status,
      customer,
      extra = {},
    ) => ({
      customerId: customer.id,
      designer: designerUser.id,
      owner_group_id: contractorGroup.id,
      created_by_user_id: contractorUser.id,
      location: location.id,
      status,
      leadSource: customer.leadSource,
      type: 'Standard',
      assembled: true,
      date: new Date(),
      manufacturersData: [
        {
          manufacturer: manufacturer.id,
          manufacturerName: manufacturer.name,
          multiplier: 1.1,
        },
      ],
      ...extra,
    });

    const drafts = [
      proposalBlueprint('draft', homeowner, {
        description: 'Initial layout draft for open-concept kitchen',
      }),
      proposalBlueprint('sent', homeowner, {
        description: 'Sent upgrade package with island option',
        sent_at: new Date(),
      }),
      proposalBlueprint('rejected', developer, {
        description: 'Rejected LVT flooring package',
      }),
    ];

    const proposals = [];
    for (const draft of drafts) {
      const proposal = await ensure(
        Proposal,
        { customerId: draft.customerId, description: draft.description },
        draft,
        transaction,
      );
      proposals.push(proposal);
    }

    const acceptedProposal = await ensure(
      Proposal,
      { customerId: developer.id, status: 'accepted' },
      proposalBlueprint('accepted', developer, {
        description: 'Penthouse cabinetry package – final approved revision',
        accepted_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
        accepted_by: contractorUser.name,
        locked_at: new Date(),
        locked_by_user_id: contractorUser.id,
        manufacturersData: [
          {
            manufacturer: manufacturer.id,
            manufacturerName: manufacturer.name,
            multiplier: 1.1,
            items: [
              {
                sku: 'BASE-36-2D',
                description: '36" Base Cabinet – Two Drawer',
                quantity: 4,
                unitPrice: 425,
                totalPrice: 1700,
              },
              {
                sku: 'WALL-24-2D',
                description: '24" Wall Cabinet – Two Door',
                quantity: 6,
                unitPrice: 295,
                totalPrice: 1770,
              },
            ],
            summary: {
              styleTotal: 3470,
              assemblyFee: 420,
              modificationsCost: 180,
              deliveryFee: 150,
              discountAmount: 120,
              taxAmount: 232,
              grandTotal: 4332,
            },
          },
        ],
      }),
      transaction,
    );
    proposals.push(acceptedProposal);

    const orderSnapshot = {
      summary: {
        grandTotal: 18650,
        taxAmount: 1235,
        deliveryFee: 180,
        discountAmount: 350,
        styleTotal: 15800,
        modificationsCost: 720,
        assemblyFee: 1900,
      },
      manufacturers: [
        {
          manufacturer: manufacturer.id,
          manufacturerName: manufacturer.name,
          items: [
            {
              sku: 'ISL-48-DR',
              description: '48" Island with Drawer Bank',
              quantity: 1,
              unitPrice: 4800,
              totalPrice: 4800,
              selectedOptions: {
                sideSelector: 'B',
                width: 48,
              },
            },
            {
              sku: 'PANTRY-96',
              description: '96" Pantry Cabinet',
              quantity: 2,
              unitPrice: 2150,
              totalPrice: 4300,
            },
          ],
          summary: {
            styleTotal: 9100,
            assemblyFee: 900,
            modificationsCost: 320,
            deliveryFee: 120,
            discountAmount: 250,
            taxAmount: 545,
            grandTotal: 10735,
          },
        },
      ],
    };

    const order = await ensure(
      Order,
      { proposal_id: acceptedProposal.id },
      {
        owner_group_id: contractorGroup.id,
        customer_id: developer.id,
        manufacturer_id: manufacturer.id,
        style_name: 'Modern Loft Series',
        status: 'processing',
        accepted_at: acceptedProposal.accepted_at,
        accepted_by_user_id: contractorUser.id,
        accepted_by_label: contractorUser.name,
        grand_total_cents: 1865000,
        snapshot: orderSnapshot,
        parts_cents: 1280000,
        assembly_cents: 190000,
        mods_cents: 72000,
        subtotal_before_discount_cents: 1830000,
        discount_cents: 35000,
        delivery_cents: 18000,
        tax_cents: 123500,
        tax_rate_pct: 6.63,
        discount_pct: 1.91,
        m_cost: 8200,
        m_markup: 42.5,
        currency: 'USD',
        created_by_user_id: contractorUser.id,
        locked_at: acceptedProposal.locked_at,
        locked_by_user_id: contractorUser.id,
        order_number: 'NJ-101-042425',
        order_number_date: new Date().toISOString().slice(0, 10),
        order_number_seq: 101,
      },
      transaction,
    );

    await ensure(
      Payment,
      { orderId: order.id },
      {
        amount_cents: 465000,
        currency: 'USD',
        status: 'completed',
        gateway: 'manual',
        paymentMethod: 'check',
        transactionId: `manual-${uuid()}`,
        gatewayResponse: JSON.stringify({ status: 'completed' }),
        paidAt: new Date(),
        createdBy: contractorUser.id,
      },
      transaction,
    );

    await ensure(
      PaymentConfiguration,
      { gatewayProvider: 'manual-demo' },
      {
        gatewayUrl: 'https://payments.demo.local/manual',
        embedCode: '<div class="manual-pay">Manual payment instructions</div>',
        apiKey: 'manual-demo-key',
        webhookSecret: 'manual-demo-secret',
        stripePublishableKey: 'pk_manual_demo',
        cardPaymentsEnabled: false,
        isActive: true,
        supportedCurrencies: ['USD'],
        settings: { instructions: 'Send check within 7 business days.' },
        createdBy: adminUser.id,
      },
      transaction,
    );

    const resourceCategory = await ensure(
      ResourceCategory,
      { slug: 'install-guides' },
      {
        name: 'Installation Guides',
        description: 'Step-by-step instructions and reference documents.',
        color: '#2563eb',
        icon: 'Book',
        sort_order: 1,
        is_active: true,
        is_pinned: true,
        pinned_order: 1,
        metadata: { audience: 'contractor' },
      },
      transaction,
    );

    await ensure(
      ResourceLink,
      { url: 'https://demo.njcabinets.com/resources/field-measure-checklist' },
      {
        title: 'Field Measure Checklist',
        type: 'document',
        description: 'Printable checklist for pre-install field visits.',
        category_id: resourceCategory.id,
        is_pinned: true,
        pinned_order: 1,
        status: 'active',
        visible_to_group_types: ['admin', 'contractor'],
        tags: ['field', 'measure'],
      },
      transaction,
    );

    await ensure(
      Notification,
      { title: 'Proposal accepted', recipient_user_id: adminUser.id },
      {
        type: 'proposal',
        message: `Proposal ${acceptedProposal.id} was accepted by ${developer.name}.`,
        payload: { proposalId: acceptedProposal.id, customerId: developer.id },
        is_read: false,
        priority: 'high',
        action_url: `/quotes/${acceptedProposal.id}`,
        created_by: contractorUser.id,
      },
      transaction,
    );

    await ensure(
      Lead,
      { email: 'lead.qa@example.com' },
      {
        name: 'Morgan Prospective',
        firstName: 'Morgan',
        lastName: 'Prospective',
        phone: '973-555-5555',
        city: 'Montclair',
        state: 'NJ',
        zip: '07042',
        company: 'Prospective Homes',
        message: 'Looking for a modern shaker package with quick lead time.',
        status: 'reviewing',
        metadata: {
          contact: {
            firstName: 'Morgan',
            lastName: 'Prospective',
            city: 'Montclair',
            state: 'NJ',
            zip: '07042',
          },
          budgetRange: '15000-20000',
          notes: [
            {
              author: adminUser.name,
              body: 'Shared showroom availability and sample door schedule.',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
      transaction,
    );
  });

  console.log('✅ E2E seed complete. Ready credentials:');
  console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('   Contractor sample: foreman.qa@contractors.com / admin123');
}

seed()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error('❌ E2E seed failed:', err);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  });