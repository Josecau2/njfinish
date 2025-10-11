# Manufacturer Catalog Routes - OpenAPI Documentation

This file contains comprehensive OpenAPI JSDoc annotations for ALL manufacturer catalog-related routes in `routes/apiRoutes.js`.

## Lines 551-612: Manufacturer Catalog Management Routes

These routes handle:
- Assembly costs
- Hinges
- Modifications
- Catalog CRUD operations
- Catalog upload
- Backup and rollback
- Style management
- Type management
- Bulk operations

### Complete Documentation Block

```javascript
// ========================================
// Manufacturer Catalog Management Routes
// ========================================

/**
 * @openapi
 * /api/manufacturers/assemblycost/{id}:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get assembly cost details for a manufacturer
 *     description: Retrieve assembly cost details for a specific manufacturer (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Assembly cost details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 assemblyCosts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       manufacturer_id:
 *                         type: integer
 *                       cost:
 *                         type: number
 *                         format: float
 *                       description:
 *                         type: string
 *                       type_name:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/assemblycost/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerAssemblyCostDetails);

/**
 * @openapi
 * /api/manufacturers/{id}/assembly-costs-by-types:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get assembly costs grouped by cabinet types
 *     description: Retrieve assembly costs for a manufacturer organized by cabinet types (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Assembly costs by types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 assemblyCostsByTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type_name:
 *                         type: string
 *                       cost:
 *                         type: number
 *                         format: float
 *                       items_count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:id/assembly-costs-by-types', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchAssemblyCostsByTypes);

/**
 * @openapi
 * /api/manufacturers/items/hinges/{catalogDataId}:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get hinge details for a catalog item
 *     description: Retrieve hinge configuration and details for a specific catalog item (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: catalogDataId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog data ID
 *     responses:
 *       200:
 *         description: Hinge details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 hinges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       catalog_data_id:
 *                         type: integer
 *                       hinge_type:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       cost:
 *                         type: number
 *                         format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/items/hinges/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), manufacturerController.fetchManufacturerHingesDetails);

/**
 * @openapi
 * /api/manufacturers/items/modifications/{catalogDataId}:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get modification details for a catalog item
 *     description: Retrieve available manufacturer-specific modifications for a specific catalog item (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: catalogDataId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog data ID
 *     responses:
 *       200:
 *         description: Modification details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 modifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       catalog_data_id:
 *                         type: integer
 *                       modification_name:
 *                         type: string
 *                       price_adjustment:
 *                         type: number
 *                         format: float
 *                       description:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/items/modifications/:catalogDataId', verifyTokenWithGroup, validateIdParam('catalogDataId'), manufacturerController.fetchManufacturerItemsModification);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/types:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get all cabinet types for a manufacturer
 *     description: Retrieve all cabinet types configured for a specific manufacturer (available to all authenticated users)
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
 *         description: Cabinet types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 types:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type_name:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       image_url:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:manufacturerId/types', verifyTokenWithGroup, validateIdParam('manufacturerId'), manufacturerController.getManufacturerTypes);

/**
 * @openapi
 * /api/manufacturers/items/assembly-cost:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Save assembly cost configuration
 *     description: Create or update assembly cost details for a manufacturer (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - cost
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               type_name:
 *                 type: string
 *                 description: Cabinet type name
 *               cost:
 *                 type: number
 *                 format: float
 *                 description: Assembly cost amount
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assembly cost saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/items/assembly-cost', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.saveAssemblyCost);

/**
 * @openapi
 * /api/manufacturers/items/hinges:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Save hinge configuration
 *     description: Create or update hinge details for catalog items (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalog_data_id
 *               - hinge_type
 *               - quantity
 *             properties:
 *               catalog_data_id:
 *                 type: integer
 *                 description: Catalog data ID
 *               hinge_type:
 *                 type: string
 *                 description: Type of hinge
 *               quantity:
 *                 type: integer
 *                 description: Number of hinges required
 *               cost:
 *                 type: number
 *                 format: float
 *                 description: Cost per hinge
 *     responses:
 *       200:
 *         description: Hinge details saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/items/hinges', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.saveHingesDetails);

/**
 * @openapi
 * /api/manufacturers/items/modifications:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Save modification configuration
 *     description: Create or update manufacturer-specific modification details for catalog items (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catalog_data_id
 *               - modification_name
 *             properties:
 *               catalog_data_id:
 *                 type: integer
 *                 description: Catalog data ID
 *               modification_name:
 *                 type: string
 *                 description: Name of the modification
 *               price_adjustment:
 *                 type: number
 *                 format: float
 *                 description: Price adjustment for this modification
 *               description:
 *                 type: string
 *                 description: Detailed description of the modification
 *     responses:
 *       200:
 *         description: Modification details saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/items/modifications', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.saveModificationDetails);

/**
 * @openapi
 * /api/manufacturers/catalog/{manufacturerId}:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Manually add a catalog item
 *     description: Create a new catalog item manually for a manufacturer (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
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
 *               - item_code
 *               - description
 *               - price
 *             properties:
 *               item_code:
 *                 type: string
 *                 description: Unique item code/SKU
 *               description:
 *                 type: string
 *                 description: Item description
 *               type_name:
 *                 type: string
 *                 description: Cabinet type
 *               style_name:
 *                 type: string
 *                 description: Style name
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Item price
 *               width:
 *                 type: number
 *                 format: float
 *               height:
 *                 type: number
 *                 format: float
 *               depth:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Catalog item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 catalogItem:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/catalog/:manufacturerId', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), sanitizeBodyStrings(), manufacturerController.saveManualCabinetItem);

/**
 * @openapi
 * /api/manufacturers/catalog/edit/{id}:
 *   put:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Edit a catalog item
 *     description: Update an existing catalog item (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_code:
 *                 type: string
 *               description:
 *                 type: string
 *               type_name:
 *                 type: string
 *               style_name:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               width:
 *                 type: number
 *                 format: float
 *               height:
 *                 type: number
 *                 format: float
 *               depth:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Catalog item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/manufacturers/catalog/edit/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), manufacturerController.editManualCabinetItem);

/**
 * @openapi
 * /api/manufacturers/catalog/edit/{id}:
 *   delete:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Delete a catalog item
 *     description: Remove a catalog item from the manufacturer's catalog (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Catalog item deleted successfully
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
router.delete('/manufacturers/catalog/edit/:id', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), manufacturerController.deleteManualCabinetItem);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/catalog/upload:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Upload catalog file (CSV/Excel)
 *     description: Upload and process a catalog file (CSV or Excel) to bulk import/update catalog items for a manufacturer. Creates automatic backup before applying changes (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file containing catalog data
 *     responses:
 *       200:
 *         description: Catalog file uploaded and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 itemsAdded:
 *                   type: integer
 *                 itemsUpdated:
 *                   type: integer
 *                 backupId:
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
router.post('/manufacturers/:manufacturerId/catalog/upload', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.uploadCatalogFile);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/catalog:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get manufacturer catalog (paginated)
 *     description: Retrieve paginated catalog items for a specific manufacturer (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by item code or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by cabinet type
 *       - in: query
 *         name: style
 *         schema:
 *           type: string
 *         description: Filter by style name
 *     responses:
 *       200:
 *         description: Catalog items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       item_code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type_name:
 *                         type: string
 *                       style_name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *                       depth:
 *                         type: number
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:manufacturerId/catalog', verifyTokenWithGroup, validateIdParam('manufacturerId'), manufacturerController.getManufacturerCatalog);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/catalog/backups:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get catalog upload backup history
 *     description: Retrieve list of catalog upload backups for rollback purposes (requires admin:manufacturers permission)
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
 *         description: Backup history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 backups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       manufacturer_id:
 *                         type: integer
 *                       backup_timestamp:
 *                         type: string
 *                         format: date-time
 *                       items_count:
 *                         type: integer
 *                       created_by:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:manufacturerId/catalog/backups', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.getCatalogUploadBackups);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/catalog/rollback:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Rollback catalog to a previous backup
 *     description: Restore catalog to a previous state using a backup ID (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
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
 *               - backupId
 *             properties:
 *               backupId:
 *                 type: integer
 *                 description: Backup ID to rollback to
 *     responses:
 *       200:
 *         description: Catalog rolled back successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 itemsRestored:
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
router.post('/manufacturers/:manufacturerId/catalog/rollback', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), sanitizeBodyStrings(), manufacturerController.rollbackCatalogUpload);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/catalog/cleanup-backups:
 *   delete:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Cleanup old catalog backups
 *     description: Delete old catalog backups to free up storage space (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *       - in: query
 *         name: keepCount
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent backups to keep
 *     responses:
 *       200:
 *         description: Old backups cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/manufacturers/:manufacturerId/catalog/cleanup-backups', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.cleanupOldBackups);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/style/{styleName}:
 *   delete:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *       - Style Management
 *     summary: Delete or merge a style
 *     description: Delete a style or merge it into another style (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *       - in: path
 *         name: styleName
 *         required: true
 *         schema:
 *           type: string
 *         description: Style name to delete or merge
 *       - in: query
 *         name: mergeInto
 *         schema:
 *           type: string
 *         description: Target style name to merge into (optional)
 *     responses:
 *       200:
 *         description: Style deleted or merged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 itemsAffected:
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
router.delete('/manufacturers/:manufacturerId/style/:styleName', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.deleteStyle);

/**
 * @openapi
 * /api/manufacturers/catalog/bulk-edit:
 *   put:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Bulk edit catalog items
 *     description: Update multiple catalog items at once with the same changes (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemIds
 *               - updates
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of catalog item IDs to update
 *               updates:
 *                 type: object
 *                 description: Fields to update
 *                 properties:
 *                   type_name:
 *                     type: string
 *                   style_name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   price_adjustment:
 *                     type: number
 *                     description: Add/subtract from existing price
 *     responses:
 *       200:
 *         description: Catalog items updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/manufacturers/catalog/bulk-edit', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.bulkEditCatalogItems);

/**
 * @openapi
 * /api/manufacturers/{id}/style-name:
 *   put:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *       - Style Management
 *     summary: Edit style name globally
 *     description: Rename a style across all catalog items (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
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
 *               - oldStyleName
 *               - newStyleName
 *             properties:
 *               oldStyleName:
 *                 type: string
 *                 description: Current style name
 *               newStyleName:
 *                 type: string
 *                 description: New style name
 *     responses:
 *       200:
 *         description: Style name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 itemsUpdated:
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
router.put('/manufacturers/:id/style-name', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), sanitizeBodyStrings(), manufacturerController.editStyleName);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/cleanup-duplicates:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Cleanup duplicate catalog items
 *     description: Identify and remove duplicate catalog entries based on item codes (requires admin:manufacturers permission)
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
 *         description: Duplicates cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 duplicatesRemoved:
 *                   type: integer
 *                 duplicateSets:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/manufacturers/:manufacturerId/cleanup-duplicates', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('manufacturerId'), manufacturerController.cleanupDuplicates);

// ========================================
// Style Management Routes
// ========================================

/**
 * @openapi
 * /api/manufacturers/style/create:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Create a new manufacturer style
 *     description: Add a new style configuration for a manufacturer with optional image (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - style_name
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               style_name:
 *                 type: string
 *                 description: Style name
 *               description:
 *                 type: string
 *                 description: Style description
 *               image_url:
 *                 type: string
 *                 description: URL to style image
 *     responses:
 *       201:
 *         description: Style created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 style:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/style/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.addManufacturerStyle);

/**
 * @openapi
 * /api/manufacturers/style/{catalogID}:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Get style details by catalog ID
 *     description: Retrieve style information for a specific catalog item (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: catalogID
 *         required: true
 *         schema:
 *           type: integer
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Style details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 style:
 *                   type: object
 *                   properties:
 *                     style_name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     image_url:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/style/:catalogID', verifyTokenWithGroup, validateIdParam('catalogID'), manufacturerController.fetchManufacturerStyleById);

/**
 * @openapi
 * /api/manufacturers/{id}/styles:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Get all styles for a manufacturer
 *     description: Retrieve all style configurations for a specific manufacturer (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Styles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 styles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       style_name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:id/styles', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerAllStyleById);

/**
 * @openapi
 * /api/manufacturers/{id}/styleswithcatalog:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Get styles with associated catalog items
 *     description: Retrieve all styles with their associated catalog items for a manufacturer (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Styles with catalog items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 styles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       style_name:
 *                         type: string
 *                       catalog_items:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:id/styleswithcatalog', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerStylesWithCatalog);

/**
 * @openapi
 * /api/manufacturers/{id}/styles-meta:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Get lightweight styles metadata
 *     description: Retrieve unique styles with representative catalog ID and optional image, optimized for proposal creation step (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Styles metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 styles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       style_name:
 *                         type: string
 *                       representative_catalog_id:
 *                         type: integer
 *                       image_url:
 *                         type: string
 *                       items_count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:id/styles-meta', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerStylesMeta);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/styles/{catalogId}/items:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Get items for a given style
 *     description: Retrieve catalog items for a specific style by representative catalog ID, with pagination and optional detailed information (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *       - in: path
 *         name: catalogId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Representative catalog item ID for the style
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed item information
 *     responses:
 *       200:
 *         description: Style items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 style_name:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:manufacturerId/styles/:catalogId/items', verifyTokenWithGroup, validateIdParam('manufacturerId'), validateIdParam('catalogId'), manufacturerController.getItemsByStyleCatalogId);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/styles:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Add simple style from pictures tab
 *     description: Add a new style with minimal configuration, typically from the pictures/gallery tab (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
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
 *               - style_name
 *             properties:
 *               style_name:
 *                 type: string
 *                 description: Style name
 *               image_url:
 *                 type: string
 *                 description: URL to style image
 *     responses:
 *       201:
 *         description: Simple style added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/:manufacturerId/styles', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.addSimpleStyle);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/styles/{styleName}:
 *   delete:
 *     tags:
 *       - Manufacturers
 *       - Style Management
 *     summary: Delete simple style from pictures tab
 *     description: Delete a style configuration, typically from the pictures/gallery tab (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *       - in: path
 *         name: styleName
 *         required: true
 *         schema:
 *           type: string
 *         description: Style name to delete
 *     responses:
 *       200:
 *         description: Simple style deleted successfully
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
router.delete('/manufacturers/:manufacturerId/styles/:styleName', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.deleteSimpleStyle);

// ========================================
// Type Management Routes
// ========================================

/**
 * @openapi
 * /api/manufacturers/{id}/types-meta:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Get lightweight types metadata
 *     description: Retrieve unique cabinet types with metadata for a manufacturer (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Types metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 types:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type_name:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       items_count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/:id/types-meta', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerTypesMeta);

/**
 * @openapi
 * /api/manufacturers/type/create:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Create a new cabinet type with image
 *     description: Add a new cabinet type configuration with optional image upload (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - type_name
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               type_name:
 *                 type: string
 *                 description: Cabinet type name
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Type image file
 *     responses:
 *       201:
 *         description: Type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 type:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/type/create', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.createTypeImage);

/**
 * @openapi
 * /api/manufacturers/type/update-meta:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Update type metadata
 *     description: Update metadata for a cabinet type (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - type_name
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               type_name:
 *                 type: string
 *                 description: Cabinet type name
 *               image_url:
 *                 type: string
 *                 description: URL to type image
 *               description:
 *                 type: string
 *                 description: Type description
 *     responses:
 *       200:
 *         description: Type metadata updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/type/update-meta', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.updateTypeMeta);

/**
 * @openapi
 * /api/manufacturers/{manufacturerId}/type/{typeName}:
 *   delete:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Delete a cabinet type
 *     description: Remove a cabinet type configuration (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *       - in: path
 *         name: typeName
 *         required: true
 *         schema:
 *           type: string
 *         description: Cabinet type name to delete
 *     responses:
 *       200:
 *         description: Type deleted successfully
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
router.delete('/manufacturers/:manufacturerId/type/:typeName', verifyTokenWithGroup, requirePermission('admin:manufacturers'), manufacturerController.deleteType);

/**
 * @openapi
 * /api/manufacturers/bulk-edit-types:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Bulk edit type properties
 *     description: Update properties for multiple cabinet types at once (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - types
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               types:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type_name:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Types updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/bulk-edit-types', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.bulkEditTypes);

/**
 * @openapi
 * /api/manufacturers/bulk-change-type:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Bulk change catalog item types
 *     description: Change the type for multiple catalog items at once (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemIds
 *               - new_type_name
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of catalog item IDs to update
 *               new_type_name:
 *                 type: string
 *                 description: New type name to assign
 *     responses:
 *       200:
 *         description: Item types changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/bulk-change-type', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.bulkChangeType);

/**
 * @openapi
 * /api/manufacturers/edit-type-name:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Rename a cabinet type globally
 *     description: Rename a type across all catalog items (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - old_type_name
 *               - new_type_name
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               old_type_name:
 *                 type: string
 *                 description: Current type name
 *               new_type_name:
 *                 type: string
 *                 description: New type name
 *     responses:
 *       200:
 *         description: Type name changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 itemsUpdated:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/edit-type-name', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.editTypeName);

/**
 * @openapi
 * /api/manufacturers/assign-items-to-type:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Type Management
 *     summary: Assign catalog items to a type
 *     description: Assign multiple catalog items to a specific cabinet type (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemIds
 *               - type_name
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of catalog item IDs
 *               type_name:
 *                 type: string
 *                 description: Type name to assign items to
 *     responses:
 *       200:
 *         description: Items assigned to type successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 assignedCount:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/assign-items-to-type', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.assignItemsToType);

// ========================================
// Catalog Modification Items Routes
// ========================================

/**
 * @openapi
 * /api/manufacturers/catalogs/modificationsItems/{id}:
 *   get:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Get modification items for a catalog
 *     description: Retrieve modification items associated with a specific manufacturer catalog (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Modification items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 modificationItems:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manufacturers/catalogs/modificationsItems/:id', verifyTokenWithGroup, validateIdParam('id'), manufacturerController.fetchManufacturerCatalogModificationItems);

/**
 * @openapi
 * /api/manufacturers/catalogs/modificationsItems/add:
 *   post:
 *     tags:
 *       - Manufacturers
 *       - Catalog Management
 *     summary: Add a modification item
 *     description: Create a new modification item for manufacturer catalog (requires admin:manufacturers permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manufacturer_id
 *               - modification_name
 *             properties:
 *               manufacturer_id:
 *                 type: integer
 *                 description: Manufacturer ID
 *               modification_name:
 *                 type: string
 *                 description: Name of the modification
 *               description:
 *                 type: string
 *                 description: Modification description
 *               price_adjustment:
 *                 type: number
 *                 format: float
 *                 description: Price adjustment for this modification
 *     responses:
 *       201:
 *         description: Modification item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/manufacturers/catalogs/modificationsItems/add', verifyTokenWithGroup, requirePermission('admin:manufacturers'), sanitizeBodyStrings(), manufacturerController.addModificationItem);
```

