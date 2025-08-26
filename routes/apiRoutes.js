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
const contractorController = require('../controllers/contractorController');
const notificationController = require('../controllers/notificationController');
const resourceUpload = require('../middleware/resourceUpload');
const { fullAccessControl, requirePermission } = require('../middleware/accessControl');
const { verifyTokenWithGroup, enforceGroupScoping } = require('../middleware/auth');
const { rateLimitAccept } = require('../middleware/rateLimiter');
const { validateIdParam, sanitizeBodyStrings } = require('../middleware/validators');
const proposalSessionController = require('../controllers/proposalSessionController');

// You can import other controllers here too

const router = express.Router();

// Auth route
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Current user (self) profile routes - available to any authenticated user
router.get('/me', verifyTokenWithGroup, authController.getCurrentUser);
router.put('/me', verifyTokenWithGroup, sanitizeBodyStrings(), authController.updateCurrentUser);

// All customer-related routes
router.get('/customers', verifyTokenWithGroup, requirePermission('customers:read'), customerController.fetchCustomer);
router.get('/customers/:id', verifyTokenWithGroup, requirePermission('customers:read'), enforceGroupScoping({ resourceType: 'customers' }), validateIdParam('id'), customerController.fetchSingleCustomer);
router.post('/customers/add', verifyTokenWithGroup, requirePermission('customers:create'), enforceGroupScoping({ resourceType: 'customers' }), sanitizeBodyStrings(), customerController.addCustomer);
router.delete('/customers/delete/:id', verifyTokenWithGroup, requirePermission('customers:delete'), enforceGroupScoping({ resourceType: 'customers' }), validateIdParam('id'), customerController.deleteCustomer);
router.put('/customers/update/:id', verifyTokenWithGroup, requirePermission('customers:update'), enforceGroupScoping({ resourceType: 'customers' }), validateIdParam('id'), sanitizeBodyStrings(), customerController.updateCustomer);

