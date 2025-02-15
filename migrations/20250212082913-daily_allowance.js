'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    
    await queryInterface.createTable('daily_allowance', {
      da_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      da_employee_id: {
        type: Sequelize.STRING(9),
        allowNull: false,
        references: {
          model: 'master_employee',
          key: 'me_id',
        },
      },
      da_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      da_status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
      },
      da_create_by: {
        type: Sequelize.STRING(9),
        allowNull: false,
        references: {
          model: 'master_employee',
          key: 'me_id',
        },
      },
      da_create_date: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('daily_allowance');
  }
};
