const model = require("../model/hrmisdb");
const mysql = require("mysql");
const { Encrypter, Decrypter } = require("./cryptography");
const { logger } = require("./logger");
require("dotenv").config();

let password = "";
Decrypter(process.env._PASSWORD_ADMIN, (err, encrypted) => {
  if (err) console.error("Error: ", err);
  // console.log(encrypted);
  password = encrypted;
});

Decrypter("5915fa55a4d5470dfcfc44ddc154f06e", (err, encrypted) => {
  if (err) console.error("Error: ", err);
  console.log(encrypted);
});

const connection = mysql.createConnection({
  host: process.env._HOST_ADMIN,
  user: process.env._USER_ADMIN,
  password: password,
  database: process.env._DATABASE_ADMIN,
  timezone: "PST",
});

exports.CheckConnection = () => {
  connection.connect((err) => {
    if (err) {
      console.error("Error connection to MYSQL database: ", err);
      logger.error(error);
      return;
    }
    console.log("MySQL database connection established successfully!");
  });
};

exports.Select = (sql, callback) => {
  try {
    connection.connect((err) => {
      return err;
    });
    connection.query(sql, (error, results, fields) => {
      if (error) {
        console.log(error);

        return callback(error, null);
      }
      callback(null, results);
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

exports.Update = async (sql, data, callback) => {
  try {
    connection.query(sql, data, (error, results, fields) => {
      if (error) {
        callback(error, null);
      }
      // console.log("Rows affected:", results.affectedRows);

      callback(null, `Rows affected: ${results.affectedRows}`);
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

exports.SelectParameter = (sql, condition, callback) => {
  connection.query(sql, [condition], (error, results, fields) => {
    if (error) {
      return callback(error, null);
    }
    // console.log(results);

    callback(null, results);
  });
};

exports.Insert = (stmt, todos, callback) => {
  try {
    connection.connect((err) => {
      return err;
    });
    // console.log(statement: ${stmt} data: ${todos});

    connection.query(stmt, [todos], (err, results, fields) => {
      if (err) {
        callback(err, null);
      }
      // callback(null, Row inserted: ${results});
      let data = [
        {
          rows: results.affectedRows,
          id: results.insertId,
        },
      ];
      callback(null, data);
      // console.log(Row inserted: ${results.affectedRows});
    });
  } catch (error) {
    logger.error(error);
    callback(error, null);
  }
};

exports.InsertTable = (sql, data, callback) => {
  this.Insert(sql, data, (err, result) => {
    if (err) {
      logger.error(err);
      callback(err, null);
    }
    callback(null, result);
  });
};
