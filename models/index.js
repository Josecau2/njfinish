const ManufacturerCatalogData = require('./manufacturerCatalogData');
const { Manufacturer } = require('./Manufacturers');
const User = require('./User');
const UserGroup = require('./UserGroup');
const Location = require('./Location');
const Tax = require('./Taxes');
const UserRole = require('./UserRole');
const Collection = require('./Collection');
const Proposals = require('./Proposals');
const Customer = require('./Customer');
const UserGroupMultiplier = require('./UserGroupMultiplier');
const {ManufacturerCatalogFile} = require('./ManufacturerCatalogFile');
const ManufacturerStyleCollection = require('./ManufacturerStyleCollection');

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
    ManufacturerStyleCollection
};
