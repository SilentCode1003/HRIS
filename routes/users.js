const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Encrypter } = require("./repository/cryptography");
const { Validator } = require("./controller/middleware");
const { generateUsernameAndPassword } = require("./repository/helper");
const { Select, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
  JsonSuccess,
  JsonWarningResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  SelectStatement,
  UpdateStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { is } = require("date-fns/locale");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // req.session.fullname = "DEV42";
  // req.session.employeeid = "999999";
  // req.session.accesstype = "Admin";

  // res.render("userslayout", {
  //   image: req.session.image,
  //   employeeid: "999999",
  //   fullname: "DEV42",
  //   accesstype: "Admin",
  // });

  Validator(req, res, "userslayout", "users");
});

module.exports = router;

router.post("/save", async (req, res) => {
  try {
    const { employeeid, accesstype } = req.body;
    let status = "Active";
    let createby = req.session.fullname;
    const createdate = currentDate.format("YYYY-MM-DD");
    let geofenceValue = 1;

    const existingUserQuery = `SELECT * FROM master_user WHERE mu_employeeid = '${employeeid}' AND mu_accesstype = '${accesstype}'`;
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
                geofenceValue,
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
    let sql = `  SELECT 
    mu_userid,
    concat(me_firstname,' ',me_lastname) as mu_employeeid,
    mu_username,
    ma_accessname as mu_accesstype,
    mu_createby,
    mu_createdate,
    mu_status,
    CASE 
            WHEN mu_isgeofence = 1 THEN 'Active'
            ELSE 'Inactive'
        END AS mu_isgeofence
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

router.post("/getisgeofencetrue", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `
      SELECT 
        mu_username,
        mu_password,
        mu_accesstype,
        mu_status,
        mu_isgeofence
    FROM master_user
    WHERE mu_employeeid = '${employeeid}';
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mu_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
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
        mu_status,
        CASE 
            WHEN mu_isgeofence = 1 THEN 'True'
            ELSE 'False'
        END AS mu_isgeofence
    FROM master_user
    WHERE mu_userid = '${userid}';
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mu_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.put("/edit", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    const { userid, username, accesstype, status, isgeofence } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];
    let geofenceValue;

    if (username) {
      data.push(username);
      columns.push("username");
    }

    if (accesstype) {
      data.push(accesstype);
      columns.push("accesstype");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (isgeofence) {
      geofenceValue = isgeofence.toLowerCase() === "true" ? 1 : 0;
      data.push(geofenceValue);
      columns.push("isgeofence");
    }

    if (userid) {
      data.push(userid);
      arguments.push("userid");
    }

    let updateStatement = UpdateStatement(
      "master_user",
      "mu",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from master_user where mu_username = ? and mu_accesstype = ? and mu_status = ? and mu_isgeofence = ?",
      [username, accesstype, status, geofenceValue]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion
