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
  Validator(req, res, "meal_request_activitylayout", "meal_request_activity");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    mra.mra_id AS mra_id,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS mra_fullname,
    DATE_FORMAT(oma.oma_clockin, '%W, %M %e, %Y %h:%i %p') AS mra_clockin,
    DATE_FORMAT(oma.oma_clockout, '%W, %M %e, %Y %h:%i %p') AS mra_clockout,
    oma.oma_totalovertime AS mra_totalovertime,
    DATE_FORMAT(oma.oma_applieddate, '%W, %Y-%m-%d') AS mra_applieddate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS mra_approver,
    DATE_FORMAT(mra.mra_date, '%W, %M %e, %Y %h:%i %p') AS mra_actiondate,
    mra.mra_status AS mra_status
    FROM meal_request_activity mra
    INNER JOIN ot_meal_allowances oma ON mra.mra_mealid = oma.oma_mealid
    INNER JOIN master_employee me_request ON oma.oma_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON mra.mra_employeeid = me_activity.me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mra_");

        console.log(data);
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

router.post("/getotmealactivity", (req, res) => {
  try {
    let otmealid = req.body.otmealid;
    let sql = `SELECT 
    mra.mra_id AS mra_id,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS mra_fullname,
    DATE_FORMAT(oma.oma_clockin, '%W, %M %e, %Y %h:%i %p') AS mra_clockin,
    DATE_FORMAT(oma.oma_clockout, '%W, %M %e, %Y %h:%i %p') AS mra_clockout,
    oma.oma_totalovertime AS mra_totalovertime,
    DATE_FORMAT(oma.oma_attendancedate, '%W, %Y-%m-%d') AS mra_attendancedate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS mra_approver,
    DATE_FORMAT(mra.mra_date, '%W, %M %e, %Y %h:%i %p') AS mra_actiondate,
	  oma_otmeal_amount as mra_otmeal_amount,
    mra.mra_status AS mra_status,
    oma.oma_image as mra_image,
	  s.s_name as mra_subgroupid,
    oma_approvalcount as mra_approvecount,
    mra.mra_commnet AS mra_actioncomment,
    CONCAT(oma_approvalcount,' out of ', ras_count) AS mra_approval_status
    FROM meal_request_activity mra
	  JOIN request_approval_settings  ON mra_departmentid = ras_departmentid
    INNER JOIN ot_meal_allowances oma ON mra.mra_mealid = oma.oma_mealid
    INNER JOIN master_employee me_request ON oma.oma_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON mra.mra_employeeid = me_activity.me_id
    INNER JOIN subgroup s on mra.mra_subgroupid = s.s_id
    WHERE mra_id = '${otmealid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mra_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(err);
    res.json(JsonErrorResponse(err));
  }
});
