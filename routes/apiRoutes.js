const express = require('express');
const jwt = require('jsonwebtoken');
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
const embeddedCustomizationController = require('../controllers/embeddedCustomizationController');
const { uploadImage } = require('../controllers/uploadController');
const calenderController = require('../controllers/calenderController');
const contractorController = require('../controllers/contractorController');
const notificationController = require('../controllers/notificationController');
const resourceUpload = require('../middleware/resourceUpload');
const contactController = require('../controllers/contactController');
const termsController = require('../controllers/termsController');
const globalModsController = require('../controllers/globalModificationsController');
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

// Lightweight auth ping to roll a fresh access token without heavy payloads
router.get('/auth/ping', verifyTokenWithGroup, (req, res) => {
	try {
		const TTL = process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '8h';
		// Minimal claims; verifyTokenWithGroup will load full user per request
		const claims = {
			id: req.user?.id,
			group_id: req.user?.group_id,
			role: req.user?.role,
		};
		const next = jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: TTL });
		res.set('x-refresh-token', next);
		res.set('Access-Control-Expose-Headers', 'x-refresh-token');
		return res.status(204).end();
	} catch (e) {
		return res.status(500).json({ message: 'Auth ping error' });
	}
});

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
router.get('/manufacturers/:id/assembly-costs-by-types', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchAssemblyCostsByTypes);
router.get('/manufacturers/items/hinges/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), manufacturerController.fetchManufacturerHingesDetails);
router.get('/manufacturers/items/modifications/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), manufacturerController.fetchManufacturerItemsModification);
router.get('/manufacturers/:manufacturerId/types', verifyTokenWithGroup, validateIdParam('manufacturerId'), manufacturerController.getManufacturerTypes);

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

// Bulk edit catalog items
router.put('/manufacturers/catalog/bulk-edit', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.bulkEditCatalogItems);

// Edit style name globally
router.put('/manufacturers/:id/style-name', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), manufacturerController.editStyleName);

// Cleanup duplicates
router.post('/manufacturers/:manufacturerId/cleanup-duplicates', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.cleanupDuplicates);


router.post('/manufacturers/style/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.addManufacturerStyle);
router.get('/manufacturers/style/:catalogID', verifyTokenWithGroup, validateIdParam('catalogID'), manufacturerController.fetchManufacturerStyleById);
router.get('/manufacturers/:id/styles', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerAllStyleById);
router.get('/manufacturers/:id/styleswithcatalog', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerStylesWithCatalog);
// Lightweight styles meta for proposal step (unique styles with a representative catalog id and optional image)
router.get('/manufacturers/:id/styles-meta', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerStylesMeta);
// Items for a given style by representative catalog id, with pagination and optional includeDetails
router.get('/manufacturers/:manufacturerId/styles/:catalogId/items', verifyTokenWithGroup, validateIdParam('manufacturerId'), validateIdParam('catalogId'), manufacturerController.getItemsByStyleCatalogId);

// Type management routes
router.get('/manufacturers/:id/types-meta', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerTypesMeta);
router.post('/manufacturers/type/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.createTypeImage);
router.post('/manufacturers/type/update-meta', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.updateTypeMeta);
router.delete('/manufacturers/:manufacturerId/type/:typeName', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.deleteType);
router.post('/manufacturers/bulk-edit-types', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.bulkEditTypes);
router.post('/manufacturers/bulk-change-type', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.bulkChangeType);
router.post('/manufacturers/edit-type-name', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.editTypeName);
router.post('/manufacturers/assign-items-to-type', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.assignItemsToType);

router.get('/manufacturers/catalogs/modificationsItems/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerCatalogModificationItems);
router.post('/manufacturers/catalogs/modificationsItems/add', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.addModificationItem);

// Simple style add/delete from pictures tab
router.post('/manufacturers/:manufacturerId/styles', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.addSimpleStyle);
router.delete('/manufacturers/:manufacturerId/styles/:styleName', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.deleteSimpleStyle);






// Global Modifications (admin only)
router.get('/global-mods/gallery', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getGallery);
router.post('/global-mods/gallery/:blueprintId/use-here', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('blueprintId'), sanitizeBodyStrings(), globalModsController.useBlueprint);
router.get('/global-mods/manufacturer/:manufacturerId/mods', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), globalModsController.getManufacturerMods);
router.get('/global-mods/categories', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getCategories);
router.get('/global-mods/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getAssignments);
router.post('/global-mods/categories', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createCategory);
router.put('/global-mods/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateCategory);
router.patch('/global-mods/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateCategory);
router.delete('/global-mods/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteCategory);
router.post('/global-mods/categories/:fromId/merge-into/:toId', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('fromId'), validateIdParam('toId'), globalModsController.mergeCategories);
router.patch('/global-mods/templates/:id/reassign-category', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.reassignTemplateCategory);
router.post('/global-mods/templates', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createTemplate);
router.put('/global-mods/templates/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateTemplate);
router.delete('/global-mods/templates/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteTemplate);
router.post('/global-mods/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createAssignment);
router.delete('/global-mods/assignments/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteAssignment);
// Allow all authenticated users (admins, contractors) to read applicable item assignments
router.get('/global-mods/item/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), globalModsController.getItemAssignments);

// API v1 aliases for Global Modifications (mirror of /global-mods)
router.get('/v1/modifications/gallery', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getGallery);
router.post('/v1/modifications/gallery/:blueprintId/use-here', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('blueprintId'), sanitizeBodyStrings(), globalModsController.useBlueprint);
router.get('/v1/modifications/manufacturer/:manufacturerId/mods', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), globalModsController.getManufacturerMods);
router.get('/v1/modifications/categories', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getCategories);
router.get('/v1/modifications/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getAssignments);
router.post('/v1/modifications/categories', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createCategory);
router.put('/v1/modifications/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateCategory);
router.patch('/v1/modifications/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateCategory);
router.delete('/v1/modifications/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteCategory);
router.post('/v1/modifications/categories/:fromId/merge-into/:toId', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('fromId'), validateIdParam('toId'), globalModsController.mergeCategories);
router.patch('/v1/modifications/templates/:id/reassign-category', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.reassignTemplateCategory);
router.post('/v1/modifications/templates', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createTemplate);
router.put('/v1/modifications/templates/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateTemplate);
router.delete('/v1/modifications/templates/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteTemplate);
router.post('/v1/modifications/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createAssignment);
router.delete('/v1/modifications/assignments/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteAssignment);
router.get('/v1/modifications/item/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), globalModsController.getItemAssignments);

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

// Quote routes (aliases for proposals with new naming)
router.get('/get-quotes', verifyTokenWithGroup, proposalsController.getProposal);
router.get('/quotes', verifyTokenWithGroup, proposalsController.getProposal);
router.post('/create-quotes', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), proposalsController.saveProposal);
router.delete('/delete-quotes/:id', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), proposalsController.deleteProposals);
router.get('/quotes/proposalByID/:id', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalsController.getProposalById);
router.post('/update-quotes', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals', idParam: 'id', allowCreate: false, idFromBody: true }), sanitizeBodyStrings(), proposalsController.updateProposal);
router.put('/quotes/:id/status', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalsController.updateProposalStatus);
router.post('/quotes/:id/accept', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), rateLimitAccept, proposalsController.acceptProposal);
router.get('/quotes/:id/admin-details', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalsController.getProposalAdminDetails);
router.post('/quotes/:id/sessions', verifyTokenWithGroup, enforceGroupScoping({ resourceType: 'proposals' }), validateIdParam('id'), proposalSessionController.createSession);
router.get('/public/quotes/by-token/:token', proposalsController.getProposalPublicByToken);
router.post('/public/quotes/:id/accept', validateIdParam('id'), proposalsController.acceptProposal);

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

// Orders (read-only for now)
const ordersController = require('../controllers/ordersController');
router.get('/orders', verifyTokenWithGroup, ordersController.listOrders);
router.get('/orders/:id', verifyTokenWithGroup, validateIdParam('id'), ordersController.getOrder);

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

router.get('/dashboard/counts', verifyTokenWithGroup, proposalsController.getCounts);
router.get('/dashboard/latest-proposals', verifyTokenWithGroup, proposalsController.getLatestProposals);


// Resources CRUD routes
router.get('/resources', verifyTokenWithGroup, resourcesController.getResources); // Contractor-scoped endpoint
router.get('/resources/links', verifyTokenWithGroup, resourcesController.getLinks);
router.post('/resources/links', verifyTokenWithGroup, resourcesController.saveLink);
router.put('/resources/links/:id', verifyTokenWithGroup, resourcesController.updateLink);
router.delete('/resources/links/:id', verifyTokenWithGroup, resourcesController.deleteLink);

router.get('/resources/files', verifyTokenWithGroup, resourcesController.getFiles);
router.post('/resources/files', verifyTokenWithGroup, resourceUpload.single('file'), resourcesController.saveFile);
router.put('/resources/files/:id', verifyTokenWithGroup, resourceUpload.single('file'), resourcesController.updateFile);
router.delete('/resources/files/:id', verifyTokenWithGroup, resourcesController.deleteFile);
router.get('/resources/files/download/:id', resourcesController.downloadFile);

// Dynamic embedded customization fetch (avoids needing a rebuild for color/logo changes)
router.get('/customization/embedded', embeddedCustomizationController.getEmbedded);

// Upload images for sample images and category cards (admin only)
router.post('/global-mods/upload/image', verifyTokenWithGroup, requirePermission('admin:manufacturers'), upload.imageUpload.single('logoImage'), uploadImage);

router.get('/calendar-events', calenderController.fetchEvents);

// Contact Info & Messaging
router.get('/contact/info', verifyTokenWithGroup, contactController.getContactInfo);
router.put('/contact/info', verifyTokenWithGroup, requirePermission('admin:settings'), sanitizeBodyStrings(), contactController.saveContactInfo);

router.post('/contact/threads', verifyTokenWithGroup, sanitizeBodyStrings(), contactController.createThread);
router.get('/contact/threads', verifyTokenWithGroup, contactController.listThreads);
router.get('/contact/threads/:id', verifyTokenWithGroup, validateIdParam('id'), contactController.getThread);
router.post('/contact/threads/:id/messages', verifyTokenWithGroup, validateIdParam('id'), sanitizeBodyStrings(), contactController.postMessage);
router.post('/contact/threads/:id/read', verifyTokenWithGroup, validateIdParam('id'), contactController.markRead);
router.post('/contact/threads/:id/close', verifyTokenWithGroup, validateIdParam('id'), contactController.closeThread);

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

// Terms & Conditions
router.get('/terms/latest', verifyTokenWithGroup, termsController.getLatestTerms);
// Allow very long terms content without truncation
router.post('/terms', verifyTokenWithGroup, requirePermission('admin:settings'), sanitizeBodyStrings(2000000), termsController.saveTerms);
router.get('/terms/acceptance', verifyTokenWithGroup, requirePermission('admin:users'), termsController.getAcceptanceStatus);
router.post('/terms/accept', verifyTokenWithGroup, termsController.acceptLatest);

// Sub-type management routes (admin only)
const subTypeController = require('../controllers/subTypeController');
router.get('/manufacturers/:manufacturerId/sub-types', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), subTypeController.getSubTypes);
router.post('/manufacturers/:manufacturerId/sub-types', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), sanitizeBodyStrings(), subTypeController.createSubType);
router.put('/sub-types/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), subTypeController.updateSubType);
router.delete('/sub-types/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), subTypeController.deleteSubType);
router.post('/sub-types/:subTypeId/assign-items', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('subTypeId'), sanitizeBodyStrings(), subTypeController.assignCatalogItems);
router.get('/sub-types/:subTypeId/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('subTypeId'), subTypeController.getSubTypeAssignments);
router.post('/sub-types/validate-requirements', verifyTokenWithGroup, sanitizeBodyStrings(), subTypeController.validateSubTypeRequirements);
router.post('/catalog-items/requirements', verifyTokenWithGroup, sanitizeBodyStrings(), subTypeController.getCatalogItemRequirements);


module.exports = router;
