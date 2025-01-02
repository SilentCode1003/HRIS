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
const { REQUEST_STATUS } = require("./repository/enums");
var router = express.Router();
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { Transaction } = require("./utility/utility");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "teamleadobapprovelayout", "teamleadobapprove");
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
      [
        req.session.accesstypeid,
        req.session.subgroupid,
        REQUEST_STATUS.approved,
      ]
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
