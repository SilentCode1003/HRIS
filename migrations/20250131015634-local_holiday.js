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

    await queryInterface.createTable("local_holiday", {
      lh_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      lh_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "master_holiday_type", // Name of the referenced table
          key: "mht_id", // The referenced column in the master_holiday_type table
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      lh_date: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      lh_create_by: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      lh_create_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      lh_status: {
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
