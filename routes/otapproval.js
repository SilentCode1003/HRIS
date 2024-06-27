var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");
const mysql = require("./repository/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('paymentlayout', { title: 'Express' });
  Validator(req, res, "otapprovallayout", "otapproval");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    pao_id,
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') as pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%H:%i:%s')  as pao_clockin,
    TIME_FORMAT(pao_clockout, '%H:%i:%s')  as pao_clockout,
	  (pao_night_differentials + pao_normal_ot + pao_early_ot) AS pao_total_hours,
    DATE_FORMAT(pao_payroll_date, '%W, %M %e, %Y') as pao_payroll_date,
    pao_status
    FROM payroll_approval_ot`;

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

router.post("/update", (req, res) => {
  try {
    let night_ot = req.body.night_ot;
    let earlyot = req.body.earlyot;
    let normal_ot = req.body.normal_ot;
    let payrolldate = req.body.payrolldate;
    let approveot_id = req.body.approveot_id;
    let overtimestatus = req.body.overtimestatus;
    let sql = `UPDATE payroll_approval_ot SET 
    pao_night_differentials = '${night_ot}',
    pao_early_ot = '${earlyot}',
    pao_normal_ot = '${normal_ot}',
    pao_night_pay = pao_night_differentials * pao_night_hours_pay,
    pao_normal_pay = pao_normal_ot * pao_normal_ot_pay,
    pao_early_ot_pay = pao_early_ot * pao_normal_ot_pay,
    pao_total_ot_net_pay = (pao_night_pay + pao_normal_pay + pao_early_ot_pay),
    pao_payroll_date = '${payrolldate}',
    pao_status = '${overtimestatus}' 
    WHERE pao_id = '${approveot_id}'`;

    mysql
      .Update(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/updateforapp", (req, res) => {
  try {
    let night_ot = req.body.night_ot;
    let earlyot = req.body.earlyot;
    let normal_ot = req.body.normal_ot;
    let approveot_id = req.body.approveot_id;
    let overtimestatus = req.body.overtimestatus;
    let sql = `UPDATE payroll_approval_ot SET 
    pao_night_differentials = '${night_ot}',
    pao_early_ot = '${earlyot}',
    pao_normal_ot = '${normal_ot}',
    pao_night_pay = pao_night_differentials * pao_night_hours_pay,
    pao_normal_pay = pao_normal_ot * pao_normal_ot_pay,
    pao_early_ot_pay = pao_early_ot * pao_normal_ot_pay,
    pao_total_ot_net_pay = (pao_night_pay + pao_normal_pay + pao_early_ot_pay),
    pao_status = '${overtimestatus}' 
    WHERE pao_id = '${approveot_id}'`;

    mysql
      .Update(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      date: error,
    });
  }
});

router.post("/getotapproval", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `select 
    pao_image,
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') as pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%H:%i:%s')  as pao_clockin,
    TIME_FORMAT(pao_clockout, '%H:%i:%s')  as pao_clockout,
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

router.post("/getotapprovalforapp", (req, res) => {
  try {
    let approveid = req.body.approveid;
    let sql = `select 
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') as pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%H:%i:%s')  as pao_clockin,
    TIME_FORMAT(pao_clockout, '%H:%i:%s')  as pao_clockout,
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
    where pao_id = '${approveid}'`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

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

// router.post('/loadforapp', (req, res) =>{
//   try {
//     let employeeid = req.body.employeeid;
//     let sql = `select *
//     from payroll_approval_ot
//     where pao_employeeid = '${employeeid}'`;

//     mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
//       if (err) console.error("Error: ", err);

//       res.json({
//         msg:'success',
//         data: result,
//       });
//     });
//   } catch (error) {
//     res.json({
//       msg:'error',
//       data: error,
//     });
//   }
// });

router.post("/forapp", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT
    pao_id,
    pao_employeeid,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') as pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%H:%i:%s')  as pao_clockin,
    TIME_FORMAT(pao_clockout, '%H:%i:%s')  as pao_clockout,
	  (pao_night_differentials + pao_normal_ot + pao_early_ot) AS pao_total_hours,
    DATE_FORMAT(pao_payroll_date, '%W, %M %e, %Y') as pao_payroll_date,
    pao_status
    FROM payroll_approval_ot
    where pao_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error: ", err);

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
