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
const {
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
} = require("./repository/customhelper");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "restdayot_request_activitylayout",
    "restdayot_request_activity"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let startdate = GetCurrentMonthFirstDay();
    let enddate = GetCurrentMonthLastDay();
    let sql = `SELECT 
    rra.rra_id AS rra_id,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS rra_fullname,
    DATE_FORMAT(roa.roa_timein, '%W, %M %e, %Y %h:%i %p') AS rra_clockin,
    DATE_FORMAT(roa.roa_timeout, '%W, %M %e, %Y %h:%i %p') AS rra_clockout,
    roa.roa_total_hours AS rra_totalhours,
    DATE_FORMAT(roa.roa_attendancedate, '%W, %Y-%m-%d') AS rra_attendancedate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS rra_approver,
    DATE_FORMAT(rra.rra_date, '%W, %M %e, %Y %h:%i %p') AS rra_actiondate,
    rra.rra_status
    FROM restdayot_request_activity rra
    INNER JOIN restday_ot_approval roa ON rra.rra_restdayotid = roa.roa_rdotid
    INNER JOIN master_employee me_request ON roa.roa_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON rra.rra_employeeid = me_activity.me_id
    WHERE rra_date BETWEEN '${startdate} 00:00:00' AND '${enddate} 23:59:59'
    ORDER BY rra_date DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "rra_");

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

router.post("/getrestdayotactivity", (req, res) => {
  try {
    let restdayotid = req.body.restdayotid;
    let sql = `SELECT 
    rra.rra_id AS rra_id,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS rra_fullname,
    DATE_FORMAT(roa.roa_timein, '%W, %M %e, %Y %h:%i %p') AS rra_clockin,
    DATE_FORMAT(roa.roa_timeout, '%W, %M %e, %Y %h:%i %p') AS rra_clockout,
    roa.roa_total_hours AS rra_totalhours,
    DATE_FORMAT(roa.roa_attendancedate, '%W, %Y-%m-%d') AS rra_attendancedate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS rra_approver,
    DATE_FORMAT(rra.rra_date, '%W, %M %e, %Y %h:%i %p') AS rra_actiondate,
    rra.rra_status AS rra_status,
    roa.roa_file as rra_image,
	  s.s_name as rra_subgroupname,
    roa_approvalcount as rra_approvecount,
    rra.rra_comment AS rra_actioncomment,
    CONCAT(roa_approvalcount,' out of ', ras_count) AS rra_approval_status
    FROM restdayot_request_activity rra
	  JOIN request_approval_settings  ON rra_departmentid = ras_departmentid
    INNER JOIN restday_ot_approval roa ON rra.rra_restdayotid = roa.roa_rdotid
    INNER JOIN master_employee me_request ON roa.roa_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON rra.rra_employeeid = me_activity.me_id
    INNER JOIN subgroup s on rra.rra_subgroupid = s.s_id
    WHERE rra_id = '${restdayotid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "rra_");

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
