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
const { uploadImage } = require('../controllers/uploadController');
const calenderController = require('../controllers/calenderController');
const contractorController = require('../controllers/contractorController');
const notificationController = require('../controllers/notificationController');
const resourceUpload = require('../middleware/resourceUpload');
const contactController = require('../controllers/contactController');
const leadController = require('../controllers/leadController');
const termsController = require('../controllers/termsController');
const globalModsController = require('../controllers/globalModificationsController');
const { fullAccessControl, requirePermission, requireAnyPermission, attachPermissions } = require('../middleware/accessControl');
const { PERMISSIONS } = require('../constants/permissions');
const { verifyTokenWithGroup, enforceGroupScoping, attachTokenFromQuery } = require('../middleware/auth');
const { createRateLimiter, rateLimitAccept } = require('../middleware/rateLimiter');
const { validateIdParam, sanitizeBodyStrings } = require('../middleware/validators');
const proposalSessionController = require('../controllers/proposalSessionController');
const { regenerateBrandSnapshot } = require('../server/branding/regenerateBrandSnapshot');
const fs = require('fs');
const path = require('path');
const { JSON_PATH } = require('../server/branding/materializeBranding');

// You can import other controllers here too

const router = express.Router();

const requestAccessLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5,
	keyGenerator: (req) => `request-access:${req.ip}`
});

// Rate limiter to prevent abuse of the proposal email endpoint
const proposalEmailLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10,
	// Prefer user-scoped limiting; fallback to IP if unauthenticated
	keyGenerator: (req) => `proposal-email:${req.user?.id || req.ip}`,
});

// Auth routes are now centralized in /api/auth/* - see routes/authRoutes.js
// Auth rate limiters have been moved to routes/authRoutes.js
// Removed duplicate routes to prevent rate limit bypass vulnerability
router.post('/request-access', requestAccessLimiter, sanitizeBodyStrings(5000), leadController.submitLead);
router.get('/admin/leads', verifyTokenWithGroup, requirePermission('admin:leads'), leadController.listLeads);
router.patch('/admin/leads/:id', verifyTokenWithGroup, requirePermission('admin:leads'), validateIdParam('id'), sanitizeBodyStrings(5000), leadController.updateLead);
router.put('/admin/leads/:id', verifyTokenWithGroup, requirePermission('admin:leads'), validateIdParam('id'), sanitizeBodyStrings(5000), leadController.updateLead);

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
		const next = jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: TTL, algorithm: 'HS256' });
		res.set('x-refresh-token', next);
		res.set('Access-Control-Expose-Headers', 'x-refresh-token');
		return res.status(204).end();
	} catch (e) {
		return res.status(500).json({ message: 'Auth ping error' });
	}
});

// Current user (self) profile routes - available to any authenticated user