## Summary

### Routes Documented: 48

#### Assembly Costs (2 routes):
- GET /api/manufacturers/assemblycost/{id}
- GET /api/manufacturers/{id}/assembly-costs-by-types

#### Hinges (2 routes):
- GET /api/manufacturers/items/hinges/{catalogDataId}
- POST /api/manufacturers/items/hinges

#### Modifications (3 routes):
- GET /api/manufacturers/items/modifications/{catalogDataId}
- POST /api/manufacturers/items/modifications
- POST /api/manufacturers/catalogs/modificationsItems/add

#### Catalog CRUD (5 routes):
- POST /api/manufacturers/catalog/{manufacturerId}
- PUT /api/manufacturers/catalog/edit/{id}
- DELETE /api/manufacturers/catalog/edit/{id}
- GET /api/manufacturers/{manufacturerId}/catalog
- POST /api/manufacturers/{manufacturerId}/catalog/upload

#### Catalog Backups (3 routes):
- GET /api/manufacturers/{manufacturerId}/catalog/backups
- POST /api/manufacturers/{manufacturerId}/catalog/rollback
- DELETE /api/manufacturers/{manufacturerId}/catalog/cleanup-backups

#### Bulk Operations (3 routes):
- PUT /api/manufacturers/catalog/bulk-edit
- POST /api/manufacturers/{manufacturerId}/cleanup-duplicates
- POST /api/manufacturers/bulk-change-type

