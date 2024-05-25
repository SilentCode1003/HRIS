const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "request_approval_settingslayout",
    "request_approval_settings"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    ras_is,
    md_departmentname as ras_departmentid,
    ras_count,
    ras_createdby,
    ras_createdate,
    ras_status
    FROM request_approval_settings
    INNER JOIN master_department on 
    request_approval_settings.ras_departmentid = md_departmentid`;

    mysql.Select(sql, "Request_Approval_Settings", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/save", (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let settingscount = req.body.settingscount;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = "Active";
    let data = [];

    data.push([departmentid, settingscount, createby, createdate, status]);

    let sql = `SELECT * FROM request_approval_settings WHERE 
    ras_departmentid = '${departmentid}' AND ras_count = '${settingscount}'`;

    mysql.Select(sql, "Request_Approval_Settings", (err, result) => {
      if (err) console.error("Error :", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("request_approval_settings", data, (err, result) => {
          if (err) console.error("Error: ", err);

          console.log(result);
          res.json({
            msg: "success",
            data: result,
          });
        });
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getapprovesettings", (req, res) => {
  try {
    let approvalsettings = req.body.approvalsettings;
    let sql = `SELECT
    ras_is,
    ras_departmentid,
    ras_count,
    ras_createdby,
    ras_createdate,
    ras_status
    FROM request_approval_settings
    WHERE  ras_is = '${approvalsettings}'`;

    mysql.Select(sql, "Request_Approval_Settings", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    console.error(error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/update", (req, res) => {
  try {
    let approvalsettings = req.body.approvalsettings;
    let departmentid = req.body.departmentid;
    let settingscount = req.body.settingscount;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = req.body.status;

    let sql = `UPDATE request_approval_settings SET 
    ras_departmentid = '${departmentid}',
    ras_count = '${settingscount}',
    ras_createdby = '${createby}',
    ras_createdate = '${createdate}',
    ras_status = '${status}'
    WHERE ras_is = '${approvalsettings}'`;

    mysql
      .Update(sql)
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
    console.log(error);
  }
});
