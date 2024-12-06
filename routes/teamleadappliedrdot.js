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
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "teamleadappliedrdotlayout", "teamleadappliedrdot");
});

module.exports = router;

router.get("/load", (req, res) => {

  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
        roa_rdotid,
        roa_fullname,
        DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') as roa_attendancedate,
        DATE_FORMAT(roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
        DATE_FORMAT(roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
        roa_total_hours,
        DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
        roa_status
    FROM restday_ot_approval
    INNER JOIN
    master_employee ON restday_ot_approval.roa_employeeid = me_id
    INNER JOIN 
            aprroval_stage_settings ON 
                aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
                aprroval_stage_settings.ats_subgroupid = restday_ot_approval.roa_subgroupid AND
                aprroval_stage_settings.ats_count = restday_ot_approval.roa_approvalcount
        WHERE 
        roa_status = 'Applied' 
            AND roa_subgroupid IN (${subgroupid})`;


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

router.post("/getrdotapproval", (req, res) => {
  try {
    let rdotid = req.body.rdotid;
    let sql = `SELECT 
      roa_rdotid,
      roa_fullname,
      DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') as roa_attendancedate,
      DATE_FORMAT(roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
      DATE_FORMAT(roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
      roa_total_hours,
      DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
      roa_status,
      roa_file,
      roa_subgroupid
      FROM restday_ot_approval
      INNER JOIN
      master_employee ON restday_ot_approval.roa_employeeid = me_id
      WHERE roa_rdotid = '${rdotid}'`;

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

router.post("/rdotaction", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.body.subgroupid;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    const { rdotid, status, comment } = req.body;

    let sql = InsertStatement("restdayot_request_activity", "rra", [
      "employeeid",
      "departmentid",
      "subgroupid",
      "date",
      "restdayotid",
      "status",
      "comment",
    ]);
    let data = [
      [
        employeeid,
        departmentid,
        subgroupid,
        createdate,
        rdotid,
        status,
        comment,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from restdayot_request_activity where rra_employeeid=? and rra_id=?",
      [employeeid, rdotid]
    );

    InsertTable(sql, data, (err, result) => {
      if (err) {
        console.log(err);
        res.json(JsonErrorResponse(err));
      }

      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
