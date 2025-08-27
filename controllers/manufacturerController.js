const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parseCatalogFile } = require('../utils/parseCatalogFile');
const upload = require('../middleware/upload'); // Your multer setup
const uploadCatalogOnly = require('../middleware/uploadCatalogOnly'); // Your multer setup
const { Manufacturer, ManufacturerCatalogData, Collection, CatalogUploadBackup } = require('../models');
const { ManufacturerCatalogFile } = require('../models/ManufacturerCatalogFile');
const ManufacturerStyleCollection = require('../models/ManufacturerStyleCollection');
const ManufacturerAssemblyCost = require('../models/ManufacturerAssemblyCost');
const ManufacturerHingesDetails = require('../models/ManufacturerHingesDetails');
const ManufacturerModificationDetails = require('../models/ManufacturerModificationDetails');
const imageLogger = require('../utils/imageLogger');
const { v4: uuidv4 } = require('uuid');
const Sequelize = require('sequelize');
const { Op } = Sequelize;


const fetchManufacturer = async (req, res) => {
    try {
        const manufacturers = await Manufacturer.findAll();
        res.json(manufacturers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
};

const addManufacturer = async (req, res) => {
    const isDev = process.env.NODE_ENV !== 'production';
    
    try {
        upload.fields([
            { name: 'catalogFiles', maxCount: 10 },
            { name: 'manufacturerImage', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                console.error('Multer error:', err && err.message ? err.message : err);
                return res.status(400).json({ message: err.message });
            }
            // Avoid logging raw form data in production
            const {
                name,
                email,
                phone,
                address,
                website,
                isPriceMSRP,
                costMultiplier,
                instructions
            } = req.body;

            if (!name || !email || !phone || !address || !website || !costMultiplier) {
                return res.status(400).json({ message: 'Please provide all required fields' });
            }

            const manufacturerImage = req.files?.['manufacturerImage']?.[0];
            const catalogFiles = req.files?.['catalogFiles'] || [];
            const imagePath = manufacturerImage?.filename || null;

            // Log image upload
            if (manufacturerImage) {
                imageLogger.logUpload(
                    manufacturerImage.filename,
                    manufacturerImage.fieldname,
                    manufacturerImage.size
                );
            }

            try {
                const newManufacturer = await Manufacturer.create({
                    name,
                    email,
                    phone,
                    address,
                    website,
                    isPriceMSRP: isPriceMSRP === 'true',
                    costMultiplier: parseFloat(costMultiplier),
                    instructions: instructions || '',
                    image: imagePath
                });

                if (catalogFiles.length > 0) {
                    const file = catalogFiles[0];

                    try {
                        const parsedData = await parseCatalogFile(file.path, file.mimetype);
                        if (Array.isArray(parsedData) && parsedData.length > 0) {
                            const saveData = parsedData.map(row => ({
                                manufacturerId: newManufacturer.id,
                                ...row
                            }));
                            await ManufacturerCatalogData.bulkCreate(saveData);
                            //Save file metadata to DB
                            await ManufacturerCatalogFile.create({
                                manufacturer_id: newManufacturer.id,
                                filename: file.filename,
                                original_name: file.originalname,
                                file_path: file.path,
                                file_size: file.size,
                                mimetype: file.mimetype
                            });

                        }
                    } catch (parseError) {
                        console.error(`Error parsing file "${file.originalname}":`, parseError && parseError.message ? parseError.message : parseError);
                    }
                }
                return res.status(201).json({
                    success: true,
                    status: 200,
                    message: 'Manufacturer added successfully',
                    manufacturer: newManufacturer
                });

            } catch (dbError) {
                // Cleanup uploaded files in case of DB error
                Object.values(req.files || {}).flat().forEach(file => {
                    fs.unlink(file.path, err => {
                        if (err) console.error('Failed to delete file:', err);
                    });
                });

                return res.status(500).json({ message: 'Database error', error: dbError.message });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Unexpected error', error: error.message });
    }
};

const updateManufacturerStatus = async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;
    try {
        const manufacturer = await Manufacturer.findByPk(id);
        if (!manufacturer) {
            return res.status(404).json({ message: 'Manufacturer not found' });
        }

        // Update only the enabled status
        manufacturer.status = enabled;
        await manufacturer.save();

        return res.json({ message: 'Manufacturer status updated successfully', manufacturer });
    } catch (error) {
        console.error('Error updating manufacturer status:', error);
        return res.status(500).json({ message: 'Failed to update manufacturer status', error: error.message });
    }
};

const fetchManufacturerById = async (req, res) => {
    const { id } = req.params;

    try {
        // Get query parameters for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; // Default to 100 items per page
        const offset = (page - 1) * limit;
        const includeCatalog = req.query.includeCatalog !== 'false'; // Default to true, but allow disabling
        
        // Build includes array conditionally to prevent memory overflow
        const includes = [];
        
        // Always include style collections and catalog files (these are typically smaller)
        includes.push(
            {
                model: ManufacturerStyleCollection,
                as: 'collectionsstyles',
                order: [['createdAt', 'DESC']]
            },
            {
                model: ManufacturerCatalogFile,
                as: 'catalogFiles',
                order: [['createdAt', 'DESC']]
            }
        );
        
        // Only include catalog data if requested (with pagination to prevent memory overflow)
        if (includeCatalog) {
            includes.push({
                model: ManufacturerCatalogData,
                as: 'catalogData',
                limit: limit,
                offset: offset,
                order: [['createdAt', 'DESC']]
            });
        }

        const manufacturer = await Manufacturer.findOne({
            where: { id },
            include: includes,
            order: [['createdAt', 'DESC']]
        });

        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // If catalog data was requested, also return pagination info
        let response = { manufacturer };
        
        if (includeCatalog) {
            // Get total count of catalog items for pagination
            const totalCatalogItems = await ManufacturerCatalogData.count({
                where: { manufacturerId: id }
            });
            
            response.pagination = {
                page,
                limit,
                total: totalCatalogItems,
                totalPages: Math.ceil(totalCatalogItems / limit),
                hasNext: page < Math.ceil(totalCatalogItems / limit),
                hasPrev: page > 1
            };
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch manufacturer and related data',
            details: error.message
        });
    }
};

const updateManufacturer = async (req, res) => {
    const manufacturerId = req.params.id;

    upload.fields([
        { name: 'catalogFiles', maxCount: 10 },
        { name: 'manufacturerImage', maxCount: 1 }
    ])(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        const {
            name,
            email,
            phone,
            address,
            website,
            isPriceMSRP,
            costMultiplier,
            instructions
        } = req.body;

        const manufacturerImage = req.files?.['manufacturerImage']?.[0];
        const catalogFiles = req.files?.['catalogFiles'] || [];
        const imagePath = manufacturerImage?.filename || null;

        // Log image upload for updates
        if (manufacturerImage) {
            imageLogger.logUpload(
                manufacturerImage.filename,
                manufacturerImage.fieldname,
                manufacturerImage.size,
                manufacturerId
            );
        }

        try {
            const manufacturer = await Manufacturer.findByPk(manufacturerId);

            if (!manufacturer) {
                return res.status(404).json({ message: 'Manufacturer not found' });
            }

            // Optional: delete old image if replaced
            if (imagePath && manufacturer.image) {
                const oldImagePath = path.resolve(__dirname, '..', process.env.UPLOAD_PATH || './uploads', 'images', manufacturer.image);
                fs.unlink(oldImagePath, err => {
                    if (err) {
                        console.warn('Failed to delete old image:', err.message);
                        imageLogger.logDelete(manufacturer.image, manufacturerId, false, err);
                    } else {
                        imageLogger.logDelete(manufacturer.image, manufacturerId, true);
                    }
                });
            }

            // Update manufacturer fields
            await manufacturer.update({
                name,
                email,
                phone,
                address,
                website,
                isPriceMSRP: isPriceMSRP === 'true',
                costMultiplier: parseFloat(costMultiplier),
                instructions: instructions || '',
                image: imagePath || manufacturer.image
            });

            // If new catalog file uploaded, parse and replace old data
            if (catalogFiles.length > 0) {
                const file = catalogFiles[0];

                try {
                    const parsedData = await parseCatalogFile(file.path, file.mimetype);

                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        await ManufacturerCatalogData.destroy({
                            where: { manufacturerId: manufacturerId }
                        });

                        const saveData = parsedData.map(row => ({
                            manufacturerId: manufacturerId,
                            ...row
                        }));
                        await ManufacturerCatalogData.bulkCreate(saveData);
                    }
                } catch (parseError) {
                    console.error(`Error parsing file "${file.originalname}":`, parseError && parseError.message ? parseError.message : parseError);
                }
            }

            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Manufacturer updated successfully',
                manufacturer
            });

        } catch (error) {
            // Cleanup uploaded files on error
            Object.values(req.files || {}).flat().forEach(file => {
                fs.unlink(file.path, err => {
                    if (err) console.error('Failed to delete file:', err);
                });
            });

            return res.status(500).json({ message: 'Update failed', error: error.message });
        }
    });
};