/**
 * @openapi
 * /api/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', verifyTokenWithGroup, authController.getCurrentUser);

/**
 * @openapi
 * /api/me:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/me', verifyTokenWithGroup, sanitizeBodyStrings(), authController.updateCurrentUser);

// All customer-related routes

/**
 * @openapi
 * /api/customers:
 *   get:
 *     tags:
 *       - Customers
 *     summary: List all customers
 *     description: Retrieve a list of all customers (requires customers:read permission)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name or email
 *     responses:
 *       200:
 *         description: List of customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/customers', verifyTokenWithGroup, requirePermission('customers:read'), customerController.fetchCustomer);

/**
 * @openapi
 * /api/customers/{id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer by ID
 *     description: Retrieve a single customer by ID (requires customers:read permission)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/customers/:id', verifyTokenWithGroup, requirePermission('customers:read'), enforceGroupScoping({ resourceType: 'customers' }), validateIdParam('id'), customerController.fetchSingleCustomer);

/**
 * @openapi
 * /api/customers/add:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a new customer
 *     description: Add a new customer to the system (requires customers:create permission)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zip:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/customers/add', verifyTokenWithGroup, requirePermission('customers:create'), enforceGroupScoping({ resourceType: 'customers' }), sanitizeBodyStrings(), customerController.addCustomer);

/**
 * @openapi
 * /api/customers/delete/{id}:
 *   delete:
 *     tags:
 *       - Customers
 *     summary: Delete a customer
 *     description: Delete a customer by ID (requires customers:delete permission)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/customers/delete/:id', verifyTokenWithGroup, requirePermission('customers:delete'), enforceGroupScoping({ resourceType: 'customers' }), validateIdParam('id'), customerController.deleteCustomer);

/**
 * @openapi
 * /api/customers/update/{id}:
 *   put:
 *     tags:
 *       - Customers
 *     summary: Update a customer
 *     description: Update customer information by ID (requires customers:update permission)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zip:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/customers/update/:id', verifyTokenWithGroup, requirePermission('customers:update'), enforceGroupScoping({ resourceType: 'customers' }), validateIdParam('id'), sanitizeBodyStrings(), customerController.updateCustomer);

// Manufacturer CRUD routes - Read access for all authenticated users, admin only for modifications

/**
 * @openapi
 * /api/manufacturers/create:
 *   post:
 *     tags:
 *       - Manufacturers
 *     summary: Create a new manufacturer
 *     description: Add a new manufacturer (requires admin:manufacturers permission)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *               logo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Manufacturer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Manufacturer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.addManufacturer);

/**
 * @openapi
 * /api/manufacturers:
 *   get:
 *     tags:
 *       - Manufacturers
 *     summary: List all manufacturers
 *     description: Retrieve a list of all manufacturers (available to all authenticated users)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by manufacturer status
 *     responses:
 *       200:
 *         description: List of manufacturers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Manufacturer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/manufacturers', verifyTokenWithGroup, manufacturerController.fetchManufacturer);

/**
 * @openapi
 * /api/manufacturers/status/{id}:
 *   put:
 *     tags:
 *       - Manufacturers
 *     summary: Update manufacturer status
 *     description: Change the status of a manufacturer (requires admin:manufacturers permission)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Manufacturer status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/manufacturers/status/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), manufacturerController.updateManufacturerStatus);

/**
 * @openapi
 * /api/manufacturers/{id}:
 *   get:
 *     tags:
 *       - Manufacturers
 *     summary: Get manufacturer by ID
 *     description: Retrieve a single manufacturer by ID (available to all authenticated users)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Manufacturer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Manufacturer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerById);

/**
 * @openapi
 * /api/manufacturers/{id}/update:
 *   put:
 *     tags:
 *       - Manufacturers
 *     summary: Update a manufacturer
 *     description: Update manufacturer information by ID (requires admin:manufacturers permission)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *               logo:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Manufacturer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Manufacturer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @openapi
 * /api/global-mods/gallery:
 *   get:
 *     tags:
 *       - Global Modifications
 *     summary: Get global modifications blueprint gallery
 *     description: Retrieve all blueprint templates from other manufacturers that can be imported into the current manufacturer (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blueprint gallery retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 blueprints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       manufacturerId:
 *                         type: integer
 *                       manufacturerName:
 *                         type: string
 *                       templateCount:
 *                         type: integer
 *                       categoryCount:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/global-mods/gallery', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getGallery);

/**
 * @openapi
 * /api/global-mods/gallery/{blueprintId}/use-here:
 *   post:
 *     tags:
 *       - Global Modifications
 *     summary: Import blueprint from gallery
 *     description: Import a blueprint (all categories and templates) from another manufacturer into the specified manufacturer (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blueprintId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Source manufacturer ID to import blueprint from
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetManufacturerId
 *             properties:
 *               targetManufacturerId:
 *                 type: integer
 *                 description: Target manufacturer ID to import blueprint into
 *     responses:
 *       200:
 *         description: Blueprint imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categoriesCreated:
 *                   type: integer
 *                 templatesCreated:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/global-mods/gallery/:blueprintId/use-here', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('blueprintId'), sanitizeBodyStrings(), globalModsController.useBlueprint);

/**
 * @openapi
 * /api/global-mods/manufacturer/{manufacturerId}/mods:
 *   get:
 *     tags:
 *       - Global Modifications
 *     summary: Get all global modifications for a manufacturer
 *     description: Retrieve all global modification templates, categories, and assignments for a specific manufacturer (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Manufacturer modifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationCategory'
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationTemplate'
 *                 assignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationAssignment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/global-mods/manufacturer/:manufacturerId/mods', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), globalModsController.getManufacturerMods);

/**
 * @openapi
 * /api/global-mods/categories:
 *   get:
 *     tags:
 *       - Global Modifications
 *     summary: Get all global modification categories
 *     description: Retrieve all global modification categories across all manufacturers (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationCategory'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/global-mods/categories', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getCategories);

/**
 * @openapi
 * /api/global-mods/assignments:
 *   get:
 *     tags:
 *       - Global Modifications
 *     summary: Get all global modification assignments
 *     description: Retrieve all global modification template assignments to catalog items (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 assignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationAssignment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/global-mods/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getAssignments);

/**
 * @openapi
 * /api/global-mods/categories:
 *   post:
 *     tags:
 *       - Global Modifications
 *     summary: Create a new global modification category
 *     description: Create a new category for organizing global modification templates (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - manufacturerId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               manufacturerId:
 *                 type: integer
 *                 description: Manufacturer ID this category belongs to
 *               description:
 *                 type: string
 *                 description: Optional category description
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 category:
 *                   $ref: '#/components/schemas/GlobalModificationCategory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/global-mods/categories', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createCategory);

/**
 * @openapi
 * /api/global-mods/categories/{id}:
 *   put:
 *     tags:
 *       - Global Modifications
 *     summary: Update a global modification category
 *     description: Update an existing global modification category (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated category name
 *               description:
 *                 type: string
 *                 description: Updated category description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 category:
 *                   $ref: '#/components/schemas/GlobalModificationCategory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     tags:
 *       - Global Modifications
 *     summary: Partially update a global modification category
 *     description: Partially update an existing global modification category (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated category name
 *               description:
 *                 type: string
 *                 description: Updated category description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 category:
 *                   $ref: '#/components/schemas/GlobalModificationCategory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/global-mods/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateCategory);
router.patch('/global-mods/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateCategory);

/**
 * @openapi
 * /api/global-mods/categories/{id}:
 *   delete:
 *     tags:
 *       - Global Modifications
 *     summary: Delete a global modification category
 *     description: Delete a global modification category and optionally reassign or delete its templates (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/global-mods/categories/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteCategory);

/**
 * @openapi
 * /api/global-mods/categories/{fromId}/merge-into/{toId}:
 *   post:
 *     tags:
 *       - Global Modifications
 *     summary: Merge two global modification categories
 *     description: Merge one category into another, moving all templates from the source category to the target category and then deleting the source category (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fromId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Source category ID to merge from (will be deleted after merge)
 *       - in: path
 *         name: toId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Target category ID to merge into (will receive all templates)
 *     responses:
 *       200:
 *         description: Categories merged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 templatesMoved:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/global-mods/categories/:fromId/merge-into/:toId', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('fromId'), validateIdParam('toId'), globalModsController.mergeCategories);

/**
 * @openapi
 * /api/global-mods/templates/{id}/reassign-category:
 *   patch:
 *     tags:
 *       - Global Modifications
 *     summary: Reassign template to different category
 *     description: Move a global modification template from one category to another (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: New category ID to assign template to
 *     responses:
 *       200:
 *         description: Template reassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 template:
 *                   $ref: '#/components/schemas/GlobalModificationTemplate'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/global-mods/templates/:id/reassign-category', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.reassignTemplateCategory);

/**
 * @openapi
 * /api/global-mods/templates:
 *   post:
 *     tags:
 *       - Global Modifications
 *     summary: Create a new global modification template
 *     description: Create a new global modification template with pricing and descriptive information (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - manufacturerId
 *               - modType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               categoryId:
 *                 type: integer
 *                 description: Category ID this template belongs to
 *               manufacturerId:
 *                 type: integer
 *                 description: Manufacturer ID
 *               modType:
 *                 type: string
 *                 enum: [fixed, percentage, multiplier, formula]
 *                 description: Type of modification pricing
 *               value:
 *                 type: number
 *                 description: Modification value (price, percentage, or multiplier)
 *               description:
 *                 type: string
 *                 description: Template description
 *               imageUrl:
 *                 type: string
 *                 description: Optional image URL for visual reference
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 template:
 *                   $ref: '#/components/schemas/GlobalModificationTemplate'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/global-mods/templates', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createTemplate);

/**
 * @openapi
 * /api/global-mods/templates/{id}:
 *   put:
 *     tags:
 *       - Global Modifications
 *     summary: Update a global modification template
 *     description: Update an existing global modification template (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated template name
 *               modType:
 *                 type: string
 *                 enum: [fixed, percentage, multiplier, formula]
 *                 description: Updated modification type
 *               value:
 *                 type: number
 *                 description: Updated modification value
 *               description:
 *                 type: string
 *                 description: Updated description
 *               imageUrl:
 *                 type: string
 *                 description: Updated image URL
 *               notes:
 *                 type: string
 *                 description: Updated notes
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 template:
 *                   $ref: '#/components/schemas/GlobalModificationTemplate'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     tags:
 *       - Global Modifications
 *     summary: Delete a global modification template
 *     description: Delete a global modification template and all its assignments (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/global-mods/templates/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), globalModsController.updateTemplate);
router.delete('/global-mods/templates/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteTemplate);

/**
 * @openapi
 * /api/global-mods/assignments:
 *   post:
 *     tags:
 *       - Global Modifications
 *     summary: Create a global modification assignment
 *     description: Assign a global modification template to one or more catalog items (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - catalogDataIds
 *             properties:
 *               templateId:
 *                 type: integer
 *                 description: Global modification template ID
 *               catalogDataIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of catalog item IDs to assign template to
 *     responses:
 *       201:
 *         description: Assignment(s) created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 assignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationAssignment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/global-mods/assignments', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), globalModsController.createAssignment);

/**
 * @openapi
 * /api/global-mods/assignments/{id}:
 *   delete:
 *     tags:
 *       - Global Modifications
 *     summary: Delete a global modification assignment
 *     description: Remove a global modification template assignment from a catalog item (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/global-mods/assignments/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), globalModsController.deleteAssignment);

/**
 * @openapi
 * /api/global-mods/item/{catalogDataId}:
 *   get:
 *     tags:
 *       - Global Modifications
 *     summary: Get global modifications for a catalog item
 *     description: Retrieve all global modification template assignments for a specific catalog item (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: catalogDataId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Item assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 assignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModificationAssignment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/global-mods/item/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), globalModsController.getItemAssignments);

// API v1 aliases for Global Modifications (mirror of /global-mods)
// Note: These routes are exact mirrors of /global-mods/* routes for API versioning compatibility

/**
 * @openapi
 * /api/v1/modifications/gallery:
 *   get:
 *     tags:
 *       - Global Modifications
 *     summary: Get global modifications blueprint gallery (v1 alias)
 *     description: Retrieve all blueprint templates from other manufacturers that can be imported into the current manufacturer. This is an alias for /api/global-mods/gallery (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blueprint gallery retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 blueprints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       manufacturerId:
 *                         type: integer
 *                       manufacturerName:
 *                         type: string
 *                       templateCount:
 *                         type: integer
 *                       categoryCount:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/v1/modifications/gallery', verifyTokenWithGroup, requirePermission('admin:manufacturers'), globalModsController.getGallery);

// The following /v1/modifications/* routes are aliases for /global-mods/* routes
// They share the same OpenAPI documentation as their /global-mods/* counterparts
// Replace "global-mods" with "v1/modifications" in the path when using these endpoints

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
router.get('/multi-manufacturer', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.MANUFACTURERS), multiManufacturerController.getAllMultiManufacturers);
router.post('/multi-manufacturer', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.MANUFACTURERS), sanitizeBodyStrings(), multiManufacturerController.createMultiManufacturer);
router.put('/multi-manufacturer/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.MANUFACTURERS), validateIdParam('id'), sanitizeBodyStrings(), multiManufacturerController.updateMultiManufacturer);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List all users
 *     description: Retrieve a list of all users in the system (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by user name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [User, Admin, Manufacturers, Contractor]
 *         description: Filter by user role
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: integer
 *         description: Filter by user group ID
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Add a new user to the system (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *               role:
 *                 type: string
 *                 enum: [User, Admin, Manufacturers, Contractor]
 *                 default: User
 *                 description: User's role in the system
 *               group_id:
 *                 type: integer
 *                 description: User group membership ID
 *               location:
 *                 type: string
 *                 description: User's location
 *               street_address:
 *                 type: string
 *                 description: Personal street address
 *               city:
 *                 type: string
 *                 description: Personal city
 *               state:
 *                 type: string
 *                 description: Personal state
 *               zip_code:
 *                 type: string
 *                 description: Personal ZIP code
 *               country:
 *                 type: string
 *                 description: Personal country
 *               company_name:
 *                 type: string
 *                 description: Company name
 *               company_street_address:
 *                 type: string
 *                 description: Company street address
 *               company_city:
 *                 type: string
 *                 description: Company city
 *               company_state:
 *                 type: string
 *                 description: Company state
 *               company_zip_code:
 *                 type: string
 *                 description: Company ZIP code
 *               company_country:
 *                 type: string
 *                 description: Company country
 *               isSalesRep:
 *                 type: boolean
 *                 default: false
 *                 description: Whether user is a sales representative
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Email already exists
 */

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user
 *     description: Soft delete a user by ID (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user
 *     description: Update user information by ID (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's new password (optional)
 *               role:
 *                 type: string
 *                 enum: [User, Admin, Manufacturers, Contractor]
 *                 description: User's role in the system
 *               group_id:
 *                 type: integer
 *                 description: User group membership ID
 *               location:
 *                 type: string
 *                 description: User's location
 *               street_address:
 *                 type: string
 *                 description: Personal street address
 *               city:
 *                 type: string
 *                 description: Personal city
 *               state:
 *                 type: string
 *                 description: Personal state
 *               zip_code:
 *                 type: string
 *                 description: Personal ZIP code
 *               country:
 *                 type: string
 *                 description: Personal country
 *               company_name:
 *                 type: string
 *                 description: Company name
 *               company_street_address:
 *                 type: string
 *                 description: Company street address
 *               company_city:
 *                 type: string
 *                 description: Company city
 *               company_state:
 *                 type: string
 *                 description: Company state
 *               company_zip_code:
 *                 type: string
 *                 description: Company ZIP code
 *               company_country:
 *                 type: string
 *                 description: Company country
 *               isSalesRep:
 *                 type: boolean
 *                 description: Whether user is a sales representative
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Email already exists
 */

/**
 * @openapi
 * /api/user-role/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user role information
 *     description: Retrieve role information for a specific user (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                 role:
 *                   type: string
 *                   enum: [User, Admin, Manufacturers, Contractor]
 *                 role_id:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /api/usersgroups:
 *   get:
 *     tags:
 *       - User Groups
 *     summary: List all user groups
 *     description: Retrieve a list of all user groups in the system (requires admin:groups permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by group name
 *       - in: query
 *         name: group_type
 *         schema:
 *           type: string
 *           enum: [standard, contractor]
 *         description: Filter by group type
 *     responses:
 *       200:
 *         description: List of user groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserGroup'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @openapi
 * /api/usersgroups/{id}:
 *   get:
 *     tags:
 *       - User Groups
 *     summary: Get user group by ID
 *     description: Retrieve a single user group by ID (requires admin:groups permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User group ID
 *     responses:
 *       200:
 *         description: User group retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGroup'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /api/usersgroups:
 *   post:
 *     tags:
 *       - User Groups
 *     summary: Create a new user group
 *     description: Add a new user group to the system (requires admin:groups permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: User group name
 *               group_type:
 *                 type: string
 *                 enum: [standard, contractor]
 *                 default: standard
 *                 description: Type of user group
 *               modules:
 *                 type: object
 *                 description: Module permissions for the group
 *                 properties:
 *                   dashboard:
 *                     type: boolean
 *                     default: false
 *                     description: Dashboard module access
 *                   proposals:
 *                     type: boolean
 *                     default: false
 *                     description: Proposals/quotes module access
 *                   customers:
 *                     type: boolean
 *                     default: false
 *                     description: Customers module access
 *                   resources:
 *                     type: boolean
 *                     default: false
 *                     description: Resources module access
 *               contractor_settings:
 *                 type: object
 *                 description: Contractor-specific settings (only for contractor groups)
 *                 properties:
 *                   price_multiplier:
 *                     type: number
 *                     description: Price multiplier for the group
 *                   allowed_manufacturers:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     description: List of allowed manufacturer IDs
 *     responses:
 *       201:
 *         description: User group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGroup'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @openapi
 * /api/usersgroups/{id}:
 *   delete:
 *     tags:
 *       - User Groups
 *     summary: Delete a user group
 *     description: Delete a user group by ID (requires admin:groups permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User group ID
 *     responses:
 *       200:
 *         description: User group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User group deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /api/usersgroups/{id}:
 *   put:
 *     tags:
 *       - User Groups
 *     summary: Update a user group
 *     description: Update user group information by ID (requires admin:groups permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User group name
 *               group_type:
 *                 type: string
 *                 enum: [standard, contractor]
 *                 description: Type of user group
 *               modules:
 *                 type: object
 *                 description: Module permissions for the group
 *                 properties:
 *                   dashboard:
 *                     type: boolean
 *                     description: Dashboard module access
 *                   proposals:
 *                     type: boolean
 *                     description: Proposals/quotes module access
 *                   customers:
 *                     type: boolean
 *                     description: Customers module access
 *                   resources:
 *                     type: boolean
 *                     description: Resources module access
 *               contractor_settings:
 *                 type: object
 *                 description: Contractor-specific settings (only for contractor groups)
 *                 properties:
 *                   price_multiplier:
 *                     type: number
 *                     description: Price multiplier for the group
 *                   allowed_manufacturers:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     description: List of allowed manufacturer IDs
 *     responses:
 *       200:
 *         description: User group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserGroup'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /api/usersgroupsmultiplier:
 *   get:
 *     tags:
 *       - User Groups
 *     summary: Get all user group multipliers
 *     description: Retrieve pricing multipliers for all user groups (requires admin:groups permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User group multipliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 multipliers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       group_id:
 *                         type: integer
 *                       group_name:
 *                         type: string
 *                       price_multiplier:
 *                         type: number
 *                       group_type:
 *                         type: string
 *                         enum: [standard, contractor]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @openapi
 * /api/user/multiplier:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user's group multiplier
 *     description: Retrieve the pricing multiplier for the authenticated user's group
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User multiplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 multiplier:
 *                   type: number
 *                   description: Price multiplier for the user's group
 *                 group_id:
 *                   type: integer
 *                 group_name:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @openapi
 * /api/designers:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all designers
 *     description: Retrieve a list of all users with sales representative or designer roles (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Designers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 designers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       isSalesRep:
 *                         type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
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
router.get('/locations', verifyTokenWithGroup, locationController.fetchLocations);
router.get('/locations/:id', verifyTokenWithGroup, validateIdParam('id'), locationController.fetchSingleLocation);
router.post('/locations', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), sanitizeBodyStrings(), locationController.addLocation);
router.delete('/locations/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), validateIdParam('id'), locationController.deleteLocation);
router.put('/locations/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), validateIdParam('id'), sanitizeBodyStrings(), locationController.updateLocation);

// Tax CRUD routes
router.get('/taxes', verifyTokenWithGroup, taxesController.getTaxes);
router.post('/taxes', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), sanitizeBodyStrings(), taxesController.addTax);
router.delete('/taxes/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), validateIdParam('id'), taxesController.deleteTax);
router.put('/taxes/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), validateIdParam('id'), taxesController.setDefaultTax);

// Collections CRUD routes
router.get('/collections', verifyTokenWithGroup, collectionsController.fetchCollection);
router.post('/collections', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), sanitizeBodyStrings(), collectionsController.addCollection);
router.delete('/collections/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), validateIdParam('id'), collectionsController.deleteCollection);
router.put('/collections/:id', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), validateIdParam('id'), sanitizeBodyStrings(), collectionsController.updateCollection);
router.get('/collections/:id', verifyTokenWithGroup, validateIdParam('id'), collectionsController.fetchCollectionById);
router.post('/bulk-collections', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), sanitizeBodyStrings(), collectionsController.addBulkCollection);



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
// Admin-only: delete any proposal (bypass group scoping and lock)
router.delete('/admin/proposals/:id', verifyTokenWithGroup, requirePermission('proposals:delete'), validateIdParam('id'), (req, res, next) => { req.isAdminBypass = true; next(); }, proposalsController.deleteProposals);
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
// Admin-only: delete any order
router.delete('/orders/:id', verifyTokenWithGroup, requirePermission('proposals:delete'), validateIdParam('id'), ordersController.deleteOrder);

// Admin-only: stream manufacturer no-price PDF for a given order id
async function streamManufacturerPdf(req, res, { forceDownload = false } = {}) {
	try {
		const orderId = req.params.id;
		const Order = require('../models/Order');
		const order = await Order.findByPk(orderId);
		if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
		const snapshot = typeof order.snapshot === 'string' ? (() => { try { return JSON.parse(order.snapshot); } catch (_) { return null; } })() : order.snapshot;
		if (!snapshot) return res.status(400).json({ success: false, message: 'Order has no snapshot' });

		// Ensure snapshot.info.orderNumber is present for legacy snapshots
		try {
			if (!snapshot.info || typeof snapshot.info !== 'object') snapshot.info = {};
			if (!snapshot.info.orderNumber) snapshot.info.orderNumber = order.order_number || null;
		} catch (_) { /* ignore */ }
		const eventManager = require('../utils/eventManager');
		const pdf = await eventManager.generateNoPricePdf(snapshot);
		const downloadParam = String(req.query.download || '').toLowerCase();
		const download = forceDownload || downloadParam === '1' || downloadParam === 'true';

		res.setHeader('Content-Type', 'application/pdf');
		if (download) {
			// Prefer normalized order number in filename when available
			const orderNum = order.order_number || (snapshot?.info && snapshot.info.orderNumber) || null;
			const safeBase = orderNum ? `Order-${orderNum}` : `Order-${orderId}`;
			res.setHeader('Content-Disposition', `attachment; filename="${safeBase}-Manufacturer.pdf"`);
		} else {
			res.setHeader('Content-Disposition', 'inline');
		}
		return res.status(200).send(pdf);
	} catch (e) {
		return res.status(500).json({ success: false, message: e.message });
	}
}

