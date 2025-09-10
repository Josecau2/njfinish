const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parseCatalogFile } = require('../utils/parseCatalogFile');
const { ChunkedCatalogParser } = require('../utils/parseCatalogFileChunked');
const upload = require('../middleware/upload'); // Your multer setup
const uploadCatalogOnly = require('../middleware/uploadCatalogOnly'); // Your multer setup
const { Manufacturer, ManufacturerCatalogData, Collection, CatalogUploadBackup } = require('../models');
const sequelize = require('../config/db');
const { ManufacturerCatalogFile } = require('../models/ManufacturerCatalogFile');
const ManufacturerStyleCollection = require('../models/ManufacturerStyleCollection');
const ManufacturerTypeCollection = require('../models/ManufacturerTypeCollection');
const ManufacturerAssemblyCost = require('../models/ManufacturerAssemblyCost');
const ManufacturerHingesDetails = require('../models/ManufacturerHingesDetails');
const ManufacturerModificationDetails = require('../models/ManufacturerModificationDetails');
const imageLogger = require('../utils/imageLogger');
const { v4: uuidv4 } = require('uuid');
const Sequelize = require('sequelize');
const { Op } = Sequelize;


const fetchManufacturer = async (req, res) => {
    try {
        // Check if user is admin - admins see all manufacturers, contractors only see active ones
        const isAdmin = req.user?.role === 'Admin' || req.user?.role_id === 2;

        const whereClause = isAdmin ? {} : { status: true };

        const manufacturers = await Manufacturer.findAll({
            where: whereClause
        });
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
                instructions,
                assembledEtaDays,
                unassembledEtaDays
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
                    assembledEtaDays: assembledEtaDays || null,
                    unassembledEtaDays: unassembledEtaDays || null,
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
            instructions,
            assembledEtaDays,
            unassembledEtaDays,
            deliveryFee
        } = req.body;

        console.log('Received ETA fields:', {
            assembledEtaDays: assembledEtaDays,
            unassembledEtaDays: unassembledEtaDays,
            assembledType: typeof assembledEtaDays,
            unassembledType: typeof unassembledEtaDays,
            assembledLength: assembledEtaDays?.length,
            unassembledLength: unassembledEtaDays?.length
        });

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
            const updateData = {
                name,
                email,
                phone,
                address,
                website,
                isPriceMSRP: isPriceMSRP === 'true',
                costMultiplier: parseFloat(costMultiplier),
                instructions: instructions || '',
                assembledEtaDays: assembledEtaDays || null,
                unassembledEtaDays: unassembledEtaDays || null,
                deliveryFee: deliveryFee ? parseFloat(deliveryFee) : null,
                image: imagePath || manufacturer.image
            };

            console.log('Updating manufacturer with data:', updateData);
            console.log('ETA data details:', {
                assembledEtaDays: updateData.assembledEtaDays,
                unassembledEtaDays: updateData.unassembledEtaDays,
                assembledType: typeof updateData.assembledEtaDays,
                unassembledType: typeof updateData.unassembledEtaDays
            });
            await manufacturer.update(updateData);

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
            console.error('Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
            }
            return res.status(400).json({ message: err.message });
        }

        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check file size
        const fileSizeInMB = file.size / (1024 * 1024);
        const isLargeFile = fileSizeInMB > 10; // Consider files >10MB as large

        console.log(`📁 Processing ${isLargeFile ? 'large' : 'regular'} catalog file: ${file.originalname} (${fileSizeInMB.toFixed(2)}MB)`);

        // Generate unique session ID for this upload
        const uploadSessionId = uuidv4();
        let backupData = [];

        try {
            let parsedData;
            let totalProcessed = 0;
            let updatedCount = 0;
            let createdCount = 0;

            // Create backup of existing data that will be affected
            console.log('📦 Creating backup of existing catalog data...');

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

            if (isLargeFile) {
                console.log('🔄 Processing large file in chunks...');

                // Use chunked processing for large files
                const parser = new ChunkedCatalogParser({
                    chunkSize: 500, // Smaller chunks for better memory management
                    maxFileSize: 50 * 1024 * 1024, // 50MB limit
                    onChunk: async (chunk, processedSoFar, total) => {
                        console.log(`📊 Processing chunk: ${processedSoFar + chunk.length}/${total} rows`);

                        // Process chunk in database transaction
                        const transaction = await sequelize.transaction();
                        try {
                            for (const row of chunk) {
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
                                    },
                                    transaction
                                });

                                if (!created) {
                                    await item.update({
                                        description: row.description,
                                        price: row.price,
                                        discontinued: row.discontinued,
                                        code: row.code,
                                        type: row.type
                                    }, { transaction });
                                    updatedCount++;
                                } else {
                                    createdCount++;
                                }
                            }

                            await transaction.commit();
                            totalProcessed += chunk.length;

                        } catch (chunkError) {
                            await transaction.rollback();
                            throw chunkError;
                        }
                    },
                    onProgress: (processed, total) => {
                        const percentage = ((processed / total) * 100).toFixed(1);
                        console.log(`⏳ Progress: ${percentage}% (${processed}/${total} rows)`);
                    }
                });

                parsedData = await parser.parse(file.path, file.mimetype);

            } else {
                console.log('📝 Processing regular file...');
                // Use regular processing for smaller files
                parsedData = await parseCatalogFile(file.path, file.mimetype);

                if (!Array.isArray(parsedData) || parsedData.length === 0) {
                    return res.status(400).json({ message: 'No valid data in the uploaded file' });
                }

                console.log(`Processing ${parsedData.length} catalog items...`);

                // Process uploaded data in batches for better performance
                const batchSize = 100;
                for (let i = 0; i < parsedData.length; i += batchSize) {
                    const batch = parsedData.slice(i, i + batchSize);

                    const transaction = await sequelize.transaction();
                    try {
                        for (const row of batch) {
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
                                },
                                transaction
                            });

                            if (!created) {
                                await item.update({
                                    description: row.description,
                                    price: row.price,
                                    discontinued: row.discontinued,
                                    code: row.code,
                                    type: row.type
                                }, { transaction });
                                updatedCount++;
                            } else {
                                createdCount++;
                            }
                        }

                        await transaction.commit();
                        totalProcessed += batch.length;

                    } catch (batchError) {
                        await transaction.rollback();
                        throw batchError;
                    }
                }
            }

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

            // Store file metadata
            await ManufacturerCatalogFile.create({
                manufacturer_id: manufacturerId,
                filename: file.filename,
                original_name: file.originalname,
                file_path: file.path,
                file_size: file.size,
                mimetype: file.mimetype
            });

            console.log(`✅ Upload completed: ${createdCount} created, ${updatedCount} updated`);

            return res.status(201).json({
                success: true,
                message: `Catalog file uploaded and data saved successfully. Processed ${totalProcessed} items.`,
                uploadSessionId: uploadSessionId,
                stats: {
                    totalProcessed: totalProcessed,
                    created: createdCount,
                    updated: updatedCount,
                    backupCreated: true,
                    fileSize: fileSizeInMB.toFixed(2) + 'MB',
                    processingMethod: isLargeFile ? 'chunked' : 'regular'
                }
            });

        } catch (parseError) {
            console.error('❌ Error during catalog upload:', parseError);

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
                error: parseError.message,
                details: isLargeFile ? 'Large file processing failed. Try splitting the file into smaller chunks.' : 'File processing failed.'
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
                console.error('Multer error (style/create):', err && err.message ? err.message : err);
                return res.status(400).json({ message: err.message || 'Upload failed' });
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

            // If the client intended to upload an image but it was filtered out, surface a clearer hint
            if (!imagePath && req.headers['content-type']?.includes('multipart/form-data')) {
                console.warn('Style image missing after upload. Check field name "styleImage" and mime type. Received fields:', Object.keys(req.files || {}));
            }

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

// Fetch assembly costs by types for a specific manufacturer
const fetchAssemblyCostsByTypes = async (req, res) => {
    const { id } = req.params; // manufacturer ID

    try {
        // First check if manufacturer exists
        const manufacturer = await Manufacturer.findByPk(id);
        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // Get all catalog data for this manufacturer to get the types with assembly costs
        const catalogDataWithCosts = await ManufacturerCatalogData.findAll({
            where: { manufacturerId: id },
            include: [{
                model: ManufacturerAssemblyCost,
                as: 'styleVariantsAssemblyCost',
                required: false // Left join to get all catalog data, even without costs
            }],
            attributes: ['id', 'type', 'code', 'description']
        });

        // Group by type and calculate assembly cost information
        const costsByType = {};

        catalogDataWithCosts.forEach(item => {
            const type = item.type;

            if (!costsByType[type]) {
                costsByType[type] = {
                    type: type,
                    assemblyCosts: []
                };
            }

            // If this item has assembly costs, process them
            const assemblyCost = item.styleVariantsAssemblyCost;
            if (assemblyCost) {
                // Check if we already have this assembly type for this item type
                const existingCost = costsByType[type].assemblyCosts.find(
                    existing => existing.assemblyType === assemblyCost.type
                );

                if (existingCost) {
                    // Update existing entry - increment count of items with this cost
                    existingCost.itemsWithCost += 1;
                    // For now, we'll keep the first price found
                } else {
                    // Add new assembly cost entry
                    costsByType[type].assemblyCosts.push({
                        assemblyType: assemblyCost.type,
                        price: parseFloat(assemblyCost.price || 0),
                        itemsWithCost: 1
                    });
                }
            }
        });

        res.json(costsByType);
    } catch (error) {
        console.error('Error fetching assembly costs by types:', error);
        res.status(500).json({ error: 'Internal server error' });
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




const getManufacturerTypes = async (req, res) => {
    try {
        const { manufacturerId } = req.params;

        if (!manufacturerId) {
            return res.status(400).json({ success: false, message: 'Manufacturer ID is required.' });
        }

        // Get unique types for this manufacturer
        const types = await ManufacturerCatalogData.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('type')), 'type'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                manufacturerId,
                type: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },
            group: ['type'],
            order: [['type', 'ASC']],
            raw: true
        });

        return res.status(200).json({ success: true, data: types });
    } catch (error) {
        console.error('Error fetching manufacturer types:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const saveAssemblyCost = async (req, res) => {
    try {
    const { catalogDataId, type, price, applyTo, manufacturerId, itemType } = req.body;

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

        if (applyTo === 'type') {
            // Apply to all items with the same type
            if (!itemType) {
                return res.status(400).json({ success: false, message: 'Item type is required for type-based application.' });
            }

            const catalogItems = await ManufacturerCatalogData.findAll({
                where: {
                    manufacturerId,
                    type: itemType
                },
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
                message: `Assembly cost applied to ${results.length} items of type "${itemType}".`,
                data: results
            });
        }

        // Apply to all items for manufacturer (default/legacy behavior)
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
        const {
            typeFilter = '',
            styleFilter = '',
            search = '',
            excludeType = '',
            sortBy = 'code',
            sortOrder = 'ASC',
        } = req.query;

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
        // Build where clause
        const where = {
            manufacturerId,
            ...(typeFilter ? { type: { [Sequelize.Op.eq]: typeFilter } } : {}),
            ...(styleFilter ? { style: { [Sequelize.Op.eq]: styleFilter } } : {}),
        };

        // Exclude current type if provided (assignable items only)
        if (excludeType) {
            where[Op.or] = [
                { type: { [Op.ne]: excludeType } },
                { type: { [Op.is]: null } },
            ];
        }

        // Text search across code/description/style
        if (search && String(search).trim().length > 0) {
            const like = `%${search}%`;
            where[Op.and] = (where[Op.and] || []).concat([
                {
                    [Op.or]: [
                        { code: { [Op.like]: like } },
                        { description: { [Op.like]: like } },
                        { style: { [Op.like]: like } },
                    ],
                },
            ]);
        }

        const { rows, count } = await ManufacturerCatalogData.findAndCountAll({
            where,
            order: [[validSortBy, validSortOrder]],
            offset,
            limit,
        });

        // Build filter metadata (distinct types/styles) for this manufacturer
        // Build where for distinct queries (mirror exclusions, but don't apply search/typeFilter/styleFilter to show a complete set)
        const distinctWhere = { manufacturerId };
        if (excludeType) {
            distinctWhere[Op.or] = [
                { type: { [Op.ne]: excludeType } },
                { type: { [Op.is]: null } },
            ];
        }

        const [typeRows, styleRows] = await Promise.all([
            ManufacturerCatalogData.findAll({
                where: distinctWhere,
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

// Bulk edit catalog items
const bulkEditCatalogItems = async (req, res) => {
    try {
        const { itemIds, updates } = req.body;

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: 'Item IDs array is required' });
        }

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ error: 'Updates object is required' });
        }

        // Validate that we have at least one field to update
        const allowedFields = ['style', 'type', 'description', 'price'];
        const fieldsToUpdate = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined && updates[field] !== null && updates[field] !== '') {
                fieldsToUpdate[field] = updates[field];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ error: 'At least one field to update is required' });
        }

        // Add timestamp for tracking
        fieldsToUpdate.updatedAt = new Date();

        // Perform bulk update
        const [affectedCount] = await ManufacturerCatalogData.update(
            fieldsToUpdate,
            {
                where: {
                    id: itemIds
                }
            }
        );

        res.json({
            success: true,
            message: `Successfully updated ${affectedCount} items`,
            affectedCount
        });

    } catch (error) {
        console.error('Error in bulk edit:', error);
        res.status(500).json({ error: 'Failed to bulk edit items' });
    }
};

