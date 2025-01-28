var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentDatetime,
  InsertStatementTransCommit,
} = require("./repository/customhelper");
const { Select, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, PND } = require("./repository/dictionary");
const { REQUEST_STATUS, REQUEST } = require("./repository/enums");
var router = express.Router();
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Transaction } = require("./utility/utility");
const { SendEmailNotification } = require("./repository/emailsender");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "teamleadobappliedlayout", "teamleadobapplied");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = SelectStatement(
      `
      SELECT 
      obr_id,
      obr_employee_id as obr_employeeid,
      CONCAT(me_firstname, '', me_lastname) as obr_fullname,
      obr_attendance_date,
      s_name as obr_subgroup_id,
      REPLACE(REPLACE(obr_clockin, 'T', ' '), 'Z', '') as obr_clockin,
      REPLACE(REPLACE(obr_clockout, 'T', ' '), 'Z', '') as obr_clockout,
      obr_applied_date,
      obr_status
      FROM official_business_request 
      INNER JOIN master_employee ON me_id = obr_employee_id
      INNER JOIN subgroup ON s_id = obr_subgroup_id
      INNER JOIN aprroval_stage_settings ON ats_subgroupid = obr_subgroup_id and obr_approval_count = ats_count and ats_accessid = ?
      WHERE obr_subgroup_id IN (?)
      AND obr_status = ?
      `,
      [req.session.accesstypeid, req.session.subgroupid, REQUEST_STATUS.applied]
    );

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(err);
      }

      if (result != 0) {
        let data = DataModeling(result, "obr_");
        res.json({
          msg: "success",
          data: data,
        });
      } else {
        res.json({
          msg: "success",
          data: result,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      msg: "error",
    });
  }
});

router.get("/getobr/:id", (req, res) => {
  try {
    const { id } = req.params;
    let sql = SelectStatement(
      `
      SELECT 
      obr_id,
      obr_employee_id as obr_employeeid,
      CONCAT(me_firstname, '', me_lastname) as obr_fullname,
      obr_attendance_date,
      obr_subgroup_id,
      s_name as obr_subgroup,
      REPLACE(REPLACE(obr_clockin, 'T', ' '), 'Z', '') as obr_clockin,
      REPLACE(REPLACE(obr_clockout, 'T', ' '), 'Z', '') as obr_clockout,
      obr_applied_date,
      obr_status,
      obr_reason
      FROM official_business_request 
      INNER JOIN master_employee ON me_id = obr_employee_id
      INNER JOIN subgroup ON s_id = obr_subgroup_id
      WHERE obr_id = ?
      `,
      [id]
    );

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result.length != 0) {
        let data = DataModeling(result, "obr_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json({
      msg: "error",
    });
  }
});

router.put("/approved", (req, res) => {
  try {
    const {
      id,
      remarks,
      subgroupid,
      clockin,
      clockout,
      attendancedate,
      employeeid,
    } = req.body;
    let queries = [];

    const approved_by = req.session.employeeid;

    console.log(
      id,
      remarks,
      subgroupid,
      clockin,
      clockout,
      attendancedate,
      employeeid
    );

    async function ProcessData() {
      let approval_count = await GetRequestApprovalSetting(subgroupid);
      let obr_approval_count = await GetOfficialBusinessRequest(id);

      console.log(
        "Approval Count: ",
        approval_count,
        "OBR Approval Count: ",
        obr_approval_count
      );

      // to approved OBR
      let update_count = parseInt(obr_approval_count) + 1;
      if (approval_count == update_count) {
        queries.push({
          sql: InsertStatementTransCommit("master_attendance", "ma", [
            "employeeid",
            "attendancedate",
            "clockin",
            "latitudeIn",
            "longitudein",
            "devicein",
            "gefenceidIn",
            "locationIn",
          ]),
          values: [
            employeeid,
            attendancedate,
            clockin,
            0.01,
            0.01,
            "OB",
            "1",
            "Official Business",
          ],
        });

        queries.push({
          sql: UpdateStatement(
            "master_attendance",
            "ma",
            [
              "clockout",
              "latitudeout",
              "longitudeout",
              "deviceout",
              "geofenceidOut",
              "locationOut",
            ],
            ["employeeid", "attendancedate"]
          ),
          values: [
            clockout,
            0.01,
            0.01,
            "OB",
            "1",
            "Official Business",
            employeeid,
            attendancedate,
          ],
        });

        queries.push({
          sql: UpdateStatement(
            "official_business_request",
            "obr",
            ["status"],
            ["id"]
          ),
          values: [REQUEST_STATUS.approved, id],
        });
      }
      queries.push({
        sql: UpdateStatement(
          "official_business_request",
          "obr",
          ["approval_count"],
          ["id"]
        ),
        values: [update_count, id],
      });

      queries.push({
        sql: InsertStatementTransCommit("official_business_activity", "oba", [
          "ob_id",
          "employee_id",
          "remarks",
          "status",
          "date",
        ]),
        values: [
          id,
          approved_by,
          remarks,
          REQUEST_STATUS.approved,
          GetCurrentDatetime(),
        ],
      });

      await Transaction(queries);

      let emailbody = [
        {
          employeename: employeeid,
          date: attendancedate,
          startdate: clockin,
          enddate: clockout,
          reason: remarks,
          status: `${MessageStatus.APPROVED} by ${approved_by} - ${update_count} out of ${approval_count}`,
          requesttype: REQUEST.OB,
        },
      ];
      SendEmailNotification(employeeid, subgroupid, REQUEST.OB, emailbody);

      res.json(JsonSuccess());
    }

    ProcessData();
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

//#region Funcitons
async function GetRequestApprovalSetting(subgroupid) {
  return new Promise((resolve, reject) => {
    let sql = SelectStatement(
      "select ras_count as count from request_approval_settings where ras_subgroupid = ?",
      [subgroupid]
    );
    Select(sql, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      }

      console.log(data);

      resolve(data[0].count);
    });
  });
}

async function GetOfficialBusinessRequest(id) {
  return new Promise((resolve, reject) => {
    let sql = SelectStatement(
      "select obr_approval_count as approval_count from official_business_request where obr_id = ?",
      [id]
    );
    Select(sql, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      console.log(data);
      resolve(data[0].approval_count);
    });
  });
}

//#endregion
