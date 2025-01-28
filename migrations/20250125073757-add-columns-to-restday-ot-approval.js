'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('restday_ot_approval', 'roa_rdotpayday', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_total_hours', 
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_rdot_type', {
      type: Sequelize.STRING(100),
      after: 'roa_rdotpayday', 
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_nightdiff_hour', {
      type: Sequelize.INTEGER,
      after: 'roa_rdot_type',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_normal_ot_hour', {
      type: Sequelize.INTEGER,
      after: 'roa_nightdiff_hour',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_early_ot_hour', {
      type: Sequelize.INTEGER,
      after: 'roa_normal_ot_hour',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_nightdiff_minutes', {
      type: Sequelize.INTEGER,
      after: 'roa_early_ot_hour',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_normal_ot_minutes', {
      type: Sequelize.INTEGER,
      after: 'roa_nightdiff_minutes',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_early_ot_minutes', {
      type: Sequelize.INTEGER,
      after: 'roa_normal_ot_minutes',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_nightdiff_pay_hour', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_early_ot_minutes',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_normal_ot_pay_hour', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_nightdiff_pay_hour',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_early_ot_pay_hour', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_normal_ot_pay_hour',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_nightdiff_pay_minutes', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_early_ot_pay_hour',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_normal_ot_pay_minutes', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_nightdiff_pay_minutes',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_early_ot_pay_minutes', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_normal_ot_pay_minutes',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_total_nightdiff', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_early_ot_pay_minutes',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_total_normal', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_total_nightdiff',
    });

    await queryInterface.addColumn('restday_ot_approval', 'roa_total_early', {
      type: Sequelize.DECIMAL(10, 5),
      after: 'roa_total_normal',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('restday_ot_approval', 'roa_rdotpayday');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_rdot_type');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_nightdiff_hour');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_normal_ot_hour');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_early_ot_hour');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_nightdiff_minutes');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_normal_ot_minutes');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_early_ot_minutes');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_nightdiff_pay_hour');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_normal_ot_pay_hour');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_early_ot_pay_hour');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_nightdiff_pay_minutes');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_normal_ot_pay_minutes');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_early_ot_pay_minutes');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_total_nightdiff');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_total_normal');
    await queryInterface.removeColumn('restday_ot_approval', 'roa_total_early');
  },
};
