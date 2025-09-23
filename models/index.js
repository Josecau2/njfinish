const ManufacturerCatalogData = require('./manufacturerCatalogData');
const { Manufacturer } = require('./Manufacturers');
const User = require('./User');
const UserGroup = require('./UserGroup');
const Location = require('./Location');
const Tax = require('./Taxes');
const UserRole = require('./UserRole');
const Collection = require('./Collection');
const Proposals = require('./Proposals');
const ProposalSession = require('./ProposalSession');
const Order = require('./Order');
const Customer = require('./Customer');
const UserGroupMultiplier = require('./UserGroupMultiplier');
const {ManufacturerCatalogFile} = require('./ManufacturerCatalogFile');
const ManufacturerStyleCollection = require('./ManufacturerStyleCollection');
const ManufacturerTypeCollection = require('./ManufacturerTypeCollection');
const CatalogUploadBackup = require('./CatalogUploadBackup');
const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');
const ResourceLink = require('./ResourceLink');
const ContactInfo = require('./ContactInfo');
const ContactThread = require('./ContactThread');
const ContactMessage = require('./ContactMessage');
const Terms = require('./Terms');
const TermsAcceptance = require('./TermsAcceptance');
const ManufacturerSubType = require('./ManufacturerSubType');
const CatalogSubTypeAssignment = require('./CatalogSubTypeAssignment');
const Payment = require('./Payment');
const PaymentConfiguration = require('./PaymentConfiguration');

// New models
const Category = require('./Category');
const Menu = require('./Menu');
const Modifier = require('./Modifier');
const ProposalItem = require('./ProposalItem');
const ProposalSection = require('./ProposalSection');
const ProposalSectionItem = require('./ProposalSectionItem');
const ResourceFile = require('./ResourceFile');
const ManufacturerMultiplier = require('./ManufacturerMultiplier');
const GlobalModificationCategory = require('./GlobalModificationCategory');
const GlobalModificationTemplate = require('./GlobalModificationTemplate');
const GlobalModificationAssignment = require('./GlobalModificationAssignment');

const ManufacturerAssemblyCost = require('./ManufacturerAssemblyCost');
const ManufacturerHingesDetails = require('./ManufacturerHingesDetails');
const ManufacturerModificationDetails = require('./ManufacturerModificationDetails');

// Missing model files
const Categories = require('./Categories');
const Customizations = require('./Customizations');
const GlobalModificationCategories = require('./GlobalModificationCategories');
const LoginCustomizations = require('./LoginCustomizations');
const ManufacturerAssemblyCosts = require('./ManufacturerAssemblyCosts');
const ManufacturerCatalogFiles = require('./ManufacturerCatalogFiles');
const PdfCustomizations = require('./PdfCustomizations');
const Lead = require('./Lead');

// Associations
Manufacturer.hasMany(ManufacturerCatalogData, {
    foreignKey: 'manufacturerId',
    as: 'catalogData'
});

ManufacturerCatalogData.belongsTo(Manufacturer, {
    foreignKey: 'manufacturerId'
});

// Manufacturer has many Collections
Manufacturer.hasMany(Collection, {
    foreignKey: 'vendor_id',
    as: 'collections'
});


ManufacturerStyleCollection.belongsTo(Manufacturer, {
    foreignKey: 'manufacturerId'
});

Manufacturer.hasMany(ManufacturerStyleCollection, {
    foreignKey: 'manufacturerId',
    as: 'collectionsstyles'
});


// Each Collection belongs to one Manufacturer
Collection.belongsTo(Manufacturer, {
    foreignKey: 'vendor_id'
});

// Define association
UserGroupMultiplier.belongsTo(UserGroup, {
  foreignKey: 'user_group_id',
});

UserGroup.hasMany(UserGroupMultiplier, {
  foreignKey: 'user_group_id',
});

Manufacturer.hasMany(ManufacturerCatalogFile, {
  foreignKey: 'manufacturer_id',
  as: 'catalogFiles'
});
ManufacturerCatalogFile.belongsTo(Manufacturer, {
  foreignKey: 'manufacturer_id',
  as: 'manufacturer'
});


