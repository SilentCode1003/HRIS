const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Encrypter } = require("./repository/crytography");
const { generateUsernameAndPassword } = require("./helper");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
//   req.session.fullname = "DEV42";
//   req.session.employeeid = "999999";
//   req.session.accesstype = "Admin";

//   res.render("userslayout", {
//     image: req.session.image,
//     employeeid: "999999",
//     fullname: "DEV42",
//     accesstype: "Admin",
//   });
  Validator(req, res, 'teamleaduserslayout');
});

module.exports = router;

router.post("/save", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let accesstype = '5';
    let status = 'Active';
    let createby = req.session.fullname;
    const createdate = currentDate.format("YYYY-MM-DD");

    const existingUserQuery = `SELECT * FROM teamlead_user WHERE tu_employeeid = '${employeeid}' AND tu_accesstype = '${accesstype}'`;
    const existingUserResult = await mysql.mysqlQueryPromise(
      existingUserQuery,
      [employeeid, accesstype]
    );

    if (existingUserResult.length > 0) {
      return res.json({ msg: "exist" });
    }

    const employeeQuery = `SELECT me_id, me_firstname, me_lastname, me_birthday FROM master_employee WHERE me_id = '${employeeid}'`;

    try {
      const employeeresult = await mysql.mysqlQueryPromise(employeeQuery, [
        employeeid,
      ]);

      if (employeeresult.length > 0) {
        const employee = employeeresult[0];
        const { username, password } = generateUsernameAndPassword(employee);

        Encrypter(password, async (err, encrypted) => {
          if (err) {
            console.error("Error: ", err);
            res.json({ msg: "error" });
          } else {
            const data = [
              [
                employeeid,
                username,
                encrypted,
                accesstype,
                createby,
                createdate,
                status,
              ],
            ];

            mysql.InsertTable(
              "teamlead_user",
              data,
              (inserterr, insertresult) => {
                if (inserterr) {
                  console.error("Error inserting record: ", inserterr);
                  res.json({ msg: "insert failed" });
                } else {
                  console.log(insertresult);
                  res.json({ msg: "success" });
                }
              }
            );
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

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    tu_userid,
    concat(me_firstname,' ',me_lastname) as tu_employeeid,
    tu_username,
    ma_accessname as tu_accesstype,
    tu_createby,
    tu_createdate,
    tu_status
    from teamlead_user
    left join master_employee on teamlead_user.tu_employeeid = me_id
    LEFT JOIN master_access ON teamlead_user.tu_accesstype = ma_accessid`;

    mysql.Select(sql, "Team_Leader_User", (err, result) => {
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
    //let password = req.body.password;
    let accesstype = req.body.accesstype;
    let status = req.body.status;

    // Wrap the Encrypter function in a promise
    // const encrypted = await new Promise((resolve, reject) => {
    //   Encrypter(password, (err, result) => {
    //     if (err) {
    //       console.error("Error in Encrypter: ", err);
    //       reject(err);
    //     } else {
    //       resolve(result);
    //     }
    //   });
    // });

    let sqlupdate = `UPDATE master_user SET 
      mu_username = '${username}',
      mu_accesstype = '${accesstype}',
      mu_status ='${status}'
      WHERE mu_userid ='${userid}'`;

    const updateResult = await mysql.Update(sqlupdate);

    console.log(updateResult);

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
        mu_username,
        mu_password,
        mu_accesstype,
        mu_status
        from master_user
        where mu_userid = '${userid}'`;

    mysql.Select(sql, "Master_User", (err, result) => {
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
