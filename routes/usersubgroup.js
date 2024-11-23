var express = require("express");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, ACT, INACT } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Validator } = require("./controller/middleware");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // req.session.fullname = "DEV42";
  // req.session.employeeid = "999999";
  // req.session.accesstype = "Admin";

  // res.render("accessroutelayout", {
  //   image: req.session.image,
  //   employeeid: "999999",
  //   fullname: "DEV42",
  //   accesstype: "Admin",
  // });
  Validator(req, res, "usersubgrouplayout", "usersubgroup");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
            us_id,
            CONCAT(me_lastname, ' ', me_firstname) AS us_employeeid,
            ma_accessname AS us_accessname,
            s_name AS us_subgroup,
            us_count,
            us_createdate,
            us_createby
        FROM 
            user_subgroup
        INNER JOIN 
            master_user ON user_subgroup.us_userid = master_user.mu_userid
        INNER JOIN 
            master_access ON master_user.mu_accesstype = ma_accessid
        INNER JOIN 
            master_employee ON master_user.mu_employeeid = master_employee.me_id
        INNER JOIN 
            subgroup ON user_subgroup.us_subgroupid = subgroup.s_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "us_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loaduserid", (req, res) => {
  try {
    let sql = `SELECT
        mu_userid,
        CONCAT(me_lastname,' ',me_firstname) AS mu_fullname,
        ma_accessname as mu_accessname
        FROM master_user
        INNER JOIN master_employee ON master_user.mu_employeeid = me_id
        INNER JOIN master_access ON master_user.mu_accesstype = ma_accessid
        WHERE ma_accessname IN ('Supervisor', 'Team Leader', 'Department Head', 'Manager')`;

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
    res.json(JsonErrorResponse(error));
  }
});

router.post("/delete", (req, res) => {
  try {
    let userid = req.body.userid;
    let sql = `DELETE FROM user_subgroup WHERE us_id = '${userid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    const { userid, subgroupid, approvecount } = req.body;

    let sql = InsertStatement("user_subgroup", "us", [
      "userid",
      "subgroupid",
      "createdate",
      "createby",
      "count",
    ]);
    let data = [[userid, subgroupid, createddate, createby, approvecount]];
    let checkStatement = SelectStatement(
      "select * from user_subgroup where us_userid=? and us_subgroupid=?",
      [userid, subgroupid]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(err);
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