const saveManualCabinetItem = async (req, res) => {
    const { manufacturerId } = req.params;
    const { style, code, description, price, type } = req.body;

    // Server-side validation
    if (!style || !code || !description || !price) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newItem = await ManufacturerCatalogData.create({
            manufacturerId,
            style,
            code,
            type,
            description,
            price: parseFloat(price),
            discontinued: false,
        });

        return res.status(201).json({ item: newItem });
    } catch (err) {
        console.error('Error saving item:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



const editManualCabinetItem = async (req, res) => {
    const { id } = req.params;
    const { style, type, code, description, price } = req.body;

    if (!style || !type || !code || !description || !price) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const item = await ManufacturerCatalogData.findByPk(id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update fields
        item.style = style;
        item.type = type;
        item.code = code;
        item.description = description;
        item.price = parseFloat(price);
        item.updatedAt = new Date();

        await item.save();

        return res.status(200).json({ item });
    } catch (err) {
        console.error('Error updating item:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteManualCabinetItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Item ID is required' });
        }

        const item = await ManufacturerCatalogData.findByPk(id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await item.destroy();

        res.json({ 
            success: true, 
            message: 'Item deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};


const uploadCatalogFile = async (req, res) => {
    const { manufacturerId } = req.params;
    const userId = req.user?.id;
    
    uploadCatalogOnly.single('catalogFiles')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate unique session ID for this upload
        const uploadSessionId = uuidv4();
        let backupData = [];

        try {
            const parsedData = await parseCatalogFile(file.path, file.mimetype);

            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                return res.status(400).json({ message: 'No valid data in the uploaded file' });
            }

            // Create backup of existing data that will be affected
            console.log('Creating backup of existing catalog data...');
            
            // Get all existing items for this manufacturer to backup
            const existingItems = await ManufacturerCatalogData.findAll({
                where: { manufacturerId: manufacturerId },
                raw: true
            });

            // Store backup data
            backupData = existingItems.map(item => ({
                id: item.id,
                manufacturerId: item.manufacturerId,
                code: item.code,
                description: item.description,
                price: item.price,
                discontinued: item.discontinued,
                style: item.style,
                type: item.type,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

            // Create backup record
            await CatalogUploadBackup.create({
                manufacturerId: manufacturerId,
                uploadSessionId: uploadSessionId,
                filename: file.filename,
                originalName: file.originalname,
                backupData: backupData,
                itemsCount: parsedData.length,
                uploadedBy: userId
            });

            console.log(`Backup created with session ID: ${uploadSessionId}`);
            console.log(`Processing ${parsedData.length} catalog items...`);

            // Process uploaded data
            let processedCount = 0;
            let updatedCount = 0;
            let createdCount = 0;

            for (const row of parsedData) {
                const cleanStyle = row.style?.replace(/\+AC0-/g, '-').trim() || '';
                const [item, created] = await ManufacturerCatalogData.findOrCreate({
                    where: {
                        manufacturerId: manufacturerId,
                        code: row.code,
                        style: cleanStyle
                    },
                    defaults: {
                        ...row,
                        manufacturerId: manufacturerId,
                        style: cleanStyle
                    }
                });

                if (!created) {
                    // If it already exists, update the rest of the fields
                    await item.update({
                        description: row.description,
                        price: row.price,
                        discontinued: row.discontinued,
                        code: row.code,
                        type: row.type
                    });
                    updatedCount++;
                } else {
                    createdCount++;
                }
                
                processedCount++;
            }

            // Store file metadata
            await ManufacturerCatalogFile.create({
                manufacturer_id: manufacturerId,
                filename: file.filename,
                original_name: file.originalname,
                file_path: file.path,
                file_size: file.size,
                mimetype: file.mimetype
            });

            console.log(`Upload completed: ${createdCount} created, ${updatedCount} updated`);

            return res.status(201).json({
                success: true,
                message: 'Catalog file uploaded and data saved successfully',
                uploadSessionId: uploadSessionId,
                stats: {
                    totalProcessed: processedCount,
                    created: createdCount,
                    updated: updatedCount,
                    backupCreated: true
                }
            });

        } catch (parseError) {
            console.error('Error during catalog upload:', parseError);
            
            // If backup was created but upload failed, we should clean up the backup
            if (uploadSessionId) {
                try {
                    await CatalogUploadBackup.destroy({
                        where: { uploadSessionId: uploadSessionId }
                    });
                } catch (cleanupError) {
                    console.error('Error cleaning up backup after failed upload:', cleanupError);
                }
            }
            
            return res.status(500).json({ 
                message: 'Error processing catalog file', 
                error: parseError.message 
            });
        }
    });
};

// Get available catalog upload backups for a manufacturer
const getCatalogUploadBackups = async (req, res) => {
    try {
        const { manufacturerId } = req.params;

        const backups = await CatalogUploadBackup.findAll({
            where: { 
                manufacturerId: manufacturerId,
                isRolledBack: false
            },
            order: [['uploadedAt', 'DESC']],
            limit: 10, // Only show last 10 uploads
            attributes: [
                'id',
                'uploadSessionId', 
                'filename',
                'originalName',
                'itemsCount',
                'uploadedAt',
                'uploadedBy'
            ]
        });

        res.json({
            success: true,
            backups: backups
        });

    } catch (error) {
        console.error('Error fetching catalog backups:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch catalog backups',
            error: error.message 
        });
    }
};

// Rollback a catalog upload
const rollbackCatalogUpload = async (req, res) => {
    try {
        const { manufacturerId } = req.params;
        const { uploadSessionId } = req.body;
        const userId = req.user?.id;

        if (!uploadSessionId) {
            return res.status(400).json({
                success: false,
                message: 'Upload session ID is required'
            });
        }

        // Find the backup record
        const backup = await CatalogUploadBackup.findOne({
            where: { 
                manufacturerId: manufacturerId,
                uploadSessionId: uploadSessionId,
                isRolledBack: false
            }
        });

        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found or already rolled back'
            });
        }

        console.log(`Starting rollback for session: ${uploadSessionId}`);

        // Start transaction for rollback
        const { sequelize } = require('../config/db');
        const transaction = await sequelize.transaction();

        try {
            // Delete all current catalog data for this manufacturer
            await ManufacturerCatalogData.destroy({
                where: { manufacturerId: manufacturerId },
                transaction
            });

            console.log('Deleted current catalog data');

            // Restore backup data
            const backupData = backup.backupData;
            if (backupData && backupData.length > 0) {
                // Prepare data for bulk insert
                const dataToRestore = backupData.map(item => ({
                    id: item.id,
                    manufacturerId: item.manufacturerId,
                    code: item.code,
                    description: item.description,
                    price: item.price,
                    discontinued: item.discontinued,
                    style: item.style,
                    type: item.type,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                }));

                await ManufacturerCatalogData.bulkCreate(dataToRestore, {
                    transaction,
                    updateOnDuplicate: ['manufacturerId', 'code', 'description', 'price', 'discontinued', 'style', 'type', 'updatedAt']
                });

                console.log(`Restored ${dataToRestore.length} catalog items`);
            }

            // Mark backup as rolled back
            await backup.update({
                isRolledBack: true,
                rolledBackAt: new Date()
            }, { transaction });

            // Commit transaction
            await transaction.commit();

            console.log(`Rollback completed for session: ${uploadSessionId}`);

            res.json({
                success: true,
                message: `Successfully rolled back catalog upload from ${backup.uploadedAt}`,
                restoredItemsCount: backupData?.length || 0
            });

        } catch (rollbackError) {
            // Rollback transaction on error
            await transaction.rollback();
            throw rollbackError;
        }

    } catch (error) {
        console.error('Error during catalog rollback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rollback catalog upload',
            error: error.message
        });
    }
};

