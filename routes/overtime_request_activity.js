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
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "overtime_request_activitylayout",
    "overtime_request_activity"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    ora.ora_id AS ora_id,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS ora_fullname,
    DATE_FORMAT(pao.pao_clockin, '%W, %M %e, %Y %h:%i %p') AS ora_clockin,
    DATE_FORMAT(pao.pao_clockout, '%W, %M %e, %Y %h:%i %p') AS ora_clockout,
    pao.pao_total_hours AS ora_totalhours,
    DATE_FORMAT(pao.pao_attendancedate, '%W, %Y-%m-%d') AS ora_attendancedate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS ora_approver,
    DATE_FORMAT(ora.ora_date, '%W, %M %e, %Y %h:%i %p') AS ora_actiondate,
    ora.ora_status AS ora_status
    FROM overtime_request_activity ora
    INNER JOIN payroll_approval_ot pao ON ora.ora_overtimeid = pao.pao_id
    INNER JOIN master_employee me_request ON pao.pao_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON ora.ora_employeeid = me_activity.me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ora_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getovertimeactivity", (req, res) => {
  try {
    let otactivityid = req.body.otactivityid;
    let sql = `SELECT 
    ora.ora_id AS ora_id,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS ora_fullname,
    DATE_FORMAT(pao.pao_clockin, '%W, %M %e, %Y %h:%i %p') AS ora_clockin,
    DATE_FORMAT(pao.pao_clockout, '%W, %M %e, %Y %h:%i %p') AS ora_clockout,
    pao.pao_total_hours AS ora_totalhours,
    DATE_FORMAT(pao.pao_attendancedate, '%W, %Y-%m-%d') AS ora_attendancedate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS ora_approver,
    DATE_FORMAT(ora.ora_date, '%W, %M %e, %Y %h:%i %p') AS ora_actiondate,
    ora.ora_status AS ora_status,
    pao.pao_overtimeimage as ora_image,
	  s.s_name as ora_subgroupname,
    pao_approvalcount as ora_approvecount,
    ora.ora_commnet AS ora_actioncomment,
    pao.pao_reason as ora_reason,
    CONCAT(pao_approvalcount,' out of ', ras_count) AS ora_approval_status
    FROM overtime_request_activity ora
	  JOIN request_approval_settings  ON ora_departmentid = ras_departmentid
    INNER JOIN payroll_approval_ot pao ON ora.ora_overtimeid = pao.pao_id
    INNER JOIN master_employee me_request ON pao.pao_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON ora.ora_employeeid = me_activity.me_id
    INNER JOIN subgroup s on ora.ora_subgroupid = s.s_id
    WHERE ora_id = '${otactivityid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ora_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(err);
    res.json(JsonErrorResponse(err));
  }
});