// Edit style name globally for a manufacturer
const editStyleName = async (req, res) => {
    try {
        const { id: manufacturerId } = req.params;
        const { oldStyleName, newStyleName } = req.body;

        if (!oldStyleName || !newStyleName) {
            return res.status(400).json({ error: 'Both old and new style names are required' });
        }

        if (oldStyleName.trim() === newStyleName.trim()) {
            return res.status(400).json({ error: 'New style name must be different from the old one' });
        }

        // Check if new style name already exists for this manufacturer
        const existingItems = await ManufacturerCatalogData.findOne({
            where: {
                manufacturerId: manufacturerId,
                style: newStyleName.trim()
            }
        });

        if (existingItems) {
            return res.status(400).json({
                error: `Style "${newStyleName.trim()}" already exists for this manufacturer`
            });
        }

        // Update all items with the old style name to the new style name
        const [affectedCount] = await ManufacturerCatalogData.update(
            {
                style: newStyleName.trim(),
                updatedAt: new Date()
            },
            {
                where: {
                    manufacturerId: manufacturerId,
                    style: oldStyleName.trim()
                }
            }
        );

        if (affectedCount === 0) {
            return res.status(404).json({
                error: `No items found with style "${oldStyleName}" for this manufacturer`
            });
        }

        res.json({
            success: true,
            message: `Successfully updated style name from "${oldStyleName}" to "${newStyleName}" for ${affectedCount} items`,
            affectedCount,
            oldStyleName: oldStyleName.trim(),
            newStyleName: newStyleName.trim()
        });

    } catch (error) {
        console.error('Error editing style name:', error);
        res.status(500).json({ error: 'Failed to edit style name' });
    }
};

