const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorForTeamLead } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, 'teamleadappliedovertimelayout');
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
    WHERE me_department = '${departmentid}' AND pao_status = 'Appllied'`;

    mysql.Select(sql, "Payroll_Approval_Ot" ,(err, result) => {
      if (err) console.error("Error", err);

      res.json({
        msg:'success',
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

router.post('/getotapproval', (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `select 
    pao_image,
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%Y-%m-%d') as pao_attendancedate,
    DATE_FORMAT(pao_clockin, '%Y-%m-%d %H:%i:%s') AS pao_clockin,
    DATE_FORMAT(pao_clockout, '%Y-%m-%d %H:%i:%s') AS pao_clockout,
    (pao_night_differentials + pao_normal_ot + pao_early_ot) AS pao_total_hours,
    pao_night_differentials,
    pao_early_ot,
    pao_normal_ot,
    pao_night_pay,
    pao_normal_pay,
    pao_early_ot_pay,
    pao_total_ot_net_pay,
    DATE_FORMAT(pao_payroll_date, '%Y-%m-%d') AS pao_payroll_date,
    pao_reason,
    pao_status
    from payroll_approval_ot
    where pao_id = '${approveot_id}'`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

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