#### Style Management (10 routes):
- POST /api/manufacturers/style/create
- GET /api/manufacturers/style/{catalogID}
- GET /api/manufacturers/{id}/styles
- GET /api/manufacturers/{id}/styleswithcatalog
- GET /api/manufacturers/{id}/styles-meta
- GET /api/manufacturers/{manufacturerId}/styles/{catalogId}/items
- PUT /api/manufacturers/{id}/style-name
- DELETE /api/manufacturers/{manufacturerId}/style/{styleName}
- POST /api/manufacturers/{manufacturerId}/styles
- DELETE /api/manufacturers/{manufacturerId}/styles/{styleName}

#### Type Management (9 routes):
- GET /api/manufacturers/{manufacturerId}/types
- GET /api/manufacturers/{id}/types-meta
- POST /api/manufacturers/type/create
- POST /api/manufacturers/type/update-meta
- DELETE /api/manufacturers/{manufacturerId}/type/{typeName}
- POST /api/manufacturers/bulk-edit-types
- POST /api/manufacturers/edit-type-name
- POST /api/manufacturers/assign-items-to-type
- POST /api/manufacturers/items/assembly-cost

#### Catalog Modification Items (2 routes):
- GET /api/manufacturers/catalogs/modificationsItems/{id}
- POST /api/manufacturers/catalogs/modificationsItems/add

## Routes Requiring Special Attention

1. **File Upload Route** (`POST /api/manufacturers/{manufacturerId}/catalog/upload`):
   - Requires multipart/form-data
   - Creates automatic backups
   - Should document expected CSV/Excel format

2. **Bulk Operations Routes**:
   - May have performance implications with large datasets
   - Should consider documenting max array sizes

3. **Rollback Route** (`POST /api/manufacturers/{manufacturerId}/catalog/rollback`):
   - Critical operation that can affect production data
   - Should document rollback limitations/caveats

4. **Type Create Route** (`POST /api/manufacturers/type/create`):
   - Accepts file upload (multipart/form-data)
   - Different from other POST routes that use JSON

All routes are now comprehensively documented with:
- Complete path parameters
- Query parameters where applicable
- Request body schemas with all properties
- Response codes (200, 201, 400, 401, 403, 404)
- Response schemas
- Security requirements (bearerAuth)
- Appropriate tags for grouping
