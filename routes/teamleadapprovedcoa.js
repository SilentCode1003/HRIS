const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { ValidatorForTeamLead } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(
    req,
    res,
    "teamleadapprovedcoalayout",
    "teamleadapprovedcoa"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
    me_profile_pic,
    ar_requestid,
    concat(me_lastname,' ',me_firstname) as ar_employeeid,
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_total,
    ar_createdate,
    ar_status
  FROM attendance_request
  INNER JOIN
  master_employee ON attendance_request.ar_employeeid = me_id
  WHERE me_department = '${departmentid}' AND ar_status = 'Approved'
  AND ar_employeeid NOT IN (
    SELECT tu_employeeid FROM teamlead_user
);`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

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
