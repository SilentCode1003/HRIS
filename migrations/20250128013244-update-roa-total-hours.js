'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE restday_ot_approval
      SET roa_total_hours = 0; -- Using decimal value 0 which is compatible with DECIMAL
    `);

    await queryInterface.changeColumn('restday_ot_approval', 'roa_total_hours', {
      type: Sequelize.TIME,
      allowNull: true,
    });
    
    await queryInterface.sequelize.query(`
      UPDATE restday_ot_approval
      SET roa_total_hours = '00:00:00'; -- Update all values to '00:00:00' in TIME format
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('restday_ot_approval', 'roa_total_hours', {
      type: Sequelize.DECIMAL(10, 5),
      allowNull: true,
    });
  },
};
