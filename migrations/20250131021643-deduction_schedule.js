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

    await queryInterface.createTable('deduction_schedule', {
      ds_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ds_employee_id: {
        type: Sequelize.STRING(9),
        allowNull: false
      },
      ds_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      ds_date: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      ds_create_by: {
        type: Sequelize.STRING(300),
        allowNull: false
      },
      ds_create_date: {
        type:Sequelize.STRING(20),
        allowNull: false
      },
      ds_status: {
        type: Sequelize.STRING(20),
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropTable('deduction_schedule');
  }
};
