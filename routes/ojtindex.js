const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorforOjt } = require('./controller/middleware');
const { Encrypter } = require('./repository/crytography');
const { generateUsernameAndPasswordforOjt } = require("./helper");
var router = express.Router();
const currentDate = moment();

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorforOjt(req, res, 'ojtindexlayout');
});

module.exports = router;

function getLatestLog(ojtid) {
  return new Promise((resolve, reject) => {
    const query = `
    SELECT *
    FROM ojt_attendance_logs
    WHERE oal_ojtid = '${ojtid}'
    ORDER BY oal_logdatetime DESC
    LIMIT 1;
  `;

    mysql.Select(query, "Ojt_Attendance_Logs", (err, result) => {
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
  const ojtid = req.body.ojtid;

  console.log(ojtid);

  getLatestLog(ojtid)
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

router.post("/clockin", (req, res) => {
  const ojt_id = req.body.ojtid;
  const geofenceid = req.body.geofenceid;

  if (!ojt_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }

  const { latitude, longitude } = req.body;
  const attendancedate = moment().format("YYYY-MM-DD");
  const devicein = getDeviceInformation(req);

  const checkExistingClockInQuery = `
    SELECT oa_ojtid
    FROM ojt_attendance
    WHERE oa_ojtid = '${ojt_id}'
      AND oa_attendancedate = '${attendancedate}'
      AND oa_clockin IS NOT NULL
  `;

  const checkMissingClockOutQuery = `
    SELECT oa_ojtid
    FROM ojt_attendance
    WHERE oa_ojtid = '${ojt_id}'
      AND oa_attendancedate = DATE_ADD('${attendancedate}', INTERVAL -1 DAY)
      AND oa_clockout IS NULL
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
            ojt_id,
            attendancedate,
            clockinDateTime,
            latitude,
            longitude,
            devicein,
            geofenceid,
          ],
        ];

        mysql.InsertTable(
          "ojt_attendance",
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
  const ojt_id = req.body.ojtid;
  const { latitude, longitude } = req.body;
  const clockoutTime = moment().format("YYYY-MM-DD HH:mm:ss");
  const geofenceid = req.body.geofenceid;

  console.log(ojt_id);

  const checkExistingClockInQuery = `
  SELECT oa_ojtid, oa_attendancedate
  FROM ojt_attendance
  WHERE oa_ojtid = '${ojt_id}'
    AND oa_clockin IS NOT NULL
    AND oa_clockout IS NULL
  ORDER BY oa_attendancedate DESC
  LIMIT 1
    
  `;

  mysql
    .mysqlQueryPromise(checkExistingClockInQuery)
    .then((resultClockIn) => {
      if (resultClockIn.length > 0) {
        const { oa_attendancedate } = resultClockIn[0];
        const deviceout = getDeviceInformation(req);

        const updateQuery = `
        UPDATE ojt_attendance
        SET
          oa_clockout = '${clockoutTime}',
          oa_latitudeout = '${latitude}',
          oa_longitudeout = '${longitude}',
          oa_deviceout = '${deviceout}',
          oa_geofenceidOut = '${geofenceid}'
        WHERE
          oa_ojtid = '${ojt_id}'
          AND oa_attendancedate = '${oa_attendancedate}'`;

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
    let = ojtid = req.body.ojtid;
    let sql = `        
    SELECT
 DATE_FORMAT(oal_logdatetime, '%Y-%m-%d') AS logdate,
 oal_logtype as logtype,
 TIME(oal_logdatetime) AS logtime
 FROM ojt_attendance_logs
 WHERE oal_ojtid = '${ojtid}'
 order by oal_logdatetime desc`;

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

