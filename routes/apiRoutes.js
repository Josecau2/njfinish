const express = require('express');
const customerController = require('../controllers/customerController');
const authController = require('../controllers/authController');
const manufacturerController = require('../controllers/manufacturerController');
const multiManufacturerController = require('../controllers/manufacturerMultiplierController');
const locationController = require('../controllers/locationController');
const taxesController = require('../controllers/taxController');
const collectionsController = require('../controllers/collections');
const proposalsController = require('../controllers/proposalsController');
const userGroupController = require('../controllers/userGroupController');
const customizationController = require('../controllers/customizationController');
const upload = require('../middleware/upload');
const emailController = require('../controllers/emailController');
const loginCustomizationController = require('../controllers/loginCustomizationController');
const resourcesController = require('../controllers/resourcesController');
const calenderController = require('../controllers/calenderController');

// You can import other controllers here too

const router = express.Router();

// Auth route
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// All customer-related routes
router.get('/customers', customerController.fetchCustomer);
router.get('/customers/:id', customerController.fetchSingleCustomer);
router.post('/customers/add', customerController.addCustomer);
router.delete('/customers/delete/:id', customerController.deleteCustomer);
router.put('/customers/update/:id', customerController.updateCustomer);

// Manufacturer CRUD routes
router.post('/manufacturers/create', manufacturerController.addManufacturer);
router.get('/manufacturers', manufacturerController.fetchManufacturer);
router.put('/manufacturers/status/:id', manufacturerController.updateManufacturerStatus);
router.get('/manufacturers/:id', manufacturerController.fetchManufacturerById);
router.put('/manufacturers/:id/update', manufacturerController.updateManufacturer);


router.get('/manufacturers/assemblycost/:id', manufacturerController.fetchManufacturerAssemblyCostDetails);
router.get('/manufacturers/items/hinges/:catalogDataId', manufacturerController.fetchManufacturerHingesDetails);
router.get('/manufacturers/items/modifications/:catalogDataId', manufacturerController.fetchManufacturerItemsModification);

router.post('/manufacturers/items/assembly-cost', manufacturerController.saveAssemblyCost);
router.post('/manufacturers/items/hinges', manufacturerController.saveHingesDetails);
router.post('/manufacturers/items/modifications', manufacturerController.saveModificationDetails);

router.post('/manufacturers/catalog/:manufacturerId', manufacturerController.saveManualCabinetItem);
router.put('/manufacturers/catalog/edit/:id', manufacturerController.editManualCabinetItem);
// Catalog file upload (CSV/Excel) for existing manufacturer
router.post('/manufacturers/:manufacturerId/catalog/upload', manufacturerController.uploadCatalogFile);


router.post('/manufacturers/style/create', manufacturerController.addManufacturerStyle);
router.get('/manufacturers/style/:catalogID', manufacturerController.fetchManufacturerStyleById);
router.get('/manufacturers/:id/styles', manufacturerController.fetchManufacturerAllStyleById);
router.get('/manufacturers/:id/styleswithcatalog', manufacturerController.fetchManufacturerStylesWithCatalog);

router.get('/manufacturers/catalogs/modificationsItems/:id', manufacturerController.fetchManufacturerCatalogModificationItems);
router.post('/manufacturers/catalogs/modificationsItems/add', manufacturerController.addModificationItem);







// Multi Manufacturer routes
router.get('/multi-manufacturer', multiManufacturerController.getAllMultiManufacturers);
router.put('/multi-manufacturer/:id', multiManufacturerController.updateMultiManufacturer);

// User CRUD routes
router.get('/users', authController.fetchUsers);
router.get('/users/:id', authController.fetchSingleUser);
router.post('/users', authController.addUser);
router.delete('/users/:id', authController.deleteUser);
router.put('/users/:id', authController.updateUser);
router.get('/user-role/:userId', authController.getUserRole);

// User Group CRUD routes
router.get('/usersgroups', userGroupController.fetchUsers);
router.get('/usersgroups/:id', userGroupController.fetchSingleUser);
router.post('/usersgroups', userGroupController.addUser);
router.delete('/usersgroups/:id', userGroupController.deleteUser);
router.put('/usersgroups/:id', userGroupController.updateUser);

//usergroup Multiplier

router.get('/usersgroupsmultiplier', userGroupController.fetchUsersGroupMultiplier);
// router.put('/usersgroupsmultiplier/:id', userGroupController.updateUsersGroupMultiplier);


// Locations CRUD routes
router.get('/locations', locationController.fetchLocations);
router.get('/locations/:id', locationController.fetchSingleLocation);
router.post('/locations', locationController.addLocation);
router.delete('/locations/:id', locationController.deleteLocation);
router.put('/locations/:id', locationController.updateLocation);

// Tax CRUD routes
router.get('/taxes', taxesController.getTaxes);
router.post('/taxes', taxesController.addTax);
router.delete('/taxes/:id', taxesController.deleteTax);
router.put('/taxes/:id', taxesController.setDefaultTax);

// Collections CRUD routes
router.get('/collections', collectionsController.fetchCollection);
router.post('/collections', collectionsController.addCollection);
router.delete('/collections/:id', collectionsController.deleteCollection);
router.put('/collections/:id', collectionsController.updateCollection);
router.get('/collections/:id', collectionsController.fetchCollectionById);
router.post('/bulk-collections', collectionsController.addBulkCollection);



// Proposals CRUD routes
router.get('/get-proposals', proposalsController.getProposal);
router.post('/create-proposals', proposalsController.saveProposal);
router.delete('/delete-proposals/:id', proposalsController.deleteProposals);
router.get('/proposals/proposalByID/:id', proposalsController.getProposalById);
router.post('/update-proposals', proposalsController.updateProposal);
// router.put('/update-proposals/:id', proposalsController.setDefaultTax);

// Contracts CRUD routes
router.get('/get-contracts', proposalsController.getContracts);

// Example placeholder for future routes:
// router.get('/orders', orderController.getOrders);

router.get('/settings/customization', customizationController.getCustomization)
router.post('/settings/customization', upload.single('logoImage'), customizationController.saveCustomization)

router.post('/settings/customization/pdf', upload.single('logo'), customizationController.saveCustomizationpdf)
router.get('/settings/customization/pdf', customizationController.getCustomizationpdf)
router.delete('/settings/customization/logo', customizationController.getCustomizationdeletelogo)
router.post('/generate-pdf', customizationController.generatepdf)



router.post('/proposals/send-email', emailController.sendProposalEmail);


//fetch desinger
router.get('/designers', userGroupController.getDesingers);

router.post('/login-customization', loginCustomizationController.saveCustomization);
router.get('/login-customization', loginCustomizationController.getCustomization);

router.get('/dashboard/counts', proposalsController.getCounts);
router.get('/dashboard/latest-proposals', proposalsController.getLatestProposals);


// Resources CRUD routes
router.get('/resources/links', resourcesController.getLinks);
router.post('/resources/links', resourcesController.saveLink);
router.put('/resources/links/:id', resourcesController.updateLink);
router.delete('/resources/links/:id', resourcesController.deleteLink);

router.get('/resources/files', resourcesController.getFiles);
router.post('/resources/files', upload.single('file'), resourcesController.saveFile);
router.put('/resources/files/:id', upload.single('file'), resourcesController.updateFile);
router.delete('/resources/files/:id', resourcesController.deleteFile);
router.get('/resources/files/download/:id', resourcesController.downloadFile);

router.get('/calendar-events', calenderController.fetchEvents);







module.exports = router;
    