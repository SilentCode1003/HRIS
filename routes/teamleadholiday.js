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
  MessageStatus,
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

router.get("/", function (req, res, next) {
  // Validator(req, res, "teamleadholidaylayout");
  Validator(req, res, "teamleadholidaylayout", "teamleadholiday");
});
module.exports = router;

router.get("/load", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
      ph_holidayid,
      concat(me_lastname,' ',me_firstname) as ph_fullname,
      DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
      DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
      DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
      ph_total_hours,
      DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate
  FROM payroll_holiday
  INNER JOIN
  master_employee ON payroll_holiday.ph_employeeid = me_id
  INNER JOIN 
  aprroval_stage_settings ON 
      aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
      aprroval_stage_settings.ats_subgroupid = payroll_holiday.ph_subgroupid AND
      aprroval_stage_settings.ats_count = payroll_holiday.ph_approvalcount
      WHERE 
        ph_status = 'Applied' 
        AND ph_subgroupid IN (${subgroupid})`;
    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");

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

router.post("/getholidayapproval", (req, res) => {
  try {
    let holiday_id = req.body.holiday_id;
    let sql = ` SELECT 
      ph_holidayid,
      ph_file,
      CONCAT(me_lastname,' ',me_firstname) as ph_fullname,
      DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
      DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
      DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
      ph_total_hours,
      DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
	    ph_holidaytype,
      DATE_FORMAT(ph_holidaydate, '%Y-%m-%d') as ph_holidaydate,
      mh_name as ph_holidayname,
      ph_subgroupid,
      ph_status,
      ph_createdate
      FROM payroll_holiday
      INNER JOIN master_holiday ON payroll_holiday.ph_holidaydate = mh_date
      INNER JOIN
      master_employee ON payroll_holiday.ph_employeeid = me_id
      where ph_holidayid = '${holiday_id}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
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

router.post("/holidayaction", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.body.subgroupid;
    let createdate = GetCurrentDatetime();
    const { holiday_id, status, comment } = req.body;
    

    let sql = InsertStatement("holiday_request_activity", "hra", [
      "employeeid",
      "departmentid",
      "holidayreqid",
      "subgroupid",
      "status",
      "date",
      "commnet",
    ]);
    let data = [
      [
        employeeid,
        departmentid,
        holiday_id,
        subgroupid,
        status,
        createdate,
        comment,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from holiday_request_activity where hra_employeeid=? and hra_holidayreqid=? and hra_status=? ",
      [employeeid, holiday_id, status]
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
    res.json(JsonErrorResponse(err));
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
