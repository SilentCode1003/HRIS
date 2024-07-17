const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable } = require("./repository/dbconnect");
const { JsonErrorResponse, JsonDataResponse, JsonSuccess, JsonWarningResponse } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { de } = require("date-fns/locale");
const { SelectStatement, InsertStatement, GetCurrentDatetime } = require("./repository/customhelper");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */

router.get("/", function (req, res, next) {
  // Validator(req, res, "teamleadtotalholidaylayout");
  Validator(req, res, "teamleadtotalholidaylayout", "teamleadtotalholiday");
});
module.exports = router;

router.get("/load", (req, res) => {
    try {
      let departmentid = req.session.departmentid;
      let subgroupid = req.session.subgroupid;
      let accesstypeid = req.session.accesstypeid;
      let sql = `SELECT 
      ph_holidayid,
      concat(me_lastname,' ',me_firstname) as ph_fullname,
      DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
      DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
      DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
      (ph_normal_ot_total + ph_nightdiff_ot_total) AS ph_total_hours,
      DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
      ph_status
    FROM payroll_holiday
    INNER JOIN
    master_employee ON payroll_holiday.ph_employeeid = me_id
    WHERE ph_subgroupid = '${subgroupid}'
    AND me_department = '${departmentid}'
    AND ph_employeeid NOT IN (
        SELECT mu_employeeid FROM master_user where mu_accesstype = '${accesstypeid}')`;
  
      Select(sql, (err, result) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
        }
  
        console.log(result);
  
        if (result != 0) {
          let data = DataModeling(result, "ph_");
  
          console.log(data);
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
      let sql = `SELECT 
        ph.ph_holidayid,
        CONCAT(me.me_lastname, ' ', me.me_firstname) AS ph_fullname,
        DATE_FORMAT(ph.ph_attendancedate, '%Y-%m-%d') AS ph_attendancedate,
        DATE_FORMAT(ph.ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
        DATE_FORMAT(ph.ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
        (ph.ph_normal_ot_total + ph.ph_nightdiff_ot_total) AS ph_total_hours,
        DATE_FORMAT(ph.ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
        DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
        ph_holidaytype,
        DATE_FORMAT(ph_holidaydate, '%Y-%m-%d') as ph_holidaydate,
        mh_name as ph_holidayname,
        ph.ph_file,
        ph.ph_status,
        hra.hra_commnet as ph_comment,
        CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS ph_approver
        FROM 
        holiday_request_activity hra
        INNER JOIN 
        payroll_holiday ph ON hra.hra_holidayreqid = ph.ph_holidayid
        INNER JOIN 
        master_employee me ON ph.ph_employeeid = me.me_id
        INNER JOIN 
        master_employee me_activity ON hra.hra_employeeid = me_activity.me_id
        INNER JOIN master_holiday ON ph.ph_holidaydate = mh_date
        WHERE ph.ph_holidayid = '${holiday_id}'
        ORDER BY 
        hra.hra_date DESC
        LIMIT 1`;
  
      Select(sql, (err, result) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
        }
  
        console.log(result);
  
        if (result != 0) {
          let data = DataModeling(result, "ph_");
  
          console.log(data);
          res.json(JsonDataResponse(data));
        } else {
          res.json(JsonDataResponse(result));
        }
      });
  
      // mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      //   if (err) console.error("Error: ", err);
  
      //   console.log(result);
  
      //   res.json({
      //     msg: "success",
      //     data: result,
      //   });
      // });
    } catch (error) {
      res.json({
        msg: "error",
        data: error,
      });
    }
  });
  