// Delete old backups (cleanup function)
const cleanupOldBackups = async (req, res) => {
    try {
        const { manufacturerId } = req.params;
        const daysToKeep = 30; // Keep backups for 30 days

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const deletedCount = await CatalogUploadBackup.destroy({
            where: {
                manufacturerId: manufacturerId,
                uploadedAt: {
                    [require('sequelize').Op.lt]: cutoffDate
                }
            }
        });

        res.json({
            success: true,
            message: `Cleaned up ${deletedCount} old backup records`,
            deletedCount: deletedCount
        });

    } catch (error) {
        console.error('Error cleaning up old backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup old backups',
            error: error.message
        });
    }
};


// const addManufacturerStyle = async (req, res) => {
//     try {
//         upload.fields([
//             { name: 'styleImage', maxCount: 1 }
//         ])(req, res, async function (err) {
//             if (err) {
//                 return res.status(400).json({ message: err.message });
//             }

//             const {
//                 shortName,
//                 description,
//                 catalogId,
//                 manufacturerId
//             } = req.body;

//             if (!shortName || !description || !catalogId || !manufacturerId) {
//                 return res.status(400).json({ message: 'Please provide all required fields' });
//             }

//             const styleImageImage = req.files?.['styleImage']?.[0];
//             const imagePath = styleImageImage?.filename || null;

