"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("master_holiday_type", {
      mht_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      mht_name: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      mht_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      mht_status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropTable("master_holiday_type");
  },
};
