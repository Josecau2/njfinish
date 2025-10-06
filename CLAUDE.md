# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NJCabinets** - A full-stack cabinet quotation and order management system for contractors and administrators. Built with Node.js/Express backend, React 19 frontend (Vite), MySQL database, and Sequelize ORM.

## CRITICAL FRAMEWORK RULES

### ⚠️ NEVER USE BOOTSTRAP - 100% PURE CHAKRA UI APPLICATION

- **NO Bootstrap** imports, classes, or components under any circumstances
- All styling must use Chakra UI components and system props only
- When in doubt, consult Chakra UI documentation
- ESLint enforces this rule and will block Bootstrap imports

## SYSTEMATIC APPROACH REQUIRED FOR EVERY TASK

### Planning Phase - Execute Before Any Code Changes

1. Create a detailed execution plan before writing or modifying code
2. Think logically and systematically about the entire scope of work
3. Identify all components, files, and systems that will be affected
4. Deploy multiple focused review agents to check individual aspects:
   - Agent for styling audit
   - Agent for logic and flow verification
   - Agent for imports and exports validation
   - Agent for related component impact analysis
   - Agent for API routes and data flow consistency

### Comprehensive Audit Checklist

Before and after ANY modification, verify ALL of the following:

- **Lint errors** - Run linter and resolve all issues
- **Styling** - Check overflow, spacing, alignment, responsiveness, consistency
- **Logic** - Verify code logic matches expected behavior and requirements
- **Imports and Exports** - Confirm all are properly declared and utilized
- **Headers** - Ensure correctness and consistency
- **Related components** - Identify and check everything that might be affected
- **Cascading effects** - Determine if this change creates new blockers or issues

### Scope Expansion Rule - Never Limit to Only the Specific Task

When shown an error:
- **DO NOT** just fix that one error in isolation
- **DO** fix the error AND check for subsequent blockers AND verify no new issues were introduced

When asked to style a component:
- Check if other components have the same styling issue
- Verify the modification does not trigger unwanted changes elsewhere
- Ensure visual and behavioral consistency across the application

**This principle applies to EVERYTHING, not just styling or errors.**

## LOGIC PRESERVATION PROTOCOL

### Compare Against Legacy Application

- Before making changes: Review the legacy app's exact logic for the relevant feature
- Verify that UI changes do not alter business logic, flow, API calls, or routes
- Maintain functional parity unless explicitly instructed otherwise

### Create Timestamped Backups

- Before modifying any file, create a temporary copy with timestamp
- Format: `filename_YYYYMMDD_HHMM.backup.ext`
- After changes: Compare new version against backup to verify no unintended logic changes

### For New Features Not in Legacy App

- Analyze current application logic first
- Document the intended logic flow before implementation
- Create timestamped copy before adding new feature
- Verify new feature does not break existing component logic

## QUALITY STANDARDS

### Never assume anything is working correctly

- Do not assume the situation is fixed after one change
- Do not assume your file changes were successful without verification
- Always verify subsequent errors or affected files after any modification

### Never code without understanding

- Take time to analyze and understand the context
- Be analytical, not reactive
- Understand that you have no memory between sessions
- Treat each interaction with full context awareness using these instructions

### Never cut corners

- Do not be complacent with partial solutions
- Always do what is best for the user
- Think comprehensively about direct and indirect impacts

## WORKFLOW COMPLETION PROTOCOL

After completing any task:

1. **ALWAYS ASK**: "Is what I did okay? Did this solve your issue completely?"
2. Wait for user confirmation before considering the task complete
3. If user confirms success: Append a plain text summary of the modification to `/init` file for future context
4. Format for `/init` append: Date, task description, files modified, key decisions made

## USER CONTEXT

The user has severe anxiety. Your goal is to:

- Provide a great experience by being thorough and careful
- Reduce frustration by getting things right the first time
- Build trust through systematic, complete solutions
- Communicate clearly about what you are doing and why

**Remember: Every interaction is a fresh start for you, so these instructions are your foundation for understanding what the user needs and expects.**

---

## Essential Commands

### Development
```bash
npm run dev              # Start backend server (port 8080)
npm run dev:frontend     # Start Vite dev server (port 3000, proxies to 8080)
npm run dev:monitor      # Run error monitoring script
```

### Build & Production
```bash
npm run build            # Build frontend + setup production
npm run build:frontend   # Vite production build to frontend/build/
npm run build:fast       # Fast build with dev config
npm run build:analyze    # Build with bundle analyzer
npm run clean            # Clean build artifacts and Vite cache
npm start               # Start production server
```