//             try {
//                 const newManufacturer = await ManufacturerStyleCollection.create({
//                     shortName,
//                     description,
//                     image: imagePath,
//                     catalogId,
//                     manufacturerId
//                 });


//                 return res.status(201).json({
//                     success: true,
//                     status: 200,
//                     message: 'Manufacturer Style added successfully',
//                     manufacturer: newManufacturer
//                 });

//             } catch (dbError) {
//                 // Cleanup uploaded files in case of DB error
//                 Object.values(req.files || {}).flat().forEach(file => {
//                     fs.unlink(file.path, err => {
//                         if (err) console.error('Failed to delete file:', err);
//                     });
//                 });

//                 return res.status(500).json({ message: 'Database error', error: dbError.message });
//             }
//         });
//     } catch (error) {
//         return res.status(500).json({ message: 'Unexpected error', error: error.message });
//     }
// };

// const addManufacturerStyle = async (req, res) => {
//     try {
//         upload.fields([{ name: 'styleImage', maxCount: 1 }])(req, res, async function (err) {
//             if (err) {
//                 return res.status(400).json({ message: err.message });
//             }

//             const {
//                 shortName,
//                 description,
//                 catalogId,
//                 manufacturerId,
//                 code
//             } = req.body;


//             if (!shortName || !description || !catalogId || !manufacturerId) {
//                 return res.status(400).json({ message: 'Please provide all required fields' });
//             }

//             const styleImageFile = req.files?.['styleImage']?.[0];
//             const imagePath = styleImageFile?.filename || null;

//             try {
//                 // 🔍 Check if a record already exists
//                 const existingStyle = await ManufacturerStyleCollection.findOne({
//                     where: {
//                         catalogId,
//                         manufacturerId,
//                     },
//                 });

//                 if (existingStyle) {
//                     // Update existing record
//                     existingStyle.shortName = shortName;
//                     existingStyle.description = description;
//                     existingStyle.code = code;
//                     if (imagePath) {
//                         existingStyle.image = imagePath;
//                     }
//                     await existingStyle.save();

//                     return res.status(200).json({
//                         success: true,
//                         status: 200,
//                         message: 'Manufacturer Style updated successfully',
//                         manufacturer: existingStyle,
//                     });
//                 } else {
//                     // Create new record
//                     const newStyle = await ManufacturerStyleCollection.create({
//                         shortName,
//                         description,
//                         image: imagePath,
//                         catalogId,
//                         manufacturerId,
//                         code
//                     });

//                     return res.status(201).json({
//                         success: true,
//                         status: 200,
//                         message: 'Manufacturer Style created successfully',
//                         manufacturer: newStyle,
//                     });
//                 }
//             } catch (dbError) {
//                 // Cleanup uploaded files in case of DB error
//                 Object.values(req.files || {}).flat().forEach(file => {
//                     fs.unlink(file.path, err => {
//                         if (err) console.error('Failed to delete file:', err);
//                     });
//                 });

