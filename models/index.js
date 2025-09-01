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

const ManufacturerAssemblyCost = require('./ManufacturerAssemblyCost');
const ManufacturerHingesDetails = require('./ManufacturerHingesDetails');
const ManufacturerModificationDetails = require('./ManufacturerModificationDetails');

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

// Contact messaging associations
ContactThread.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
User.hasMany(ContactThread, { foreignKey: 'user_id', as: 'contactThreads' });

ContactMessage.belongsTo(ContactThread, { foreignKey: 'thread_id', as: 'thread' });
ContactThread.hasMany(ContactMessage, { foreignKey: 'thread_id', as: 'messages' });

ContactMessage.belongsTo(User, { foreignKey: 'author_user_id', as: 'author' });

// Terms associations
TermsAcceptance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(TermsAcceptance, { foreignKey: 'user_id', as: 'termsAcceptances' });


module.exports = {
    Manufacturer,
    ManufacturerCatalogData,
    User,
    Location,
    Tax,
    UserRole,
    Collection,
    Proposals,
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
  TermsAcceptance
};
