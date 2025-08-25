const ResourceLink = require('../models/ResourceLink');
const ResourceFile = require('../models/ResourceFile');
const { Op } = require('sequelize');
const fs = require('fs');


const getLinks = async (req, res) => {
    try {
        const user = req.user;
        
        // Build where clause with group visibility
        let whereClause = {};
        
        // Apply group visibility filtering
        if (user.group_id && user.group && user.group.group_type === 'contractor') {
            // Contractors can only see links visible to 'contractor' type or their specific group
            whereClause[Op.or] = [
                { visible_to_group_types: { [Op.contains]: ['contractor'] } },
                { visible_to_group_ids: { [Op.contains]: [user.group_id] } }
            ];
        }
        // Admins can see all links (no additional filtering)

        const links = await ResourceLink.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'title', 'url', 'type', 'createdAt', 'updatedAt'],
        });

        res.status(200).json({
            success: true,
            data: links,
            message: 'Links fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching links',
            error: error.message,
        });
    }
};

const saveLink = async (req, res) => {
    try {
        const { title, url, type } = req.body;

        // Validation
        if (!title || !url || !type) {
            return res.status(400).json({
                success: false,
                message: 'Title, URL, and type are required',
            });
        }

        // URL validation
        const urlPattern = new RegExp(
            '^(https?:\\/\\/)?' +                       // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}' + // domain name
            '|((\\d{1,3}\\.){3}\\d{1,3}))' +            // OR IP (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +         // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' +                // query string
            '(\\#[-a-z\\d_]*)?$', 'i'                    // fragment locator
        );

        if (!urlPattern.test(url)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid URL',
            });
        }

        // Save link
        const newLink = await ResourceLink.create({ title, url, type });

        res.status(201).json({
            success: true,
            data: newLink,
            message: 'Link saved successfully',
        });
    } catch (error) {
        console.error('Error saving link:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving link',
            error: error.message,
        });
    }
};


const updateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, type } = req.body;

        // Validation
        if (!title || !url || !type) {
            return res.status(400).json({
                success: false,
                message: 'Title, URL, and type are required',
            });
        }

        // Find the existing link
        const existingLink = await ResourceLink.findOne({
            where: { id },
        });

        if (!existingLink) {
            return res.status(404).json({
                success: false,
                message: 'Link not found',
            });
        }

        // Update fields
        await existingLink.update({ title, url, type });

        res.status(200).json({
            success: true,
            data: existingLink,
            message: 'Link updated successfully',
        });
    } catch (error) {
        console.error('Error updating link:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating link',
            error: error.message,
        });
    }
};


const deleteLink = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the existing link
        const existingLink = await ResourceLink.findOne({
            where: { id },
        });

        if (!existingLink) {
            return res.status(404).json({
                success: false,
                message: 'Link not found',
            });
        }

        // Soft delete (set is_deleted = 1)
        await existingLink.update({ is_deleted: true });

        res.status(200).json({
            success: true,
            message: 'Link deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting link',
            error: error.message,
        });
    }
};

// 
const getFiles = async (req, res) => {
    try {
        const user = req.user;
        
        // Build where clause with group visibility
        let whereClause = { is_deleted: false };
        
        // Apply group visibility filtering
        if (user.group_id && user.group && user.group.group_type === 'contractor') {
            // Contractors can only see files visible to 'contractor' type or their specific group
            whereClause[Op.or] = [
                { visible_to_group_types: { [Op.contains]: ['contractor'] } },
                { visible_to_group_ids: { [Op.contains]: [user.group_id] } }
            ];
        }
        // Admins can see all files (no additional filtering)

        const files = await ResourceFile.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            attributes: [
                'id',
                'name',
                'original_name',
                'file_path',
                'file_size',
                'file_type',
                'mime_type',
                ['created_at', 'uploadedAt'],
                ['updated_at', 'updatedAt'],
            ],
        });

        const formattedFiles = files.map(file => ({
            ...file.toJSON(),
            size: formatFileSize(file.file_size),
            type: file.file_type,
            url: `/api/resources/files/download/${file.id}`,
        }));

        res.status(200).json({
            success: true,
            data: formattedFiles,
            message: 'Files fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching files',
            error: error.message,
        });
    }
};


const saveFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Avoid logging uploaded file details to prevent leaking paths/PII
    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    const fileType = getFileType(originalname);
    const fileCategory = getFileType(originalname);

    // Create file record in DB
    const newFile = await ResourceFile.create({
      name: filename,
      original_name: originalname,
      file_path: filePath,
      file_size: size,
      mime_type: mimetype,
      file_category: fileCategory,
    });

    const formattedFile = {
      id: newFile.id,
      name: newFile.name,
      original_name: newFile.original_name,
      file_path: newFile.file_path,
      file_size: newFile.file_size,
      file_type: newFile.file_type,
      mime_type: newFile.mime_type,
      uploadedAt: newFile.created_at,
      updatedAt: newFile.updated_at,
      size: formatFileSize(newFile.file_size),
      type: newFile.file_type,
      url: `/api/resources/files/download/${newFile.id}`,
    };

    res.status(201).json({
      success: true,
      data: formattedFile,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error saving file:', error);

    // Cleanup file if DB insert fails
    // if (req.file && req.file.path) {
    //   try {
    //     fs.unlinkSync(req.file.path);
    //   } catch (unlinkError) {
    //     console.error('Error deleting uploaded file:', unlinkError);
    //   }
    // }

    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

const updateFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if file exists
        const [existingFile] = await db.execute(
            'SELECT id, file_path FROM resource_files WHERE id = ? AND is_deleted = 0',
            [id]
        );

        if (existingFile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        let updateQuery = 'UPDATE resource_files SET updated_at = NOW()';
        let queryParams = [];

        // Update name if provided
        if (name) {
            updateQuery += ', original_name = ?';
            queryParams.push(name);
        }

        // Handle new file upload
        if (req.file) {
            const { originalname, filename, path: filePath, size, mimetype } = req.file;
            const fileType = getFileType(originalname);

            updateQuery += ', name = ?, file_path = ?, file_size = ?, file_type = ?, mime_type = ?';
            queryParams.push(filename, filePath, size, fileType, mimetype);

            // Delete old file
            try {
                if (fs.existsSync(existingFile[0].file_path)) {
                    fs.unlinkSync(existingFile[0].file_path);
                }
            } catch (deleteError) {
                console.error('Error deleting old file:', deleteError);
            }
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(id);

        await db.execute(updateQuery, queryParams);

        // Fetch updated file
        const [updatedFile] = await db.execute(
            `SELECT id, name, original_name, file_path, file_size, file_type, mime_type,
              created_at as uploadedAt, updated_at as updatedAt 
       FROM resource_files WHERE id = ?`,
            [id]
        );

        const formattedFile = {
            ...updatedFile[0],
            size: formatFileSize(updatedFile[0].file_size),
            type: updatedFile[0].file_type,
            url: `/api/resources/files/download/${updatedFile[0].id}`
        };

        res.status(200).json({
            success: true,
            data: formattedFile,
            message: 'File updated successfully'
        });
    } catch (error) {
        console.error('Error updating file:', error);

        // Clean up uploaded file if database save failed
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error updating file',
            error: error.message
        });
    }
};

const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if file exists and get file path
        const [existingFile] = await db.execute(
            'SELECT id, file_path FROM resource_files WHERE id = ? AND is_deleted = 0',
            [id]
        );

        if (existingFile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Soft delete in database
        await db.execute(
            'UPDATE resource_files SET is_deleted = 1, updated_at = NOW() WHERE id = ?',
            [id]
        );

        // Delete physical file
        try {
            if (fs.existsSync(existingFile[0].file_path)) {
                fs.unlinkSync(existingFile[0].file_path);
            }
        } catch (deleteError) {
            console.error('Error deleting physical file:', deleteError);
        }

        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
};

const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Build where clause with group visibility
        let whereClause = { id: id, is_deleted: false };
        
        // Apply group visibility filtering for contractors
        if (user.group_id && user.group && user.group.group_type === 'contractor') {
            whereClause[Op.or] = [
                { visible_to_group_types: { [Op.contains]: ['contractor'] } },
                { visible_to_group_ids: { [Op.contains]: [user.group_id] } }
            ];
        }

        const file = await ResourceFile.findOne({
            where: whereClause,
            attributes: ['file_path', 'original_name', 'mime_type']
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found or access denied'
            });
        }

        const filePath = file.file_path;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.setHeader('Content-Type', file.mime_type);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: error.message,
        });
    }
};

// Helper Functions
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();

    if (['pdf'].includes(extension)) return 'pdf';
    if (['xlsx', 'xls', 'csv'].includes(extension)) return 'excel';
    if (['docx', 'doc'].includes(extension)) return 'word';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) return 'image';
    return 'other';
};

// Contractor-scoped resources endpoint
const getResources = async (req, res) => {
    try {
        const { scope } = req.query;
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        let whereClause = { is_deleted: false };

        // Apply contractor scoping
        if (scope === 'contractor' && user.group_id && user.group && user.group.type === 'contractor') {
            // For contractors, show resources visible to:
            // 1. All contractors (visible_to_group_types includes 'contractor')
            // 2. Specific contractor group (visible_to_group_ids includes their group_id)
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    // Resources visible to all contractors
                    require('sequelize').literal(`JSON_CONTAINS(visible_to_group_types, '"contractor"')`),
                    // Resources visible to specific contractor group
                    require('sequelize').literal(`JSON_CONTAINS(visible_to_group_ids, '${user.group_id}')`),
                ]
            };
        } else if (user.group && user.group.type === 'admin') {
            // Admins can see all resources
            // No additional filtering needed
        } else {
            // Non-contractor users get empty results
            whereClause = { ...whereClause, id: -1 }; // Impossible condition
        }

        // Fetch links and files
        const [links, files] = await Promise.all([
            ResourceLink.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'title', 'url', 'type', 'createdAt', 'updatedAt', 'visible_to_group_types', 'visible_to_group_ids'],
            }),
            ResourceFile.findAll({
                where: whereClause,
                order: [['created_at', 'DESC']],
                attributes: [
                    'id',
                    'name',
                    'original_name',
                    'file_path',
                    'file_size',
                    'file_type',
                    'mime_type',
                    ['created_at', 'uploadedAt'],
                    ['updated_at', 'updatedAt'],
                    'visible_to_group_types',
                    'visible_to_group_ids'
                ],
            })
        ]);

        const formattedFiles = files.map(file => ({
            ...file.toJSON(),
            size: formatFileSize(file.file_size),
            type: file.file_type,
            url: `/api/resources/files/download/${file.id}`,
        }));

        res.status(200).json({
            success: true,
            data: {
                links: links,
                files: formattedFiles
            },
            message: 'Resources fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources',
            error: error.message,
        });
    }
};

module.exports = {
    getLinks,
    saveLink,
    updateLink,
    deleteLink,
    getFiles,
    saveFile,
    updateFile,
    deleteFile,
    downloadFile,
    getResources
};