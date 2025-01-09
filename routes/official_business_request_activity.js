var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentDatetime,
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
} = require("./repository/customhelper");
const { Select, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, PND } = require("./repository/dictionary");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "obactivitylayout", "obactivity");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = SelectStatement(
      `select 
        oba_id,
        oba_ob_id,
        obr_attendance_date as oba_attendance_date,
        obr_clockin as oba_clockin,
        obr_clockout as oba_clockout,
        obr_reason as oba_reason,
        CONCAT(me_firstname, '', me_lastname)  oba_employee_id,
        oba_remarks,
        oba_status,
        oba_date 
        from official_business_activity
        inner join official_business_request on oba_ob_id = obr_id
        inner join master_employee on me_id = oba_employee_id
        where oba_date between ? and ?
        order by oba_date desc`,
      [
        `${GetCurrentMonthFirstDay()} 00:00:00`,
        `${GetCurrentMonthLastDay()} 23:59:59`,
      ]
    );

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json(JsonErrorResponse(err));
        return;
      }

      console.log(result);
      

      if (result != 0) {
        let data = DataModeling(result, "oba_");
        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
