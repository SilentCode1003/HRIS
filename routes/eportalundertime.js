var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  InsertStatementTransCommit,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { Select, Insert, Update, Check } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
  JsonWarningResponse,
  MessageStatus,
} = require("./repository/response");
const { REQUEST_STATUS, REQUEST } = require("./repository/enums");
const { SendEmailNotification } = require("./repository/emailsender");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "eportalundertimelayout", "eportalundertime");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    const startDate = GetCurrentMonthFirstDay();
    const endDate = GetCurrentMonthLastDay();
    const employeeid = req.session.employeeid;

    let sql = SelectStatement(
      "select * from undertime_request where ur_employee_id = ? and ur_attendance_date between ? and ?",
      [employeeid, startDate, endDate]
    );

    Select(sql, (error, result) => {
      if (error) {
        res.status(500).json(JsonErrorResponse(error));
      }

      if (result.length != 0) {
        let data = DataModeling(result, "ur_");
        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    const { attendancedate, clockin, clockout, reason, subgroupid } = req.body;
    const employeeid = req.session.employeeid;
    const status = REQUEST_STATUS.applied;

    async function ProcessData() {
      let check_sql = SelectStatement(
        "select * from undertime_request where ur_attendance_date = ? and ur_employee_id = ? and ur_status = ?",
        [attendancedate, employeeid, status]
      );

      let check_result = await Check(check_sql);
      console.log(check_result);

      let insert_sql = InsertStatement("undertime_request", "ur", [
        "employee_id",
        "attendance_date",
        "clockin",
        "clockout",
        "reason",
        "subgroup_id",
        "status",
        "approval_count",
        "applied_date",
      ]);

      let insert_data = [[
        employeeid,
        attendancedate,
        clockin,
        clockout,
        reason,
        subgroupid,
        status,
        0,
        GetCurrentDatetime(),
      ]];

      if (check_result) {
        Insert(insert_sql, insert_data, (error, result) => {
          if (error) {
            console.log(error);

            return res.status(500).json(JsonErrorResponse(error));
          }

          let emailbody = [
            {
              employeename: employeeid,
              date: attendancedate,
              reason: reason,
              status: MessageStatus.APPLIED,
              requesttype: REQUEST.UT,
              startdate: clockin,
              enddate: clockout,
            },
          ];

          SendEmailNotification(employeeid, subgroupid, REQUEST.UT, emailbody);

          res.status(200).json(JsonSuccess());
        });
      } else {
        res.status(200).json(JsonWarningResponse(MessageStatus.EXIST));
      }
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
