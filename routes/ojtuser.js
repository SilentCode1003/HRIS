const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Encrypter } = require("./repository/cryptography");
var router = express.Router();
const currentDate = moment();

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtuserlayout', { title: 'Express' });
  Validator(req, res, "ojtuserlayout", "ojtuser");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
      ou_userid,
      concat(mo_lastname,' ',mo_name) as ou_ojtid,
      ou_username,
      ma_accessname as ou_accesstype,
      ou_status
      from ojt_user
        left join master_ojt on ojt_user.ou_ojtid = mo_id
      LEFT JOIN master_access ON ojt_user.ou_accesstype = ma_accessid`;

    mysql.Select(sql, "Ojt_User", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/update", async (req, res) => {
  try {
    let userid = req.body.userid;
    let username = req.body.username;
    let status = req.body.status;

    let sqlupdate = `UPDATE ojt_user SET 
      ou_username = '${username}',
      ou_status ='${status}'
      WHERE ou_userid ='${userid}'`;

    const updateResult = await mysql.Update(sqlupdate);

    res.json({
      msg: "success",
    });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
    });
  }
});

router.post("/getusers", (req, res) => {
  try {
    let userid = req.body.userid;
    let sql = `
      SELECT 
      ou_username,
      ou_accesstype,
      ou_status
      from ojt_user
      where ou_userid = '${userid}'`;

    mysql.Select(sql, "Ojt_User", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.post("/save", async (req, res) => {
  try {
    let ojtID = req.body.ojtID;
    let accesstype = "4";
    let createby = req.session.fullname;
    const createdate = currentDate.format("YYYY-MM-DD");

    const existingUserQuery = `SELECT * FROM ojt_user WHERE ou_ojtid = '${ojtID}' AND ou_accesstype = '${accesstype}'`;
    const existingUserResult = await mysql.mysqlQueryPromise(
      existingUserQuery,
      [ojtID, accesstype]
    );

    if (existingUserResult.length > 0) {
      return res.json({ msg: "exist" });
    }

    const employeeQuery = `SELECT mo_id, mo_name, mo_lastname, mo_birthday FROM master_ojt WHERE mo_id = '${ojtID}'`;

    try {
      const employeeresult = await mysql.mysqlQueryPromise(employeeQuery, [
        ojtID,
      ]);

      if (employeeresult.length > 0) {
        const ojt = employeeresult[0];
        const { username, password } = generateUsernameAndPasswordforOjt(ojt);

        Encrypter(password, async (err, encrypted) => {
          if (err) {
            console.error("Error: ", err);
            res.json({ msg: "error" });
          } else {
            const data = [
              [ojtID, username, encrypted, 4, createby, createdate, "Active"],
            ];

            mysql.InsertTable("ojt_user", data, (inserterr, insertresult) => {
              if (inserterr) {
                console.error("Error inserting record: ", inserterr);
                res.json({ msg: "insert failed" });
              } else {
                res.json({ msg: "success" });
              }
            });
          }
        });
      } else {
        console.error("No employee found with that ID");
        res.json({ msg: "No employee found with that ID" });
      }
    } catch (employeeerror) {
      console.error("Error querying employee: ", employeeerror);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});
