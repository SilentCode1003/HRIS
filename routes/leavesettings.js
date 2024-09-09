const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { Select } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('interestlayout', { title: 'Express' });
  Validator(req, res, "leavesettingslayout", "leavesettings");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) as ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    inner join master_employee on master_leaves.ml_employeeid = me_id`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

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

router.post("/setleave", async (req, res) => {
  try {
    let totalleave = req.body.totalleave;
    let yearleave = req.body.yearleave;
    let leavetype = req.body.leavetype;

    console.log(yearleave);
    console.log(leavetype);

    const checkQuery = `SELECT COUNT(*) AS count FROM master_leaves WHERE ml_year = '${yearleave}' AND ml_leavetype = '${leavetype}'`;

    const existingRecord = await mysql.mysqlQueryPromise(checkQuery);

    if (existingRecord.length > 0 && existingRecord[0].count > 0) {
      res.json({ msg: "exist" });
    } else {
      let sql = `CALL hrmis.CreateLeave(${totalleave}, ${yearleave}, '${leavetype}')`;

      mysql.StoredProcedure(sql, (err, result) => {
        if (err) {
          console.error("Error calling stored procedure: ", err);
          res.json({
            msg: "error",
            data: err,
          });
        } else {
          res.json({
            msg: "success",
            data: result,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/setleaveperemployee", async (req, res) => {
  try {
    let totalleave = req.body.totalleave;
    let yearleave = req.body.yearleave;
    let leavetype = req.body.leavetype;
    let employeeid = req.body.employeeid;

    console.log(yearleave);
    console.log(leavetype);

    const checkQuery = `SELECT COUNT(*) AS count FROM master_leaves 
    WHERE ml_year = '${yearleave}' 
    AND ml_leavetype = '${leavetype}'
    AND ml_employeeid = '${employeeid}'`;

    const existingRecord = await mysql.mysqlQueryPromise(checkQuery);

    if (existingRecord.length > 0 && existingRecord[0].count > 0) {
      res.json({ msg: "exist" });
    } else {
      let sql = `call hrmis.CreateLeavePerEmployee
      (${totalleave}, ${yearleave}, '${leavetype}', '${employeeid}')`;

      mysql.StoredProcedure(sql, (err, result) => {
        if (err) {
          console.error("Error calling stored procedure: ", err);
          res.json({
            msg: "error",
            data: err,
          });
        } else {
          res.json({
            msg: "success",
            data: result,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getleavedates", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let sql = `
    SELECT
    ld_dateid,
    CONCAT(me_lastname,' ',me_firstname) AS ld_fullname,
    DATE_FORMAT(ld_leavedates, '%Y-%m-%d') AS ld_leavedates,
    DATE_FORMAT(ld_leavedates, '%W') AS ld_day_name,
    ml_leavetype AS ld_leavetype,
    ml_year AS ld_year,
    DATE_FORMAT(ld_payrolldate, '%Y-%m-%d') AS ld_payrolldate
    FROM leave_dates
    INNER JOIN master_leaves ON leave_dates.ld_leavetype = ml_id
    INNER JOIN master_employee ON leave_dates.ld_employeeid = me_id
    WHERE ml_id = '${leavesettingsid}'
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ld_");

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

router.post("/getleavesettings", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let sql = `select * from master_leaves
    where ml_id = '${leavesettingsid}'`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

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

router.post("/update", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let employeeid = req.body.employeeid;
    let leavetype = req.body.leavetype;
    let yearleave = req.body.yearleave;
    let totalleave = req.body.totalleave;
    let unusedleave = req.body.unusedleave;
    let usedleave = req.body.usedleave;

    let sqlupdate = `UPDATE master_leaves SET   
    ml_employeeid = '${employeeid}',
    ml_leavetype  = '${leavetype}',
    ml_year = '${yearleave}',
    ml_totalleavedays = '${totalleave}',
    ml_unusedleavedays = '${unusedleave}',
    ml_usedleavedays = '${usedleave}'
    WHERE ml_id ='${leavesettingsid}'`;

    mysql
      .Update(sqlupdate)
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
