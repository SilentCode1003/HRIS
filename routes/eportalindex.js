const mysql = require("./repository/hrmisdb");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");
const { Attendance_Logs } = require("./model/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportalindexlayout', { title: 'Express' });
  Validator(req, res, "eportalindexlayout");
});

module.exports = router;

function getLatestLog(employeeId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM attendance_logs
      WHERE al_employeeid = '${employeeId}'
      ORDER BY al_logdatetime DESC
      LIMIT 1;
  `;

    mysql.Select(query, "Attendance_Logs", (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

function getDeviceInformation(req) {
  if (typeof navigator === "undefined") {
    return "app";
  } else {
    return "web";
  }
}

router.post("/latestlog", (req, res) => {
  const employeeid = req.body.employeeid;

  console.log(employeeid);

  getLatestLog(employeeid)
    .then((latestLog) => {
      res.json({
        message: "success",
        data: latestLog,
      });
    })
    .catch(() =>
      res
        .status(500)
        .json({ status: "error", message: "Failed to fetch latest log." })
    );
});


router.post("/latestlogforapp", (req, res) => {
  const employeeId = req.body.employeeid;

  getLatestLog(employeeId)
    .then((latestLog) => res.json(latestLog))
    .catch(() =>
      res
        .status(500)
        .json({ status: "error", message: "Failed to fetch latest log." })
    );
});


router.post("/clockin", (req, res) => {
  const employee_id = req.body.employeeid;
  const geofenceid = req.body.geofenceid;


  if (!employee_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }

  const { latitude, longitude } = req.body;
  const attendancedate = moment().format("YYYY-MM-DD");
  const devicein = getDeviceInformation(req);

  const checkExistingClockInQuery = `
    SELECT ma_employeeid
    FROM master_attendance
    WHERE ma_employeeid = '${employee_id}'
      AND ma_attendancedate = '${attendancedate}'
      AND ma_clockin IS NOT NULL
  `;

  const checkMissingClockOutQuery = `
    SELECT ma_employeeid
    FROM master_attendance
    WHERE ma_employeeid = '${employee_id}'
      AND ma_attendancedate = DATE_ADD('${attendancedate}', INTERVAL -1 DAY)
      AND ma_clockout IS NULL
  `;

  console.log(checkMissingClockOutQuery);


  const executeSequentialQueries = (queries) =>
    queries.reduce(
      (promise, query) =>
        promise.then((result) =>
          mysql
            .mysqlQueryPromise(query)
            .then((queryResult) => [...result, queryResult])
        ),
      Promise.resolve([])
    );

  executeSequentialQueries([checkExistingClockInQuery, checkMissingClockOutQuery])
    .then(([resultClockIn, resultMissingClockOut]) => {
      if (resultClockIn.length > 0) {
        res.json({
          status: "exist",
          message: "Clock-in not allowed. Employee already clocked in on the same day.",
        });
      } else if (resultMissingClockOut.length > 0) {
        res.json({
          status: "disabled",
          message: "Clock-in not allowed. Missing clock-out on the previous day.",
        });
      } else {
        const clockinDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
        const attendanceData = [
          [
            employee_id,
            attendancedate,
            clockinDateTime,
            latitude,
            longitude,
            devicein,
            geofenceid,
          ],
        ];

        mysql.InsertTable(
          "master_attendance",
          attendanceData,
          (err, result) => {
            if (err) {
              console.error("Error inserting record:", err);
              return res.status(500).json({
                status: "error",
                message: "Failed to insert attendance. Please try again.",
              });
            }

            console.log("Insert result:", result);
            res.json({
              status: "success",
              message: "Clock-in successful.",
            });
          }
        );
      }
    })
    .catch((error) => {
      console.error("Error during clock-in process:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error. Please try again.",
        data: error,
      });
    });
});


router.post("/clockout", (req, res) => {
  const employee_id = req.body.employeeid;
  const { latitude, longitude } = req.body;
  const clockoutTime = moment().format("YYYY-MM-DD HH:mm:ss");
  const geofenceid = req.body.geofenceid;

  const checkExistingClockInQuery = `
    SELECT ma_employeeid, ma_attendancedate
    FROM master_attendance
    WHERE ma_employeeid = '${employee_id}'
      AND ma_clockin IS NOT NULL
      AND ma_clockout IS NULL
    ORDER BY ma_attendancedate DESC
    LIMIT 1
  `;

  mysql
    .mysqlQueryPromise(checkExistingClockInQuery)
    .then((resultClockIn) => {
      if (resultClockIn.length > 0) {
        const { ma_attendancedate } = resultClockIn[0];
        const deviceout = getDeviceInformation(req);

        const updateQuery = `
        UPDATE master_attendance
        SET
          ma_clockout = '${clockoutTime}',
          ma_latitudeout = '${latitude}',
          ma_longitudeout = '${longitude}',
          ma_deviceout = '${deviceout}',
          ma_geofenceidOut = '${geofenceid}'
        WHERE
          ma_employeeid = '${employee_id}'
          AND ma_attendancedate = '${ma_attendancedate}'`;
        mysql
          .Update(updateQuery)
          .then((updateResult) => {
            console.log(updateResult);
            res.json({
              status: "success",
              message: "Clock-out successful.",
            });
          })
          .catch((updateError) => {
            console.log(updateError);
            res.json({
              status: "error",
              message: "Error updating clock-out record.",
              data: updateError,
            });
          });
      } else {
        res.json({
          status: "error",
          message:
            "Clock-out not allowed. No matching clock-in record found for the employee.",
        });
      }
    })
    .catch((errorClockIn) => {
      console.log(errorClockIn);
      res.json({
        status: "error",
        message: "Error checking existing clock-in records.",
        data: errorClockIn,
      });
    });
});


router.post('/emplogs', (req, res) => {
  try {
    let = employeeid = req.body.employeeid;
    let sql = `   SELECT
    DATE_FORMAT(al_logdatetime, '%Y-%m-%d') AS logdate,
    al_logtype as logtype,
    TIME(al_logdatetime) AS logtime
    FROM attendance_logs
    WHERE al_employeeid = '${employeeid}'
    order by al_logdatetime desc`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg: 'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      })
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});
