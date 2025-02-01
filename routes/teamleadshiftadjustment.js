const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  UpdateStatement,
} = require("./repository/customhelper");
const { Transaction } = require("./utility/utility");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  Validator(
    req,
    res,
    "teamleadshiftadjustmentlayout",
    "teamleadshiftadjustment"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    const startdate = GetCurrentMonthFirstDay();
    const enddate = GetCurrentMonthLastDay();
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
                cs_id,
                cs_employeeid,
                concat(me_lastname,' ',me_firstname) as cs_fullname,
                cs_actualrd,
                cs_changerd,
                cs_createby,
                cs_shiftstatus
                FROM change_shift
                INNER JOIN master_employee on change_shift.cs_employeeid = me_id
                WHERE me_department = '${departmentid}'
                AND cs_employeeid NOT IN (
                SELECT tu_employeeid FROM teamlead_user)
                AND cs_actualrd BETWEEN '${startdate}' AND '${enddate}'
                ORDER BY cs_id DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cs_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.post("/viewactualrd", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `WITH RECURSIVE date_series AS (
            SELECT DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AS forecast_date
            UNION ALL
            SELECT DATE_ADD(forecast_date, INTERVAL 1 DAY)
            FROM date_series
            WHERE forecast_date < DATE_ADD(CURDATE(), INTERVAL 2 MONTH)
        )
        SELECT 
            DATE_FORMAT(ds.forecast_date, '%Y-%m-%d') AS forecast_date
        FROM date_series ds
        JOIN master_shift ms
            ON ms.ms_employeeid = '${employeeid}'
        WHERE JSON_EXTRACT(
            CASE DAYNAME(ds.forecast_date)
                WHEN 'Monday' THEN ms.ms_monday
                WHEN 'Tuesday' THEN ms.ms_tuesday
                WHEN 'Wednesday' THEN ms.ms_wednesday
                WHEN 'Thursday' THEN ms.ms_thursday
                WHEN 'Friday' THEN ms.ms_friday
                WHEN 'Saturday' THEN ms.ms_saturday
                WHEN 'Sunday' THEN ms.ms_sunday
            END, '$.time_in') = '00:00:00'
        AND JSON_EXTRACT(
            CASE DAYNAME(ds.forecast_date)
                WHEN 'Monday' THEN ms.ms_monday
                WHEN 'Tuesday' THEN ms.ms_tuesday
                WHEN 'Wednesday' THEN ms.ms_wednesday
                WHEN 'Thursday' THEN ms.ms_thursday
                WHEN 'Friday' THEN ms.ms_friday
                WHEN 'Saturday' THEN ms.ms_saturday
                WHEN 'Sunday' THEN ms.ms_sunday
            END, '$.time_out') = '00:00:00'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cs_");
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

router.put("/update", (req, res) => {
  try {
    const { employeeid, targetrddate, actualrddate, changeshift, status } =
      req.body;

    let queries = [];

    console.log(employeeid, targetrddate, actualrddate, changeshift, status);

    async function ProcessData() {
      let getShiftTargetRestday = `
      SELECT 
      CASE
        WHEN DAYOFWEEK('${targetrddate}') = 2 THEN (ms.ms_MONDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 3 THEN (ms.ms_TUESDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 4 THEN (ms.ms_WEDNESDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 5 THEN (ms.ms_THURSDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 6 THEN (ms.ms_FRIDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 7 THEN (ms.ms_SATURDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 1 THEN (ms.ms_SUNDAY->>'$.time_in')
      END as target_schedule_time_in,
      CASE 
        WHEN DAYOFWEEK('${targetrddate}') = 2 THEN (ms.ms_MONDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 3 THEN (ms.ms_TUESDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 4 THEN (ms.ms_WEDNESDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 5 THEN (ms.ms_THURSDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 6 THEN (ms.ms_FRIDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 7 THEN (ms.ms_SATURDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 1 THEN (ms.ms_SUNDAY->>'$.time_out')
      END as target_schedule_time_out
      FROM master_shift as ms
      INNER JOIN master_employee on me_id = ms_employeeid
      WHERE me_id = '${employeeid}'`;

      let getShiftActualRestday = `
      SELECT 
      CASE
        WHEN DAYOFWEEK('${actualrddate}') = 2 THEN (ms.ms_MONDAY->>'$.time_in')
        WHEN DAYOFWEEK('${actualrddate}') = 3 THEN (ms.ms_TUESDAY->>'$.time_in')
        WHEN DAYOFWEEK('${actualrddate}') = 4 THEN (ms.ms_WEDNESDAY->>'$.time_in')
        WHEN DAYOFWEEK('${actualrddate}') = 5 THEN (ms.ms_THURSDAY->>'$.time_in')
        WHEN DAYOFWEEK('${actualrddate}') = 6 THEN (ms.ms_FRIDAY->>'$.time_in')
        WHEN DAYOFWEEK('${actualrddate}') = 7 THEN (ms.ms_SATURDAY->>'$.time_in')
        WHEN DAYOFWEEK('${actualrddate}') = 1 THEN (ms.ms_SUNDAY->>'$.time_in')
      END as actual_schedule_time_in,
      CASE 
        WHEN DAYOFWEEK('${actualrddate}') = 2 THEN (ms.ms_MONDAY->>'$.time_out')
        WHEN DAYOFWEEK('${actualrddate}') = 3 THEN (ms.ms_TUESDAY->>'$.time_out')
        WHEN DAYOFWEEK('${actualrddate}') = 4 THEN (ms.ms_WEDNESDAY->>'$.time_out')
        WHEN DAYOFWEEK('${actualrddate}') = 5 THEN (ms.ms_THURSDAY->>'$.time_out')
        WHEN DAYOFWEEK('${actualrddate}') = 6 THEN (ms.ms_FRIDAY->>'$.time_out')
        WHEN DAYOFWEEK('${actualrddate}') = 7 THEN (ms.ms_SATURDAY->>'$.time_out')
        WHEN DAYOFWEEK('${actualrddate}') = 1 THEN (ms.ms_SUNDAY->>'$.time_out')
      END as actual_schedule_time_out
      FROM master_shift as ms
      INNER JOIN master_employee on me_id = ms_employeeid
      WHERE me_id = '${employeeid}'`;

      const targetRestdayResult = await Check(getShiftTargetRestday);
      const actualRestdayResult = await Check(getShiftActualRestday);

      const { target_schedule_time_in, target_schedule_time_out } =
        targetRestdayResult[0];

      const { actual_schedule_time_in, actual_schedule_time_out } =
        actualRestdayResult[0];

      if (status === STATUS_LOG.ACTIVE) {
        queries.push({
          sql: UpdateStatement(
            "master_attendance",
            "ma",
            ["shift_timein", "shift_timeout"],
            ["attendancedate", "employeeid"]
          ),
          values: [
            target_schedule_time_in,
            target_schedule_time_out,
            targetrddate,
            employeeid,
          ],
        });

        queries.push({
          sql: UpdateStatement(
            "master_attendance",
            "ma",
            ["shift_timein", "shift_timeout"],
            ["attendancedate", "employeeid"]
          ),
          values: [
            actual_schedule_time_in,
            actual_schedule_time_out,
            actualrddate,
            employeeid,
          ],
        });
      } else {
        queries.push({
          sql: UpdateStatement(
            "master_attendance",
            "ma",
            ["shift_timein", "shift_timeout"],
            ["attendancedate", "employeeid"]
          ),
          values: [
            actual_schedule_time_in,
            actual_schedule_time_out,
            targetrddate,
            employeeid,
          ],
        });

        queries.push({
          sql: UpdateStatement(
            "master_attendance",
            "ma",
            ["shift_timein", "shift_timeout"],
            ["attendancedate", "employeeid"]
          ),
          values: [
            target_schedule_time_in,
            target_schedule_time_out,
            actualrddate,
            employeeid,
          ],
        });
      }

      queries.push({
        sql: UpdateStatement("change_shift", "cs", ["shiftstatus"], ["id"]),
        values: [
          status == STATUS_LOG.ACTIVE ? STATUS_LOG.INACTIVE : STATUS_LOG.ACTIVE,
          changeshift,
        ],
      });

      await Transaction(queries);

      res.status(200).json(JsonSuccess());
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});