// Fetch types metadata for a manufacturer
const fetchManufacturerTypesMeta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Manufacturer ID is required' });
        }

        // Representative catalog rows per type (short description/price)
        const reps = await ManufacturerCatalogData.findAll({
            where: { manufacturerId: id, type: { [Op.ne]: null } },
            attributes: [
                [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
                'type',
                [Sequelize.fn('MIN', Sequelize.col('description')), 'description'],
                [Sequelize.fn('MIN', Sequelize.col('price')), 'price'],
            ],
            group: ['type'],
            order: [[Sequelize.literal('type'), 'ASC']],
            raw: true,
        });

        // All type metadata rows (names/images/longDescription)
        const allTypeCollections = await ManufacturerTypeCollection.findAll({
            where: { manufacturerId: id },
            raw: true,
        });

        const repMap = new Map((reps || []).map(r => [r.type, r]));
        const tcMap = new Map((allTypeCollections || []).map(tc => [tc.type, tc]));
        const allTypes = Array.from(new Set([
            ...(reps || []).map(r => r.type),
            ...(allTypeCollections || []).map(tc => tc.type),
        ])).filter(Boolean);

        const unified = allTypes.map(typeName => {
            const rep = repMap.get(typeName);
            const tc = tcMap.get(typeName);
            return {
                id: rep?.id || tc?.catalogId || null,
                type: typeName,
                description: rep?.description || null,
                longDescription: tc?.description || null,
                price: rep?.price || null,
                image: tc?.image || null,
                name: tc?.name || null,
                shortName: tc?.shortName || null,
                code: tc?.code || null,
            };
        }).sort((a, b) => String(a.type).localeCompare(String(b.type)));

        return res.json(unified);
    } catch (error) {
        console.error('Error fetching types metadata:', error);
        return res.status(500).json({ error: 'Failed to fetch types metadata' });
    }
};

