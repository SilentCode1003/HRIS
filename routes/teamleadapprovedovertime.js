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
    "teamleadapprovedovertimelayout",
    "teamleadapprovedovertime"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT
    pao_image,
    pao_id,
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') as pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%H:%i:%s')  as pao_clockin,
    TIME_FORMAT(pao_clockout, '%H:%i:%s')  as pao_clockout,
	  (pao_night_differentials + pao_normal_ot + pao_early_ot) AS pao_total_hours,
    DATE_FORMAT(pao_payroll_date, '%W, %M %e, %Y') as pao_payroll_date,
    pao_status
    FROM payroll_approval_ot
	INNER JOIN
	master_employee ON payroll_approval_ot.pao_employeeid = me_id
    WHERE me_department = '${departmentid}' AND pao_status = 'Approved'
    AND pao_employeeid NOT IN (
      SELECT tu_employeeid FROM teamlead_user
  );`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error", err);

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
