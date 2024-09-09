const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  Validator(req, res, "teamleadshiftlayout", "teamleadshift");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;

    console.log(departmentid);

    let sql = `call hrmis.TeamLeadLoadShift('${departmentid}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.error("Error: ", err);

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

router.get("/selectdistinct", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    console.log(departmentid);
    let sql = `SELECT DISTINCT
      me_id,
      concat(me_lastname,' ',me_firstname) as me_fullname
      FROM master_employee
      LEFT JOIN master_shift ON master_employee.me_id = master_shift.ms_employeeid
      WHERE master_shift.ms_employeeid IS NULL
      AND me_jobstatus IN ('regular', 'probitionary','apprentice')
      AND me_department = '${departmentid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/selectshift", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    console.log(departmentid);
    let sql = `SELECT 
      me_id,
      concat(me_lastname,' ',me_firstname) as me_fullname
      FROM master_employee
      LEFT JOIN master_shift ON master_employee.me_id = master_shift.ms_employeeid
      WHERE me_jobstatus IN ('regular', 'probitionary','apprentice')
      AND me_department = '${departmentid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/save", async (req, res) => {
  try {
    let employeeName = req.body.employeeName;
    let departmentid = req.session.departmentid;
    let shiftsettingsid = req.body.shiftsettingsid;

    console.log(employeeName, departmentid, shiftsettingsid);

    let checkSql = `SELECT * FROM master_shift WHERE ms_employeeid = '${employeeName}'`;

    mysql.Select(checkSql, "Master_Shift", (err, result) => {
      if (err) {
        console.error("Error checking data:", err);
        return res.json({
          msg: "error",
          data: err,
        });
      }

      if (result.length > 0) {
        return res.json({
          msg: "exist",
          data: result,
        });
      }

      let sql = `call hrmis.InsertShift('${employeeName}', '${departmentid}', '${shiftsettingsid}')`;

      mysql.StoredProcedure(sql, (err, result) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.json({
            msg: "error",
            data: err,
          });
        }

        res.json({
          msg: "success",
          data: result,
        });
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});