router.get('/orders/:id/manufacturer-pdf', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), async (req, res) => {
	return streamManufacturerPdf(req, res);
});

// Explicit download path to avoid any client/proxy quirks with query strings
router.get('/orders/:id/manufacturer-pdf/download', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), async (req, res) => {
	return streamManufacturerPdf(req, res, { forceDownload: true });
});

// Admin-only: resend manufacturer email for a given order id
router.post('/orders/:id/resend-manufacturer-email', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), async (req, res) => {
	try {
		const orderId = req.params.id;
		const Order = require('../models/Order');
		const order = await Order.findByPk(orderId);
		if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
		const eventManager = require('../utils/eventManager');
		// Optional dry-run: return pdfBytes without sending email
		if (String(req.query.noSend).toLowerCase() === '1' || String(req.body?.noSend).toLowerCase() === 'true') {
			const snapshot = typeof order.snapshot === 'string' ? (() => { try { return JSON.parse(order.snapshot); } catch (_) { return null; } })() : order.snapshot;
			if (!snapshot) return res.status(400).json({ success: false, message: 'Order has no snapshot' });
			const pdf = await eventManager.generateNoPricePdf(snapshot);
			return res.status(200).json({ success: true, pdfBytes: pdf?.length || 0 });
		}
		const result = await eventManager.autoEmailManufacturerOnAccept({ proposalId: order.proposal_id });
		return res.status(200).json({ success: !!result?.sent, message: result?.sent ? 'Resent successfully' : 'Resend attempted', result });
	} catch (e) {
		return res.status(500).json({ success: false, message: e.message });
	}
});

