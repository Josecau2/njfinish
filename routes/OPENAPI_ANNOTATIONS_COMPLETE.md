# OpenAPI Annotations for Notification, Contractor, Lead, and Contact Routes

This file contains comprehensive OpenAPI JSDoc annotations for all notification, contractor, lead, and contact-related routes in `routes/apiRoutes.js`.

## Summary

This documentation covers **23 routes** across 4 categories:
- **Leads**: 3 routes (1 public, 2 admin)
- **Notifications**: 4 routes (authenticated users)
- **Contractors**: 5 routes (admin-only)
- **Contacts**: 11 routes (authenticated users, some admin-only)

---

## LEAD ROUTES

### POST /api/request-access
```javascript
/**
 * @openapi
 * /api/request-access:
 *   post:
 *     tags:
 *       - Leads
 *     summary: Submit a request for access (lead submission)
 *     description: Public endpoint for submitting access requests. Rate limited to 5 requests per 15 minutes per IP. Creates or updates a lead record and sends notification emails to admins and the requester.
 *     security: []
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
 *                 description: Full name of the requester
 *                 maxLength: 191
 *               firstName:
 *                 type: string
 *                 description: First name (optional if name is provided)
 *                 maxLength: 191
 *               lastName:
 *                 type: string
 *                 description: Last name (optional if name is provided)
 *                 maxLength: 191
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the requester
 *               company:
 *                 type: string
 *                 description: Company name
 *                 maxLength: 191
 *               message:
 *                 type: string
 *                 description: Message or reason for access request
 *                 maxLength: 2000
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 maxLength: 32
 *               city:
 *                 type: string
 *                 description: City
 *                 maxLength: 191
 *               state:
 *                 type: string
 *                 description: State (auto-uppercase if <=3 chars)
 *                 maxLength: 64
 *               zip:
 *                 type: string
 *                 description: ZIP/postal code
 *                 maxLength: 32
 *     responses:
 *       201:
 *         description: Lead submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Success message (customizable via admin settings)
 *                 lead:
 *                   $ref: '#/components/schemas/Lead'
 *                 notifications:
 *                   type: object
 *                   properties:
 *                     adminEmailSent:
 *                       type: boolean
 *                     userEmailSent:
 *                       type: boolean
 *       400:
 *         description: Validation error (missing required fields or invalid email format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email is required.
 *       429:
 *         description: Rate limit exceeded (5 requests per 15 minutes)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests, please try again later.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/admin/leads
```javascript
/**
 * @openapi
 * /api/admin/leads:
 *   get:
 *     tags:
 *       - Leads
 *     summary: List all leads
 *     description: Retrieve all lead submissions with optional filtering by status and search (requires admin:leads permission)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (comma-separated for multiple). Allowed values - new, reviewing, contacted, closed
 *         example: new,reviewing
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across name, firstName, lastName, email, company, phone, city, state, zip
 *     responses:
 *       200:
 *         description: Leads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 leads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### PATCH/PUT /api/admin/leads/{id}
```javascript
/**
 * @openapi
 * /api/admin/leads/{id}:
 *   patch:
 *     tags:
 *       - Leads
 *     summary: Update a lead (PATCH)
 *     description: Update lead status and/or add admin notes (requires admin:leads permission)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, reviewing, contacted, closed]
 *                 description: New status for the lead
 *               adminNote:
 *                 type: string
 *                 description: Admin note to add to the lead history
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lead:
 *                   $ref: '#/components/schemas/Lead'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status or no updates provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     tags:
 *       - Leads
 *     summary: Update a lead (PUT)
 *     description: Update lead status and/or add admin notes (requires admin:leads permission). Same functionality as PATCH.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, reviewing, contacted, closed]
 *                 description: New status for the lead
 *               adminNote:
 *                 type: string
 *                 description: Admin note to add to the lead history
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lead:
 *                   $ref: '#/components/schemas/Lead'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status or no updates provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

---

## NOTIFICATION ROUTES

### GET /api/notifications
```javascript
/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get user notifications
 *     description: Retrieve paginated list of notifications for the authenticated user with optional filtering
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
 *           default: 20
 *           maximum: 100
 *         description: Number of notifications per page (max 100)
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread notifications
 *       - in: query
 *         name: read_only
 *         schema:
 *           type: boolean
 *         description: Filter to show only read notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type (e.g., system, contact.message, contact.reply)
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 unreadCount:
 *                   type: integer
 *                   description: Total number of unread notifications
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/notifications/unread-count
```javascript
/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread notification count
 *     description: Retrieve the count of unread notifications for the authenticated user
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 unreadCount:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### POST /api/notifications/{id}/read
```javascript
/**
 * @openapi
 * /api/notifications/{id}/read:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the authenticated user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: integer
 *                   description: The notification ID that was marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### POST /api/notifications/mark-all-read
```javascript
/**
 * @openapi
 * /api/notifications/mark-all-read:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     description: Mark all unread notifications as read for the authenticated user
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 updated:
 *                   type: integer
 *                   description: Number of notifications that were marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

---

## CONTRACTOR ROUTES

### GET /api/contractors
```javascript
/**
 * @openapi
 * /api/contractors:
 *   get:
 *     tags:
 *       - Contractors
 *     summary: List all contractor groups
 *     description: Retrieve all contractor groups with statistics including user count, customer count, and proposal count (requires contractors:read permission)
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
 *           default: 10
 *         description: Number of contractors per page
 *     responses:
 *       200:
 *         description: Contractors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       modules:
 *                         type: object
 *                       user_count:
 *                         type: integer
 *                       customer_count:
 *                         type: integer
 *                       proposal_count:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/contractors/{groupId}
```javascript
/**
 * @openapi
 * /api/contractors/{groupId}:
 *   get:
 *     tags:
 *       - Contractors
 *     summary: Get contractor group details
 *     description: Retrieve detailed information about a specific contractor group including users and statistics (requires contractors:read permission)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contractor group ID
 *     responses:
 *       200:
 *         description: Contractor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     group_type:
 *                       type: string
 *                       example: contractor
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     stats:
 *                       type: object
 *                       properties:
 *                         user_count:
 *                           type: integer
 *                         customer_count:
 *                           type: integer
 *                         proposal_count:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/contractors/{groupId}/proposals
```javascript
/**
 * @openapi
 * /api/contractors/{groupId}/proposals:
 *   get:
 *     tags:
 *       - Contractors
 *     summary: Get contractor proposals
 *     description: Retrieve all proposals for a specific contractor group with optional filtering and search (requires contractors:read permission)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contractor group ID
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
 *           default: 10
 *         description: Number of proposals per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by proposal status (e.g., draft, sent, accepted)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by proposal title, description, or customer name
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/contractors/{groupId}/customers
```javascript
/**
 * @openapi
 * /api/contractors/{groupId}/customers:
 *   get:
 *     tags:
 *       - Contractors
 *     summary: Get contractor customers
 *     description: Retrieve all customers for a specific contractor group with proposal counts and optional search (requires contractors:read permission)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contractor group ID
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
 *           default: 10
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name or email
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     allOf:
 *                       - $ref: '#/components/schemas/Customer'
 *                       - type: object
 *                         properties:
 *                           proposal_count:
 *                             type: integer
 *                             description: Number of proposals for this customer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/proposals/{proposalId}/details
```javascript
/**
 * @openapi
 * /api/proposals/{proposalId}/details:
 *   get:
 *     tags:
 *       - Contractors
 *     summary: Get proposal details for contractor view
 *     description: Retrieve detailed information about a specific proposal including customer information (requires contractors:read permission)
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Proposal details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Proposal'
 *                     - type: object
 *                       properties:
 *                         customer:
 *                           $ref: '#/components/schemas/Customer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

---

## CONTACT ROUTES

### GET /api/contact/info
```javascript
/**
 * @openapi
 * /api/contact/info:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get contact information
 *     description: Retrieve the admin-configured contact information displayed to users
 *     responses:
 *       200:
 *         description: Contact info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContactInfo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### PUT /api/contact/info
```javascript
/**
 * @openapi
 * /api/contact/info:
 *   put:
 *     tags:
 *       - Contacts
 *     summary: Update contact information
 *     description: Update the admin-configured contact information (requires admin:settings permission)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *               address:
 *                 type: string
 *                 description: Physical address
 *               hours:
 *                 type: string
 *                 description: Business hours
 *               message:
 *                 type: string
 *                 description: Additional contact message or instructions
 *     responses:
 *       200:
 *         description: Contact info updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContactInfo'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### POST /api/contact/threads
```javascript
/**
 * @openapi
 * /api/contact/threads:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Create a new contact thread
 *     description: Create a new message thread to contact admins. Automatically notifies all admin users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Thread subject line
 *               message:
 *                 type: string
 *                 description: Initial message content
 *     responses:
 *       200:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     threadId:
 *                       type: integer
 *       400:
 *         description: Subject and message are required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/contact/threads
```javascript
/**
 * @openapi
 * /api/contact/threads:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: List contact threads
 *     description: List all contact threads for the authenticated user. Admins can see all threads; contractors see only their own.
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
 *           default: 20
 *           maximum: 100
 *         description: Number of threads per page (max 100)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Filter by thread status
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by thread subject
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID (admin only)
 *     responses:
 *       200:
 *         description: Threads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       subject:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [open, closed]
 *                       last_message_at:
 *                         type: string
 *                         format: date-time
 *                       unreadCount:
 *                         type: integer
 *                       owner:
 *                         type: object
 *                         description: User who owns the thread (admin view only)
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### GET /api/contact/threads/{id}
```javascript
/**
 * @openapi
 * /api/contact/threads/{id}:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get thread details
 *     description: Retrieve a specific contact thread with all messages and participants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     subject:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [open, closed]
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           thread_id:
 *                             type: integer
 *                           author_user_id:
 *                             type: integer
 *                           is_admin:
 *                             type: boolean
 *                           body:
 *                             type: string
 *                           read_by_recipient:
 *                             type: boolean
 *                           read_at:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           author:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                     owner:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### POST /api/contact/threads/{id}/messages
```javascript
/**
 * @openapi
 * /api/contact/threads/{id}/messages:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Post a message to a thread
 *     description: Add a new message to an existing contact thread. Automatically notifies the recipient (admin or user).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       200:
 *         description: Message posted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     thread_id:
 *                       type: integer
 *                     author_user_id:
 *                       type: integer
 *                     is_admin:
 *                       type: boolean
 *                     body:
 *                       type: string
 *       400:
 *         description: Message body is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### POST /api/contact/threads/{id}/read
```javascript
/**
 * @openapi
 * /api/contact/threads/{id}/read:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Mark thread messages as read
 *     description: Mark all unread messages from the other party in this thread as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

### POST /api/contact/threads/{id}/close
```javascript
/**
 * @openapi
 * /api/contact/threads/{id}/close:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Close a contact thread
 *     description: Close a contact thread to mark it as resolved. Can be reopened by posting a new message.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: closed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

---

## SCHEMAS

### Lead Schema
```javascript
/**
 * @openapi
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         company:
 *           type: string
 *         message:
 *           type: string
 *         phone:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zip:
 *           type: string
 *         status:
 *           type: string
 *           enum: [new, reviewing, contacted, closed]
 *         metadata:
 *           type: object
 *           description: JSON metadata including IP, userAgent, history, notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
```

### Notification Schema
```javascript
/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         recipient_user_id:
 *           type: integer
 *         type:
 *           type: string
 *           description: Notification type (e.g., system, contact.message, contact.reply)
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         payload:
 *           type: object
 *           description: Additional data related to the notification
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         action_url:
 *           type: string
 *           description: URL to navigate to when notification is clicked
 *         is_read:
 *           type: boolean
 *         read_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: integer
 *           description: User ID who created the notification
 *         created_at:
 *           type: string
 *           format: date-time
 */
