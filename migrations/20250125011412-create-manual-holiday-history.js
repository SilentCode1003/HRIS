'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('manual_holiday_history', {
      mhh_history_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      mhh_employee: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      mhh_gp_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'generate_payroll', // Name of the referenced table
          key: 'gp_id', // The referenced column in the generate_payroll table
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      mhh_holiday_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      mhh_attendance_date: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      mhh_payroll_date: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      mhh_create_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      mhh_create_by: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('manual_holiday_history');
  },
};