// Manufacturer CRUD routes - Read access for all authenticated users, admin only for modifications
router.post('/manufacturers/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.addManufacturer);
router.get('/manufacturers', verifyTokenWithGroup, manufacturerController.fetchManufacturer);
router.put('/manufacturers/status/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), manufacturerController.updateManufacturerStatus);
router.get('/manufacturers/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerById);
router.put('/manufacturers/:id/update', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), manufacturerController.updateManufacturer);


router.get('/manufacturers/assemblycost/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerAssemblyCostDetails);
router.get('/manufacturers/items/hinges/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), manufacturerController.fetchManufacturerHingesDetails);
router.get('/manufacturers/items/modifications/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), manufacturerController.fetchManufacturerItemsModification);

router.post('/manufacturers/items/assembly-cost', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.saveAssemblyCost);
router.post('/manufacturers/items/hinges', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.saveHingesDetails);
router.post('/manufacturers/items/modifications', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.saveModificationDetails);

router.post('/manufacturers/catalog/:manufacturerId', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), sanitizeBodyStrings(), manufacturerController.saveManualCabinetItem);
router.put('/manufacturers/catalog/edit/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), manufacturerController.editManualCabinetItem);
router.delete('/manufacturers/catalog/edit/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), manufacturerController.deleteManualCabinetItem);
// Catalog file upload (CSV/Excel) for existing manufacturer
router.post('/manufacturers/:manufacturerId/catalog/upload', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.uploadCatalogFile);

// Paginated catalog fetch
router.get('/manufacturers/:manufacturerId/catalog', verifyTokenWithGroup, validateIdParam('manufacturerId'), manufacturerController.getManufacturerCatalog);

// Rollback capabilities
router.get('/manufacturers/:manufacturerId/catalog/backups', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.getCatalogUploadBackups);
router.post('/manufacturers/:manufacturerId/catalog/rollback', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), sanitizeBodyStrings(), manufacturerController.rollbackCatalogUpload);
router.delete('/manufacturers/:manufacturerId/catalog/cleanup-backups', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.cleanupOldBackups);

// Delete/merge style
router.delete('/manufacturers/:manufacturerId/style/:styleName', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.deleteStyle);

// Cleanup duplicates
router.post('/manufacturers/:manufacturerId/cleanup-duplicates', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.cleanupDuplicates);


router.post('/manufacturers/style/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.addManufacturerStyle);
router.get('/manufacturers/style/:catalogID', verifyTokenWithGroup, validateIdParam('catalogID'), manufacturerController.fetchManufacturerStyleById);
router.get('/manufacturers/:id/styles', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerAllStyleById);
router.get('/manufacturers/:id/styleswithcatalog', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerStylesWithCatalog);

router.get('/manufacturers/catalogs/modificationsItems/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerCatalogModificationItems);
router.post('/manufacturers/catalogs/modificationsItems/add', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.addModificationItem);







// Multi Manufacturer routes
router.get('/multi-manufacturer', multiManufacturerController.getAllMultiManufacturers);
router.post('/multi-manufacturer', multiManufacturerController.createMultiManufacturer);
router.put('/multi-manufacturer/:id', validateIdParam('id'), sanitizeBodyStrings(), multiManufacturerController.updateMultiManufacturer);

// User CRUD routes - ADMIN ONLY (contractors should not access)
router.get('/users', verifyTokenWithGroup, requirePermission('admin:users'), authController.fetchUsers);
router.get('/users/:id', verifyTokenWithGroup, requirePermission('admin:users'), validateIdParam('id'), authController.fetchSingleUser);
router.post('/users', verifyTokenWithGroup, requirePermission('admin:users'), sanitizeBodyStrings(), authController.addUser);
router.delete('/users/:id', verifyTokenWithGroup, requirePermission('admin:users'), validateIdParam('id'), authController.deleteUser);
router.put('/users/:id', verifyTokenWithGroup, requirePermission('admin:users'), validateIdParam('id'), sanitizeBodyStrings(), authController.updateUser);
router.get('/user-role/:userId', verifyTokenWithGroup, requirePermission('admin:users'), authController.getUserRole);

// User Group CRUD routes - ADMIN ONLY
router.get('/usersgroups', verifyTokenWithGroup, requirePermission('admin:groups'), userGroupController.fetchUsers);
router.get('/usersgroups/:id', verifyTokenWithGroup, requirePermission('admin:groups'), validateIdParam('id'), userGroupController.fetchSingleUser);
router.post('/usersgroups', verifyTokenWithGroup, requirePermission('admin:groups'), sanitizeBodyStrings(), userGroupController.addUser);
router.delete('/usersgroups/:id', verifyTokenWithGroup, requirePermission('admin:groups'), validateIdParam('id'), userGroupController.deleteUser);
router.put('/usersgroups/:id', verifyTokenWithGroup, requirePermission('admin:groups'), validateIdParam('id'), sanitizeBodyStrings(), userGroupController.updateUser);

//usergroup Multiplier - ADMIN ONLY
router.get('/usersgroupsmultiplier', verifyTokenWithGroup, requirePermission('admin:groups'), userGroupController.fetchUsersGroupMultiplier);
// router.put('/usersgroupsmultiplier/:id', userGroupController.updateUsersGroupMultiplier);

// Get current user's group multiplier (for pricing)
router.get('/user/multiplier', verifyTokenWithGroup, userGroupController.getCurrentUserMultiplier);


// Locations CRUD routes
router.get('/locations', locationController.fetchLocations);
router.get('/locations/:id', validateIdParam('id'), locationController.fetchSingleLocation);
router.post('/locations', sanitizeBodyStrings(), locationController.addLocation);
router.delete('/locations/:id', validateIdParam('id'), locationController.deleteLocation);
router.put('/locations/:id', validateIdParam('id'), sanitizeBodyStrings(), locationController.updateLocation);

// Tax CRUD routes
router.get('/taxes', taxesController.getTaxes);
router.post('/taxes', taxesController.addTax);
router.delete('/taxes/:id', validateIdParam('id'), taxesController.deleteTax);
router.put('/taxes/:id', validateIdParam('id'), taxesController.setDefaultTax);

// Collections CRUD routes
router.get('/collections', collectionsController.fetchCollection);
router.post('/collections', collectionsController.addCollection);
router.delete('/collections/:id', validateIdParam('id'), collectionsController.deleteCollection);
router.put('/collections/:id', validateIdParam('id'), sanitizeBodyStrings(), collectionsController.updateCollection);
router.get('/collections/:id', validateIdParam('id'), collectionsController.fetchCollectionById);
router.post('/bulk-collections', collectionsController.addBulkCollection);



// Proposals CRUD routes
router.get('/get-proposals', verifyTokenWithGroup, proposalsController.getProposal);
router.get('/proposals', verifyTokenWithGroup, proposalsController.getProposal); // Standardized route
router.post('/create-proposals', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), proposalsController.saveProposal);
router.delete('/delete-proposals/:id', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), proposalsController.deleteProposals);
router.get('/proposals/proposalByID/:id', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalsController.getProposalById);
router.post('/update-proposals', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals', idParam: 'id', allowCreate: false, idFromBody: true }), sanitizeBodyStrings(), proposalsController.updateProposal);
router.put('/proposals/:id/status', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalsController.updateProposalStatus);
router.post('/proposals/:id/accept', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), rateLimitAccept, proposalsController.acceptProposal);
router.get('/proposals/:id/admin-details', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalsController.getProposalAdminDetails); // Admin read-only view
// Create a tokenized public session for a proposal (contractor/admin only)
router.post('/proposals/:id/sessions', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalSessionController.createSession);
// Public tokenized routes (no auth). View by token and accept with session_token in body.
router.get('/public/proposals/by-token/:token', proposalsController.getProposalPublicByToken);
router.post('/public/proposals/:id/accept', validateIdParam('id'), proposalsController.acceptProposal);
// router.put('/update-proposals/:id', proposalsController.setDefaultTax);

// Contracts route - block contractors entirely
router.get(
	'/get-contracts',
	verifyTokenWithGroup,
	(req, res, next) => {
		try {
			if (req.user?.group?.group_type === 'contractor') {
				return res.status(403).json({ message: 'Forbidden: contractors cannot access contracts' });
			}
			next();
		} catch (e) {
			return res.status(403).json({ message: 'Forbidden' });
		}
	},
	proposalsController.getContracts
);

// Example placeholder for future routes:
// router.get('/orders', orderController.getOrders);

router.get('/settings/customization', customizationController.getCustomization)
router.post('/settings/customization', upload.single('logoImage'), customizationController.saveCustomization)

router.post('/settings/customization/pdf', upload.single('logo'), customizationController.saveCustomizationpdf)
router.get('/settings/customization/pdf', customizationController.getCustomizationpdf)
router.delete('/settings/customization/logo', customizationController.getCustomizationdeletelogo)
router.post('/generate-pdf', customizationController.generatepdf)



router.post('/proposals/send-email', sanitizeBodyStrings(), emailController.sendProposalEmail);


//fetch desinger
router.get('/designers', userGroupController.getDesingers);

// Login page customization
// Public GET so unauthenticated users (and contractors) can load the admin-defined branding on the login screen
router.get('/login-customization', loginCustomizationController.getCustomization);
// Admin-only save endpoint
router.post('/login-customization', verifyTokenWithGroup, requirePermission('admin:settings'), loginCustomizationController.saveCustomization);

router.get('/dashboard/counts', proposalsController.getCounts);
router.get('/dashboard/latest-proposals', proposalsController.getLatestProposals);


// Resources CRUD routes
router.get('/resources', verifyTokenWithGroup, resourcesController.getResources); // Contractor-scoped endpoint
router.get('/resources/links', resourcesController.getLinks);
router.post('/resources/links', resourcesController.saveLink);
router.put('/resources/links/:id', resourcesController.updateLink);
router.delete('/resources/links/:id', resourcesController.deleteLink);

router.get('/resources/files', resourcesController.getFiles);
router.post('/resources/files', resourceUpload.single('file'), resourcesController.saveFile);
router.put('/resources/files/:id', resourceUpload.single('file'), resourcesController.updateFile);
router.delete('/resources/files/:id', resourcesController.deleteFile);
router.get('/resources/files/download/:id', resourcesController.downloadFile);

router.get('/calendar-events', calenderController.fetchEvents);

// Contractor routes (admin only)
router.get('/contractors', ...fullAccessControl, requirePermission('contractors:read'), contractorController.fetchContractors);
router.get('/contractors/:groupId', ...fullAccessControl, requirePermission('contractors:read'), validateIdParam('groupId'), contractorController.fetchContractor);
router.get('/contractors/:groupId/proposals', ...fullAccessControl, requirePermission('contractors:read'), validateIdParam('groupId'), contractorController.fetchContractorProposals);
router.get('/contractors/:groupId/customers', ...fullAccessControl, requirePermission('contractors:read'), validateIdParam('groupId'), contractorController.fetchContractorCustomers);
router.get('/proposals/:proposalId/details', ...fullAccessControl, requirePermission('contractors:read'), validateIdParam('proposalId'), contractorController.fetchProposalDetails);

// Notification routes (authenticated users)
router.get('/notifications', verifyTokenWithGroup, notificationController.getNotifications);
router.get('/notifications/unread-count', verifyTokenWithGroup, notificationController.getUnreadCount);
router.post('/notifications/:id/read', verifyTokenWithGroup, validateIdParam('id'), notificationController.markAsRead);
router.post('/notifications/mark-all-read', verifyTokenWithGroup, notificationController.markAllAsRead);


module.exports = router;
    