//                 return res.status(500).json({
//                     message: 'Database error',
//                     error: dbError.message,
//                 });
//             }
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: 'Unexpected error',
//             error: error.message,
//         });
//     }
// };

const addManufacturerStyle = async (req, res) => {
    try {
        upload.fields([{ name: 'styleImage', maxCount: 1 }])(req, res, async function (err) {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            const {
                name, // the style name (e.g., "Shaker White")
                shortName,
                catalogId,
                description,
                manufacturerId,
                code
            } = req.body;

            // Avoid logging raw req.body in production

            if (!name || !manufacturerId) {
                return res.status(400).json({ message: 'Style name and manufacturerId are required' });
            }

            const styleImageFile = req.files?.['styleImage']?.[0];
            const imagePath = styleImageFile?.filename || null;

            // Update or Create one central style metadata row
            let centralStyle = await ManufacturerStyleCollection.findOne({
                where: { name, manufacturerId },
            });

            if (centralStyle) {
                // Update the central style metadata
                centralStyle.shortName = shortName;
                centralStyle.description = description;
                centralStyle.code = code;
                centralStyle.name = name;
                centralStyle.catalogId = catalogId;

                if (imagePath) centralStyle.image = imagePath;
                await centralStyle.save();
            } else {
                // Create central style
                centralStyle = await ManufacturerStyleCollection.create({
                    catalogId,
                    name,
                    shortName,
                    description,
                    code,
                    image: imagePath,
                    manufacturerId,
                });
            }

            //Loop through all catalog items with this style name
            const catalogItems = await ManufacturerCatalogData.findAll({
                where: { style: name, manufacturerId }
            });


            for (const item of catalogItems) {
                const existingStyleRow = await ManufacturerStyleCollection.findOne({
                    where: {
                        catalogId: item.id,
                        manufacturerId,
                    }
                });

                if (existingStyleRow) {
                    // Update
                    await existingStyleRow.update({
                        shortName,
                        description,
                        code,
                        image: imagePath || existingStyleRow.image
                    });
                } else {
                    // Create
                    await ManufacturerStyleCollection.create({
                        catalogId: item.id,
                        manufacturerId,
                        name: name,
                        shortName,
                        description,
                        code,
                        image: imagePath || null
                    });
                }
            }


            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Style applied to all catalog items successfully',
                style: centralStyle
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Unexpected error',
            error: error.message,
        });
    }
};


const fetchManufacturerStyleById = async (req, res) => {
    const { catalogID } = req.params;
    try {

        const manufacturers = await ManufacturerStyleCollection.findOne({
            where: { catalogId: catalogID }
        });
        if (!manufacturers) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }
        res.json(manufacturers);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
};


const fetchManufacturerAllStyleById = async (req, res) => {
    const { id } = req.params;
    try {

        const manufacturers = await ManufacturerCatalogData.findAll({
            where: { manufacturerId: id }
        });
        if (!manufacturers) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }
        res.json(manufacturers);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
};


const fetchManufacturerStylesWithCatalog = async (req, res) => {
    const { id } = req.params;

    try {
        const catalogItems = await ManufacturerCatalogData.findAll({
            where: { manufacturerId: id },
            attributes: ['id', 'code', 'style', 'price', 'description'],
            include: [
                {
                    model: ManufacturerStyleCollection,
                    as: 'styleVariants', // use correct alias from association
                    attributes: ['catalog_id', 'shortName', 'image'],
                    required: false, // even if no styles are associated, include the item
                },
                {
                    model: ManufacturerAssemblyCost,
                    as: 'styleVariantsAssemblyCost', // use correct alias from association
                    attributes: ['catalog_data_id', 'type', 'price'],
                    required: false, // even if no styles are associated, include the item
                },
                {
                    model: ManufacturerModificationDetails,
                    as: 'styleVariantsModification', // use correct alias from association
                    attributes: ['catalog_data_id', 'description', 'price', 'modification_name'],
                    required: false, // even if no styles are associated, include the item
                },
            ],
            order: [['style', 'ASC']],
        });

        res.json(catalogItems);
    } catch (error) {
        console.error('Error fetching catalog items with styles:', error);
        res.status(500).json({ error: 'Failed to fetch catalog data' });
    }
};