// Create/update type image
const createTypeImage = async (req, res) => {
    try {
        upload.fields([{ name: 'typeImage', maxCount: 1 }])(req, res, async function (err) {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({ message: err.message });
            }

            const { type, manufacturerId, catalogId, longDescription, description } = req.body;
            const typeImageFile = req.files?.typeImage?.[0];

            if (!typeImageFile) {
                return res.status(400).json({ message: 'Type image file is required' });
            }
            if (!type || !manufacturerId) {
                return res.status(400).json({ message: 'Type name and manufacturer ID are required' });
            }

            // Resolve a representative catalog id for this manufacturer/type (or any item for the manufacturer)
            let repCatalog = null;
            try {
                repCatalog = await ManufacturerCatalogData.findOne({
                    where: { manufacturerId, type },
                    attributes: ['id'],
                    order: [['id', 'ASC']],
                });
                if (!repCatalog) {
                    repCatalog = await ManufacturerCatalogData.findOne({
                        where: { manufacturerId },
                        attributes: ['id'],
                        order: [['id', 'ASC']],
                    });
                }
            } catch (e) {
                // ignore
            }

            // Find or create type collection entry
            const [typeCollection, created] = await ManufacturerTypeCollection.findOrCreate({
                where: { manufacturerId: manufacturerId, type: type },
                defaults: {
                    catalogId: catalogId || repCatalog?.id || null,
                    manufacturerId: manufacturerId,
                    type: type,
                    image: typeImageFile.filename,
                    description: typeof longDescription === 'string' ? longDescription : (typeof description === 'string' ? description : null),
                },
            });

            if (!created) {
                const updatePayload = { image: typeImageFile.filename };
                if (typeof longDescription === 'string') updatePayload.description = longDescription;
                else if (typeof description === 'string') updatePayload.description = description;
                if (!typeCollection.catalogId && (catalogId || repCatalog?.id)) {
                    updatePayload.catalogId = catalogId || repCatalog.id;
                }
                await typeCollection.update(updatePayload);
            }

            return res.json({ success: true, message: 'Type image uploaded successfully', filename: typeImageFile.filename });
        });
    } catch (error) {
        console.error('Error uploading type image:', error);
        return res.status(500).json({ error: 'Failed to upload type image' });
    }
};