### Database
```bash
npm run db:migrate       # Run pending migrations (up)
npm run db:migrate:down  # Rollback last migration
npm run db:migrate:status # Check migration status
npm run db:sync          # Sync database models (use cautiously)
npm run seed:dev         # Seed development data
```

### Testing & Quality
```bash
npm run lint                    # Run ESLint
npm run test:audit              # Run Playwright tests
npm run test:audit:headed       # Run Playwright with browser UI
npm run test:audit:update       # Update Playwright snapshots
npm run test:pricing            # Test pricing calculations
npm run audit:manifest          # Generate and check file manifest
```

### Payments (Stripe)
```bash
npm run test:payments           # Run payment amount tests
```

## Architecture Overview

### Monorepo Structure
```
root/                    # Node.js/Express backend
  ├── app.js            # Express app config with security headers, CORS, CSP
  ├── index.js          # Server entry point (port 8080)
  ├── routes/           # API route handlers
  ├── controllers/      # Business logic controllers
  ├── models/           # Sequelize models (MySQL)
  ├── middleware/       # Auth, validation, etc.
  ├── services/         # Business services
  ├── utils/            # Shared utilities
  ├── scripts/          # DB migrations, seed scripts, utilities
  │   └── migrations/   # Umzug migrations
  └── frontend/         # React SPA (separate folder)
      ├── src/
      │   ├── pages/           # Page components
      │   ├── components/      # Reusable components
      │   ├── store/           # Redux Toolkit slices
      │   ├── routes.js        # Route definitions with permissions
      │   ├── App.jsx          # Root app with routing
      │   └── config/          # Auto-generated customization configs
      ├── public/
      │   └── brand/           # Branding assets (logo, customization JSON)
      └── vite.config.mjs      # Vite config with chunk splitting
```

### Key Architectural Patterns

#### Frontend (React)
- **UI Framework**: 100% Chakra UI v3 - **NEVER USE BOOTSTRAP OR COREUI COMPONENTS**
- **Icons**: `lucide-react` only (not FontAwesome, react-icons)
- **State Management**: Redux Toolkit with slice pattern (`store/slices/`)
- **Routing**: React Router v7 with permission-based route guards
- **Forms**: Transitioning from Formik to React Hook Form (check eslint rules)
- **Lazy Loading**: Code splitting with `React.lazy()` for all pages
- **Path Aliasing**: `@/` and `src/` resolve to `frontend/src/`
- **Responsive Design**: Mobile-first with Chakra breakpoints

#### Noisy URL Pattern
Edit routes use a "noisy" pattern to prevent URL guessing:
- Plain path `/quotes/edit/:id` → redirects to `/:noise1/:noise2/quotes/edit/:id`
- Implemented via `NoisyRedirects` components
- Applied to: quotes, customers, manufacturers, users, user groups, locations, contractors

#### Backend (Express)
- **Database**: MySQL via Sequelize ORM
- **Auth**: JWT tokens with `verifyTokenWithGroup` middleware
- **Security**: CSP headers, CORS, rate limiting, sanitization
- **File Uploads**: Multer with auth-protected `/uploads` endpoint
- **Brand Injection**: `withBrandInline()` injects brand JSON into index.html at runtime
- **Event System**: Domain events via `utils/eventManager`

#### Database Migrations
- **Tool**: Umzug with manual migration files in `scripts/migrations/`
- **Convention**: `YYYYMMDD-description.js` (e.g., `20250910-add-proposal-fields.js`)
- **Environment**: `DB_SYNC_MODE` controls sync behavior (`none|create|alter`)

#### Customization System
- **App Customization**: Colors, logo, company name stored in `Customization` model
- **Login Customization**: Login page branding in `LoginCustomization` model
- **PDF Customization**: PDF layout settings in `PdfCustomization` model
- **Persistence**: Auto-written to `frontend/public/assets/customization/*.json` on server start
- **Frontend Config**: Auto-generated to `frontend/src/config/customization.js` and `loginCustomization.js`

#### Permission System
- Routes in `routes.js` define `permission`, `adminOnly`, or `contractorBlock` flags
- Middleware `verifyTokenWithGroup` validates user permissions
- User groups have granular permissions (e.g., `customers:read`, `proposals:update`)

### Important Files

