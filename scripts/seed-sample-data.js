#!/usr/bin/env node
/**
 * Comprehensive sample data seeder for the NJ Cabinets demo environment.
 * Populates representative content across most tables so every feature
 * has data to work with immediately.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');
const sequelize = require('../config/db');
const models = require('../models');
const CustomizationTheme = require('../models/Customization');

const getModel = (name) => {
  const model = models[name];
  if (!model) {
    throw new Error(`Model "${name}" is not exported from models/index.js`);
  }
  return model;
};

const User = getModel('User');
const UserGroup = getModel('UserGroup');
const UserRole = getModel('UserRole');
const UserGroupMultiplier = getModel('UserGroupMultiplier');
const Location = getModel('Location');
const Tax = getModel('Tax');
const Customer = getModel('Customer');
const Proposal = getModel('Proposals');
const ProposalSection = getModel('ProposalSection');
const ProposalItem = getModel('ProposalItem');
const ProposalSectionItem = getModel('ProposalSectionItem');
const ProposalSession = getModel('ProposalSession');
const Order = getModel('Order');
const Payment = getModel('Payment');
const PaymentConfiguration = getModel('PaymentConfiguration');
const Notification = getModel('Notification');
const ActivityLog = getModel('ActivityLog');
const CatalogUploadBackup = getModel('CatalogUploadBackup');
const ContactInfo = getModel('ContactInfo');
const ContactThread = getModel('ContactThread');
const ContactMessage = getModel('ContactMessage');
const ResourceLink = getModel('ResourceLink');
const ResourceFile = getModel('ResourceFile');
const Terms = getModel('Terms');
const TermsAcceptance = getModel('TermsAcceptance');
const CategoriesTable = getModel('Categories');
const Category = getModel('Category');
const Menu = getModel('Menu');
const Modifier = getModel('Modifier');
const Manufacturer = getModel('Manufacturer');
const ManufacturerCatalogData = getModel('ManufacturerCatalogData');
const ManufacturerCatalogFiles = getModel('ManufacturerCatalogFiles');
const ManufacturerStyleCollection = getModel('ManufacturerStyleCollection');
const ManufacturerTypeCollection = getModel('ManufacturerTypeCollection');
const ManufacturerSubType = getModel('ManufacturerSubType');
const CatalogSubTypeAssignment = getModel('CatalogSubTypeAssignment');
const ManufacturerMultiplier = getModel('ManufacturerMultiplier');
const ManufacturerAssemblyCost = getModel('ManufacturerAssemblyCost');
const ManufacturerHingesDetails = getModel('ManufacturerHingesDetails');
const ManufacturerModificationDetails = getModel('ManufacturerModificationDetails');
const GlobalModificationCategory = getModel('GlobalModificationCategory');
const GlobalModificationCategories = getModel('GlobalModificationCategories');
const GlobalModificationTemplate = getModel('GlobalModificationTemplate');
const GlobalModificationAssignment = getModel('GlobalModificationAssignment');
const CustomizationsTable = getModel('Customizations');
const LoginCustomization = getModel('LoginCustomizations');
const PdfCustomization = getModel('PdfCustomizations');
const Lead = getModel('Lead');

const now = () => new Date();

async function ensure(model, where, data, transaction, createOptions = {}) {
  const existing = await model.findOne({ where, transaction });
  if (existing) {
    await existing.update(data, { transaction });
    return existing;
  }
  return model.create({ ...where, ...data }, { transaction, ...createOptions });
}

async function run() {
  await sequelize.authenticate();
  await Lead.sync();

  await sequelize.transaction(async (transaction) => {
    // --- User groups -------------------------------------------------------
    const adminGroup = await ensure(UserGroup, { name: 'Head Office Admins' }, {
      group_type: 'standard',
      modules: { dashboard: true, proposals: true, customers: true, resources: true },
      contractor_settings: null,
    }, transaction);

    const contractorGroup = await ensure(UserGroup, { name: 'Skyline Contractors' }, {
      group_type: 'contractor',
      modules: { dashboard: true, proposals: true, customers: true, resources: true },
      contractor_settings: { price_multiplier: 1.15, manufacturers: ['Gallery Cabinets'] },
    }, transaction);

    // --- Users & roles -----------------------------------------------------
    const password = await bcrypt.hash('DemoPass123!', 10);

    const adminUser = await ensure(User, { email: 'ceo@demo.nj' }, {
      name: 'Avery Admin',
      password,
      role: 'Admin',
      location: 'HQ',
      group_id: adminGroup.id,
      role_id: 1,
      isSalesRep: false,
      isDeleted: false,
    }, transaction);

    const designerUser = await ensure(User, { email: 'designer@demo.nj' }, {
      name: 'Dana Designer',
      password,
      role: 'User',
      location: 'HQ',
      group_id: adminGroup.id,
      role_id: 1,
      isSalesRep: true,
      isDeleted: false,
    }, transaction);

    const contractorUser = await ensure(User, { email: 'fieldlead@skyline.builders' }, {
      name: 'Cameron Contractor',
      password,
      role: 'User',
      group_id: contractorGroup.id,
      role_id: 1,
      isSalesRep: true,
      isDeleted: false,
    }, transaction);

    const manufacturerUser = await ensure(User, { email: 'rep@gallerycabinets.com' }, {
      name: 'Morgan Manufacturer',
      password,
      role: 'Manufacturers',
      group_id: adminGroup.id,
      role_id: 1,
      isSalesRep: true,
      isDeleted: false,
    }, transaction);

    await ensure(UserRole, { userId: adminUser.id, role: 'Admin' }, {}, transaction);
    await ensure(UserRole, { userId: designerUser.id, role: 'User' }, {}, transaction);
    await ensure(UserRole, { userId: contractorUser.id, role: 'Contractor' }, {}, transaction);
    await ensure(UserRole, { userId: manufacturerUser.id, role: 'Manufacturers' }, {}, transaction);

    await ensure(UserGroupMultiplier, { user_group_id: contractorGroup.id }, {
      multiplier: '1.10',
      enabled: 1,
    }, transaction);

    // --- Locations & taxes -------------------------------------------------
    const hqLocation = await ensure(Location, { locationName: 'Newark HQ' }, {
      address: '123 Market St, Newark, NJ 07102',
      website: 'https://demo.njcabinets.com',
      email: 'contact@demo.njcabinets.com',
      phone: '973-555-0100',
      country: 'USA',
      timezone: 'America/New_York',
      isDeleted: false,
    }, transaction);

    await ensure(Location, { locationName: 'Jersey Shore Showroom' }, {
      address: '45 Ocean Ave, Asbury Park, NJ 07712',
      website: 'https://shore.njcabinets.com',
      email: 'shore@demo.njcabinets.com',
      phone: '732-555-0199',
      country: 'USA',
      timezone: 'America/New_York',
      isDeleted: false,
    }, transaction);

    await ensure(Tax, { label: 'NJ State Tax' }, {
      value: 6.63,
      isDefault: true,
    }, transaction);

    await ensure(Tax, { label: 'NYC Surcharge' }, {
      value: 8.75,
      isDefault: false,
    }, transaction);

    // --- Manufacturers and catalog content --------------------------------
    const gallery = await ensure(Manufacturer, { name: 'Gallery Cabinets' }, {
      email: 'sales@gallerycabinets.com',
      phone: '800-555-1212',
      address: '200 Cabinet Way, Paterson, NJ 07501',
      website: 'https://gallerycabinets.com',
      isPriceMSRP: true,
      costMultiplier: 2.15,
      instructions: 'Use soft-close hinges for premium line.',
      image: '/uploads/manufacturers/gallery.png',
      assembledEtaDays: '21',
      unassembledEtaDays: '14',
      deliveryFee: 175,
      status: true,
    }, transaction);

    const precision = await ensure(Manufacturer, { name: 'Precision Woodworks' }, {
      email: 'hello@precisionwoodworks.com',
      phone: '415-555-3333',
      address: '90 Artisan Rd, Trenton, NJ 08611',
      website: 'https://precisionwoodworks.com',
      isPriceMSRP: false,
      costMultiplier: 1.85,
      instructions: 'Custom stain requires approval form.',
      image: '/uploads/manufacturers/precision.png',
      assembledEtaDays: '28',
      unassembledEtaDays: '18',
      deliveryFee: 225,
      status: true,
    }, transaction);

    const shakerDoor = await ensure(ManufacturerCatalogData, { code: 'GL-DOOR-SHAKER' }, {
      manufacturerId: gallery.id,
      description: 'Classic Shaker Door 18x30',
      style: 'Modern Shaker',
      color: 'Polar White',
      type: 'Door',
      price: 149.99,
      discontinued: false,
    }, transaction);

    const baseCabinet = await ensure(ManufacturerCatalogData, { code: 'GL-BASE-30' }, {
      manufacturerId: gallery.id,
      description: '30" Base Cabinet',
      style: 'Modern Shaker',
      color: 'Polar White',
      type: 'Cabinet',
      price: 329.99,
      discontinued: false,
    }, transaction);

    await ensure(ManufacturerCatalogFiles, { fileName: 'gallery-2025.xlsx', manufacturerId: gallery.id }, {
      originalName: 'gallery-price-list-2025.xlsx',
      fileSize: 102400,
      uploadedBy: adminUser.id,
    }, transaction);

    await ensure(ManufacturerCatalogFiles, { fileName: 'precision-doors.pdf', manufacturerId: precision.id }, {
      originalName: 'precision-doors-2025.pdf',
      fileSize: 512000,
      uploadedBy: adminUser.id,
    }, transaction);

    await ensure(ManufacturerStyleCollection, { catalogId: shakerDoor.id, manufacturerId: gallery.id }, {
      name: 'Signature Series',
      shortName: 'Signature',
      description: 'Premium curated door styles',
      code: 'SIG',
      image: '/uploads/styles/signature.png',
    }, transaction);

    await ensure(ManufacturerTypeCollection, { catalogId: baseCabinet.id, manufacturerId: gallery.id, type: 'Base Cabinet' }, {
      name: 'Kitchen Bases',
      shortName: 'KB',
      description: 'Base cabinets for kitchens',
      code: 'BASE',
      image: '/uploads/types/base.png',
    }, transaction);

    const wallSubtype = await ensure(ManufacturerSubType, { manufacturer_id: gallery.id, name: 'Wall Cabinets' }, {
      description: 'Wall mounted storage cabinets',
      requires_hinge_side: true,
      requires_exposed_side: true,
      created_by_user_id: adminUser.id,
    }, transaction);

    await ensure(CatalogSubTypeAssignment, { catalog_data_id: baseCabinet.id, sub_type_id: wallSubtype.id }, {
      assigned_by_user_id: designerUser.id,
    }, transaction);

    await ensure(ManufacturerMultiplier, { email: 'pricing@gallerycabinets.com' }, {
      name: 'Gallery Pricing Desk',
      multiplier: 1.12,
      enabled: true,
    }, transaction);

    await ensure(ManufacturerAssemblyCost, { catalogDataId: baseCabinet.id, type: 'fixed' }, {
      price: 45.0,
    }, transaction);

    await ensure(ManufacturerHingesDetails, { catalogDataId: shakerDoor.id }, {
      leftHingePrice: 12.5,
      rightHingePrice: 12.5,
      bothHingesPrice: 20.0,
      exposedSidePrice: 15.0,
    }, transaction);

    await ensure(ManufacturerModificationDetails, { catalogDataId: baseCabinet.id, modificationName: 'Pull-out Trash' }, {
      description: 'Install dual-bin pull-out trash system',
      notes: 'Requires 18" base cabinet minimum',
      price: 85.0,
    }, transaction);

    await ensure(CatalogUploadBackup, { uploadSessionId: 'gallery-seed-session' }, {
      manufacturerId: gallery.id,
      filename: 'gallery-import.csv',
      originalName: 'gallery-import.csv',
      backupData: [{ code: 'GL-BASE-30', price: 329.99 }],
      itemsCount: 1,
      uploadedBy: adminUser.id,
      isRolledBack: false,
    }, transaction);

    // --- Customers ---------------------------------------------------------
    const homeowner = await ensure(Customer, { email: 'alex.homeowner@example.com' }, {
      name: 'Alex Homeowner',
      phone: '973-555-2200',
      address: '500 Elm St',
      city: 'Montclair',
      state: 'NJ',
      zipCode: '07042',
      leadSource: 'Website',
      customerType: 'Homeowner',
      defaultDiscount: 5,
      group_id: contractorGroup.id,
      created_by_user_id: contractorUser.id,
    }, transaction);

    const builder = await ensure(Customer, { email: 'project@buildright.dev' }, {
      name: 'BuildRight Development',
      phone: '212-555-9876',
      address: '88 Broadway',
      city: 'New York',
      state: 'NY',
      zipCode: '10005',
      leadSource: 'Referral',
      customerType: 'Builder',
      defaultDiscount: 8,
      group_id: contractorGroup.id,
      created_by_user_id: contractorUser.id,
    }, transaction);

    // --- Categories & modifications ---------------------------------------
    const galleryCategory = await ensure(Category, { categoryId: 'GL-ACCENTS' }, {
      type: 'accessory',
      isDeleted: false,
      presentAtAllLocations: true,
      name: 'Decorative Accents',
      categoryType: 'Decor',
      isTopLevel: true,
      onlineVisibility: true,
    }, transaction);

    await ensure(CategoriesTable, { name: 'Premium Finishes' }, {
      description: 'Finish upgrades for cabinetry',
      status: 'active',
    }, transaction);

    const gmCategory = await ensure(GlobalModificationCategory, { name: 'Crown Moulding' }, {
      scope: 'gallery',
      manufacturer_id: null,
      order_index: 1,
      image: '/uploads/modifications/crown.png',
      description: 'Decorative crown moulding packages',
    }, transaction);

    await ensure(GlobalModificationCategories, { id: gmCategory.id }, {
      sortOrder: 1,
    }, transaction);

    const gmTemplate = await ensure(GlobalModificationTemplate, { name: 'Standard Crown Package' }, {
      category_id: gmCategory.id,
      sample_image: '/uploads/modifications/crown-standard.png',
      fields_config: JSON.stringify({ linearFeet: { label: 'Linear Feet', type: 'number', defaultValue: 20 } }),
      is_ready: true,
      is_blueprint: true,
      manufacturer_id: null,
      price_cents: 25000,
    }, transaction);

    await ensure(GlobalModificationAssignment, { template_id: gmTemplate.id, scope: 'all' }, {
      manufacturer_id: gallery.id,
      target_style: 'Modern Shaker',
      target_type: null,
      catalog_data_id: null,
      override_price: 260.0,
      is_active: true,
    }, transaction);

    // --- Menus & modifiers -------------------------------------------------
    await ensure(Menu, { itemName: 'Classic Caesar Salad' }, {
      description: 'Fresh romaine, parmesan, house-made dressing',
      nickName: 'Caesar',
      photo: '/uploads/menu/caesar.jpg',
      isDeleted: 'false',
    }, transaction);

    await ensure(Modifier, { name: 'Soft-Close Hinges' }, {
      modifierId: 'MOD-SOFTCLOSE',
      price: 35.0,
      isDeleted: false,
      presentAtAllLocations: true,
    }, transaction);

    // --- UI Customization --------------------------------------------------
    await ensure(CustomizationTheme, { id: 1 }, {
      headerBg: '#1E293B',
      headerFontColor: '#F8FAFC',
      sidebarBg: '#0F172A',
      sidebarFontColor: '#E2E8F0',
      logoText: 'NJ Cabinets Demo',
      logoBg: '#2563EB',
      logoImage: '/uploads/branding/logo-demo.svg',
    }, transaction);

    await ensure(LoginCustomization, { id: 1 }, {
      logo: '/uploads/branding/login-logo.png',
      title: 'Welcome to NJ Cabinets Portal',
      subtitle: 'Log in to manage proposals, catalogs, and more.',
      backgroundColor: '#0F172A',
      showForgotPassword: true,
      showKeepLoggedIn: true,
      rightTitle: 'Need Access?',
      rightSubtitle: 'Contact your administrator',
      rightTagline: 'Premium cabinetry management',
      rightDescription: 'Track proposals, approvals, and catalog updates from one place.',
    }, transaction);

    await ensure(PdfCustomization, { id: 1 }, {
      vendor_id: contractorGroup.id,
      pdfHeader: 'NJ Cabinets Proposal',
      pdfFooter: 'Thank you for your business!',
      headerLogo: '/uploads/branding/pdf-header.png',
      companyName: 'NJ Cabinets Demo LLC',
      companyPhone: '973-555-0100',
      companyEmail: 'proposals@demo.nj',
      companyWebsite: 'https://demo.njcabinets.com',
      companyAddress: '123 Market St, Newark, NJ 07102',
      headerBgColor: '#1E293B',
      headerTxtColor: '#F8FAFC',
      isDeleted: false,
    }, transaction);

    await ensure(Lead, { email: 'interested@demo.nj' }, {
      name: 'Interested Dealer',
      company: 'Demo Kitchens LLC',
      message: 'We would love to explore NJ Cabinets for our showroom.',
      status: 'new',
    }, transaction);

    await ensure(ContactInfo, { id: 1 }, {
      companyName: 'NJ Cabinets Demo',
      email: 'hello@demo.nj',
      phone: '973-555-0100',
      address: '123 Market St, Newark, NJ 07102',
      website: 'https://demo.njcabinets.com',
      hours: 'Mon-Fri 8am - 6pm',
      socials: { facebook: 'https://facebook.com/njcabinets', instagram: 'https://instagram.com/njcabinets' },
      notes: 'Schedule private showroom visits by appointment.',
      updated_by: adminUser.id,
      showCompanyName: true,
      showEmail: true,
      showPhone: true,
      showAddress: true,
      showWebsite: true,
      showHours: true,
      showNotes: true,
    }, transaction);

    // --- Terms -------------------------------------------------------------
    const termsRecord = await ensure(Terms, { version: 1 }, {
      content: 'These are the standard demo terms and conditions for NJ Cabinets.',
      created_by_user_id: adminUser.id,
    }, transaction);

    await ensure(TermsAcceptance, { user_id: contractorUser.id, terms_version: termsRecord.version }, {
      accepted_at: now(),
    }, transaction);

    // --- Proposals & sections ---------------------------------------------
    const proposal = await ensure(Proposal, { description: 'Kitchen remodel for Alex Homeowner' }, {
      customerId: homeowner.id,
      designer: designerUser.id,
      measurementDone: true,
      designDone: true,
      measurementDate: now(),
      designDate: now(),
      location: hqLocation.id,
      salesRep: 'Dana Designer',
      leadSource: 'Website',
      type: 'Kitchen Remodel',
      assembled: true,
      status: 'accepted',
      manufacturersData: { primary: 'Gallery Cabinets', options: ['Precision Woodworks'] },
      date: now(),
      owner_group_id: contractorGroup.id,
      created_by_user_id: contractorUser.id,
      accepted_at: now(),
      accepted_by: 'Alex Homeowner',
      sent_at: now(),
      is_locked: true,
      order_snapshot: { total: 14500, items: 8 },
      locked_pricing: { total: 14500, deposit: 4500 },
      locked_at: now(),
      locked_by_user_id: contractorUser.id,
      migrated_to_sections: true,
    }, transaction);

    const islandSection = await ensure(ProposalSection, { proposal_id: proposal.id, section_name: 'Kitchen Island' }, {
      section_order: 1,
      manufacturer_id: gallery.id,
      style_id: shakerDoor.id,
      style_name: 'Modern Shaker',
      style_color: 'Polar White',
      is_active: true,
      section_summary: 'Island cabinetry with quartz countertop',
      legacy_version_name: 'v2',
    }, transaction);

    const perimeterSection = await ensure(ProposalSection, { proposal_id: proposal.id, section_name: 'Perimeter Cabinets' }, {
      section_order: 2,
      manufacturer_id: gallery.id,
      style_id: baseCabinet.id,
      style_name: 'Modern Shaker',
      style_color: 'Polar White',
      is_active: true,
      section_summary: 'Base and wall cabinets for perimeter',
      legacy_version_name: 'v1',
    }, transaction);

    await ensure(ProposalItem, { proposal_section_id: islandSection.id, name: 'Island Drawer Stack' }, {
      proposal_id: proposal.id,
      item_type: 'product',
      description: 'Three-drawer base cabinet',
      sku: 'GL-BASE-30',
      manufacturer_item_id: 'GL-BASE-30',
      category: 'Cabinets',
      subcategory: 'Base',
      width: 30,
      height: 34.5,
      depth: 24,
      quantity: 1,
      unit_price: 329.99,
      order_index: 1,
      is_custom: false,
      notes: 'Install countertop support brackets',
    }, transaction);

    await ensure(ProposalSectionItem, { proposal_section_id: islandSection.id, description: 'Quartz Countertop with Waterfall Edge' }, {
      code: 'CNTR-QUARTZ-WF',
      qty: 1,
      price: 2200,
      total: 2200,
      type: 'custom',
      assembled: true,
      taxable: true,
      exposed_side: 'Left & Right',
      modifications: JSON.stringify([{ name: 'Waterfall Edge', price: 450 }]),
      modifications_total: 450,
      item_order: 2,
      is_custom: true,
    }, transaction);

    await ensure(ProposalItem, { proposal_section_id: perimeterSection.id, name: 'Perimeter Wall Cabinets' }, {
      proposal_id: proposal.id,
      item_type: 'product',
      description: 'Set of wall cabinets with glass doors',
      sku: 'GL-WALL-36',
      manufacturer_item_id: 'GL-WALL-36',
      category: 'Cabinets',
      subcategory: 'Wall',
      width: 36,
      height: 30,
      depth: 12,
      quantity: 4,
      unit_price: 289.99,
      order_index: 1,
      is_custom: false,
    }, transaction);

    await ensure(ProposalSession, { token: 'demo-session-token' }, {
      proposal_id: proposal.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      created_by_user_id: contractorUser.id,
      customer_email: homeowner.email,
    }, transaction);

    // --- Communication -----------------------------------------------------
    const thread = await ensure(ContactThread, { subject: 'Installation Schedule', user_id: contractorUser.id }, {
      status: 'open',
      last_message_at: now(),
    }, transaction);

    await ensure(ContactMessage, { thread_id: thread.id, body: 'Can we install the island on April 4th?' }, {
      author_user_id: null,
      is_admin: false,
      read_by_recipient: false,
    }, transaction);

    await ensure(ContactMessage, { thread_id: thread.id, body: 'Yes, the team is confirmed for April 4th at 9am.' }, {
      author_user_id: contractorUser.id,
      is_admin: true,
      read_by_recipient: true,
      read_at: now(),
    }, transaction);

    await ensure(ResourceLink, { url: 'https://demo.njcabinets.com/resource/install-guide' }, {
      title: 'Installation Guide',
      type: 'document',
      visible_to_group_types: ['admin', 'contractor'],
    }, transaction);

    await ensure(ResourceFile, { name: 'Stock Color Swatches.pdf' }, {
      original_name: 'color-swatches.pdf',
      file_path: '/uploads/resources/color-swatches.pdf',
      file_size: 245760,
      file_type: 'document',
      mime_type: 'application/pdf',
      is_deleted: false,
      file_category: 'Marketing',
      visible_to_group_types: ['admin', 'contractor'],
      visible_to_group_ids: [contractorGroup.id],
    }, transaction);

    await ensure(ActivityLog, { action: 'proposal.accepted', target_type: 'proposal', target_id: proposal.id }, {
      actor: `user:${contractorUser.id}`,
      diff: { status: { from: 'sent', to: 'accepted' } },
    }, transaction);

    await ensure(Notification, { recipient_user_id: adminUser.id, title: 'Proposal accepted' }, {
      type: 'proposal',
      message: `Proposal ${proposal.id} was accepted by ${homeowner.name}.`,
      payload: { proposalId: proposal.id, customerId: homeowner.id },
      is_read: false,
      priority: 'high',
      action_url: `/proposals/${proposal.id}`,
      created_by: contractorUser.id,
    }, transaction);

    // --- Orders & payments -------------------------------------------------
    const order = await ensure(Order, { proposal_id: proposal.id }, {
      owner_group_id: contractorGroup.id,
      customer_id: homeowner.id,
      manufacturer_id: gallery.id,
      style_id: shakerDoor.id,
      style_name: 'Modern Shaker',
      status: 'processing',
      accepted_at: proposal.accepted_at,
      accepted_by_user_id: contractorUser.id,
      accepted_by_label: contractorUser.name,
      grand_total_cents: 1450000,
      snapshot: { sections: 2, items: 5 },
      parts_cents: 980000,
      assembly_cents: 120000,
      mods_cents: 35000,
      subtotal_before_discount_cents: 1400000,
      discount_cents: 50000,
      delivery_cents: 75000,
      tax_cents: 84750,
      tax_rate_pct: 6.63,
      discount_pct: 3.57,
      m_cost: 4800,
      m_markup: 42.5,
      currency: 'USD',
      created_by_user_id: contractorUser.id,
      locked_at: proposal.locked_at,
      locked_by_user_id: contractorUser.id,
    }, transaction, { hooks: false });

    await ensure(PaymentConfiguration, { gatewayProvider: 'stripe-demo' }, {
      gatewayUrl: 'https://api.stripe.com/demo',
      embedCode: '<iframe src="https://pay.demo"></iframe>',
      apiKey: 'sk_demo_123',
      webhookSecret: 'whsec_demo',
      isActive: true,
      supportedCurrencies: ['USD', 'CAD'],
      settings: { capture: 'manual' },
      createdBy: adminUser.id,
    }, transaction);

    await ensure(Payment, { orderId: order.id }, {
      amount: 4500,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'card',
      transactionId: `demo-${uuid()}`,
      gatewayResponse: JSON.stringify({ status: 'succeeded' }),
      paidAt: now(),
      createdBy: contractorUser.id,
    }, transaction);

    await ensure(ProposalSession, { token: 'follow-up-session-token' }, {
      proposal_id: proposal.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      created_by_user_id: contractorUser.id,
      customer_email: builder.email,
    }, transaction);
  });

  console.log('✅ Sample data seeded successfully.');
  console.log('Use these demo logins:');
  console.log(' - Avery Admin (Admin)       : ceo@demo.nj / DemoPass123!');
  console.log(' - Dana Designer (Designer)  : designer@demo.nj / DemoPass123!');
  console.log(' - Cameron Contractor        : fieldlead@skyline.builders / DemoPass123!');
  console.log(' - Morgan Manufacturer       : rep@gallerycabinets.com / DemoPass123!');

  await sequelize.close();
}

run().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
