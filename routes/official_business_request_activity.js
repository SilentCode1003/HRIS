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
const { JsonErrorResponse } = require("./repository/response");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "obactivitylayout", "obactivity");
});

module.exports = router;


router.get("/load", (req, res) => {
    try {
        let sql = SelectStatement(`select 
oba_id,
oba_ob_id,
CONCAT(me_firstname, '', me_lastname)  oba_employee_id,
oba_remarks,
oba_status,
oba_date 
from official_business_activity
inner join master_employee on me_id = oba_employee_id
where oba_date between ? and ?
order by oba_date desc;`, [`${GetCurrentMonthFirstDay()} 00:00:00`, `${GetCurrentMonthLastDay()} 23:59:59`]);
    } catch (error) {
        res.status(500).json(JsonErrorResponse(error));
    }
});