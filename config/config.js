const { DecrypterString } = require('../routes/repository/cryptography');
require('dotenv').config();

module.exports = {
  development: {
    username: process.env._USER_ADMIN,
    password: DecrypterString(process.env._PASSWORD_ADMIN),
    database: process.env._DATABASE_ADMIN,
    host: process.env._HOST_ADMIN,
    dialect: 'mysql',
  },
  test: {
    username: process.env._USER_ADMIN,
    password: DecrypterString(process.env._PASSWORD_ADMIN),
    database: process.env._DATABASE_ADMIN,
    host: process.env._HOST_ADMIN,
    dialect: 'mysql',
  },
  production: {
    username: process.env._USER_ADMIN,
    password: DecrypterString(process.env._PASSWORD_ADMIN),
    database: process.env._DATABASE_ADMIN,
    host: process.env._HOST_ADMIN,
    dialect: 'mysql',
  },
};