Customer.hasMany(Proposals, { foreignKey: 'customerId', as: 'Proposals' });
Proposals.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Proposals.belongsTo(User, { foreignKey: 'designer', as: 'designerData' });
Proposals.belongsTo(Location, { foreignKey: 'location', targetKey: 'id', as: 'locationData' });

// New associations for scoping and ownership
UserGroup.hasMany(Customer, { foreignKey: 'group_id', as: 'customers' });
Customer.belongsTo(UserGroup, { foreignKey: 'group_id', as: 'group' });

User.hasMany(Customer, { foreignKey: 'created_by_user_id', as: 'createdCustomers' });
Customer.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'createdBy' });

UserGroup.hasMany(Proposals, { foreignKey: 'owner_group_id', as: 'proposals' });
Proposals.belongsTo(UserGroup, { foreignKey: 'owner_group_id', as: 'ownerGroup' });

// Track creator of proposals as Owner for admin displays
User.hasMany(Proposals, { foreignKey: 'created_by_user_id', as: 'createdProposals' });
Proposals.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'Owner' });

User.hasMany(Notification, { foreignKey: 'recipient_user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipient_user_id', as: 'recipient' });

// User belongs to group association
UserGroup.hasMany(User, { foreignKey: 'group_id', as: 'users' });
User.belongsTo(UserGroup, { foreignKey: 'group_id', as: 'group' });

// User belongs to role association
UserRole.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(UserRole, { foreignKey: 'role_id', as: 'userRole' });


ManufacturerCatalogData.hasMany(ManufacturerStyleCollection, {
  foreignKey: 'catalog_id',
  as: 'styleVariants', // must match your include alias
});


ManufacturerStyleCollection.belongsTo(ManufacturerCatalogData, {
  foreignKey: 'catalog_id',
  as: 'catalogItem', // optional, used if you ever include the catalog from style
});

ManufacturerAssemblyCost.belongsTo(ManufacturerCatalogData, {
  foreignKey: 'catalog_data_id',
  as: 'styleVariantsAssemblyCost', // optional, used if you ever include the catalog from style
});

ManufacturerModificationDetails.belongsTo(ManufacturerCatalogData, {
  foreignKey: 'catalog_data_id',
  as: 'styleVariantsModification', // optional, used if you ever include the catalog from style
});


ManufacturerCatalogData.hasOne(ManufacturerAssemblyCost, {
    foreignKey: 'catalogDataId',
    onDelete: 'CASCADE',
    as: 'styleVariantsAssemblyCost' // THIS MUST MATCH your include alias
});
ManufacturerCatalogData.hasMany(ManufacturerModificationDetails, {
  foreignKey: 'catalogDataId',
  onDelete: 'CASCADE',
  as: 'styleVariantsModification'
});



// ManufacturerAssemblyCost.belongsTo(ManufacturerCatalogData, { foreignKey: 'catalogDataId' });
// ManufacturerHingesDetails.belongsTo(ManufacturerCatalogData, { foreignKey: 'catalogDataId' });
// ManufacturerModificationDetails.belongsTo(ManufacturerCatalogData, { foreignKey: 'catalogDataId' });

// Proposal sessions associations
Proposals.hasMany(ProposalSession, { foreignKey: 'proposal_id', as: 'sessions' });
ProposalSession.belongsTo(Proposals, { foreignKey: 'proposal_id', as: 'proposal' });

