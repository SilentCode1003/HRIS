const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();
const { Encrypter } = require('./repository/crytography');
const { generateUsernameAndPasswordforOjt } = require("./helper");

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('registerlayout', { title: 'Express' });
//   Validator(req, res, 'registerlayout');
});

module.exports = router;

router.post("/save", async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      address,
      birthday,
      gender,
      phone,
      ercontact,
      ercontactnumber,
      school,
      department,
      startdate,
      hours,
      image,
    } = req.body;

    const ojtExist = await checkojtExist(firstname, lastname);

    if (ojtExist) {
      return res.json({
        msg: "exist",
      });
    }

    const ojtID = await generateOJTId(currentYear, currentMonth);

    const ojtData = [
      [
        ojtID,
        firstname,
        lastname,
        address,
        'Active', 
        birthday,
        gender,
        phone,
        ercontact,
        ercontactnumber,
        school,
        department,
        startdate,
        hours,
        image,
      ],
    ];

    mysql.InsertTable("master_ojt", ojtData, async (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting ojt: ", insertErr);
        return res.json({
          msg: "insert failed",
        });
      }

      console.log("Ojt record inserted: ", insertResult);

      const { username, password } = generateUsernameAndPasswordforOjt({
        mo_name: firstname,
        mo_lastname: lastname,
        mo_id: ojtID,
        mo_birthday: birthday,
      });

      Encrypter(password, async (encryptErr, encryptedPassword) => {
        if (encryptErr) {
          console.error("Error encrypting password: ", encryptErr);
          return res.json({
            msg: 'encrypt error',
          });
        }

        const userSaveResult = await saveOjtRecord(
          req,
          ojtID,
          username,
          encryptedPassword
        );

        if (userSaveResult.msg === "success") {
          return res.json({
            msg: "success",
          });
        } else {
          console.error("error saving ojt user", userSaveResult.msg);
          return res.json({
            msg: "user save",
          });
        }
      });
    });

  } catch (error) {
    console.error("Error in try-catch block:", error);
    res.json({
      msg: 'error',
      data: error,
    });
  }
});



function checkojtExist(firstname, lastname) {
  return new Promise((resolve, reject) => {
    const checkQuery = `SELECT COUNT(*) AS count FROM master_ojt WHERE mo_name = '${firstname}' AND mo_lastname = '${lastname}'`;

    mysql
      .mysqlQueryPromise(checkQuery)
      .then((result) => {
        const count = parseInt(result[0].count);

        if (count > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}


function generateOJTId(year, month) {
  return new Promise((resolve, reject) => {
    const maxIdQuery = `SELECT count(*) as count FROM master_ojt WHERE mo_id LIKE '${year}${month}%'`;
    mysql
      .mysqlQueryPromise(maxIdQuery)
      .then((result) => {
        let currentCount = parseInt(result[0].count) + 1;
        const paddedNumericPart = String(currentCount).padStart(2, "0");

        let ojtID = `${year}${month}${paddedNumericPart}`;

        resolve(ojtID);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function saveOjtRecord(req, ojtID, username, encryptedPassword) {
  return new Promise((resolve, reject) => {
    const createdate = moment().format('YYYY-MM-DD');
    const createby = req.session && req.session.fullname ? req.session.fullname : 'DefaultUser'; 

    console.log("Session:", req.session);

    const data = [
      [
        ojtID,
        username,
        encryptedPassword,
        4,
        createby,
        createdate,
        "Active",
      ],
    ];

    mysql.InsertTable("ojt_user", data, (inserterr, insertResult) => {
      if (inserterr) {
        console.error("Error inserting user record: ", inserterr);
        reject({ msg: "insert_failed" });
      } else {
        console.log("User record inserted: ", insertResult);
        resolve({ msg: "success" });
      }
    });
  });
}

