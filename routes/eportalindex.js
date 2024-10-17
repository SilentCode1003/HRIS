const mysql = require("./repository/hrmisdb");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");
const { Attendance_Logs } = require("./model/hrmisdb");
var express = require("express");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, ACT, INACT } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportalindexlayout', { title: 'Express' });
  Validator(req, res, "eportalindexlayout", "eportalindex");
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

// function getDeviceInformation(device) {
//   console.log(device);

//   if (typeof device === "undefined" || " ") {
//     return "app";
//   } else {
//     return "web";
//   }
// }

router.get("/getisgefence", (req, res) => {
  console.log("hit");
  try {
    let employeeId = req.session.employeeid;
    let accesstype = req.session.accesstypeid;

    console.log(employeeId);
    let sql = `SELECT 
    mu_isgeofence
    FROM master_user
    WHERE mu_accesstype = '${accesstype}' AND mu_employeeid = '${employeeId}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mu_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

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

// router.post("/clockin", (req, res) => {
//   const employee_id = req.body.employeeid;
//   const geofenceid = req.body.geofenceid;
//   let locationin = req.body.locationin;

//   locationin = RemoveApostrophe(locationin);

//   console.log(locationin, "locationin");

//   if (!employee_id) {
//     return res.status(401).json({
//       status: "error",
//       message: "Unauthorized. Employee not logged in.",
//     });
//   }

//   const { latitude, longitude } = req.body;
//   const attendancedate = moment().format("YYYY-MM-DD");
//   const devicein = getDeviceInformation(req.body.devicein);

//   console.log(employee_id);

//   const checkExistingClockInQuery = `
//     SELECT ma_employeeid
//     FROM master_attendance
//     WHERE ma_employeeid = '${employee_id}'
//       AND ma_attendancedate = '${attendancedate}'
//       AND ma_clockin IS NOT NULL
//   `;

//   const checkMissingClockOutQuery = `
//     SELECT ma_employeeid
//     FROM master_attendance
//     WHERE ma_employeeid = '${employee_id}'
//       AND ma_attendancedate = DATE_ADD('${attendancedate}', INTERVAL -1 DAY)
//       AND ma_clockout IS NULL
//   `;

//   const executeSequentialQueries = (queries) =>
//     queries.reduce(
//       (promise, query) =>
//         promise.then((result) =>
//           mysql
//             .mysqlQueryPromise(query)
//             .then((queryResult) => [...result, queryResult])
//         ),
//       Promise.resolve([])
//     );

//   executeSequentialQueries([
//     checkExistingClockInQuery,
//     checkMissingClockOutQuery,
//   ])
//     .then(([resultClockIn, resultMissingClockOut]) => {
//       if (resultClockIn.length > 0) {
//         res.json({
//           status: "exist",
//           message:
//             "Clock-in not allowed. Employee already clocked in on the same day.",
//         });
//       } else if (resultMissingClockOut.length > 0) {
//         res.json({
//           status: "disabled",
//           message:
//             "Clock-in not allowed. Missing clock-out on the previous day.",
//         });
//       } else {
//         const clockinDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
//         const attendanceData = [
//           [
//             employee_id,
//             attendancedate,
//             clockinDateTime,
//             latitude,
//             longitude,
//             devicein,
//             geofenceid,
//             locationin,
//           ],
//         ];

//         mysql.InsertTable(
//           "master_attendance",
//           attendanceData,
//           (err, result) => {
//             if (err) {
//               console.error("Error inserting record:", err);
//               return res.status(500).json({
//                 status: "error",
//                 message: "Failed to insert attendance. Please try again.",
//               });
//             }

//             console.log("Insert result:", result);
//             res.json({
//               status: "success",
//               message: "Clock-in successful.",
//             });
//           }
//         );
//       }
//     })
//     .catch((error) => {
//       console.error("Error during clock-in process:", error);
//       res.status(500).json({
//         status: "error",
//         message: "Internal server error. Please try again.",
//         data: error,
//       });
//     });
// });

router.post("/clockin", (req, res) => {
  const employee_id = req.body.employeeid;
  const geofenceid = req.body.geofenceid;
  let locationin = req.body.locationin;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;
  const devicein = req.body.devicein;

  locationin = RemoveApostrophe(locationin);

  // Validate all required fields
  if (!employee_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }

  if (!geofenceid) {
    return res.status(400).json({
      status: "error",
      message: "Geofence ID cannot be null.",
    });
  }

  if (!locationin) {
    return res.status(400).json({
      status: "error",
      message: "We Cant Find Your Location",
    });
  }

  if (latitude === null || latitude === undefined) {
    return res.status(400).json({
      status: "error",
      message: "Latitude cannot be null.",
    });
  }

  if (longitude === null || longitude === undefined) {
    return res.status(400).json({
      status: "error",
      message: "Longitude cannot be null.",
    });
  }

  if (!devicein) {
    return res.status(400).json({
      status: "error",
      message: "Device information cannot be null.",
    });
  }

  // Get the current attendance date
  const attendancedate = moment().format("YYYY-MM-DD");

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

  // Function to execute sequential queries
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
        return res.json({
          status: "exist",
          message: "Clock-in not allowed. Employee already clocked in on the same day.",
        });
      } else if (resultMissingClockOut.length > 0) {
        return res.json({
          status: "disabled",
          message: "Clock-in not allowed. Missing clock-out on the previous day.",
        });
      } else {
        const clockinDateTime = moment().format("YYYY-MM-DD HH:mm:ss");

        // Insert attendance record into the database
        let sql = InsertStatement("master_attendance", "ma", [
          "employeeid",
          "attendancedate",
          "clockin",
          "latitudeIn",
          "longitudein",
          "devicein",
          "gefenceidIn",
          "locationIn",
        ]);

        // Prepare data for insertion
        let data = [
          [
            employee_id,
            attendancedate,
            clockinDateTime,
            latitude, // This should not be null
            longitude, // This should not be null
            devicein,
            geofenceid,
            locationin,
          ],
        ];

        let checkStatement = SelectStatement(
          "SELECT * FROM master_attendance WHERE ma_attendancedate=? AND ma_employeeid=?",
          [attendancedate, employee_id]
        );

        Check(checkStatement)
          .then((result) => {
            if (result.length !== 0) {
              return res.json(JsonWarningResponse(MessageStatus.EXIST));
            } else {
              if (latitude === null || longitude === null) {
                return res.status(400).json({
                  status: "error",
                  message: "Latitude and Longitude cannot be null.",
                });
              }
              InsertTable(sql, data, (err, result) => {
                if (err) {
                  console.log(err);
                  return res.status(500).json({
                    status: "error",
                    message: "Failed to insert attendance. Please try again.",
                  });
                }
                return res.json({
                  status: "success",
                  message: "Clock-in successful.",
                });
              });
            }
          })
          .catch((error) => {
            console.error("Error during check statement:", error);
            return res.json({
              status: "error",
              message: "Internal server error. Please try again.",
              data: error,
            });
          });
      }
    })
    .catch((error) => {
      console.error("Error during clock-in process:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error. Please try again.",
        data: error,
      });
    });
});

