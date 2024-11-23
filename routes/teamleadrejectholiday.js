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
    "teamleadrejectholidaylayout",
    "teamleadrejectholiday"
  );
});

module.exports = router;


router.get("/load", (req, res) => {
    try {
      let departmentid = req.session.departmentid;
      let sql = `SELECT
      ph_holidayid,
      CONCAT(me_lastname,' ',me_firstname) as ph_fullname,
      DATE_FORMAT(ph_attendancedate, '%W, %M %e, %Y') as ph_attendancedate,
      TIME_FORMAT(ph_timein, '%H:%i:%s')  as ph_timein,
      TIME_FORMAT(ph_timeout, '%H:%i:%s')  as ph_timeout,
       ph_total_hours,
      DATE_FORMAT(ph_payrolldate, '%W, %M %e, %Y') as ph_payrolldate,
      ph_status
      FROM payroll_holiday
      INNER JOIN
      master_employee ON payroll_holiday.ph_employeeid = me_id
      WHERE me_department = '${departmentid}' AND ph_status = 'Rejected'
      AND ph_employeeid NOT IN (
        SELECT tu_employeeid FROM teamlead_user)`;

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
     console.log(error);
     res.json(JsonErrorResponse(error));
    }
});
  