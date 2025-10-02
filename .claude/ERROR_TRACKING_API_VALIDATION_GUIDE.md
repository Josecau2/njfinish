# Error Tracking & API Validation - Quick Start Guide 🐛📡

## 🐛 Sentry MCP - Runtime Error Tracking

### What It Does
Track and monitor runtime errors in your NJ Cabinets application. Get AI-powered insights into production issues.

### Setup (Optional - Requires Sentry Account)

1. **Create Free Sentry Account:**
   - Go to https://sentry.io/signup/
   - Create an organization and project
   - Choose "Node.js" or "Express" as your platform

2. **Get Auth Token:**
   - Settings → Account → API Keys
   - Create new token with scopes:
     - `event:read`
     - `project:read`
     - `org:read`
   - Copy the token

3. **Configure MCP:**
   Edit `.claude/mcp.json`:
   ```json
   "sentry": {
     "env": {
       "SENTRY_ACCESS_TOKEN": "your_token_here",
       "SENTRY_HOST": "https://sentry.io"
     }
   }
   ```

4. **Install Sentry in Your App (Optional):**
   ```bash
   npm install @sentry/node @sentry/express
   ```

   Add to your `app.js`:
   ```javascript
   const Sentry = require('@sentry/node');

   Sentry.init({
     dsn: 'your-sentry-dsn',
     tracesSampleRate: 1.0,
   });
   ```

### Usage Examples

Once configured, ask Claude:

**Find Errors:**
```
"Show me all errors from the last 24 hours"
"What are the top 5 most common errors in production?"
"Find all TypeErrors in the proposals module"
```

**Debug Issues:**
```
"Show me the stack trace for error ID abc123"
"What users are affected by this TypeError?"
"When did this error first start occurring?"
```

**Monitor Performance:**
```
"What's the error rate for the last week?"
"Show me errors that only happen on mobile"
"Which API endpoints are throwing the most errors?"
```

**AI-Powered Search:**
```
"Find errors related to Stripe payment failures"
"Show me all database connection issues"
"What errors are happening during proposal generation?"
```

### Benefits

- 🚨 **Real-time Alerts** - Know immediately when errors occur
- 📊 **Trends** - See error patterns over time
- 🎯 **User Impact** - Understand which users are affected
- 🔍 **Stack Traces** - Full error context for debugging
- 🤖 **AI Search** - Natural language error queries

---

## 📡 OpenAPI/Swagger MCP - API Route Validation

### What It Does
Validate your API routes, check consistency, and generate documentation from OpenAPI/Swagger specifications.

### Option 1: If You Have an OpenAPI Spec

If you already have a `swagger.json` or `openapi.yaml`:

```
"Load the OpenAPI spec from ./swagger.json and list all endpoints"
"Check if all routes have proper authentication"
"Find endpoints missing request validation"
```

### Option 2: Generate OpenAPI Spec from Your Express App

Your NJ Cabinets app uses Express. Let's generate an OpenAPI spec:

#### Method 1: Using swagger-jsdoc (Recommended)

1. **Install:**
   ```bash
   npm install swagger-jsdoc swagger-ui-express
   ```

2. **Create `swagger.js`:**
   ```javascript
   const swaggerJsdoc = require('swagger-jsdoc');

   const options = {
     definition: {
       openapi: '3.0.0',
       info: {
         title: 'NJ Cabinets API',
         version: '8.2.3',
         description: 'Cabinet ordering and proposal management API',
       },
       servers: [
         {
           url: 'http://localhost:8080',
           description: 'Development server',
         },
       ],
     },
     apis: ['./routes/*.js'], // Path to your route files
   };

   const specs = swaggerJsdoc(options);
   module.exports = specs;
   ```

3. **Add to `app.js`:**
   ```javascript
   const swaggerUi = require('swagger-ui-express');
   const swaggerSpecs = require('./swagger');

   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
   ```

4. **Document Your Routes:**
   In your route files (e.g., `routes/proposals.js`):
   ```javascript
   /**
    * @openapi
    * /api/proposals:
    *   get:
    *     summary: Get all proposals
    *     description: Returns a list of all proposals for the authenticated user
    *     tags: [Proposals]
    *     security:
    *       - BearerAuth: []
    *     responses:
    *       200:
    *         description: Successful response
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 $ref: '#/components/schemas/Proposal'
    */
   router.get('/api/proposals', authenticate, getProposals);
   ```

#### Method 2: Using swagger-autogen (Faster)

1. **Install:**
   ```bash
   npm install swagger-autogen
   ```