```

### ContactInfo Schema
```javascript
/**
 * @openapi
 * components:
 *   schemas:
 *     ContactInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         hours:
 *           type: string
 *         message:
 *           type: string
 *         updated_by:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
```

---

## IMPLEMENTATION NOTES

### Security
- **Lead submission** (`/api/request-access`) is public but rate-limited (5 requests/15 min per IP)
- **All other routes** require authentication via JWT token
- **Admin routes** require specific permissions (admin:leads, contractors:read, admin:settings)
- **Contractor routes** are admin-only with fullAccessControl middleware

### Rate Limiting
- Lead submission: 5 requests per 15 minutes per IP
- Prevents abuse and spam

### Notifications
- Created automatically by system events (lead submission, contact messages, etc.)
- Support filtering by read status, type, and pagination
- Include action URLs for navigation

### Contact Threads
- Bidirectional messaging between users and admins
- Admins see all threads; contractors see only their own
- Automatic notifications when new messages are posted
- Threads can be closed and reopened

### Data Validation
- Lead fields have strict max lengths
- Email validation using regex pattern
- State auto-uppercase for values ≤3 chars
- All string inputs sanitized with configurable limits

### Metadata
- Leads store rich metadata: IP, user agent, history, notes
- Admin notes are timestamped and attributed
- Status changes tracked in history with timestamps