| File | Purpose |
|------|---------|
| `app.js` | Express app setup, middleware, security headers, brand injection |
| `frontend/src/routes.js` | All app routes with lazy loading and permissions |
| `frontend/vite.config.mjs` | Vite config with vendor chunk splitting and proxy to backend |
| `frontend/eslint.config.mjs` | ESLint rules enforcing Chakra UI, lucide-react, accessibility |
| `scripts/migrate.js` | Database migration runner |
| `config/db.js` | Sequelize instance |
| `models/index.js` | Model associations |

### Environment Variables

Required in `.env`:
```bash
# Database
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_PORT=3306
DB_NAME=
DB_SYNC_MODE=none  # none|create|alter (use 'none' in production)

# Auth
JWT_SECRET=

# Email (Gmail)
GMAIL_USER=
GMAIL_APP_PASS=

# App
PORT=8080
APP_URL=http://localhost:8080
NODE_ENV=production|development

# Static files (optional)
STATIC_DIR=./frontend/build

# Logging
KEEP_LOGS=false  # Set to 'true' to enable console logs
```

## Critical Development Rules

### UI Framework
- **NEVER USE BOOTSTRAP** - This application is 100% Chakra UI
- No Bootstrap imports, classes (`className="row"`, `className="col-md-6"`), or components
- All styling uses Chakra UI components and system props
- ESLint enforces this: imports from `@coreui/*` are blocked

### Icons
- Use `lucide-react` only
- ESLint blocks: `@fortawesome/*`, `react-icons/*`, `font-awesome/*`

### Accessibility
- All interactive elements must have proper ARIA labels
- Modal close buttons require `aria-label="Close modal"`
- Strict a11y rules enforced by ESLint

### Internationalization
- Use `react-i18next` for all user-facing strings
- ESLint warns on hardcoded string literals in JSX
- Translation files in `frontend/src/i18n/locales/`

### Code Quality
- Run `npm run lint` before commits
- Playwright tests cover critical user flows
- Accessibility tests via `@axe-core/playwright`

## Testing

### Playwright Tests
```bash
npm run test:audit              # Headless run
npm run test:audit:headed       # Watch in browser
npm run test:audit:update       # Update snapshots
```

Tests located in `/tests` directory. Base URL: `http://localhost:8080`

### Unit Tests
```bash
npm run test:payments           # Payment calculations (Node test runner)
```

## Common Workflows

### Adding a New Page
1. Create page component in `frontend/src/pages/[category]/`
2. Add lazy import in `frontend/src/routes.js`
3. Add route definition with permissions
4. Update navigation in `frontend/src/_nav.js` if needed

### Database Schema Changes
1. Create migration: `scripts/migrations/YYYYMMDD-description.js`
2. Update Sequelize model in `models/`
3. Run: `npm run db:migrate`
4. Update `models/index.js` if adding associations

### Customization Changes
1. Update model: `Customization`, `LoginCustomization`, or `PdfCustomization`
2. Backend auto-writes to `frontend/public/assets/customization/*.json`
3. Frontend auto-imports from `frontend/src/config/customization.js`
4. Server restart required for changes to apply

### Creating a Modal
- Use Chakra UI `Modal`, `ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`
- Add `ModalCloseButton` with `aria-label="Close modal"`
- Ensure responsive design with `size={{ base: 'full', md: 'xl' }}`
- Support dark mode with `useColorModeValue` where needed

### Working with Proposals/Quotes
- Proposals have sections (`ProposalSection`) with items (`ProposalSectionItem`)
- Items reference catalog data (`manufacturerCatalogData`)
- Global modifications via `GlobalModificationTemplate` + `GlobalModificationAssignment`
- Manufacturer-specific mods via `ManufacturerModificationDetails`
- Pricing locked when proposal status changes (see `lockedPricing` field)

## Special Notes

### Static Asset Serving
- Frontend build output: `frontend/build/`
- Backend serves SPA from `STATIC_DIR` (defaults to `build/`)
- Brand assets served from `/brand` with no-cache headers
- Index.html has brand JSON injected server-side for instant customization

### Proxy Setup (Development)
- Vite dev server (`:3000`) proxies `/api` requests to Express (`:8080`)
- Run both servers: `npm run dev` (backend) + `npm run dev:frontend` (frontend)

### Security
- CSP headers with nonce for inline scripts
- Stripe, Cloudflare Analytics allowed in CSP
- CORS configured via `CORS_ALLOWED_ORIGINS` env
- JWT tokens in `Authorization: Bearer <token>` header
- File uploads require auth token in query param for direct access

### Performance
- Vendor chunk splitting in Vite for optimal caching
- React/Emotion/Framer dedupe to prevent duplicate bundles
- Lazy loading for all pages
- Production builds drop console logs and minify with Terser