router.get('/settings/customization', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), customizationController.getCustomization);
router.post('/settings/customization', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), upload.single('logoImage'), customizationController.saveCustomization);

router.post('/settings/customization/pdf', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), upload.single('logo'), customizationController.saveCustomizationpdf);
router.get('/settings/customization/pdf', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), customizationController.getCustomizationpdf);
router.delete('/settings/customization/logo', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.SETTINGS), customizationController.getCustomizationdeletelogo);
// PDF generation for proposal previews - requires proposals read permission
router.post('/generate-pdf', verifyTokenWithGroup, requirePermission(PERMISSIONS.PROPOSALS.READ), customizationController.generatepdf);



// Authenticated endpoint to generate a PDF and email a proposal
router.post(
  '/proposals/send-email',
  verifyTokenWithGroup,
  attachPermissions,
  requireAnyPermission([
    PERMISSIONS.PROPOSALS.UPDATE,
    PERMISSIONS.PROPOSALS.ACCEPT,
  ]),
  proposalEmailLimiter,
  // Do not truncate HTML at all; sanitizer will still trim but not slice when maxLen=0
  sanitizeBodyStrings(0),
  emailController.sendProposalEmail
);


//fetch desinger
router.get('/designers', verifyTokenWithGroup, requirePermission(PERMISSIONS.ADMIN.USERS), userGroupController.getDesingers);