// Bulk edit types
const bulkEditTypes = async (req, res) => {
    try {
        const { manufacturerId, itemIds, updates } = req.body;

        if (!manufacturerId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: 'Manufacturer ID and item IDs are required' });
        }

        // Build update object, only including non-empty values
        const updateFields = {};
        if (updates.type && updates.type.trim()) {
            updateFields.type = updates.type.trim();
        }
        if (updates.description && updates.description.trim()) {
            updateFields.description = updates.description.trim();
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'At least one field must be provided for update' });
        }

        // Update the items
        const [updatedCount] = await ManufacturerCatalogData.update(
            updateFields,
            {
                where: {
                    id: { [Op.in]: itemIds },
                    manufacturerId: manufacturerId
                }
            }
        );

        res.json({
            success: true,
            message: `Updated ${updatedCount} catalog items`,
            updatedCount
        });

    } catch (error) {
        console.error('Error in bulk edit types:', error);
        res.status(500).json({ error: 'Failed to update catalog items' });
    }
};

// Edit type name globally
const editTypeName = async (req, res) => {
    try {
        const { manufacturerId, oldTypeName, newTypeName } = req.body;

        if (!manufacturerId || !oldTypeName || !newTypeName) {
            return res.status(400).json({ error: 'Manufacturer ID, old type name, and new type name are required' });
        }

        // Update all items with the old type name
        const [updatedCount] = await ManufacturerCatalogData.update(
            { type: newTypeName.trim() },
            {
                where: {
                    manufacturerId: manufacturerId,
                    type: oldTypeName
                }
            }
        );

        res.json({
            success: true,
            message: `Updated ${updatedCount} items from type "${oldTypeName}" to "${newTypeName}"`,
            updatedCount
        });

    } catch (error) {
        console.error('Error editing type name:', error);
        res.status(500).json({ error: 'Failed to update type name' });
    }
};

