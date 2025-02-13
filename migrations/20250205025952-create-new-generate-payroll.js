'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('new_generate_payroll', {
      ngp_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ngp_employeeid: {
        type: Sequelize.STRING(9),
        allowNull: false,
        references: {
          model: 'master_employee',
          key: 'me_id',
        },
      },
      ngp_attendancedate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ngp_day_types: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ngp_startdate: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      ngp_enddate: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      ngp_payrolldate: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      ngp_cutoff: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ngp_clockin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ngp_clockout: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ngp_timein_schedule: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ngp_timeout_schedule: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ngp_late: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      ngp_latedeductions: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_overtime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      ngp_allowances: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_basic_adjustments: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_percutoff: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_per_cutoff_with_allowances: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_per_day: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_per_hour: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_total_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ngp_total_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ngp_night_differentials: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ngp_normal_ot: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ngp_early_ot: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ngp_nightdiff_pay_per_ot: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_basic_pay_per_ot: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_status: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      ngp_total_nd_pay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      ngp_regular_holiday_ot: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_regular_holiday_day: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_special_holiday_ot: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_special_holiday_day: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_total_normal_ot_pay: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_total_early_ot_pay: {
        type: Sequelize.DECIMAL(10, 5),
        allowNull: true,
      },
      ngp_regular_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('new_generate_payroll');
  },
};
