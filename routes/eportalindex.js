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

router.get("/getisgefence", (req, res) => {
  try {
    let employeeId = req.session.employeeid;
    let accesstype = req.session.accesstypeid;
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
  let locationin = req.body.locationin;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;
  const devicein = req.body.devicein;

  locationin = RemoveApostrophe(locationin);

  if (!employee_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }
  if (!locationin) {
    return res.status(400).json({
      status: "error",
      message: "We Can't Find Your Location",
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

  const fetchScheduledTimeInQuery = `
    SELECT as_scheduled_timein 
    FROM attendance_status 
    WHERE as_employeeid = '${employee_id}' 
      AND as_attendance_date = '${attendancedate}'
  `;

  const fetchScheduledTimeOutQuery = `
    SELECT as_scheduled_timeout 
    FROM attendance_status 
    WHERE as_employeeid = '${employee_id}' 
      AND as_attendance_date = '${attendancedate}'
  `;

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

  executeSequentialQueries([
    checkExistingClockInQuery,
    checkMissingClockOutQuery,
    fetchScheduledTimeInQuery,
    fetchScheduledTimeOutQuery,
  ])
    .then(
      ([
        resultClockIn,
        resultMissingClockOut,
        resultScheduledTimeIn,
        resultScheduledTimeOut,
      ]) => {
        if (resultClockIn.length > 0) {
          return res.json({
            status: "exist",
            message:
              "Clock-in not allowed. Employee already clocked in on the same day.",
          });
        } else if (resultMissingClockOut.length > 0) {
          return res.json({
            status: "disabled",
            message:
              "Clock-in not allowed. Missing clock-out on the previous day.",
          });
        } else if (
          resultScheduledTimeIn.length === 0 ||
          resultScheduledTimeOut.length === 0
        ) {
          return res.status(400).json({
            status: "error",
            message:
              "Scheduled time-in or time-out not found for the employee.",
          });
        } else {
          const clockinDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
          const scheduledTimeIn = resultScheduledTimeIn[0].as_scheduled_timein;
          const scheduledTimeOut =
            resultScheduledTimeOut[0].as_scheduled_timeout;

          let status,
            minutesDifference = 0,
            hoursDifference = 0;

          if (scheduledTimeIn === "00:00:00") {
            status = "Rest Day OT";
          } else {
            const clockInMoment = moment(
              clockinDateTime,
              "YYYY-MM-DD HH:mm:ss"
            );
            const scheduledTimeInMoment = moment(
              `${attendancedate} ${scheduledTimeIn}`,
              "YYYY-MM-DD HH:mm:ss"
            );

            if (clockInMoment.isBefore(scheduledTimeInMoment)) {
              status = "Early";
              minutesDifference = scheduledTimeInMoment.diff(
                clockInMoment,
                "minutes"
              );
            } else if (clockInMoment.isAfter(scheduledTimeInMoment)) {
              status = "Late";
              minutesDifference = clockInMoment.diff(
                scheduledTimeInMoment,
                "minutes"
              );
            } else {
              status = "On Time";
            }
            hoursDifference = Math.floor(minutesDifference / 60);
            minutesDifference %= 60;
          }

          const insertAttendanceQuery = InsertStatement(
            "master_attendance",
            "ma",
            [
              "employeeid",
              "attendancedate",
              "clockin",
              "shift_timein",
              "shift_timeout",
              "latitudeIn",
              "longitudein",
              "devicein",
              "gefenceidIn",
              "locationIn",
            ]
          );

          const attendanceData = [
            [
              employee_id,
              attendancedate,
              clockinDateTime,
              scheduledTimeIn,
              scheduledTimeOut,
              latitude,
              longitude,
              devicein,
              geofenceid,
              locationin,
            ],
          ];

          const checkStatement = SelectStatement(
            "SELECT * FROM master_attendance WHERE ma_attendancedate=? AND ma_employeeid=?",
            [attendancedate, employee_id]
          );

          Check(checkStatement)
            .then((result) => {
              if (result.length !== 0) {
                return res.json(JsonWarningResponse(MessageStatus.EXIST));
              } else {
                InsertTable(
                  insertAttendanceQuery,
                  attendanceData,
                  (err, result) => {
                    if (err) {
                      console.log(err);
                      return res.status(500).json({
                        status: "error",
                        message:
                          "Failed to insert attendance. Please try again.",
                      });
                    }

                    const updateAttendanceStatusQuery = `
                      UPDATE attendance_status 
                      SET as_status = '${status}', 
                          as_minutes = ${minutesDifference}, 
                          as_hours = ${hoursDifference} 
                      WHERE as_employeeid = '${employee_id}' 
                        AND as_attendance_date = '${attendancedate}'
                    `;

                    mysql
                      .mysqlQueryPromise(updateAttendanceStatusQuery)
                      .then(() => {
                        return res.json({
                          status: "success",
                          message: "Clock-in successful.",
                        });
                      })
                      .catch((updateError) => {
                        console.error(
                          "Error updating attendance status:",
                          updateError
                        );
                        return res.status(500).json({
                          status: "error",
                          message: "Failed to update attendance status.",
                        });
                      });
                  }
                );
              }
            })
            .catch((error) => {
              console.error("Error during check statement:", error);
              return res.status(500).json({
                status: "error",
                message: "Internal server error. Please try again.",
                data: error,
              });
            });
        }
      }
    )
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
  const { latitude, longitude, geofenceid } = req.body;
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
