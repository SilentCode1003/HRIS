const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestovertimelayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT * FROM payroll_approval_ot WHERE pao_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});


router.post('/getovertime', (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `select
    pao_attendancedate,
    pao_clockin,
    pao_clockout,
    pao_total_hours,
    pao_night_differentials,
    pao_normal_ot,
    pao_early_ot,
    pao_reason,
    pao_payroll_date,
    pao_status
   from payroll_approval_ot
   where pao_id = '${approveot_id}'`

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error : ", err);

      res.json({
        msg:'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/update', (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let totalhours = req.body.totalhours;
    let night_ot = req.body.night_ot;
    let normal_ot = req.body.normal_ot;
    let earlyot = req.body.earlyot;
    let reason = req.body.reason;
    let overtimestatus = req.body.overtimestatus;
    let sql = `UPDATE payroll_approval_ot SET 
    pao_total_hours = '${totalhours}',
    pao_night_differentials = '${night_ot}',
    pao_normal_ot = '${normal_ot}',
    pao_early_ot = '${earlyot}',
    pao_reason = '${reason}',
    pao_status = '${overtimestatus}'
    WHERE pao_id = '${approveot_id}'`;

    mysql.Update(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      });
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});