2. **Create `swagger-autogen.js`:**
   ```javascript
   const swaggerAutogen = require('swagger-autogen')();

   const doc = {
     info: {
       title: 'NJ Cabinets API',
       description: 'API documentation',
       version: '8.2.3'
     },
     host: 'localhost:8080',
     schemes: ['http'],
   };

   const outputFile = './swagger.json';
   const endpointsFiles = ['./app.js']; // Your main app file

   swaggerAutogen(outputFile, endpointsFiles, doc);
   ```

3. **Generate:**
   ```bash
   node swagger-autogen.js
   ```

### Usage Examples

Once you have an OpenAPI spec:

**Explore API:**
```
"List all API endpoints with their HTTP methods"
"Show me all POST endpoints"
"What endpoints are in the /api/proposals namespace?"
```

**Validate Consistency:**
```
"Check if all routes follow RESTful naming conventions"
"Find endpoints missing authentication"
"Show me routes with inconsistent response formats"
```

**Generate Code:**
```
"Generate TypeScript types from the OpenAPI spec"
"Create Zod validators for the Proposal schema"
"Generate React Query hooks for the API"
```

**Check Quality:**
```
"Which endpoints are missing descriptions?"
"Show me routes without request validation"
"Find endpoints with missing error responses"
```

**Documentation:**
```
"Generate API documentation markdown"
"Create a client SDK from the OpenAPI spec"
"Show me example requests for each endpoint"
```

### Benefits

- ✅ **Route Consistency** - Ensure all endpoints follow conventions
- 📝 **Auto Documentation** - Generate docs from code
- 🔒 **Security Checks** - Find missing authentication
- 🎯 **Type Safety** - Generate TypeScript types
- 🧪 **Testing** - Generate test fixtures from schemas

---

## 🎯 Real-World Scenarios

### Scenario 1: Debugging a Production Error

```
User: "We're getting 500 errors on the proposals endpoint"

You: "Use the Sentry MCP to show me all 500 errors in the last hour"
→ Claude shows error details, stack traces, user impact

You: "Show me the stack trace for error abc123"
→ Claude provides full error context

You: "Use the filesystem MCP to open routes/proposals.js at line 45"
→ Claude shows the problematic code

You: "Fix this error"
→ Claude fixes the bug
```

### Scenario 2: API Consistency Audit

```
You: "Use the OpenAPI MCP to check if all my routes follow REST conventions"
→ Claude analyzes your API structure

You: "Find endpoints missing authentication"
→ Claude lists unprotected routes

You: "Generate a security report"
→ Claude creates comprehensive security audit

You: "Fix all routes to require authentication"
→ Claude adds auth middleware to vulnerable routes
```

### Scenario 3: New Feature with Quality Checks

```
You: "Create a new endpoint for updating customer addresses"
→ Claude creates the route

You: "Add OpenAPI documentation for this endpoint"
→ Claude adds JSDoc comments

You: "Validate it matches our API conventions"
→ Claude checks against existing patterns

You: "Add error tracking for this endpoint"
→ Claude adds Sentry error capture

You: "Generate TypeScript types for the request/response"
→ Claude creates type definitions
```

---

## 🚀 Quick Commands to Try Now

### Test Sentry (if configured):
```
"Show me all errors from today"
"What's the most common error in production?"
```

### Test OpenAPI (after generating spec):
```
"List all API endpoints"
"Check for missing authentication"
"Generate TypeScript types for the Proposal model"
```

### Combined Power:
```
"Find all errors on the /api/orders endpoint, then check if that
endpoint has proper validation in the OpenAPI spec"
```

---

## 📚 Additional Resources

**Sentry:**
- [Sentry Node.js Setup](https://docs.sentry.io/platforms/node/)
- [Sentry Express Integration](https://docs.sentry.io/platforms/node/guides/express/)
- [Error Monitoring Best Practices](https://blog.sentry.io/category/best-practices/)

**OpenAPI/Swagger:**
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [swagger-jsdoc Guide](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Setup](https://github.com/scottie1984/swagger-ui-express)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)

**Your Project:**
Your Express app has these routes to document:
- `/routes/` - 15+ route files
- `/controllers/` - Business logic
- `/models/` - 40+ Sequelize models

Start by documenting your most-used endpoints first!

---

**Pro Tip:** Combine these MCPs with:
- **MySQL MCP** - Validate database schemas match API responses
- **Git MCP** - Track when errors were introduced
- **Filesystem MCP** - Quickly navigate to problematic files
- **Chakra UI MCP** - Build error display components

**Next Steps:**
1. Set up Sentry (optional but recommended)
2. Generate OpenAPI spec for your API
3. Start monitoring errors
4. Validate API consistency

🎉 **You're now equipped with professional-grade error tracking and API validation!**
