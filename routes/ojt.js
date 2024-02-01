const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Encrypter } = require("./repository/crytography");
const { generateUsernameAndPasswordforOjt } = require("./helper");
var router = express.Router();
const currentDate = moment();

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtlayout', { title: 'Express' });
  Validator(req, res, "ojtlayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `
    SELECT
        mo_image AS image,
        mo.mo_id AS id,
        CONCAT(mo_lastname, ' ', mo_name) AS Name,
        mo_startdate AS DateStarted,
        mo.mo_hours as TotalHours,
        SEC_TO_TIME(IFNULL(SUM(TIME_TO_SEC(TIMEDIFF(oa.oa_clockout, oa.oa_clockin))), 0)) AS AcumulatedHours,
        SEC_TO_TIME(TIME_TO_SEC(mo.mo_hours) - IFNULL(SUM(TIME_TO_SEC(TIMEDIFF(oa.oa_clockout, oa.oa_clockin))), 0)) AS RemainingHours,
        DATE_ADD(NOW(), INTERVAL CEIL(TIME_TO_SEC(SEC_TO_TIME(TIME_TO_SEC(mo.mo_hours) - IFNULL(SUM(TIME_TO_SEC(TIMEDIFF(oa.oa_clockout, oa.oa_clockin))), 0))) / 28800) DAY) AS EndDate,
        mo_status as Status
    FROM
        master_ojt mo
    LEFT JOIN
        ojt_attendance oa ON mo.mo_id = oa.oa_ojtid
    GROUP BY
        mo.mo_id, mo.mo_hours;
        `;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/save", async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      address,
      status,
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
        status,
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

    mysql.InsertTable(
      "master_ojt",
      ojtData,
      async (insertErr, insertResult) => {
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
              msg: "encrypt error",
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
      }
    );
  } catch (error) {
    console.error("Error in try-catch block:", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getojt", (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let sql = `SELECT * FROM master_ojt WHERE mo_id = '${ojtid}'`;

    mysql.Select(sql, "Master_Ojt", (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      dat: error,
    });
  }
});

router.post("/update", async (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let image = req.body.image;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let address = req.body.address;
    let status = req.body.status;
    let birthday = req.body.birthday;
    let gender = req.body.gender;
    let phone = req.body.phone;
    let ercontact = req.body.ercontact;
    let ercontactnumber = req.body.ercontactnumber;
    let school = req.body.school;
    let department = req.body.department;
    let startdate = req.body.startdate;
    let hours = req.body.hours;

    console.log(ojtid);

    let sql = `UPDATE master_ojt SET
      mo_image = '${image}',
      mo_name = '${firstname}',
      mo_lastname = '${lastname}',
      mo_address = '${address}',
      mo_status = '${status}',
      mo_birthday = '${birthday}',
      mo_gender = '${gender}',
      mo_cpnumber = '${phone}',
      mo_ercontact = '${ercontact}',
      mo_ercontactnumber = '${ercontactnumber}',
      mo_school = '${school}',
      mo_department = '${department}',
      mo_startdate = '${startdate}',
      mo_hours = '${hours}'
      WHERE mo_id = '${ojtid}'`;

    mysql
      .Update(sql)
      .then((result) => {
        console.log(result);
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

//#region function

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
        console.log(error);
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
    const createdate = moment().format("YYYY-MM-DD");
    const createby =
      req.session && req.session.fullname
        ? req.session.fullname
        : "DefaultUser";

    console.log("Session:", req.session);

    const data = [
      [ojtID, username, encryptedPassword, 4, createby, createdate, "Active"],
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

//#endregion
