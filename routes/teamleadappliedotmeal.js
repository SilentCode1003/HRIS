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
  Validator(req, res, "teamleadappliedotmeallayout", "teamleadappliedotmeal");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    const subgroupid = req.session.subgroupid;
    const accesstypeid = req.session.accesstypeid;
    const sql = `SELECT 
    oma_mealid,
    concat(me_lastname,' ',me_firstname) oma_fullname,
    DATE_FORMAT(oma_attendancedate, '%Y-%m-%d') as oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%Y-%m-%d %H:%i:%s') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%Y-%m-%d %H:%i:%s') AS oma_clockout,
	  oma_totalovertime,
    DATE_FORMAT(oma_payroll_date, '%Y-%m-%d') AS oma_payroll_date,
    oma_status
    FROM ot_meal_allowances
    INNER JOIN
    master_employee ON ot_meal_allowances.oma_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = ot_meal_allowances.oma_subgroupid AND
                aprroval_stage_settings.ats_count = ot_meal_allowances.oma_approvalcount
    WHERE 
        oma_status = 'Applied' 
        AND oma_subgroupid IN (${subgroupid})`;
    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
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

router.post("/getotmeal", (req, res) => {
  try {
    let otmealid = req.body.otmealid;
    let sql = `SELECT 
      oma_mealid,
      oma_image,
      oma_employeeid as oma_fullname,
      DATE_FORMAT(oma_attendancedate, '%Y-%m-%d') as oma_attendancedate,
      DATE_FORMAT(oma_clockin, '%Y-%m-%d %H:%i:%s') AS oma_clockin,
      DATE_FORMAT(oma_clockout, '%Y-%m-%d %H:%i:%s') AS oma_clockout,
      oma_totalovertime,
      DATE_FORMAT(oma_payroll_date, '%Y-%m-%d') AS oma_payroll_date,
      oma_approvalcount,
      oma_otmeal_amount,
      oma_status,
      oma_applieddate,
      oma_subgroupid
      FROM ot_meal_allowances
      INNER JOIN
      master_employee ON ot_meal_allowances.oma_employeeid = me_id
      where oma_mealid = '${otmealid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
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

router.post("/otmealaction", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.body.subgroupid;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    const { otmealid, status, comment, attendancedate, timein, timeout } =
      req.body;

    let sql = InsertStatement("meal_request_activity", "mra", [
      "employeeid",
      "departmentid",
      "mealid",
      "subgroupid",
      "status",
      "date",
      "commnet",
    ]);
    let data = [
      [
        employeeid,
        departmentid,
        otmealid,
        subgroupid,
        status,
        createdate,
        comment,
      ],
    ];

    InsertTable(sql, data, (err, result) => {
      if (err) {
        console.log(err);
        res.json(JsonErrorResponse(err));
      }

      let emailbody = [
        {
          employeename: employeeid,
          date: attendancedate,
          timein: timein,
          timeout: timeout,
          reason: comment,
          requesttype: REQUEST.OTMEAL,
        },
      ];
      SendEmailNotificationEmployee(
        employeeid,
        subgroupid,
        REQUEST.OTMEAL,
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
