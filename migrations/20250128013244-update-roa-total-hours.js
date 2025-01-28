'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE restday_ot_approval
      SET roa_total_hours = NULL
      WHERE roa_total_hours < 0;
    `);

    await queryInterface.changeColumn('restday_ot_approval', 'roa_total_hours', {
      type: Sequelize.TIME,
      allowNull: true, 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('restday_ot_approval', 'roa_total_hours', {
      type: Sequelize.DECIMAL(10, 5),
      allowNull: true, 
    });
  },
};