// Orders associations
Proposals.hasOne(Order, { foreignKey: 'proposal_id', as: 'order' });
Order.belongsTo(Proposals, { foreignKey: 'proposal_id', as: 'proposal' });
Order.belongsTo(UserGroup, { foreignKey: 'owner_group_id', as: 'ownerGroup' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Order.belongsTo(Manufacturer, { foreignKey: 'manufacturer_id', as: 'manufacturer' });
Order.belongsTo(User, { foreignKey: 'accepted_by_user_id', as: 'creator' });

// Payment associations
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Payment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Contact messaging associations
ContactThread.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
User.hasMany(ContactThread, { foreignKey: 'user_id', as: 'contactThreads' });

ContactMessage.belongsTo(ContactThread, { foreignKey: 'thread_id', as: 'thread' });
ContactThread.hasMany(ContactMessage, { foreignKey: 'thread_id', as: 'messages' });

ContactMessage.belongsTo(User, { foreignKey: 'author_user_id', as: 'author' });

// Terms associations
TermsAcceptance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(TermsAcceptance, { foreignKey: 'user_id', as: 'termsAcceptances' });

// Sub-type associations
ManufacturerSubType.belongsTo(Manufacturer, { foreignKey: 'manufacturer_id', as: 'manufacturer' });
Manufacturer.hasMany(ManufacturerSubType, { foreignKey: 'manufacturer_id', as: 'subTypes' });

CatalogSubTypeAssignment.belongsTo(ManufacturerCatalogData, { foreignKey: 'catalog_data_id', as: 'catalogItem' });
CatalogSubTypeAssignment.belongsTo(ManufacturerSubType, { foreignKey: 'sub_type_id', as: 'subType' });
ManufacturerCatalogData.hasMany(CatalogSubTypeAssignment, { foreignKey: 'catalog_data_id', as: 'subTypeAssignments' });
ManufacturerSubType.hasMany(CatalogSubTypeAssignment, { foreignKey: 'sub_type_id', as: 'catalogAssignments' });

// Proposal sections and items associations
Proposals.hasMany(ProposalSection, { foreignKey: 'proposal_id', as: 'sections' });
ProposalSection.belongsTo(Proposals, { foreignKey: 'proposal_id', as: 'proposal' });

ProposalSection.hasMany(ProposalItem, { foreignKey: 'section_id', as: 'items' });
ProposalItem.belongsTo(ProposalSection, { foreignKey: 'section_id', as: 'section' });

Proposals.hasMany(ProposalItem, { foreignKey: 'proposal_id', as: 'items' });
ProposalItem.belongsTo(Proposals, { foreignKey: 'proposal_id', as: 'proposal' });

ProposalSectionItem.belongsTo(ProposalSection, { foreignKey: 'section_id', as: 'section' });
ProposalSectionItem.belongsTo(ProposalItem, { foreignKey: 'item_id', as: 'item' });

// Global modification associations
GlobalModificationTemplate.belongsTo(GlobalModificationCategory, { foreignKey: 'category_id', as: 'category' });
GlobalModificationCategory.hasMany(GlobalModificationTemplate, { foreignKey: 'category_id', as: 'templates' });

// Manufacturer multiplier associations
ManufacturerMultiplier.belongsTo(Manufacturer, { foreignKey: 'manufacturer_id', as: 'manufacturer' });
Manufacturer.hasMany(ManufacturerMultiplier, { foreignKey: 'manufacturer_id', as: 'multipliers' });


module.exports = {
    Manufacturer,
    ManufacturerCatalogData,
    User,
    Location,
    Tax,
    UserRole,
    Collection,
    Proposals,
    Order,
    Customer,
    UserGroup,
    UserGroupMultiplier,
    ManufacturerStyleCollection,
    ManufacturerTypeCollection,
    CatalogUploadBackup,
    Notification,
    ActivityLog,
    ResourceLink,
    ProposalSession,
    ContactInfo,
    ContactThread,
    ContactMessage,
    Terms,
    TermsAcceptance,
    ManufacturerSubType,
    CatalogSubTypeAssignment,
    Payment,
    PaymentConfiguration,
    // New models
    Category,
    Menu,
    Modifier,
    ProposalItem,
    ProposalSection,
    ProposalSectionItem,
    ResourceFile,
    ManufacturerMultiplier,
    GlobalModificationCategory,
    GlobalModificationTemplate,
    GlobalModificationAssignment,
    // Assembly and modification models
    ManufacturerAssemblyCost,
    ManufacturerHingesDetails,
    ManufacturerModificationDetails,
    // Additional missing models
    Categories,
    Customizations,
    GlobalModificationCategories,
    LoginCustomizations,
    ManufacturerAssemblyCosts,
    ManufacturerCatalogFiles,
    PdfCustomizations,
    Lead
};
