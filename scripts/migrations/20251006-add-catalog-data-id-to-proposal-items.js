const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    // Add catalog_data_id column to proposal_section_items table
    await queryInterface.addColumn('proposal_section_items', 'catalog_data_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'manufacturer_catalog_data',
        key: 'id'
      },
      comment: 'Reference to the original catalog item for sub-type validation'
    });

    // Add index for performance
    await queryInterface.addIndex('proposal_section_items', ['catalog_data_id'], {
      name: 'idx_proposal_items_catalog_data'
    });

    console.log('✓ Added catalog_data_id column to proposal_section_items');
    console.log('✓ Added index idx_proposal_items_catalog_data');
  },

  async down(queryInterface) {
    // Remove index first
    await queryInterface.removeIndex('proposal_section_items', 'idx_proposal_items_catalog_data');

    // Remove column
    await queryInterface.removeColumn('proposal_section_items', 'catalog_data_id');

    console.log('✓ Removed catalog_data_id column from proposal_section_items');
    console.log('✓ Removed index idx_proposal_items_catalog_data');
  }
};
