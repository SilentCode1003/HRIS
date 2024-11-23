const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "teamleadapprovedrdotlayout", "teamleadapprovedrdot");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let sql = `SELECT
    roa_rdotid,
    roa_fullname,
    DATE_FORMAT(roa_attendancedate, '%W, %M %e, %Y') as roa_attendancedate,
    TIME_FORMAT(roa_timein, '%H:%i:%s')  as roa_timein,
    TIME_FORMAT(roa_timeout, '%H:%i:%s')  as roa_timeout,
	roa_total_hours,
    DATE_FORMAT(roa_payrolldate, '%W, %M %e, %Y') as roa_payrolldate,
    roa_status
    FROM restday_ot_approval
	INNER JOIN
	master_employee ON restday_ot_approval.roa_employeeid = me_id
    WHERE roa_subgroupid IN ('${subgroupid}')  AND roa_status = 'Approved'`;

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
    res.json(JsonErrorResponse(error));
  }
});
