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
  JsonSuccessMulti,
} = require("./repository/response");
const { REQUEST_STATUS, REQUEST } = require("./repository/enums");
const { SendEmailNotification } = require("./repository/emailsender");
const { Transaction } = require("./utility/utility");
const { SendEmployeeNotification } = require("./repository/helper");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "teamleadundertimelayout", "teamleadundertime");
});

module.exports = router;

router.get("/getundertimerequest", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let status = REQUEST_STATUS.applied;

    let sql = SelectStatement(
      `select 
        ur_id,
        ur_employee_id,
        concat(me_firstname, ' ', me_lastname) as ur_fullname,
        ur_attendance_date,
        REPLACE(REPLACE(ur_clockin, 'T', ' '), 'Z', '') AS ur_clockin,
        REPLACE(REPLACE(ur_clockout, 'T', ' '), 'Z', '') AS ur_clockout,
        ur_applied_date,
        ur_status
        from undertime_request 
        inner join master_employee on ur_employee_id = me_id
        inner join aprroval_stage_settings on ats_subgroupid = ur_subgroup_id and ats_count = ur_approval_count and ats_accessid = ?
        where ur_subgroup_id in (?)
        and ur_status = ?`,
      [req.session.accesstypeid, subgroupid, status]
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

router.get("/view/:requestid", (req, res) => {
  try {
    const { requestid } = req.params;

    async function ProcessData() {
      let undertime_request_sql = SelectStatement(
        `select     
                      ur_id,
                      ur_employee_id,
                      ur_attendance_date,
                      ur_subgroup_id,
                      REPLACE(REPLACE(ur_clockin, 'T', ' '), 'Z', '') AS ur_clockin,
                      REPLACE(REPLACE(ur_clockout, 'T', ' '), 'Z', '') AS ur_clockout,
                      ur_applied_date,
                      ur_reason,
                      ur_status,
                      ur_approval_count from undertime_request where ur_id = ?`,
        [requestid]
      );

      let undertime_request_result = await Check(undertime_request_sql);
      let undertime_request_data = DataModeling(
        undertime_request_result,
        "ur_"
      );

      let aprrover_sql = SelectStatement(
        `select me_id as employee_id,
        concat(me_firstname, ' ', me_lastname) as fullname,
        mp_positionname as position,
        md_departmentname as department,
        ats_count as approval_count
        from user_subgroup 
        inner join master_user on mu_userid = us_userid
        inner join master_employee on me_id = mu_employeeid
        inner join master_department on me_department = md_departmentid
        inner join master_position on mp_positionid = me_position
        inner join aprroval_stage_settings on ats_accessid = mu_accesstype and ats_subgroupid = us_subgroupid
        where us_subgroupid in (?)`,
        [undertime_request_data[0].subgroup_id]
      );

      let aprrover_result = await Check(aprrover_sql);

      const response = {
        msg: MessageStatus.SUCCESS,
        undertime: undertime_request_data,
        approver: aprrover_result,
      };
      res.status(200).json(JsonSuccessMulti(response));
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.put("/approve", (req, res) => {
  try {
    const {
      requestid,
      remarks,
      employeeid,
      clockin,
      clockout,
      attendancedate,
    } = req.body;
    const status = REQUEST_STATUS.approved;
    const approved_by = req.session.employeeid;
    const subgroupid = req.session.subgroupid;
    const departmentid = req.session.departmentid;
    const accesstypeid = req.session.accesstypeid;

    let queries = [];

    async function ProcessData() {
      let check_undertime_activity_sql = SelectStatement(
        "select count(*) as total_count from undertime_activity where ua_undertime_id = ? and ua_status = ?",
        [requestid, status]
      );

      let check_request_approval_sql = SelectStatement(
        "select ras_count as count from request_approval_settings where ras_subgroupid = ?",
        [subgroupid]
      );

      let undertime_activity_result = await Check(check_undertime_activity_sql);
      let request_approval_result = await Check(check_request_approval_sql);
      let counter = undertime_activity_result[0].total_count;
      let ats_count = request_approval_result[0].count;

      if (ats_count == counter) {
        let update_status_undertime_request_sql = UpdateStatement(
          "undertime_request",
          "ur",
          ["status"],
          ["id"]
        );

        queries.push({
          sql: update_status_undertime_request_sql,
          values: [status, requestid],
        });
      }

      counter = counter + 1;

      let update_undertime_request_sql = UpdateStatement(
        "undertime_request",
        "ur",
        ["approval_count", "status"],
        ["id"]
      );

      queries.push({
        sql: update_undertime_request_sql,
        values: [
          counter,
          `${MessageStatus.PARTIALLY} ${counter} out of ${ats_count}`,
          requestid,
        ],
      });

      let insert_undertime_activity_sql = InsertStatementTransCommit(
        "undertime_activity",
        "ua",
        ["undertime_id", "employee_id", "remarks", "status", "date"]
      );

      queries.push({
        sql: insert_undertime_activity_sql,
        values: [requestid, approved_by, remarks, status, GetCurrentDatetime()],
      });

      await Transaction(queries);

      let emailbody = [
        {
          employeename: employeeid,
          date: attendancedate,
          timein: clockin,
          timeout: clockout,
          reason: remarks,
          status: `${MessageStatus.APPROVED} by ${req.session.fullname} - ${counter} out of ${ats_count}`,
          requesttype: REQUEST.UT,
        },
      ];
      SendEmailNotification(employeeid, subgroupid, REQUEST.UT, emailbody);

      res.status(200).json(JsonSuccess());
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.put("/reject", (req, res) => {
  try {
    const {
      requestid,
      remarks,
      employeeid,
      clockin,
      clockout,
      attendancedate,
    } = req.body;
    const status = REQUEST_STATUS.rejected;
    const approved_by = req.session.employeeid;
    const subgroupid = req.session.subgroupid;

    const {} = req.session;
    let queries = [];

    async function ProcessData() {
      let update_status_undertime_request_sql = UpdateStatement(
        "undertime_request",
        "ur",
        ["status"],
        ["id"]
      );

      queries.push({
        sql: update_status_undertime_request_sql,
        values: [status, requestid],
      });

      let insert_undertime_activity_sql = InsertStatementTransCommit(
        "undertime_activity",
        "ua",
        ["undertime_id", "employee_id", "remarks", "status", "date"]
      );

      queries.push({
        sql: insert_undertime_activity_sql,
        values: [requestid, approved_by, remarks, status, GetCurrentDatetime()],
      });

      await Transaction(queries);

      let emailbody = [
        {
          employeename: employeeid,
          date: attendancedate,
          timein: clockin,
          timeout: clockout,
          reason: remarks,
          status: `${MessageStatus.REJECTED} by ${req.session.fullname}`,
          requesttype: REQUEST.UT,
        },
      ];
      SendEmailNotification(employeeid, subgroupid, REQUEST.UT, emailbody);

      res.status(200).json(JsonSuccess());
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
