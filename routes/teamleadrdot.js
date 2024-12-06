const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
const { JsonErrorResponse, JsonDataResponse } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { Select } = require("./repository/dbconnect");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('approvedleavelayout', { title: 'Express' });
  Validator(
    req,
    res,
    "teamleadrdotlayout",
    "teamleadrdot"
  );
});

module.exports = router;



router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    roa_rdotid,
    concat(me_lastname,' ',me_firstname) as roa_fullname,
    DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') as roa_attendancedate,
    DATE_FORMAT(roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
    DATE_FORMAT(roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
    roa_total_hours,
    DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
    roa_status
    FROM restday_ot_approval
    INNER JOIN
    master_employee ON restday_ot_approval.roa_employeeid = me_id
    WHERE roa_subgroupid = '${subgroupid}'
    AND me_department = '${departmentid}'
    AND roa_employeeid NOT IN (
        SELECT mu_employeeid FROM master_user where mu_accesstype = '${accesstypeid}')`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
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

router.post("/getteamleadrdot", (req, res) => {
  try {
    let rdotid = req.body.rdotid;  
    let sql = `SELECT 
    roa.roa_rdotid,
    CONCAT(me.me_lastname, ' ', me.me_firstname) AS roa_fullname,
    DATE_FORMAT(roa.roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
    DATE_FORMAT(roa.roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
    DATE_FORMAT(roa.roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
    roa_total_hours,
    DATE_FORMAT(roa.roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
    roa.roa_file,
    roa.roa_status,
    rra.rra_comment as roa_comment,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS roa_approver
    FROM 
    restdayot_request_activity rra
    INNER JOIN 
    restday_ot_approval roa ON rra.rra_restdayotid = roa.roa_rdotid
    INNER JOIN 
    master_employee me ON roa.roa_employeeid = me.me_id
    INNER JOIN 
    master_employee me_activity ON rra.rra_employeeid = me_activity.me_id
    WHERE roa.roa_rdotid = '${rdotid}'
    ORDER BY 
    rra.rra_date DESC
    LIMIT 1`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }      

      if (result != 0) {
        let data = DataModeling(result, "roa_");
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

