const mysql = require("./repository/hrmisdb");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportalindexlayout', { title: 'Express' });
  Validator(req, res, "eportalindexlayout");
});

module.exports = router;

// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Radius of the Earth in kilometers
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);

//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(deg2rad(lat1)) *
//       Math.cos(deg2rad(lat2)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   const distance = R * c; // Distance in kilometers
//   return distance;
// }

// function deg2rad(deg) {
//   return deg * (Math.PI / 180);
// }

function getLatestLog(employeeId) {
  // Replace this with your actual database query
  // In this example, we're using a sample query to filter logs based on the employeeId and sorting by logdatetime
  const query = `
      SELECT *
      FROM attendance_logs
      WHERE al_employeeid = '${employeeId}'
      ORDER BY al_logdatetime DESC
      LIMIT 1;
  `;

  return mysql
    .mysqlQueryPromise(query)
    .then((result) => (result.length > 0 ? result[0] : null))
    .catch((error) => {
      console.error("Error fetching latest log:", error);
      throw error;
    });
}

// API endpoint for fetching the latest log
router.get("/latestlog", (req, res) => {
  const employeeId = req.query.employeeid;

  // Fetch the latest log using the function
  getLatestLog(employeeId)
    .then((latestLog) => res.json(latestLog))
    .catch(() =>
      res
        .status(500)
        .json({ status: "error", message: "Failed to fetch latest log." })
    );
});

router.post("/clockin", (req, res) => {
  const employee_id = req.session.employeeid;

  if (!employee_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }

  const { latitude, longitude } = req.body;
  const attendancedate = moment().format("YYYY-MM-DD");
  const devicein = "web";

  // Check if there is already a clock-in record for the same day
  const checkExistingClockInQuery = `
    SELECT ma_employeeid
    FROM master_attendance
    WHERE ma_employeeid = '${employee_id}'
      AND ma_attendancedate = '${attendancedate}'
      AND ma_clockin IS NOT NULL
  `;

  mysql
    .mysqlQueryPromise(checkExistingClockInQuery)
    .then((result) => {
      if (result.length > 0) {
        res.json({
          status: "exist",
          data: result,
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
                message: "Failed to insert attendance.",
              });
            }

            console.log("Insert result:", result);
            res.json({
              status: "success",
              message: "Clock-in allowed.",
            });
          }
        );
      }
    })
    .catch((error) => {
      res.json({
        status: "error",
        message: "Error checking existing clock-in records.",
        data: error,
      });
    });
});

router.post("/clockout", (req, res) => {
  const employee_id = req.session.employeeid;
  const { latitude, longitude } = req.body;
  const clockoutTime = moment().format("YYYY-MM-DD HH:mm:ss");

  // Check if there is a clock-in record for the same day
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
        const deviceout = "web";

        // Proceed with the clock-out process using the date of the corresponding clock-in
        const updateQuery = `
          UPDATE master_attendance
          SET
            ma_clockout = '${clockoutTime}',
            ma_latitudeout = '${latitude}',
            ma_longitudeout = '${longitude}',
            ma_deviceout = '${deviceout}'
          WHERE
            ma_employeeid = '${employee_id}'
            AND ma_attendancedate = '${ma_attendancedate}'
        `;

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
        // No matching clock-in record found
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
