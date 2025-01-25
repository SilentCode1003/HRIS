const { Sequelize } = require('sequelize');
const Umzug = require('umzug');
require('dotenv').config();
const { DecrypterString } = require('../repository/cryptography');

(async () => {
  try {
    const sequelize = new Sequelize(
      process.env._DATABASE_ADMIN,
      process.env._USER_ADMIN,
      DecrypterString(process.env._PASSWORD_ADMIN),
      {
        host: process.env._HOST_ADMIN,
        dialect: 'mysql',
      }
    );

    const migrator = new Umzug({
      migrations: { glob: 'migrations/*.js' },
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelize, 
      },
    });

    const executedMigrations = await migrator.executed();
    const pendingMigrations = await migrator.pending();

    const allMigrations = [
      ...executedMigrations.map((migration) => ({
        Name: migration.file,
        Status: 'up',
      })),
      ...pendingMigrations.map((migration) => ({
        Name: migration.file,
        Status: 'down',
      })),
    ];

    console.table(allMigrations);

    await sequelize.close();
  } catch (error) {
    console.error('Error fetching migration status:', error);
  }
})();