// Lightweight list of unique styles with a representative catalog id and optional thumbnail (first variant image)
const fetchManufacturerStylesMeta = async (req, res) => {
    try {
        const { id } = req.params;

        // Get manufacturer info to include costMultiplier
        const manufacturer = await Manufacturer.findByPk(id, {
            attributes: ['id', 'name', 'costMultiplier']
        });
        
        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // Get a representative catalog row id per style for this manufacturer
        const reps = await ManufacturerCatalogData.findAll({
            where: {
                manufacturerId: id,
                style: { [Op.ne]: null },
            },
            attributes: [
                [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
                'style',
                [Sequelize.fn('MIN', Sequelize.col('price')), 'price'],
            ],
            group: ['style'],
            order: [[Sequelize.literal('style'), 'ASC']],
            raw: true,
        });

        if (!reps?.length) {
            return res.json({
                styles: [],
                manufacturerCostMultiplier: manufacturer.costMultiplier
            });
        }

        const repIds = reps.map(r => r.id);
        const variants = await ManufacturerStyleCollection.findAll({
            where: { catalogId: { [Op.in]: repIds } },
            attributes: ['catalogId', 'shortName', 'image'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        const variantsByCatalog = variants.reduce((acc, v) => {
            if (!acc[v.catalogId]) acc[v.catalogId] = [];
            acc[v.catalogId].push({ shortName: v.shortName, image: v.image });
            return acc;
        }, {});

        const payload = reps.map(r => ({
            id: Number(r.id),
            style: r.style,
            price: r.price,
            styleVariants: (variantsByCatalog[r.id] || []),
        }));

        return res.json({
            styles: payload,
            manufacturerCostMultiplier: manufacturer.costMultiplier
        });
    } catch (error) {
        console.error('Error fetching styles meta:', error);
        return res.status(500).json({ error: 'Failed to fetch styles' });
    }
};

// Paginated items for a given style, identified by a representative catalog id
const getItemsByStyleCatalogId = async (req, res) => {
    try {
        const { manufacturerId, catalogId } = req.params;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 300, 1000);
        const includeDetails = req.query.includeDetails === '1';

        // Get manufacturer info to include costMultiplier
        const manufacturer = await Manufacturer.findByPk(manufacturerId, {
            attributes: ['id', 'name', 'costMultiplier']
        });
        
        if (!manufacturer) {
            return res.status(404).json({ success: false, message: 'Manufacturer not found' });
        }

        const rep = await ManufacturerCatalogData.findOne({
            where: { id: catalogId, manufacturerId },
            attributes: ['style'],
        });
        if (!rep || !rep.style) {
            return res.status(404).json({ success: false, message: 'Style not found for catalog id' });
        }

        const where = {
            manufacturerId,
            style: rep.style,
        };

        const include = includeDetails ? [
            { model: ManufacturerStyleCollection, as: 'styleVariants', attributes: ['catalog_id', 'shortName', 'image'], required: false },
            { model: ManufacturerAssemblyCost, as: 'styleVariantsAssemblyCost', attributes: ['catalog_data_id', 'type', 'price'], required: false },
            { model: ManufacturerModificationDetails, as: 'styleVariantsModification', attributes: ['catalog_data_id', 'description', 'price', 'modification_name'], required: false },
        ] : [];

        const offset = (page - 1) * limit;
        const { rows, count } = await ManufacturerCatalogData.findAndCountAll({
            where,
            offset,
            limit,
            order: [['code', 'ASC']],
            include,
        });

        return res.json({
            success: true,
            style: rep.style,
            catalogData: rows,
            manufacturerCostMultiplier: manufacturer.costMultiplier, // Include manufacturer cost multiplier
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching items by style catalog id:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch items for style' });
    }
};




const fetchManufacturerAssemblyCostDetails = async (req, res) => {
    const { id } = req.params;

    try {
        let assemblycost = await ManufacturerAssemblyCost.findOne({
            where: { catalogDataId: id },
        });

        res.json(assemblycost);
    } catch (error) {
        console.error('Error fetching catalog items with styles:', error);
        res.status(500).json({ error: 'Failed to fetch catalog data' });
    }
};



// In manufacturerController.js

const fetchManufacturerHingesDetails = async (req, res) => {
    try {
        const { catalogDataId } = req.params;

        const hingesDetails = await ManufacturerHingesDetails.findOne({
            where: { catalogDataId },
        });

        if (!hingesDetails) {
            return res.status(404).json({ success: false, message: 'No hinges details found.' });
        }

        return res.status(200).json({ success: true, data: hingesDetails });
    } catch (error) {
        console.error('Error fetching hinges details:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const fetchManufacturerItemsModification = async (req, res) => {
    try {
        const { catalogDataId } = req.params;

        const modificationDetails = await ManufacturerModificationDetails.findOne({
            where: { catalogDataId },
        });

        if (!modificationDetails) {
            return res.status(404).json({ success: false, message: 'No modification details found.' });
        }

        return res.status(200).json({ success: true, data: modificationDetails });
    } catch (error) {
        console.error('Error fetching modification details:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};




const saveAssemblyCost = async (req, res) => {
    try {
    const { catalogDataId, type, price, applyTo, manufacturerId } = req.body;

        if (!catalogDataId || !type || !price) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        if (applyTo === 'one') {
            // Apply to only one item
            let cost = await ManufacturerAssemblyCost.findOne({ where: { catalogDataId } });
            if (cost) {
                await cost.update({ type, price });
            } else {
                cost = await ManufacturerAssemblyCost.create({ catalogDataId, type, price });
            }
            return res.status(200).json({ success: true, data: cost });
        }

        // Check if assembly cost already exists for this catalog item
        // let assemblyCost = await ManufacturerAssemblyCost.findOne({
        //     where: { catalogDataId },
        // });

        // if (assemblyCost) {
        //     // Update existing record
        //     await assemblyCost.update({ type, price });
        // } else {
        //     // Create new record
        //     assemblyCost = await ManufacturerAssemblyCost.create({ catalogDataId, type, price });
        // }

        // Apply to all with same style + manufacturer
        const catalogItems = await ManufacturerCatalogData.findAll({
            where: { manufacturerId },
        });

        const results = [];
        for (const item of catalogItems) {
            let cost = await ManufacturerAssemblyCost.findOne({
                where: { catalogDataId: item.id },
            });

            if (cost) {
                await cost.update({ type, price });
            } else {
                cost = await ManufacturerAssemblyCost.create({
                    catalogDataId: item.id,
                    type,
                    price
                });
            }

            results.push(cost);
        }

        return res.status(200).json({
            success: true,
            message: `Assembly cost applied to ${results.length} items.`,
            data: results
        });

    } catch (error) {
        console.error('Error saving assembly cost:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const saveHingesDetails = async (req, res) => {
    try {
        const { catalogDataId, leftHingePrice, rightHingePrice, bothHingesPrice, exposedSidePrice } = req.body;

        if (!catalogDataId) {
            return res.status(400).json({ success: false, message: 'Catalog Data ID is required.' });
        }

        // Check if hinges details already exist for this catalog item
        let hingesDetails = await ManufacturerHingesDetails.findOne({
            where: { catalogDataId },
        });

        if (hingesDetails) {
            // Update existing record
            await hingesDetails.update({
                leftHingePrice,
                rightHingePrice,
                bothHingesPrice,
                exposedSidePrice,
            });
        } else {
            // Create new record
            hingesDetails = await ManufacturerHingesDetails.create({
                catalogDataId,
                leftHingePrice,
                rightHingePrice,
                bothHingesPrice,
                exposedSidePrice,
            });
        }

        return res.status(200).json({ success: true, data: hingesDetails });
    } catch (error) {
        console.error('Error saving hinges details:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const saveModificationDetails = async (req, res) => {
    try {
        const { catalogDataId, modificationName, description, notes, price } = req.body;

        if (!catalogDataId || !modificationName || !price) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        let modificationDetails = await ManufacturerModificationDetails.findOne({
            where: { catalogDataId },
        });

        if (modificationDetails) {
            await modificationDetails.update({ modificationName, description, notes, price });
        } else {
            modificationDetails = await ManufacturerModificationDetails.create({
                catalogDataId,
                modificationName,
                description,
                notes,
                price,
            });
        }

        return res.status(200).json({ success: true, data: modificationDetails });
    } catch (error) {
        console.error('Error saving modification details:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const fetchManufacturerCatalogModificationItems = async (req, res) => {
    try {
        const {id} = req.params;
        const manufacturers = await ManufacturerModificationDetails.findAll({
            where: { catalogDataId: id }
        });
        if (!manufacturers) {
            return res.status(404).json({ error: 'Modification items not not found' });
        }
        res.json(manufacturers);

    } catch (error) {
        res.status(500).json({ error: error });
    }
};



const addModificationItem = async (req, res) => {
  try {
    const {
      catalogId,
      name,         // this maps to modificationName
      price,
      note,         // this maps to notes
      description,
    } = req.body;

    if (!catalogId || !name) {
      return res.status(400).json({ error: 'catalogId and name are required' });
    }

    const saved = await ManufacturerModificationDetails.create({
      catalogDataId: catalogId,           // correct model key
      modificationName: name,             // correct model key
      price,
      notes: note,
      description: description || '',
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Error saving custom modification:', err);
    res.status(500).json({ error: 'Failed to save modification' });
  }
};



const deleteStyle = async (req, res) => {
  try {
    const { manufacturerId, styleName } = req.params;
    const { mergeToStyle } = req.body;

    // Validate inputs
    if (!manufacturerId || !styleName) {
      return res.status(400).json({ error: 'Manufacturer ID and style name are required' });
    }

    // Check if manufacturer exists
    const manufacturer = await Manufacturer.findByPk(manufacturerId);
    if (!manufacturer) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }

    // Find all items with the style to be deleted
    const itemsToUpdate = await ManufacturerCatalogData.findAll({
      where: {
        manufacturerId: manufacturerId,
        style: styleName
      }
    });

    if (itemsToUpdate.length === 0) {
      return res.status(404).json({ error: 'No items found with this style' });
    }

    // If merge option is provided, handle duplicates intelligently
    if (mergeToStyle && mergeToStyle.trim() !== '') {
      let mergedCount = 0;
      let duplicatesRemoved = 0;

      // Process each item to merge
      for (const item of itemsToUpdate) {
        // Check if there's already an item with the same code and target style
        const existingItem = await ManufacturerCatalogData.findOne({
          where: {
            manufacturerId: manufacturerId,
            code: item.code,
            style: mergeToStyle.trim()
          }
        });

        if (existingItem) {
          // Duplicate found - delete the item being merged
          await item.destroy();
          duplicatesRemoved++;
        } else {
          // No duplicate - update the style
          await item.update({ style: mergeToStyle.trim() });
          mergedCount++;
        }
      }

      let message = `Successfully processed ${itemsToUpdate.length} items from style "${styleName}"`;
      if (mergedCount > 0 && duplicatesRemoved > 0) {
        message += `: ${mergedCount} merged to "${mergeToStyle}", ${duplicatesRemoved} duplicates removed`;
      } else if (mergedCount > 0) {
        message += `: ${mergedCount} merged to "${mergeToStyle}"`;
      } else if (duplicatesRemoved > 0) {
        message += `: ${duplicatesRemoved} duplicates removed (all items already existed in target style)`;
      }

      res.json({ 
        success: true, 
        message: message,
        itemsAffected: itemsToUpdate.length,
        mergedCount: mergedCount,
        duplicatesRemoved: duplicatesRemoved
      });
    } else {
      // If no merge option, delete all items with this style
      const deletedCount = await ManufacturerCatalogData.destroy({
        where: {
          manufacturerId: manufacturerId,
          style: styleName
        }
      });

      res.json({ 
        success: true, 
        message: `Successfully deleted ${deletedCount} items with style "${styleName}"`,
        itemsDeleted: deletedCount
      });
    }

  } catch (error) {
    console.error('Error deleting/merging style:', error);
    res.status(500).json({ error: 'Failed to delete/merge style' });
  }
};

const cleanupDuplicates = async (req, res) => {
  try {
    const { manufacturerId } = req.params;

    // Validate input
    if (!manufacturerId) {
      return res.status(400).json({ error: 'Manufacturer ID is required' });
    }

    // Check if manufacturer exists
    const manufacturer = await Manufacturer.findByPk(manufacturerId);
    if (!manufacturer) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }

    // Find all items for this manufacturer
    const allItems = await ManufacturerCatalogData.findAll({
      where: { manufacturerId: manufacturerId },
      order: [['createdAt', 'ASC']] // Keep the oldest item in case of duplicates
    });

    const seen = new Map(); // Track unique combinations
    const duplicatesToDelete = [];
    let duplicateCount = 0;

    // Check for duplicates based on code + style combination
    for (const item of allItems) {
      const uniqueKey = `${item.code}_${item.style || 'NO_STYLE'}`;
      
      if (seen.has(uniqueKey)) {
        // This is a duplicate, mark for deletion
        duplicatesToDelete.push(item.id);
        duplicateCount++;
      } else {
        // First occurrence, keep it
        seen.set(uniqueKey, item);
      }
    }

    // Delete duplicates if any found
    if (duplicatesToDelete.length > 0) {
      await ManufacturerCatalogData.destroy({
        where: {
          id: duplicatesToDelete
        }
      });
    }

    res.json({
      success: true,
      message: duplicateCount > 0 
        ? `Successfully removed ${duplicateCount} duplicate items`
        : 'No duplicates found',
      duplicatesRemoved: duplicateCount,
      totalItemsChecked: allItems.length
    });

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    res.status(500).json({ error: 'Failed to cleanup duplicates' });
  }
};

// Paginated fetch of catalog data for a manufacturer with optional filters
const getManufacturerCatalog = async (req, res) => {
    try {
        const { manufacturerId } = req.params;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 500);
        const offset = (page - 1) * limit;
        const { typeFilter = '', styleFilter = '', sortBy = 'code', sortOrder = 'ASC' } = req.query;

        // Validate manufacturer exists (optional but useful)
        const manufacturer = await Manufacturer.findByPk(manufacturerId);
        if (!manufacturer) {
            return res.status(404).json({ success: false, message: 'Manufacturer not found' });
        }

        // Validate sort parameters
        const allowedSortFields = ['code', 'description', 'style', 'price', 'type', 'createdAt'];
        const allowedSortOrders = ['ASC', 'DESC'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'code';
        const validSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // keep Sequelize import above for pagination and distinct helpers
        const where = {
            manufacturerId,
            ...(typeFilter ? { type: { [Sequelize.Op.eq]: typeFilter } } : {}),
            ...(styleFilter ? { style: { [Sequelize.Op.eq]: styleFilter } } : {}),
        };

        const { rows, count } = await ManufacturerCatalogData.findAndCountAll({
            where,
            order: [[validSortBy, validSortOrder]],
            offset,
            limit,
        });

        // Build filter metadata (distinct types/styles) for this manufacturer
        const [typeRows, styleRows] = await Promise.all([
            ManufacturerCatalogData.findAll({
                where: { manufacturerId },
                attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('type')), 'type']],
                raw: true,
            }),
            ManufacturerCatalogData.findAll({
                where: { manufacturerId },
                attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('style')), 'style']],
                raw: true,
            }),
        ]);

        const uniqueTypes = typeRows.map((r) => (r.type || '').trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));
        const uniqueStyles = styleRows.map((r) => (r.style || '').trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));

        return res.json({
            success: true,
            catalogData: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
            filters: {
                uniqueTypes,
                uniqueStyles,
            },
            sorting: {
                sortBy: validSortBy,
                sortOrder: validSortOrder,
            },
        });
    } catch (error) {
        console.error('Error fetching paginated catalog:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch catalog', error: error.message });
    }
};
module.exports = {
    addManufacturer,
    fetchManufacturer,
    updateManufacturerStatus,
    fetchManufacturerById,
    updateManufacturer,
    saveManualCabinetItem,
    editManualCabinetItem,
    deleteManualCabinetItem,
    uploadCatalogFile,
    addManufacturerStyle,
    fetchManufacturerStyleById,
    fetchManufacturerAllStyleById,
    fetchManufacturerStylesWithCatalog,
    fetchManufacturerStylesMeta,
    getItemsByStyleCatalogId,
    fetchManufacturerAssemblyCostDetails,
    fetchManufacturerHingesDetails,
    fetchManufacturerItemsModification,
    saveAssemblyCost,
    saveHingesDetails,
    saveModificationDetails,
    fetchManufacturerCatalogModificationItems,
    addModificationItem,
    deleteStyle,
    cleanupDuplicates,
    getCatalogUploadBackups,
    rollbackCatalogUpload,
    cleanupOldBackups,
    getManufacturerCatalog
};