// Login page customization
// Public GET so unauthenticated users (and contractors) can load the admin-defined branding on the login screen
router.get('/login-customization', loginCustomizationController.getCustomization);
// Admin-only save endpoint
router.post('/login-customization', verifyTokenWithGroup, requirePermission('admin:settings'), loginCustomizationController.saveCustomization);
router.post('/login-customization/test-email', verifyTokenWithGroup, requirePermission('admin:settings'), loginCustomizationController.testEmail);

// Brand diagnostics (admin only)
router.get('/brand/current', verifyTokenWithGroup, requirePermission('admin:settings'), async (req, res) => {
	try {
		let data = null;
		try { data = fs.readFileSync(JSON_PATH, 'utf8'); } catch {}
		return res.status(200).json({
			success: true,
			snapshotPath: JSON_PATH,
			snapshot: data ? JSON.parse(data) : null,
			hasInline: fs.existsSync(path.join(process.cwd(), 'public', 'brand', 'inline.html'))
		});
	} catch (e) {
		return res.status(500).json({ success: false, message: e.message });
	}
});

router.post('/brand/refresh', verifyTokenWithGroup, requirePermission('admin:settings'), async (req, res) => {
	try {
		const result = await regenerateBrandSnapshot();
		return res.status(200).json({ success: true, result });
	} catch (e) {
		return res.status(500).json({ success: false, message: e.message });
	}
});

