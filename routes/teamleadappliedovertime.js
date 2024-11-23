const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  InsertStatement,
  SelectStatement,
} = require("./repository/customhelper");
const { SendEmailNotificationEmployee } = require("./repository/emailsender");
var router = express.Router();
const currentDate = moment();
const { REQUEST } = require("./repository/enums");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "teamleadappliedovertimelayout",
    "teamleadappliedovertime"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
        pao_id,
        pao_fullname,
        DATE_FORMAT(pao_attendancedate, '%Y-%m-%d') as pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%Y-%m-%d %H:%i:%s') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%Y-%m-%d %H:%i:%s') AS pao_clockout,
        (pao_night_differentials + pao_normal_ot + pao_early_ot) AS pao_total_hours,
        DATE_FORMAT(pao_payroll_date, '%Y-%m-%d') AS pao_payroll_date,
        pao_status
    FROM payroll_approval_ot
    INNER JOIN
    master_employee ON payroll_approval_ot.pao_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = payroll_approval_ot.pao_subgroupid AND
                aprroval_stage_settings.ats_count = payroll_approval_ot.pao_approvalcount
        WHERE 
        pao_status = 'Applied' 
            AND pao_subgroupid IN (${subgroupid})`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");
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

router.post("/getotapproval", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `select 
	  pao_id,
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%Y-%m-%d') as pao_attendancedate,
    DATE_FORMAT(pao_clockin, '%Y-%m-%d %H:%i:%s') AS pao_clockin,
    DATE_FORMAT(pao_clockout, '%Y-%m-%d %H:%i:%s') AS pao_clockout,
    (pao_night_differentials + pao_normal_ot + pao_early_ot) AS pao_total_hours,
    pao_night_differentials,
    pao_early_ot,
    pao_normal_ot,
    DATE_FORMAT(pao_payroll_date, '%Y-%m-%d') AS pao_payroll_date,
    pao_reason,
    pao_status,
    pao_overtimeimage,
    pao_subgroupid
    FROM payroll_approval_ot
    INNER JOIN
    master_employee ON payroll_approval_ot.pao_employeeid = me_id
    where pao_id = '${approveot_id}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");
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

router.post("/ovetimeaction", (req, res) => {
  console.log("HIT");
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.body.subgroupid;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    const { approveot_id, status, comment, attendancedate, timein, timeout } =
      req.body;
    let sql = InsertStatement("overtime_request_activity", "ora", [
      "employeeid",
      "departmentid",
      "subgroupid",
      "date",
      "overtimeid",
      "status",
      "commnet",
    ]);
    let data = [
      [
        employeeid,
        departmentid,
        subgroupid,
        createdate,
        approveot_id,
        status,
        comment,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from overtime_request_activity where ora_employeeid=? and ora_overtimeid=?",
      [employeeid, approveot_id]
    );

    InsertTable(sql, data, (err, result) => {
      if (err) {
        console.log(err);
        res.json(JsonErrorResponse(err));
      }

      let emailbody = [
        {
          employeename: employeeid,
          date: attendancedate,
          reason: comment,
          requesttype: REQUEST.OVERTIME,
        },
      ];


      SendEmailNotificationEmployee(
        employeeid,
        subgroupid,
        REQUEST.OVERTIME,
        emailbody
      );

      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
