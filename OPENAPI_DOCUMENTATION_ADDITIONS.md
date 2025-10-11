# OpenAPI Documentation Additions for routes/apiRoutes.js

This document contains the comprehensive OpenAPI JSDoc annotations that need to be added to `routes/apiRoutes.js` for Collections, Calendar, Resources, Terms, and Image Upload routes.

## Collections Routes (6 routes)

### GET /api/collections
```javascript
/**
 * @openapi
 * /api/collections:
 *   get:
 *     tags:
 *       - Collections
 *     summary: List all collections
 *     description: Retrieve a list of all collections (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of collections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Collection'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### POST /api/collections
```javascript
/**
 * @openapi
 * /api/collections:
 *   post:
 *     tags:
 *       - Collections
 *     summary: Create a new collection
 *     description: Add a new collection to the system (requires admin:settings permission)
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
 *                 description: Collection name
 *               description:
 *                 type: string
 *                 description: Collection description
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Collection status
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

### DELETE /api/collections/{id}
```javascript
/**
 * @openapi
 * /api/collections/{id}:
 *   delete:
 *     tags:
 *       - Collections
 *     summary: Delete a collection
 *     description: Delete a collection by ID (requires admin:settings permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection deleted successfully
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
```

### PUT /api/collections/{id}
```javascript
/**
 * @openapi
 * /api/collections/{id}:
 *   put:
 *     tags:
 *       - Collections
 *     summary: Update a collection
 *     description: Update collection information by ID (requires admin:settings permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Collection name
 *               description:
 *                 type: string
 *                 description: Collection description
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Collection status
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/collections/{id}
```javascript
/**
 * @openapi
 * /api/collections/{id}:
 *   get:
 *     tags:
 *       - Collections
 *     summary: Get collection by ID
 *     description: Retrieve a single collection by ID (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### POST /api/bulk-collections
```javascript
/**
 * @openapi
 * /api/bulk-collections:
 *   post:
 *     tags:
 *       - Collections
 *     summary: Create multiple collections in bulk
 *     description: Add multiple collections at once (requires admin:settings permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collections
 *             properties:
 *               collections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Collections created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 created:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

---

## Calendar Routes (1 route)

### GET /api/calendar-events
```javascript
/**
 * @openapi
 * /api/calendar-events:
 *   get:
 *     tags:
 *       - Calendar
 *     summary: Get calendar events
 *     description: Retrieve all calendar events for scheduling and planning (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter for events (ISO 8601 format)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter for events (ISO 8601 format)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter events by user ID
 *     responses:
 *       200:
 *         description: Calendar events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *                       userId:
 *                         type: integer
 *                       allDay:
 *                         type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

---

## Resources Routes (18 routes)

### GET /api/resources
```javascript
/**
 * @openapi
 * /api/resources:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get all resources
 *     description: Retrieve all resources including announcements, links, and files (contractor-scoped endpoint)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter resources by category ID
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 resources:
 *                   type: object
 *                   properties:
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     links:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ResourceLink'
 *                     files:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ResourceFile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### GET /api/resources/categories
```javascript
/**
 * @openapi
 * /api/resources/categories:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get all resource categories
 *     description: Retrieve all resource categories for organizing resources (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resource categories retrieved successfully
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
 *                     $ref: '#/components/schemas/ResourceCategory'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### POST /api/resources/categories
```javascript
/**
 * @openapi
 * /api/resources/categories:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Create a new resource category
 *     description: Create a new category for organizing resources (available to authenticated users)
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
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               groupId:
 *                 type: integer
 *                 description: User group ID this category belongs to (null for global)
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
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### PUT /api/resources/categories/{id}
```javascript
/**
 * @openapi
 * /api/resources/categories/{id}:
 *   put:
 *     tags:
 *       - Resources
 *     summary: Update a resource category
 *     description: Update an existing resource category (available to authenticated users)
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
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### POST /api/resources/categories/scaffold
```javascript
/**
 * @openapi
 * /api/resources/categories/scaffold:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Scaffold default resource categories
 *     description: Create a default set of resource categories for a user group (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: User group ID to create default categories for
 *     responses:
 *       201:
 *         description: Default categories created successfully
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
 *                     $ref: '#/components/schemas/ResourceCategory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### DELETE /api/resources/categories/{id}
```javascript
/**
 * @openapi
 * /api/resources/categories/{id}:
 *   delete:
 *     tags:
 *       - Resources
 *     summary: Delete a resource category
 *     description: Delete a resource category and optionally reassign its resources (available to authenticated users)
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### POST /api/resources/categories/{id}/thumbnail
```javascript
/**
 * @openapi
 * /api/resources/categories/{id}/thumbnail:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Upload category thumbnail
 *     description: Upload a thumbnail image for a resource category (admin only)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - thumbnail
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Thumbnail image file (JPEG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Thumbnail uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 thumbnailPath:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/resources/categories/{id}/thumbnail
```javascript
/**
 * @openapi
 * /api/resources/categories/{id}/thumbnail:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get category thumbnail
 *     description: Retrieve the thumbnail image for a resource category (requires authentication via query token)
 *     security:
 *       - bearerAuth: []
 *       - queryAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: JWT token for authentication (alternative to Authorization header)
 *     responses:
 *       200:
 *         description: Thumbnail image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/resources/announcements
```javascript
/**
 * @openapi
 * /api/resources/announcements:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get all announcements
 *     description: Retrieve all announcements (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter announcements by category ID
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 announcements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### POST /api/resources/announcements
```javascript
/**
 * @openapi
 * /api/resources/announcements:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Create a new announcement
 *     description: Create a new announcement (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Announcement title
 *               content:
 *                 type: string
 *                 description: Announcement content (HTML supported)
 *               categoryId:
 *                 type: integer
 *                 description: Category ID this announcement belongs to
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 description: Announcement priority level
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date for the announcement
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### PUT /api/resources/announcements/{id}
```javascript
/**
 * @openapi
 * /api/resources/announcements/{id}:
 *   put:
 *     tags:
 *       - Resources
 *     summary: Update an announcement
 *     description: Update an existing announcement (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated announcement title
 *               content:
 *                 type: string
 *                 description: Updated announcement content (HTML supported)
 *               categoryId:
 *                 type: integer
 *                 description: Updated category ID
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 description: Updated priority level
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Updated expiration date
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### DELETE /api/resources/announcements/{id}
```javascript
/**
 * @openapi
 * /api/resources/announcements/{id}:
 *   delete:
 *     tags:
 *       - Resources
 *     summary: Delete an announcement
 *     description: Delete an announcement by ID (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID to delete
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/resources/links
```javascript
/**
 * @openapi
 * /api/resources/links:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get all resource links
 *     description: Retrieve all resource links (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter links by category ID
 *     responses:
 *       200:
 *         description: Resource links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceLink'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### POST /api/resources/links
```javascript
/**
 * @openapi
 * /api/resources/links:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Create a new resource link
 *     description: Create a new resource link (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 description: Link title
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Link URL
 *               description:
 *                 type: string
 *                 description: Link description
 *               categoryId:
 *                 type: integer
 *                 description: Category ID this link belongs to
 *               openInNewTab:
 *                 type: boolean
 *                 description: Whether link should open in a new tab
 *     responses:
 *       201:
 *         description: Resource link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 link:
 *                   $ref: '#/components/schemas/ResourceLink'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### PUT /api/resources/links/{id}
```javascript
/**
 * @openapi
 * /api/resources/links/{id}:
 *   put:
 *     tags:
 *       - Resources
 *     summary: Update a resource link
 *     description: Update an existing resource link (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Link ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated link title
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Updated link URL
 *               description:
 *                 type: string
 *                 description: Updated link description
 *               categoryId:
 *                 type: integer
 *                 description: Updated category ID
 *               openInNewTab:
 *                 type: boolean
 *                 description: Whether link should open in a new tab
 *     responses:
 *       200:
 *         description: Resource link updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 link:
 *                   $ref: '#/components/schemas/ResourceLink'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### DELETE /api/resources/links/{id}
```javascript
/**
 * @openapi
 * /api/resources/links/{id}:
 *   delete:
 *     tags:
 *       - Resources
 *     summary: Delete a resource link
 *     description: Delete a resource link by ID (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Link ID to delete
 *     responses:
 *       200:
 *         description: Resource link deleted successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/resources/files
```javascript
/**
 * @openapi
 * /api/resources/files:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get all resource files
 *     description: Retrieve all resource files (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter files by category ID
 *     responses:
 *       200:
 *         description: Resource files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceFile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### POST /api/resources/files
```javascript
/**
 * @openapi
 * /api/resources/files:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Upload a new resource file
 *     description: Upload a new resource file (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               title:
 *                 type: string
 *                 description: File title
 *               description:
 *                 type: string
 *                 description: File description
 *               categoryId:
 *                 type: integer
 *                 description: Category ID this file belongs to
 *     responses:
 *       201:
 *         description: Resource file uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 file:
 *                   $ref: '#/components/schemas/ResourceFile'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

### PUT /api/resources/files/{id}
```javascript
/**
 * @openapi
 * /api/resources/files/{id}:
 *   put:
 *     tags:
 *       - Resources
 *     summary: Update a resource file
 *     description: Update an existing resource file (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New file to replace existing (optional)
 *               title:
 *                 type: string
 *                 description: Updated file title
 *               description:
 *                 type: string
 *                 description: Updated file description
 *               categoryId:
 *                 type: integer
 *                 description: Updated category ID
 *     responses:
 *       200:
 *         description: Resource file updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 file:
 *                   $ref: '#/components/schemas/ResourceFile'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### DELETE /api/resources/files/{id}
```javascript
/**
 * @openapi
 * /api/resources/files/{id}:
 *   delete:
 *     tags:
 *       - Resources
 *     summary: Delete a resource file
 *     description: Delete a resource file by ID (available to authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID to delete
 *     responses:
 *       200:
 *         description: Resource file deleted successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/resources/files/download/{id}
```javascript
/**
 * @openapi
 * /api/resources/files/download/{id}:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Download a resource file
 *     description: Download a resource file by ID (requires authentication via query token)
 *     security:
 *       - bearerAuth: []
 *       - queryAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID to download
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: JWT token for authentication (alternative to Authorization header)
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### POST /api/resources/files/{id}/thumbnail
```javascript
/**
 * @openapi
 * /api/resources/files/{id}/thumbnail:
 *   post:
 *     tags:
 *       - Resources
 *     summary: Upload file thumbnail
 *     description: Upload a thumbnail image for a resource file (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - thumbnail
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Thumbnail image file (JPEG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Thumbnail uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 thumbnailPath:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

### GET /api/resources/files/{id}/thumbnail
```javascript
/**
 * @openapi
 * /api/resources/files/{id}/thumbnail:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Get file thumbnail
 *     description: Retrieve the thumbnail image for a resource file (requires authentication via query token)
 *     security:
 *       - bearerAuth: []
 *       - queryAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: JWT token for authentication (alternative to Authorization header)
 *     responses:
 *       200:
 *         description: Thumbnail image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
```

---

## Terms & Conditions Routes (4 routes)

### GET /api/terms/latest
```javascript
/**
 * @openapi
 * /api/terms/latest:
 *   get:
 *     tags:
 *       - Terms
 *     summary: Get latest terms and conditions
 *     description: Retrieve the most recent version of terms and conditions (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest terms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 terms:
 *                   $ref: '#/components/schemas/Terms'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No terms and conditions have been created yet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
```

### POST /api/terms
```javascript
/**
 * @openapi
 * /api/terms:
 *   post:
 *     tags:
 *       - Terms
 *     summary: Create new terms and conditions
 *     description: Create a new version of terms and conditions (requires admin:settings permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Full content of the terms and conditions (HTML supported, up to 2MB)
 *               version:
 *                 type: string
 *                 description: Version identifier (e.g., "1.0", "2024-01")
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date when these terms become effective
 *     responses:
 *       201:
 *         description: Terms created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 terms:
 *                   $ref: '#/components/schemas/Terms'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

### GET /api/terms/acceptance
```javascript
/**
 * @openapi
 * /api/terms/acceptance:
 *   get:
 *     tags:
 *       - Terms
 *     summary: Get terms acceptance status for all users
 *     description: Retrieve acceptance status of current terms for all users in the system (requires admin:users permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceptance status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 acceptances:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       userName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       hasAccepted:
 *                         type: boolean
 *                       acceptedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       termsVersion:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

### POST /api/terms/accept
```javascript
/**
 * @openapi
 * /api/terms/accept:
 *   post:
 *     tags:
 *       - Terms
 *     summary: Accept latest terms and conditions
 *     description: Record the current user's acceptance of the latest terms and conditions (available to all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accepted:
 *                 type: boolean
 *                 description: Must be true to accept terms
 *     responses:
 *       200:
 *         description: Terms accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 acceptance:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     termsId:
 *                       type: integer
 *                     acceptedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
```

---

## Image Upload Route (1 route)

### POST /api/global-mods/upload/image
```javascript
/**
 * @openapi
 * /api/global-mods/upload/image:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload an image
 *     description: Upload an image for sample images and category cards (requires admin:manufacturers permission)
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
 *                 description: Image file to upload (JPEG, PNG, WebP, GIF)
 *               category:
 *                 type: string
 *                 description: Category for the image (e.g., 'global-mod', 'sample', 'category-card')
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
 *                 message:
 *                   type: string
 *                 imagePath:
 *                   type: string
 *                   description: Path to the uploaded image
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                   description: Full URL to access the uploaded image
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

---

## Summary

### Routes Documented:
- **Collections**: 6 routes
- **Calendar**: 1 route
- **Resources**: 18 routes (categories, announcements, links, files with thumbnails)
- **Terms & Conditions**: 4 routes
- **Image Upload**: 1 route

**Total: 30 routes documented**

### Key Features:
- Complete request/response schemas
- Security requirements (bearerAuth, queryAuth)
- All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Path and query parameters
- Multipart/form-data for file uploads
- Error response references
- Detailed descriptions and examples

### Implementation Notes:
1. Add these JSDoc blocks directly above their corresponding `router.METHOD()` calls
2. Ensure the OpenAPI component schemas are defined in your swagger configuration
3. The `$ref` paths assume standard component definitions
4. Query token authentication (`attachTokenFromQuery()`) is documented as `queryAuth` security scheme
5. All routes maintain consistent response formatting and error handling