router.post("/clockout", (req, res) => {
  const employee_id = req.body.employeeid;
  const { latitude, longitude, geofenceid} = req.body;
  let locationout = req.body.locationout;
  const clockoutTime = moment().format("YYYY-MM-DD HH:mm:ss");
  if (!employee_id) {
    return res.status(400).json({
      status: "error",
      message: "Employee ID is required.",
    });
  }

  if (!latitude) {
    return res.status(400).json({
      status: "error",
      message: "Latitude cannot be null.",
    });
  }

  if (!longitude) {
    return res.status(400).json({
      status: "error",
      message: "Longitude cannot be null.",
    });
  }

  if (!geofenceid) {
    return res.status(400).json({
      status: "error",
      message: "Geofence ID cannot be null.",
    });
  }

  if (!locationout) {
    return res.status(400).json({
      status: "error",
      message: "Location cannot be null.",
    });
  }

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
        const deviceout = req.body.deviceout;

        let sanitizedLocationOut = RemoveApostrophe(locationout);

        const updateQuery = `
          UPDATE master_attendance
          SET
            ma_clockout = '${clockoutTime}',
            ma_latitudeout = '${latitude}',
            ma_longitudeout = '${longitude}',
            ma_deviceout = '${deviceout}',
            ma_geofenceidOut = '${geofenceid}',
            ma_locationOut = '${sanitizedLocationOut}'
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


router.post("/emplogs", (req, res) => {
  try {
    let = employeeid = req.body.employeeid;
    let sql = `   SELECT
    DATE_FORMAT(al_logdatetime, '%Y-%m-%d') AS logdate,
    al_logtype as logtype,
    TIME(al_logdatetime) AS logtime
    FROM attendance_logs
    WHERE al_employeeid = '${employeeid}'
    order by al_logdatetime desc
    limit 4`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

//#region notification api

router.post("/viewnotif", (req, res) => {
  try {
    let notificationIdClicked = req.body.notificationIdClicked;
    let sql = `select *
    from master_notification
    where mn_notificationid = '${notificationIdClicked}'`;

    console.log("notif_id", notificationIdClicked);

    mysql.Select(sql, "Master_Notification", (err, result) => {
      if (err) console.error("Error : ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/generatenotification", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.GetNotification('${employeeid}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/loadnotif", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM master_notification
    WHERE mn_employeeid = '${employeeid}'
    AND mn_isDeleate = 'NO'
    ORDER BY mn_date DESC`;

    console.log();

    mysql.Select(sql, "Master_Notification", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/readnotif", (req, res) => {
  try {
    let notificationId = req.body.notificationId;
    let sql = `UPDATE master_notification SET 
    mn_isReceived = 'YES',
    mn_isRead = 'YES'
    WHERE mn_notificationid = '${notificationId}'`;

    mysql
      .Update(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/recievednotif", (req, res) => {
  try {
    let notificationId = req.body.notificationId;
    let sql = `UPDATE master_notification SET 
    mn_isReceived = 'YES'
    WHERE mn_notificationid = '${notificationId}'`;

    mysql
      .Update(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/deleatenotif", (req, res) => {
  try {
    let notificationId = req.body.notificationId;
    let sql = `UPDATE master_notification SET 
    mn_isReceived = 'YES',
    mn_isRead = 'YES',
    mn_isDeleate = 'YES'
    WHERE mn_notificationid = '${notificationId}'`;

    mysql
      .Update(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/countunreadbadge", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `    
    SELECT count(*) AS Unreadcount
    FROM master_notification 
    WHERE mn_employeeid = '${employeeid}'
    AND mn_isRead = 'NO'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result,
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

//#endregion

//#region FUNCTION

function RemoveApostrophe(str) {
  return str.replace(/'/g, "");
}


function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}

//#endregion