// Bulk change type category
const bulkChangeType = async (req, res) => {
    try {
        const { manufacturerId, itemIds, newType } = req.body;

        if (!manufacturerId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0 || !newType) {
            return res.status(400).json({ error: 'Manufacturer ID, item IDs, and new type are required' });
        }

        // Update all specified items to the new type
        const [updatedCount] = await ManufacturerCatalogData.update(
            { type: newType.trim() },
            {
                where: {
                    manufacturerId: manufacturerId,
                    id: { [Op.in]: itemIds }
                }
            }
        );

        res.json({
            success: true,
            message: `Updated ${updatedCount} items to type "${newType}"`,
            updatedCount
        });

    } catch (error) {
        console.error('Error in bulk change type:', error);
        res.status(500).json({ error: 'Failed to change type category' });
    }
};

const assignItemsToType = async (req, res) => {
  try {
    const { manufacturerId, itemIds, newType } = req.body;

    if (!manufacturerId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0 || !newType) {
      return res.status(400).json({
        success: false,
        message: 'Manufacturer ID, item IDs array, and new type are required'
      });
    }

    // Update all specified items to the new type
    const updateResult = await ManufacturerCatalogData.update(
      { type: newType },
      {
        where: {
          id: { [Op.in]: itemIds },
          manufacturerId: manufacturerId
        }
      }
    );

    if (updateResult[0] > 0) {
      res.json({
        success: true,
        message: `Successfully assigned ${updateResult[0]} items to type "${newType}"`,
        updatedCount: updateResult[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No items were updated. Please check the item IDs and manufacturer ID.'
      });
    }

  } catch (error) {
    console.error('Error assigning items to type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign items to type',
      error: error.message
    });
  }
};

// Update type metadata (e.g., description) for a given manufacturer and type
const updateTypeMeta = async (req, res) => {
    try {
        const { manufacturerId, type, longDescription, description, name, shortName, code } = req.body;
        if (!manufacturerId || !type) {
            return res.status(400).json({ success: false, message: 'Manufacturer ID and type are required' });
        }

        // Ensure we set a representative catalogId when creating a new type meta row
        // This avoids validation errors if catalogId is required by the model/DB.
        let repCatalog = await ManufacturerCatalogData.findOne({
            where: { manufacturerId, type },
            attributes: ['id'],
            order: [['id', 'ASC']]
        });
        // If there is no catalog item for this specific type yet, fall back to any
        // catalog item for the same manufacturer so we can persist metadata.
        if (!repCatalog) {
            repCatalog = await ManufacturerCatalogData.findOne({
                where: { manufacturerId },
                attributes: ['id'],
                order: [['id', 'ASC']]
            });
        }
        // If the manufacturer has no catalog items at all, return a clear 400 error
        if (!repCatalog) {
            return res.status(400).json({
                success: false,
                message: 'No catalog items found for this manufacturer to associate metadata with. Upload a catalog or create at least one item first.'
            });
        }

    const [typeCollection] = await ManufacturerTypeCollection.findOrCreate({
            where: { manufacturerId, type },
            defaults: {
                catalogId: repCatalog.id,
                manufacturerId,
                type,
                // Store longDescription in description column
                description: typeof longDescription === 'string' ? longDescription : (typeof description === 'string' ? description : null),
                name: typeof name === 'string' ? name : null,
                shortName: typeof shortName === 'string' ? shortName : null,
                code: typeof code === 'string' ? code : null,
            }
        });

        const updatePayload = {};
        if (typeof longDescription === 'string') updatePayload.description = longDescription;
        else if (typeof description === 'string') updatePayload.description = description;
        if (typeof name === 'string') updatePayload.name = name;
        if (typeof shortName === 'string') updatePayload.shortName = shortName;
        if (typeof code === 'string') updatePayload.code = code;

        // If an existing row somehow lacks catalogId, repair it
        if (!typeCollection.catalogId && repCatalog?.id) {
            updatePayload.catalogId = repCatalog.id;
        }
        if (Object.keys(updatePayload).length > 0) {
            await typeCollection.update(updatePayload);
        }

        return res.json({ success: true, message: 'Type metadata updated', data: { manufacturerId, type, ...updatePayload } });
    } catch (error) {
        console.error('Error updating type metadata:', error?.message || error);
        return res.status(500).json({ success: false, message: 'Failed to update type metadata' });
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
    // new endpoints will be appended below exports update
    fetchManufacturerAssemblyCostDetails,
    fetchAssemblyCostsByTypes,
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
    getManufacturerCatalog,
    bulkEditCatalogItems,
    editStyleName,
    fetchManufacturerTypesMeta,
    createTypeImage,
    bulkEditTypes,
    bulkChangeType,
    editTypeName,
    assignItemsToType,
    updateTypeMeta,
    deleteType,
    getManufacturerTypes,
    addSimpleStyle,
    deleteSimpleStyle
};

// Delete a type: options to reassign item types to another type or null, and remove metadata/image
async function deleteType(req, res) {
    try {
        const { manufacturerId, typeName } = req.params;
        const { reassignTo } = req.body || {};

        if (!manufacturerId || !typeName) {
            return res.status(400).json({ success: false, message: 'Manufacturer ID and type name are required' });
        }

        // Update catalog items
        const itemUpdate = {};
        if (typeof reassignTo === 'string' && reassignTo.trim()) {
            itemUpdate.type = reassignTo.trim();
        } else {
            itemUpdate.type = null; // clear
        }
        const [updatedCount] = await ManufacturerCatalogData.update(itemUpdate, {
            where: { manufacturerId, type: typeName }
        });

        // Remove type metadata entries
        const deletedMeta = await ManufacturerTypeCollection.destroy({ where: { manufacturerId, type: typeName } });

        return res.json({ success: true, message: 'Type deleted', updatedItems: updatedCount, deletedMeta });
    } catch (error) {
        console.error('Error deleting type:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete type' });
    }
}

