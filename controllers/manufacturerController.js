const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parseCatalogFile } = require('../utils/parseCatalogFile');
const upload = require('../middleware/upload'); // Your multer setup
const uploadCatalogOnly = require('../middleware/uploadCatalogOnly'); // Your multer setup
const { Manufacturer, ManufacturerCatalogData, Collection } = require('../models');
const { ManufacturerCatalogFile } = require('../models/ManufacturerCatalogFile');
const ManufacturerStyleCollection = require('../models/ManufacturerStyleCollection');
const ManufacturerAssemblyCost = require('../models/ManufacturerAssemblyCost');
const ManufacturerHingesDetails = require('../models/ManufacturerHingesDetails');
const ManufacturerModificationDetails = require('../models/ManufacturerModificationDetails');


const fetchManufacturer = async (req, res) => {
    try {
        const manufacturers = await Manufacturer.findAll();
        res.json(manufacturers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
};

const addManufacturer = async (req, res) => {
    console.log('addManufacturer called');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    try {
        upload.fields([
            { name: 'catalogFiles', maxCount: 10 },
            { name: 'manufacturerImage', maxCount: 1 }
        ])(req, res, async function (err) {
            console.log('Multer processing complete');
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({ message: err.message });
            }

            console.log('Form data received:', req.body);
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
                console.log('Validation failed - missing required fields');
                return res.status(400).json({ message: 'Please provide all required fields' });
            }

            const manufacturerImage = req.files?.['manufacturerImage']?.[0];
            const catalogFiles = req.files?.['catalogFiles'] || [];
            const imagePath = manufacturerImage?.filename || null;

            try {
                console.log('Creating manufacturer with data:', {
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

                console.log('Manufacturer created successfully:', newManufacturer.toJSON());

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
                        console.error(`Error parsing file "${file.originalname}":`, parseError.message);
                    }
                }

                console.log('Sending response with manufacturer:', newManufacturer.toJSON());
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
        const manufacturer = await Manufacturer.findOne({
            where: { id },
            include: [
                {
                    model: ManufacturerCatalogData,
                    as: 'catalogData',
                    order: [['createdAt', 'DESC']] // ordering catalog data by latest
                },
                {
                    model: ManufacturerStyleCollection,
                    as: 'collectionsstyles',
                    order: [['createdAt', 'DESC']] // ordering catalog data by latest
                },
                {
                    model: ManufacturerCatalogFile,
                    as: 'catalogFiles',
                    order: [['createdAt', 'DESC']] // ordering catalog data by latest
                }
            ],
            order: [['createdAt', 'DESC']] // optional: sort manufacturer itself if needed
        });

        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        res.json(manufacturer);
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

        try {
            const manufacturer = await Manufacturer.findByPk(manufacturerId);

            if (!manufacturer) {
                return res.status(404).json({ message: 'Manufacturer not found' });
            }

            // Optional: delete old image if replaced
            if (imagePath && manufacturer.image) {
                fs.unlink(`uploads/${manufacturer.image}`, err => {
                    if (err) console.warn('Failed to delete old image:', err.message);
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
                    console.error(`Error parsing file "${file.originalname}":`, parseError.message);
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




const uploadCatalogFile = async (req, res) => {
    const { manufacturerId } = req.params;
    uploadCatalogOnly.single('catalogFiles')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const parsedData = await parseCatalogFile(file.path, file.mimetype);

            if (!Array.isArray(parsedData) || parsedData.length === 0) {
                return res.status(400).json({ message: 'No valid data in the uploaded file' });
            }

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
                }
            }


            await ManufacturerCatalogFile.create({
                manufacturer_id: manufacturerId,
                filename: file.filename,
                original_name: file.originalname,
                file_path: file.path,
                file_size: file.size,
                mimetype: file.mimetype
            });

            return res.status(201).json({
                success: true,
                message: 'Catalog file uploaded and data saved successfully'
            });

        } catch (parseError) {
            console.error('Error parsing file:', parseError);
            return res.status(500).json({ message: 'Error parsing catalog file', error: parseError.message });
        }
    });
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

            console.log('req.body', req.body);

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
                console.log(`Processing catalogId: ${item.id}`);
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
                    console.log(`Updated style for catalogId: ${item.id}`);
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
                    console.log(`Created style for catalogId: ${item.id}`);
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
        console.log('req.body', req.body);

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



module.exports = {
    addManufacturer,
    fetchManufacturer,
    updateManufacturerStatus,
    fetchManufacturerById,
    updateManufacturer,
    saveManualCabinetItem,
    editManualCabinetItem,
    uploadCatalogFile,
    addManufacturerStyle,
    fetchManufacturerStyleById,
    fetchManufacturerAllStyleById,
    fetchManufacturerStylesWithCatalog,
    fetchManufacturerAssemblyCostDetails,
    fetchManufacturerHingesDetails,
    fetchManufacturerItemsModification,
    saveAssemblyCost,
    saveHingesDetails,
    saveModificationDetails,
    fetchManufacturerCatalogModificationItems,
    addModificationItem
};