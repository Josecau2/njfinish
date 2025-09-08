# Migration Management for NJ Cabinets

## Overview
This document outlines the migration system for the NJ Cabinets application, ensuring all database schema changes are properly applied during container deployments.

## Migration Directories
The application uses two migration directories:
- `scripts/migrations/` - Primary migration directory (used by Dockerfile)
- `migrations/` - Legacy/additional migrations (also processed)

## Docker Integration
Migrations are automatically applied during container startup via the Dockerfile CMD:
```dockerfile
CMD ["sh", "-lc", "node scripts/wait-for-db.js && node scripts/migrate.js up && node index.js"]
```

## Available Migrations

### Core Migrations (scripts/migrations/)
1. `00000000000000-initial-baseline.js` - Database baseline
2. `20241229-create-manufacturer-subtypes.js` - Manufacturer subtypes system
3. `20250101-contacts-and-terms.js` - Contact and terms management
4. `20250106-add-user-address-company-fields.js` - User address/company fields
5. `20250107-add-order-snapshot-to-proposals.js` - Order snapshots
6. `20250203-global-modifications.js` - Global modifications system
7. `20250903-blueprint-manufacturer-isolation.js` - Blueprint isolation
8. `20250903-global-mods-tables.js` - Global modifications tables
9. `20250903-manufacturer-mods-tables.js` - Manufacturer modifications tables
10. `20250904-add-locked-pricing-to-proposals.js` - Locked pricing
11. `20250904-fix-category-unique-index.js` - Category indexing
12. `20250905-create-orders-table.js` - Orders system
13. `20250905-ensure-orders-columns.js` - Orders schema validation
14. `20250907-create-payment-configurations.js` - Payment configurations
15. `20250907-create-payments.js` - Payments system

## Migration Execution

### Manual Execution
```bash
# Run all pending migrations
node scripts/migrate.js up

# Check migration status
node scripts/migrate.js status

# Rollback last migration (use with caution)
node scripts/migrate.js down

# List all available migrations
node scripts/list-migrations.js
```

### Docker Execution
Migrations are automatically executed during container startup:
1. Container starts
2. `wait-for-db.js` ensures database connectivity
3. `migrate.js up` applies all pending migrations
4. Application starts (`index.js`)

## Backup Strategy
When `DB_BACKUP_ON_MIGRATE=true` and `NODE_ENV=production`, the migration script will:
1. Create a database backup before applying migrations
2. Store backup in `/app/backups/` directory
3. Use timestamp format: `backup-{DB_NAME}-{timestamp}.sql`

## Migration Development
When adding new migrations:
1. Place migration files in `scripts/migrations/` directory
2. Use timestamp prefix format: `YYYYMMDD-description.js`
3. Include both `up` and `down` methods
4. Test locally before deployment

## Troubleshooting

### Check Migration Status
```bash
docker exec -it njcabinets-app node scripts/migrate.js status
```

### Manual Migration Run
```bash
docker exec -it njcabinets-app node scripts/migrate.js up
```

### View Migration Logs
```bash
docker logs njcabinets-app | grep -i migration
```

## Environment Variables
- `DB_BACKUP_ON_MIGRATE` - Enable backup before migrations (production)
- `BACKUP_DIR` - Backup directory path (default: `/app/backups`)
- `NODE_ENV` - Environment (backup only in production)

## Important Notes
1. All migrations are automatically included in Docker builds
2. Duplicate migrations (same filename) are filtered out
3. Migrations run in alphabetical order by filename
4. Database backup is created in production before migrations
5. Migration state is tracked in `SequelizeMeta` table
