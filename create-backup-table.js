const sequelize = require('./config/db');
const CatalogUploadBackup = require('./models/CatalogUploadBackup');

async function createBackupTable() {
    try {
        console.log('Creating catalog_upload_backups table...');
        
        await sequelize.sync({ alter: true });
        
        console.log('✅ catalog_upload_backups table created successfully');
        console.log('The table has the following columns:');
        console.log('- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('- manufacturer_id (INTEGER, NOT NULL)');
        console.log('- upload_session_id (STRING, UNIQUE, NOT NULL)');
        console.log('- filename (STRING, NOT NULL)');
        console.log('- original_name (STRING, NOT NULL)');
        console.log('- backup_data (JSON, NOT NULL)');
        console.log('- items_count (INTEGER, NOT NULL)');
        console.log('- uploaded_at (DATE, DEFAULT NOW)');
        console.log('- rolled_back_at (DATE, NULLABLE)');
        console.log('- is_rolled_back (BOOLEAN, DEFAULT FALSE)');
        console.log('- uploaded_by (INTEGER, NULLABLE)');
        console.log('- createdAt (DATE, AUTO)');
        console.log('- updatedAt (DATE, AUTO)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating backup table:', error);
        process.exit(1);
    }
}

createBackupTable();
