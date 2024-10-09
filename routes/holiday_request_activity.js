const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
  JsonWarningResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { de } = require("date-fns/locale");
const {
  SelectStatement,
  InsertStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "holiday_request_activitylayout",
    "holiday_request_activity"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    hra.hra_id as hra_holidayid,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS hra_employeeid,
    ph.ph_attendancedate as hra_attendancedate,
    DATE_FORMAT(ph.ph_timein, '%W, %M %e, %Y') AS hra_timein,
    DATE_FORMAT(ph.ph_timeout, '%W, %M %e, %Y') AS hra_timeout,
    ph.ph_total_hours as hra_totalhours,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS hra_approver,
    hra.hra_date as hra_actiondate,
    hra.hra_status as hra_status
    FROM holiday_request_activity hra
    INNER JOIN payroll_holiday ph ON hra.hra_holidayreqid = ph.ph_holidayid
    INNER JOIN master_employee me_request ON ph.ph_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON hra.hra_employeeid = me_activity.me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hra_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.post("/getholidayactivity", (req, res) => {
  try {
    let holidayrequest_id = req.body.holidayrequest_id;
    let sql = `SELECT 
    hra.hra_id as hra_holidayid,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS hra_employeeid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as hra_attendancedate,
    DATE_FORMAT(ph.ph_timein, '%W, %M %e, %Y, %H:%i:%s') AS hra_timein,
    DATE_FORMAT(ph.ph_timeout, '%W, %M %e, %Y %H:%i:%s') AS hra_timeout,
    ph.ph_total_hours as hra_totalhours,
    DATE_FORMAT(ph.ph_createdate,  '%W, %M %e, %Y, %H:%i:%s') as hra_applicationdate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS hra_approver,
    DATE_FORMAT(hra.hra_date,  '%W, %M %e, %Y, %H:%i:%s') as hra_actiondate,
    hra.hra_status as hra_status,
    ph.ph_total_hours as hra_total_hours,
    ph.ph_file as hra_file,
    ph.ph_approvalcount as hra_approvalcount,
    s_name as hra_subgroupname,
    ph_holidaytype as hra_holidaytype,
    DATE_FORMAT(ph_holidaydate, '%Y-%m-%d') as ph_holidaydate,
    mh_name as hra_holidayname,
    hra_commnet as hra_comment,
    ph_approvalcount as hra_approve_count,
    CONCAT(ph_approvalcount,' out of ', ras_count) AS hra_approval_status
    FROM holiday_request_activity hra
    INNER JOIN payroll_holiday ph ON hra.hra_holidayreqid = ph.ph_holidayid
    INNER JOIN master_holiday mh ON ph.ph_holidaydate = mh_date
    INNER JOIN master_employee me_request ON ph.ph_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON hra.hra_employeeid = me_activity.me_id
    INNER JOIN subgroup on hra.hra_subgroupid = s_id
	JOIN request_approval_settings  ON hra_departmentid = ras_departmentid
    WHERE hra_id = '${holidayrequest_id}';`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hra_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
