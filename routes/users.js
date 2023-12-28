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
  req.session.fullname = "DEV42";
  req.session.employeeid = "999999";
  req.session.accesstype = "Admin";

  res.render("userslayout", {
    image: req.session.image,
    employeeid: "999999",
    fullname: "DEV42",
    accesstype: "Admin",
  });

  // Validator(req, res, 'userslayout');
});

module.exports = router;

router.post("/save", async (req, res) => {
  try {
    const { employeeid, accesstype, status } = req.body;
    let createby = req.session.fullname;
    const createdate = currentDate.format("YYYY-MM-DD");

    // Validate if the combination of employeeid and accesstype already exists
    const existingUserQuery = `SELECT * FROM master_user WHERE mu_employeeid = '${employeeid}' AND mu_accesstype = '${accesstype}'`;
    const existingUserResult = await mysql.mysqlQueryPromise(
      existingUserQuery,
      [employeeid, accesstype]
    );

    if (existingUserResult.length > 0) {
      // Combination already exists, return an error
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
              "master_user",
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
    mu_userid,
    concat(me_firstname,' ',me_lastname) as mu_employeeid,
    mu_username,
    ma_accessname as mu_accesstype,
    mu_createby,
    mu_createdate,
    mu_status
    from master_user
      left join master_employee on master_user.mu_employeeid = me_id
    LEFT JOIN master_access ON master_user.mu_accesstype = ma_accessid`;

    mysql.Select(sql, "Master_User", (err, result) => {
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