// Simple add style (by name + optional shortName/description/code/image) without requiring mapping screen
async function addSimpleStyle(req, res) {
    try {
        upload.fields([{ name: 'styleImage', maxCount: 1 }])(req, res, async function (err) {
            if (err) return res.status(400).json({ message: err.message });
            const { manufacturerId, name, shortName, description, code } = req.body;
            if (!manufacturerId || !name) return res.status(400).json({ message: 'manufacturerId and name are required' });
            const imagePath = req.files?.styleImage?.[0]?.filename || null;

            // Resolve a representative catalog item id to satisfy the NOT NULL constraint on catalogId
            let repCatalog = null;
            try {
                repCatalog = await ManufacturerCatalogData.findOne({
                    where: { manufacturerId, style: name },
                    attributes: ['id'],
                    order: [['id', 'ASC']],
                });
                if (!repCatalog) {
                    repCatalog = await ManufacturerCatalogData.findOne({
                        where: { manufacturerId },
                        attributes: ['id'],
                        order: [['id', 'ASC']],
                    });
                }
            } catch (_) {
                // ignore lookup errors, handled below
            }

            if (!repCatalog?.id) {
                return res.status(400).json({
                    message: 'No catalog items found for this manufacturer; add at least one item before creating styles.',
                });
            }

            // Upsert central row with a valid catalogId
            const [row, created] = await ManufacturerStyleCollection.findOrCreate({
                where: { manufacturerId, name },
                defaults: { manufacturerId, name, shortName, description, code, image: imagePath, catalogId: repCatalog.id },
            });
            if (!created) {
                const update = { shortName, description, code };
                if (imagePath) update.image = imagePath;
                if (!row.catalogId) update.catalogId = repCatalog.id;
                await row.update(update);
            }
            return res.json({ success: true, style: row });
        });
    } catch (e) {
        console.error('addSimpleStyle error:', e);
        return res.status(500).json({ message: 'Failed to add style' });
    }
}

// Delete a style: optionally reassign affected catalog items to another style or delete them
async function deleteSimpleStyle(req, res) {
    try {
        const { manufacturerId, styleName } = req.params;
        const { reassignTo, deleteItems } = req.body || {};
        if (!manufacturerId || !styleName) return res.status(400).json({ message: 'manufacturerId and styleName are required' });

        if (deleteItems) {
            await ManufacturerCatalogData.destroy({ where: { manufacturerId, style: styleName } });
        } else if (typeof reassignTo === 'string' && reassignTo.trim()) {
            await ManufacturerCatalogData.update({ style: reassignTo.trim() }, { where: { manufacturerId, style: styleName } });
        } else {
            await ManufacturerCatalogData.update({ style: null }, { where: { manufacturerId, style: styleName } });
        }

        // Remove central metadata rows (both central and per-catalog if any)
        await ManufacturerStyleCollection.destroy({ where: { manufacturerId, name: styleName } });
        await ManufacturerStyleCollection.destroy({ where: { manufacturerId, shortName: styleName } });

        return res.json({ success: true, message: 'Style deleted' });
    } catch (e) {
        console.error('deleteSimpleStyle error:', e);
        return res.status(500).json({ message: 'Failed to delete style' });
    }
}