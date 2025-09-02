const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add personal address fields
    await queryInterface.addColumn('users', 'street_address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'zip_code', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    // Add company information fields
    await queryInterface.addColumn('users', 'company_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'company_street_address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'company_city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'company_state', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'company_zip_code', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('users', 'company_country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove personal address fields
    await queryInterface.removeColumn('users', 'street_address');
    await queryInterface.removeColumn('users', 'city');
    await queryInterface.removeColumn('users', 'state');
    await queryInterface.removeColumn('users', 'zip_code');
    await queryInterface.removeColumn('users', 'country');
    
    // Remove company information fields
    await queryInterface.removeColumn('users', 'company_name');
    await queryInterface.removeColumn('users', 'company_street_address');
    await queryInterface.removeColumn('users', 'company_city');
    await queryInterface.removeColumn('users', 'company_state');
    await queryInterface.removeColumn('users', 'company_zip_code');
    await queryInterface.removeColumn('users', 'company_country');
  }
};
