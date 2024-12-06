var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { Select, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, PND } = require("./repository/dictionary");
const { REQUEST_STATUS } = require("./repository/enums");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "eportaloblayout", "eportalob");
});

module.exports = router;

router.get("/getob/:status", (req, res) => {
  try {
    const { status } = req.params;
    let sql = SelectStatement(
      `SELECT 
      obr_id,
      obr_attendance_date,
      concat(me_firstname,'',me_lastname) as obr_employee_id,
      s_name as obr_subgroup_id,
      REPLACE(REPLACE(obr_clockin, 'T', ' '), 'Z', '') as obr_clockin,
      REPLACE(REPLACE(obr_clockout, 'T', ' '), 'Z', '') as obr_clockout,
      obr_applied_date,
      obr_reason,
      obr_status,
      obr_approval_count
      FROM official_business_request
      INNER JOIN master_employee on me_id = obr_employee_id
      INNER JOIN subgroup on s_id = obr_subgroup_id WHERE obr_status = ? and obr_employee_id = ?`,
      [status, req.session.employeeid]
    );

    Select(sql, (err, result) => {
      if (err) {
        res.status(500).json({
          msg: err,
        });
      }
      if (result.length != 0) {
        let data = DataModeling(result, "obr_");

        console.log(data);

        res.status(200).json({
          msg: "success",
          data: data,
        });
      } else {
        res.status(200).json({
          msg: "success",
          data: result,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      msg: error,
    });
  }
});

router.post("/save", (req, res) => {
  try {
    const { attendancedate, subgroupid, clockin, clockout, reason } = req.body;
    let status = REQUEST_STATUS.applied;
    let employeeid = req.session.employeeid;
    let applied_date = GetCurrentDatetime();

    async function ProcessData() {
      let official_business_request_sql = InsertStatement(
        "official_business_request",
        "obr",
        [
          "employee_id",
          "attendance_date",
          "subgroup_id",
          "clockin",
          "clockout",
          "applied_date",
          "reason",
          "status",
          "approval_count",
        ]
      );

      let obr_data = [
        [
          employeeid,
          attendancedate,
          subgroupid,
          clockin,
          clockout,
          applied_date,
          reason,
          status,
          0,
        ],
      ];

      Insert(official_business_request_sql, obr_data, (err, result) => {
        if (err) {
          console.log(err);

          res.status(500).json({
            msg: err,
          });
        }
        console.log(result);
        res.status(200).json({
          msg: "success",
          data: result,
        });
      });
    }

    ProcessData();
  } catch (error) {
    res.status(500).json({
      msg: error,
    });
  }
});