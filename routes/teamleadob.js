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
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "teamleadoblayout", "teamleadob");
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
      obr_clockin,
      obr_clockout,
      obr_applied_date,
      obr_status
      FROM official_business_request 
      INNER JOIN master_employee ON me_id = obr_employee_id
      INNER JOIN subgroup ON s_id = obr_subgroup_id
      WHERE obr_subgroup_id IN (?)
      `,
      [req.session.subgroupid]
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