router.get('/dashboard/counts', verifyTokenWithGroup, proposalsController.getCounts);
router.get('/dashboard/latest-proposals', verifyTokenWithGroup, proposalsController.getLatestProposals);


// Resources CRUD routes
router.get('/resources', verifyTokenWithGroup, resourcesController.getResources); // Contractor-scoped endpoint
router.get('/resources/categories', verifyTokenWithGroup, resourcesController.getCategories);
router.post('/resources/categories', verifyTokenWithGroup, resourcesController.createCategory);
router.put('/resources/categories/:id', verifyTokenWithGroup, resourcesController.updateCategory);
router.post('/resources/categories/scaffold', verifyTokenWithGroup, resourcesController.scaffoldCategories);
router.delete('/resources/categories/:id', verifyTokenWithGroup, resourcesController.deleteCategory);
// Category thumbnail upload (admin only) and serve
router.post('/resources/categories/:id/thumbnail', verifyTokenWithGroup, resourceUpload.single('thumbnail'), resourcesController.uploadCategoryThumbnail);
router.get('/resources/categories/:id/thumbnail', attachTokenFromQuery(), verifyTokenWithGroup, resourcesController.getCategoryThumbnail);

router.get('/resources/announcements', verifyTokenWithGroup, resourcesController.getAnnouncements);
router.post('/resources/announcements', verifyTokenWithGroup, resourcesController.createAnnouncement);
router.put('/resources/announcements/:id', verifyTokenWithGroup, resourcesController.updateAnnouncement);
router.delete('/resources/announcements/:id', verifyTokenWithGroup, resourcesController.deleteAnnouncement);

