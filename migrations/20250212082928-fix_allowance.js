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

    await queryInterface.createTable('fix_allowance', {
      fa_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      fa_employeeid: {
        type: Sequelize.STRING(9),
        allowNull: false,
        references: {
          model: 'master_employee',
          key: 'me_id',
        },
      },
      fa_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      fa_cut_off: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      fa_status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
      },
      fa_create_by: {
        type: Sequelize.STRING(9),
        allowNull: false,
        references: {
          model: 'master_employee',
          key: 'me_id',
        },
      },
      fa_create_date: {
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

    await queryInterface.dropTable('fix_allowance');
  }
};
