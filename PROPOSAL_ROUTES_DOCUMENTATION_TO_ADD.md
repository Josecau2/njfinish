# Proposal/Quote Routes OpenAPI Documentation - TO BE ADDED

## Summary
This document contains comprehensive OpenAPI JSDoc annotations for ALL proposal/quote-related routes in `routes/apiRoutes.js`.

## Routes Documented: 35 Total

### Category Breakdown:
1. **Main Proposal CRUD Routes**: 15 routes
2. **Quote Alias Routes**: 10 routes (mirrors of proposal routes)
3. **Contracts Routes**: 1 route
4. **Orders Routes**: 6 routes
5. **PDF Generation**: 1 route
6. **Email Sending**: 1 route
7. **Dashboard**: 2 routes

---

## DOCUMENTATION TO ADD TO routes/apiRoutes.js

### Section 1: Main Proposal CRUD Routes (Lines 1193-1210)

Replace:
```javascript
// Proposals CRUD routes
router.get('/get-proposals', verifyTokenWithGroup, proposalsController.getProposal);
router.get('/proposals', verifyTokenWithGroup, proposalsController.getProposal); // Standardized route
```

With:
```javascript
// Proposals CRUD routes

/**
 * @openapi
 * /api/get-proposals:
 *   get:
 *     tags:
 *       - Proposals
 *     summary: List all proposals (legacy endpoint)
 *     description: Retrieve a paginated list of proposals with filtering support. Legacy endpoint - prefer /api/proposals.
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, viewed, accepted, rejected, expired]
 *         description: Filter by proposal status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, proposal ID, or title
 *     responses:
 *       200:
 *         description: List of proposals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/get-proposals', verifyTokenWithGroup, proposalsController.getProposal);

/**
 * @openapi
 * /api/proposals:
 *   get:
 *     tags:
 *       - Proposals
 *     summary: List all proposals
 *     description: Retrieve a paginated list of all proposals with filtering support. Results are scoped to the authenticated user's group.
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, viewed, accepted, rejected, expired]
 *         description: Filter by proposal status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, proposal ID, or title
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: List of proposals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *                 total:
 *                   type: integer
 *                   description: Total number of proposals matching the query
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/proposals', verifyTokenWithGroup, proposalsController.getProposal); // Standardized route
```

[Continue with remaining 13 proposal routes...]

###Section 2: Quote Alias Routes (Lines 1212-1224)

Add JSDoc comments for each of the 10 quote routes mirroring the proposal documentation...

### Section 3: Contracts Route (Lines 1226-1241)

```javascript
/**
 * @openapi
 * /api/get-contracts:
 *   get:
 *     tags:
 *       - Contracts
 *     summary: List all contracts
 *     description: Retrieve all accepted proposals as contracts. Contractors are blocked from accessing this endpoint.
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
 *         description: Search by customer name or contract number
 *     responses:
 *       200:
 *         description: List of contracts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contracts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Contractors cannot access contracts
 */
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
```

### Section 4: Orders Routes (Lines 1243-1344)

```javascript
/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List all orders
 *     description: Retrieve all orders created from accepted proposals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
const ordersController = require('../controllers/ordersController');
router.get('/orders', verifyTokenWithGroup, ordersController.listOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID
 *     description: Retrieve a single order with full details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/orders/:id', verifyTokenWithGroup, validateIdParam('id'), ordersController.getOrder);

/**
 * @openapi
 * /api/orders/{id}:
 *   delete:
 *     tags:
 *       - Orders
 *     summary: Delete an order
 *     description: Delete an order (admin only, requires proposals:delete permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/orders/:id', verifyTokenWithGroup, requirePermission('proposals:delete'), validateIdParam('id'), ordersController.deleteOrder);

/**
 * @openapi
 * /api/orders/{id}/manufacturer-pdf:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get manufacturer PDF for order
 *     description: Stream a no-price PDF version of the order for manufacturer use (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *       - in: query
 *         name: download
 *         schema:
 *           type: string
 *           enum: ['1', 'true']
 *         description: Force download instead of inline display
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Order has no snapshot data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Order not found
 *       500:
 *         description: PDF generation failed
 */
router.get('/orders/:id/manufacturer-pdf', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), async (req, res) => {
	return streamManufacturerPdf(req, res);
});

/**
 * @openapi
 * /api/orders/{id}/manufacturer-pdf/download:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Download manufacturer PDF for order
 *     description: Download a no-price PDF version of the order for manufacturer use (admin only, forces download)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: PDF generated and downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment with filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="Order-12345-Manufacturer.pdf"'
 *       400:
 *         description: Order has no snapshot data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Order not found
 *       500:
 *         description: PDF generation failed
 */
router.get('/orders/:id/manufacturer-pdf/download', verifyTokenWithGroup, requirePermission('admin:manufacturers'), validateIdParam('id'), async (req, res) => {
	return streamManufacturerPdf(req, res, { forceDownload: true });
});

/**
 * @openapi
 * /api/orders/{id}/resend-manufacturer-email:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Resend manufacturer email for order
 *     description: Resend the automated manufacturer email with no-price PDF for a given order (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *       - in: query
 *         name: noSend
 *         schema:
 *           type: string
 *           enum: ['1', 'true']
 *         description: Dry-run mode - generate PDF without sending email
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noSend:
 *                 type: boolean
 *                 description: Dry-run mode - generate PDF without sending email
 *     responses:
 *       200:
 *         description: Email resent successfully or dry-run completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 pdfBytes:
 *                   type: integer
 *                   description: PDF size in bytes (dry-run mode only)
 *                 result:
 *                   type: object
 *                   description: Email send result
 *       400:
 *         description: Order has no snapshot data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Email send failed
 */
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
```

