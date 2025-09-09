const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Check if the old columns exist before trying to rename them
            const tableDescription = await queryInterface.describeTable('catalog_sub_type_assignments');

            if (tableDescription.created_at) {
                // Rename created_at to createdAt
                await queryInterface.renameColumn(
                    'catalog_sub_type_assignments',
                    'created_at',
                    'createdAt',
                    { transaction }
                );
            }

            if (tableDescription.updated_at) {
                // Rename updated_at to updatedAt
                await queryInterface.renameColumn(
                    'catalog_sub_type_assignments',
                    'updated_at',
                    'updatedAt',
                    { transaction }
                );
            }

            await transaction.commit();
            console.log('Successfully renamed catalog_sub_type_assignments timestamp columns to camelCase');
        } catch (error) {
            await transaction.rollback();
            console.error('Error renaming catalog_sub_type_assignments columns:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Check if the new columns exist before trying to rename them back
            const tableDescription = await queryInterface.describeTable('catalog_sub_type_assignments');

            if (tableDescription.createdAt) {
                // Rename createdAt back to created_at
                await queryInterface.renameColumn(
                    'catalog_sub_type_assignments',
                    'createdAt',
                    'created_at',
                    { transaction }
                );
            }

            if (tableDescription.updatedAt) {
                // Rename updatedAt back to updated_at
                await queryInterface.renameColumn(
                    'catalog_sub_type_assignments',
                    'updatedAt',
                    'updated_at',
                    { transaction }
                );
            }

            await transaction.commit();
            console.log('Successfully reverted catalog_sub_type_assignments timestamp columns to snake_case');
        } catch (error) {
            await transaction.rollback();
            console.error('Error reverting catalog_sub_type_assignments columns:', error);
            throw error;
        }
    }
};