router.get('/resources/links', verifyTokenWithGroup, resourcesController.getLinks);
router.post('/resources/links', verifyTokenWithGroup, resourcesController.saveLink);
router.put('/resources/links/:id', verifyTokenWithGroup, resourcesController.updateLink);
router.delete('/resources/links/:id', verifyTokenWithGroup, resourcesController.deleteLink);

router.get('/resources/files', verifyTokenWithGroup, resourcesController.getFiles);
router.post('/resources/files', verifyTokenWithGroup, resourceUpload.single('file'), resourcesController.saveFile);
router.put('/resources/files/:id', verifyTokenWithGroup, resourceUpload.single('file'), resourcesController.updateFile);
router.delete('/resources/files/:id', verifyTokenWithGroup, resourcesController.deleteFile);
router.get('/resources/files/download/:id', attachTokenFromQuery(), verifyTokenWithGroup, resourcesController.downloadFile);
// File thumbnail upload (admin only) and serve
router.post('/resources/files/:id/thumbnail', verifyTokenWithGroup, resourceUpload.single('thumbnail'), resourcesController.uploadFileThumbnail);
router.get('/resources/files/:id/thumbnail', attachTokenFromQuery(), verifyTokenWithGroup, resourcesController.getFileThumbnail);

/**
 * @openapi
 * /api/global-mods/upload/image:
 *   post:
 *     tags:
 *       - Global Modifications
 *     summary: Upload an image for global modifications
 *     description: Upload an image file for use in global modification templates, sample images, or category cards (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logoImage
 *             properties:
 *               logoImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPEG, PNG, GIF, WebP supported)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imageUrl:
 *                   type: string
 *                   description: Public URL of the uploaded image
 *                 filename:
 *                   type: string
 *                   description: Uploaded filename
 *       400:
 *         description: Invalid file type or upload error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/global-mods/upload/image', verifyTokenWithGroup, requirePermission('admin:manufacturers'), upload.imageUpload.single('logoImage'), uploadImage);

router.get('/calendar-events', verifyTokenWithGroup, calenderController.fetchEvents);

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