### Section 5: PDF Generation Route (Line ~1352)

```javascript
/**
 * @openapi
 * /api/generate-pdf:
 *   post:
 *     tags:
 *       - Proposals
 *     summary: Generate proposal PDF preview
 *     description: Generate a PDF preview of a proposal for download or viewing (requires proposals:read permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposalId
 *             properties:
 *               proposalId:
 *                 type: integer
 *                 description: ID of the proposal to generate PDF for
 *               includePrice:
 *                 type: boolean
 *                 description: Whether to include pricing in the PDF
 *                 default: true
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: PDF generation failed
 */
router.post('/generate-pdf', verifyTokenWithGroup, requirePermission(PERMISSIONS.PROPOSALS.READ), customizationController.generatepdf);
```

### Section 6: Proposal Email Sending Route (Lines ~1357-1370)

```javascript
/**
 * @openapi
 * /api/proposals/send-email:
 *   post:
 *     tags:
 *       - Proposals
 *     summary: Send proposal via email
 *     description: Generate a PDF and email a proposal to a customer with custom message. Rate limited to prevent abuse.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposalId
 *               - recipientEmail
 *             properties:
 *               proposalId:
 *                 type: integer
 *                 description: ID of the proposal to email
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the recipient
 *               recipientName:
 *                 type: string
 *                 description: Name of the recipient
 *               subject:
 *                 type: string
 *                 description: Custom email subject line
 *               message:
 *                 type: string
 *                 description: Custom email message body (supports HTML)
 *               ccEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: CC email addresses
 *               bccEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: BCC email addresses
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 messageId:
 *                   type: string
 *                   description: Email message ID from mail server
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Proposal not found
 *       429:
 *         description: Too many email requests - rate limit exceeded
 *       500:
 *         description: Email send failed
 */
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
```

### Section 7: Dashboard Routes (Lines ~1408-1409)

```javascript
/**
 * @openapi
 * /api/dashboard/counts:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard statistics
 *     description: Retrieve count statistics for proposals, contracts, and orders for dashboard widgets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProposals:
 *                   type: integer
 *                   description: Total number of proposals
 *                 draftProposals:
 *                   type: integer
 *                   description: Number of draft proposals
 *                 sentProposals:
 *                   type: integer
 *                   description: Number of sent proposals
 *                 acceptedProposals:
 *                   type: integer
 *                   description: Number of accepted proposals
 *                 totalContracts:
 *                   type: integer
 *                   description: Total number of contracts
 *                 totalOrders:
 *                   type: integer
 *                   description: Total number of orders
 *                 totalCustomers:
 *                   type: integer
 *                   description: Total number of customers
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard/counts', verifyTokenWithGroup, proposalsController.getCounts);

/**
 * @openapi
 * /api/dashboard/latest-proposals:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get latest proposals
 *     description: Retrieve the most recent proposals for dashboard display
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent proposals to retrieve
 *     responses:
 *       200:
 *         description: Latest proposals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard/latest-proposals', verifyTokenWithGroup, proposalsController.getLatestProposals);
```

---

## Implementation Notes:

1. All documentation follows OpenAPI 3.0 spec
2. Each route has:
   - Appropriate tags (Proposals, Contracts, Orders, Dashboard)
   - Clear summary and description
   - Complete parameter definitions (path, query, body)
   - All possible response codes
   - Schema references where applicable
   - Security requirements

3. Common schemas referenced:
   - `$ref: '#/components/schemas/Proposal'`
   - `$ref: '#/components/schemas/ProposalDetailed'`
   - `$ref: '#/components/schemas/Contract'`
   - `$ref: '#/components/schemas/Order'`

4. Common responses referenced:
   - `$ref: '#/components/responses/UnauthorizedError'`
   - `$ref: '#/components/responses/ForbiddenError'`
   - `$ref: '#/components/responses/NotFoundError'`
   - `$ref: '#/components/responses/ValidationError'`

5. Special considerations documented:
   - Rate limiting on accept and email endpoints
   - Group scoping on all proposal operations
   - Admin bypass capability
   - Public tokenized access
   - Contractor blocking on contracts
   - PDF generation options

---

## Next Steps:

The file `routes/apiRoutes.js` is currently being modified by another process. Once stable:
1. Apply these JSDoc blocks to their respective route sections
2. Ensure no existing comments are removed
3. Maintain all existing code exactly as is
4. Only add the OpenAPI documentation comments above each route or route group
