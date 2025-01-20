const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const { SendEmailNotification } = require("./repository/emailsender");
const { Master_Geofence_Settings } = require("./model/hrmisdb");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
  JsonWarningResponse,
  JsonSuccess,
} = require("./repository/response");
const { UserLogin } = require("./repository/helper");
const { DataModeling } = require("./model/hrmisdb");
const e = require("express");
var router = express.Router();
const currentDate = moment();
const {
  Encrypter,
  Decrypter,
  EncrypterString,
  DecrypterString,
} = require("./repository/cryptography");
const {
  InsertStatement,
  SelectStatement,
  GetCurrentDate,
  GetCurrentDatetime,
  UpdateStatement,
  GetCurrentDatetimeSecconds,
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  ConvertToDate,
  InsertStatementTransCommit,
} = require("./repository/customhelper");
const verifyJWT = require("../middleware/authenticator");
const jwt = require("jsonwebtoken");
const { sq, de } = require("date-fns/locale");
const { REQUEST } = require("./repository/enums");
const { log } = require("winston");
const { resolveInclude } = require("ejs");
const { Transaction } = require("./utility/utility");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "mobile-api", "mobile-api");
});

module.exports = router;

//#region NOTIFICATION API

router.post("/viewnotif", verifyJWT, (req, res) => {
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

router.post("/generatenotification", verifyJWT, (req, res) => {
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

router.post("/loadnotif", verifyJWT, (req, res) => {
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

router.get("/loadpopupnotif", (req, res) => {
  try {
    let sql = `
    SELECT
    mb_image AS image,
    mb_tittle AS title,
    mb_type as type,
    mb_targetdate as targetdate,
    mb_description AS description
    FROM master_bulletin
    WHERE (mb_type = 'Announcement' OR (mb_type = 'Event' AND mb_targetdate >= CURDATE()))`;

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
            msg: "Department not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error,
        });
      });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/readnotif", verifyJWT, (req, res) => {
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

router.post("/recievednotif", verifyJWT, (req, res) => {
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

router.post("/deleatenotif", verifyJWT, (req, res) => {
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

router.post("/countunreadbadge", verifyJWT, (req, res) => {
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

router.post("/announcementloadforapp", verifyJWT, (req, res) => {
  try {
    let sql = `select * from master_bulletin
    order by mb_bulletinid desc`;

    mysql.Select(sql, "Master_Bulletin", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/getnotif", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.GetNotification('${employeeid}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.log(err);

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

router.post("/getannouncement", verifyJWT, (req, res) => {
  try {
    let bulletinid = req.body.bulletinid;
    let sql = `SELECT
    mb_image as image,
    mb_tittle as tittle,
    mb_type as type,
    mb_description as description,
    mb_targetdate as targetdate,
    mb_createby as createby,
    mb_status as status
    FROM master_bulletin
    WHERE mb_bulletinid = '${bulletinid}'`;

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

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region APP HOMEPAGE

router.get("/loadservertime", verifyJWT, (req, res) => {
  try {
    let servertime = GetCurrentDatetimeSecconds();
    res.json(JsonDataResponse(servertime));
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/latestlog", verifyJWT, (req, res) => {
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

router.post("/clockin", verifyJWT, (req, res) => {
  const employee_id = req.body.employeeid;
  const geofenceid = req.body.geofenceid == undefined ? 0 : req.body.geofenceid;
  let locationin = req.body.locationin;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;
  const devicein = req.body.devicein;
  let queries = [];

  try {
    async function ProcessData() {
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

      const isExist = await Check(checkExistingClockInQuery);
      const isMissedLog = await Check(checkMissingClockOutQuery);
      const isScheduledTimein = await Check(fetchScheduledTimeInQuery);
      const isScheduledTimeout = await Check(fetchScheduledTimeOutQuery);

      if (isExist.length > 0) {
        return res.json({
          status: "exist",
          message:
            "Clock-in not allowed. Employee already clocked in on the same day.",
        });
      } else if (isMissedLog.length > 0) {
        return res.json({
          status: "disabled",
          message:
            "Clock-in not allowed. Missing clock-out on the previous day.",
        });
      } else if (
        isScheduledTimein.length === 0 ||
        isScheduledTimeout.length === 0
      ) {
        return res.status(400).json({
          status: "error",
          message: "Scheduled time-in or time-out not found for the employee.",
        });
      } else {
        const clockinDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
        const scheduledTimeIn = isScheduledTimein[0].as_scheduled_timein;
        const scheduledTimeOut = isScheduledTimeout[0].as_scheduled_timeout;

        let status,
          minutesDifference = 0,
          hoursDifference = 0;

        if (scheduledTimeIn === "00:00:00") {
          status = "Rest Day OT";
        } else {
          const clockInMoment = moment(clockinDateTime, "YYYY-MM-DD HH:mm:ss");
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

        //#region Insert Attendance

        const insertAttendanceQuery = InsertStatementTransCommit(
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
        ];
        const checkStatement = SelectStatement(
          "SELECT * FROM master_attendance WHERE ma_attendancedate=? AND ma_employeeid=?",
          [attendancedate, employee_id]
        );

        const isAlreadyClockedIn = await Check(checkStatement);

        if (isAlreadyClockedIn.length !== 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        }

        queries.push({
          sql: insertAttendanceQuery,
          values: attendanceData,
        });

        //#endregion

        //#region Update Attendance Status

        // const updateAttendanceStatusQuery = `
        //                   UPDATE attendance_status
        //                   SET as_status = '${status}',
        //                       as_minutes = ${minutesDifference},
        //                       as_hours = ${hoursDifference}
        //                   WHERE as_employeeid = '${employee_id}'
        //                     AND as_attendance_date = '${attendancedate}'
        //                 `;

        const updateAttendanceStatusQuery = UpdateStatement(
          "attendance_status",
          "as",
          ["status", "minutes", "hours"],
          ["employeeid", "attendance_date"]
        );

        queries.push({
          sql: updateAttendanceStatusQuery,
          values: [
            status,
            minutesDifference,
            hoursDifference,
            employee_id,
            attendancedate,
          ],
        });

        console.log("Employee ID: ", employee_id);
        console.log("Attendance Date: ", attendancedate);
        console.log("Clock-in Time: ", clockinDateTime);
        console.log("Scheduled Time In: ", scheduledTimeIn);
        console.log("Status: ", status);
        console.log("Minutes Difference: ", minutesDifference);
        console.log("Hours Difference: ", hoursDifference);
        console.log("Location: ", locationin);
        

        //#endregion

        await Transaction(queries);

        return res.json({
          status: "success",
          message: "Clock-in successful.",
        });
      }
    }

    ProcessData();
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error. Please try again.",
      data: error,
    });
  }
});

router.post("/clockout", verifyJWT, (req, res) => {
  const employee_id = req.body.employeeid;
  const { latitude, longitude } = req.body;
  const clockoutTime = moment().format("YYYY-MM-DD HH:mm:ss");
  const geofenceid = req.body.geofenceid == undefined ? 0 : req.body.geofenceid;

  const checkExistingClockInQuery = `
    SELECT ma_employeeid, ma_attendancedate
    FROM master_attendance
    WHERE ma_employeeid = '${employee_id}'
      AND ma_clockin IS NOT NULL
      AND ma_clockout IS NULL
    ORDER BY ma_attendancedate DESC
    LIMIT 1
  `;

  console.log(checkExistingClockInQuery);

  mysql
    .mysqlQueryPromise(checkExistingClockInQuery)
    .then((resultClockIn) => {
      console.log(resultClockIn);

      if (resultClockIn.length > 0) {
        const { ma_attendancedate } = resultClockIn[0];
        const deviceout = req.body.deviceout;
        let locationout = req.body.locationout;

        locationout = RemoveApostrophe(locationout);

        const updateQuery = `
        UPDATE master_attendance
        SET
          ma_clockout = '${clockoutTime}',
          ma_latitudeout = '${latitude}',
          ma_longitudeout = '${longitude}',
          ma_deviceout = '${deviceout}',
          ma_geofenceidOut = '${geofenceid}',
          ma_locationOut = '${locationout}'
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

router.post("/selectgeofence", verifyJWT, (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let sql = `select * from master_geofence_settings
    where mgs_departmentid ='${departmentid}' and mgs_status = 'Active'`;
    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        let data = Master_Geofence_Settings(result);
        res.json({
          msg: "success",
          data: data,
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
      msg: error,
    });
  }
});

router.post("/offlineclockin", async (req, res) => {
  try {
    const records = req.body;

    console.log(records, "records");

    for (const record of records) {
      const { employeeid, attendancedate, datetime, type } = record;
      const location = "Offline";
      const lat = "0.1";
      const long = "0.1";
      const device = "App";

      if (type === "Clock In") {
        const clockInSQL = InsertStatement("master_attendance", "ma", [
          "employeeid",
          "attendancedate",
          "clockin",
          "latitudeIn",
          "longitudein",
          "devicein",
          "locationIn",
        ]);

        const clockinData = [
          [employeeid, attendancedate, datetime, lat, long, device, location],
        ];

        const clockinCheckStatement = SelectStatement(
          "SELECT * FROM master_attendance WHERE ma_employeeid = ? AND ma_attendancedate = ?",
          [employeeid, attendancedate]
        );

        try {
          const result = await Check(clockinCheckStatement);
          if (result.length > 0) {
            return res.json(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            await new Promise((resolve, reject) => {
              InsertTable(clockInSQL, clockinData, (err) => {
                if (err) {
                  console.log(err);
                  return reject(JsonErrorResponse(err));
                }
                console.log(
                  `Inserted Clock IN for ${employeeid} on ${attendancedate}`
                );
                resolve();
              });
            });
          }
        } catch (error) {
          console.log(error);
          return res.json(JsonErrorResponse(error));
        }
      } else if (type === "Clock Out") {
        let data = [];
        let columns = [];
        let arguments = [];

        if (datetime) {
          data.push(datetime);
          columns.push("clockout");
        }

        if (lat) {
          data.push(lat);
          columns.push("latitudeout");
        }

        if (long) {
          data.push(long);
          columns.push("longitudeout");
        }

        if (location) {
          data.push(location);
          columns.push("locationOut");
        }

        if (device) {
          data.push(device);
          columns.push("deviceout");
        }

        if (employeeid) {
          arguments.push(employeeid);
        }

        if (attendancedate) {
          arguments.push(attendancedate);
        }

        if (columns.length > 0 && arguments.length > 0) {
          let updateStatement = UpdateStatement(
            "master_attendance",
            "ma",
            columns,
            ["employeeid", "attendancedate"]
          );
          const updateData = [...data, employeeid, attendancedate];
          await new Promise((resolve, reject) => {
            Update(updateStatement, updateData, (err, result) => {
              if (err) {
                console.error("Error updating clock-out:", err);
                return reject(JsonErrorResponse(err));
              } else {
                console.log(
                  `Updated Clock Out for ${employeeid} on ${attendancedate}, Rows affected: ${result}`
                );
                resolve();
              }
            });
          });
        } else {
          console.log("No columns to update for Clock Out.");
        }
      }
    }

    res.json(JsonSuccess());
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region EMPLOYEE PAGE

router.post("/getgovid", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select
    mg_governmentid as governmentid,
    mg_employeeid as employeeid,
    mg_idtype as idtype,
    mg_idnumber as idnumber,
    mg_issuedate as issuedate
    from master_govid
    inner join master_employee on mg_employeeid = me_id
    where mg_employeeid = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/eportaldisciplinaryactionloadforapp", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `        
    SELECT 
     me_id as oda_employeeid,
     oda_disciplinaryid,
     mo_offensename as oda_offenseid,
     mda_description as oda_actionid,
     mv_description as oda_violation,
     oda_date,
     oda_createby,
     oda_createdate,
     oda_status
     from offense_disciplinary_actions
     LEFT JOIN master_employee ON offense_disciplinary_actions.oda_employeeid = me_id
     LEFT JOIN master_offense ON offense_disciplinary_actions.oda_offenseid = mo_offenseid
     LEFT JOIN master_disciplinary_action ON offense_disciplinary_actions.oda_actionid = mda_actionid
     LEFT JOIN master_violation ON offense_disciplinary_actions.oda_violation = mv_violationid
   WHERE oda_employeeid = '${employeeid}'
   order by oda_disciplinaryid desc`;

    mysql.Select(sql, "Offense_Disciplinary_Actions", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post(
  "/getemployeeprofileforappbasicinformation",
  verifyJWT,
  (req, res) => {
    try {
      let employeeid = req.body.employeeid;
      let sql = `SELECT 
    me_id AS employeeid,
    md_departmentname AS department,
    mp_positionname AS position,
    md_departmenthead AS departmenthead,
    me_jobstatus AS jobstatus,
    me_hiredate AS hiredate,
    CONCAT(
        TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
        TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
        DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
    ) AS tenure
    FROM 
    master_employee
    LEFT JOIN 
    master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN 
    master_position ON master_employee.me_position = mp_positionid
    where me_id = '${employeeid}'`;

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
            error,
          });
        });
    } catch (error) {
      res.json({
        msg: error,
      });
    }
  }
);

router.post("/getemployee", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `    
    SELECT
    me_id as employeeid,
    me_firstname as firstname,
    me_middlename as middlename,
    me_lastname as lastname,
    me_birthday as birthday,
    me_gender as gender,
    me_civilstatus as civilstatus,
    me_phone as phone,
    me_email as email,
    me_hiredate as hiredate,
    me_jobstatus as jobstatus,
    me_ercontactname as ercontactname,
    me_ercontactphone as ercontactphone,
    me_department as department,
    me_position as position,
    me_address as address,
    me_profile_pic as profilePicturePath
    FROM master_employee me
    WHERE me_id = '${employeeid}'`;

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
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/gettrainingforapp", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = ` select
    me_id as employeeid,
    mt_trainingid as trainingid, 
    mt_name as name,
    mt_startdate as startdate,
    mt_enddate as enddate,
    mt_location as location,
    mt_status as status
    from master_training 
    inner join master_employee on mt_employeeid = me_id
    where mt_employeeid = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region SETTINGS PAGE

router.post("/loadshiftforapp", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadShiftForApp('${employeeid}')`;

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

router.post("/updatepassword", verifyJWT, async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let currentPass = req.body.currentPass;
    let newPass = req.body.newPass;
    let confirmPass = req.body.confirmPass;
    let accesstypeid = req.body.accesstypeid;

    if (newPass !== confirmPass) {
      return res.json({
        msg: "error",
        description: "New password and confirm password do not match",
      });
    }

    const userData = await mysql.mysqlQueryPromise(
      `SELECT mu_password FROM master_user WHERE 
        mu_accesstype = '${accesstypeid}' and  mu_employeeid = '${employeeid}'`
    );

    if (userData.length !== 1) {
      return res.json({
        msg: "error",
        description: "Employee not found",
      });
    }

    const encryptedStoredPassword = userData[0].mu_password;

    Decrypter(
      encryptedStoredPassword,
      async (decryptError, decryptedStoredPassword) => {
        if (decryptError) {
          return res.json({
            msg: "error",
            description: "Error decrypting the stored password",
          });
        }

        if (currentPass !== decryptedStoredPassword) {
          return res.json({
            msg: "error",
            description: "Current password is incorrect",
          });
        }

        Encrypter(newPass, async (encryptError, encryptedNewPassword) => {
          if (encryptError) {
            return res.json({
              msg: "error",
              description: "Error encrypting the new password",
            });
          }

          await mysql.Update(
            `UPDATE master_user SET mu_password = '${encryptedNewPassword}' WHERE mu_employeeid = '${employeeid}' and mu_accesstype = '${accesstypeid}'`
          );

          return res.json({
            msg: "success",
            description: "Password updated successfully",
          });
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.json({
      msg: "error",
      description: error.message || "Internal server error",
    });
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region PAYROLL

router.post("/getpayrolldate", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
      CONCAT(p_startdate, ' To ', p_enddate) AS p_daterange,
      DATE_FORMAT(p_payrolldate, '%Y-%m-%d') AS p_payrolldate,
      p_cutoff as p_cutoff,
      ROUND(p_salary + p_allowances + p_basic_adjustments, 2) as p_totalsalary,
      SUM(p_totalhours) as p_totalhours,
      SUM(p_nightothours) as p_nightdiff,
      SUM(p_normalothours) as p_normalot,
      SUM(p_earlyothours) as p_earlyot,
      SEC_TO_TIME(SUM(TIME_TO_SEC(COALESCE(p_lateminutes, '00:00:00')))) AS p_totalminutes,
      round(p_total_netpay, 2) as p_totalnetpay
      FROM 
      payslip  
      WHERE 
      p_employeeid = '${employeeid}'
      GROUP BY 
      p_startdate, p_enddate, p_payrolldate, p_cutoff, p_salary, p_allowances, p_basic_adjustments, p_total_netpay
      ORDER BY 
      p_payrolldate DESC
      LIMIT 2`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "p_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/loadpayslip", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let payrolldate = req.body.payrolldate;
    let sql = `SELECT
    p_employeeid,
    p_sssid, 
    p_tinid,
    p_philhealthid, 
    p_pagibigid, 
    p_present, 
    p_restday, 
    p_leaveday, 
    p_restotday, 
    p_fullname, 
    p_remaining_leave, 
    p_position, 
    p_department, 
    p_payrolltype, 
    p_salary, 
    p_allowances, 
    p_basic_adjustments, 
    p_payrolldate, 
    p_cutoff, 
    p_startdate, 
    p_enddate, 
    p_totalhours, 
    p_totalminutes, 
    p_nightothours, 
    p_normalothours, 
    p_earlyothours, 
    p_lateminutes, 
    p_latehours, 
    p_holidayot, 
    p_regularhours, 
    p_basic_perday, 
    p_basic_perhour, 
    p_nighdiff, 
    p_normalot, 
    p_exempteddays, 
    p_workdays, 
    p_restdays, 
    p_presentdays_gp, 
    p_holidaydays, 
    p_absent, 
    p_nightdiffpay, 
    p_restday_ot, 
    p_otpay, 
    p_earlyotpay, 
    p_compensation, 
    p_night_diff_hours_approved, 
    p_normal_ot_hours_approved, 
    p_early_ot_hours_approved, 
    p_approveOT, 
    p_approveNormalOT, 
    p_approvedNightOT, 
    p_approvedEarlyOT, 
    p_regularholidayComp, 
    p_specialholidayComp, 
    p_regularholidayOT, 
    p_specialholidayOT, 
    p_payroll_adjustments, 
    p_overtime_meal, 
    p_leave_pay, 
    p_suspension_pay,
    p_overall_netpay, 
    p_absent_deductions, 
    p_leave_with_out_pay_deductions,
    p_wisp_deductions, 
    p_late_deductions, 
    p_sss_dedcutions, 
    p_pagibigdeductions, 
    p_philhealthdeductions, 
    p_tindeductions, 
    p_healthcard, 
    p_sudden_deductions,
    p_calamity_loan, 
    p_shortterm_loan, 
    p_housing_loan, 
    p_education_loan, 
    p_sterling_loan,
    p_salary_loan,
    p_total_deductions, 
    p_total_netpay,
    p_accrued13thmonth
    FROM payslip
    WHERE p_employeeid = '${employeeid}'
    And p_payrolldate = '${payrolldate}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "p_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/subgrouploadforapp", verifyJWT, (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let sql = `select * 
    from subgroup
    where s_departmentid = '${departmentid}'
    AND s_status = 'Active'`;

    mysql.Select(sql, "Subgroup", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.post("/getpayrolldate", verifyJWT, (req, res) => {
  try {
    let sql = `select pd_payrolldate as gp_payrolldate 
              from payroll_date where 
              pd_startdate = (
              SELECT CASE 
              WHEN DAY(CURRENT_DATE) <= 11 THEN DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH), '%Y-%m-26') -- Previous month's 26th
              WHEN DAY(CURRENT_DATE) <= 26 THEN DATE_FORMAT(CURRENT_DATE, '%Y-%m-11') -- Current month's 11th
              ELSE DATE_FORMAT(CURRENT_DATE, '%Y-%m-26') -- Current month's 26th
              END
              )`;

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

router.post("/viewpayslip", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let password = req.body.password;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      let sql = `select 
      me_id
      from master_employee
      inner join master_user on master_employee.me_id = mu_employeeid
      where mu_password = '${encrypted}' and me_id = '${employeeid}'`;

      mysql
        .mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            res.json({
              msg: "success",
              data: result,
            });
          } else {
            return res.status(500).json({
              msg: "Incorrect",
            });
          }
        })
        .catch((error) => {
          res.json({
            msg: "error",
            data: error,
          });
        });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/loadreqbeforepayout", verifyJWT, (req, res) => {
  try {
    let sql = `SELECT 
          pd_payrollid,
          pd_name,
          pd_cutoff,
          DATE_FORMAT(pd_startdate, '%Y-%m-%d') AS pd_startdate,
          DATE_FORMAT(pd_enddate, '%Y-%m-%d') AS pd_enddate,
          DATE_FORMAT(pd_payrolldate, '%Y-%m-%d') AS pd_payrolldate
          FROM 
          payroll_date
          WHERE
          pd_startdate = (
            SELECT CASE 
              WHEN DAY(CURRENT_DATE) <= 11 THEN DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH), '%Y-%m-26') -- Previous month's 26th
              WHEN DAY(CURRENT_DATE) <= 26 THEN DATE_FORMAT(CURRENT_DATE, '%Y-%m-11') -- Current month's 11th
              ELSE DATE_FORMAT(CURRENT_DATE, '%Y-%m-26') -- Current month's 26th
                  END
          )  `;

    mysql.Select(sql, "Payroll_Date", (err, result) => {
      if (err) console.error("Error: ", err);
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      mag: "error",
      data: error,
    });
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region LABAS REGION

router.post("/apps_detailsloadforapp", (req, res) => {
  try {
    let sql = `SELECT * FROM  apps_details`;

    mysql.Select(sql, "Apps_Details", (err, result) => {
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

router.post("/getloadforapp", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT
    CONCAT(me_lastname, " ", me_firstname) as employeeid,
    TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d') as attendancedateout,
    DATE_FORMAT(ma_clockin, '%Y-%m-%d') as attendancedatein,
    ma_devicein as devicein,
    ma_deviceout as deviceout,
    ma_locationIn as geofencenameIn,
    ma_locationOut as geofencenameOut, 
    CONCAT(
    FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
    FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
    ) AS totalhours
    FROM master_attendance
    INNER JOIN master_employee ON ma_employeeid = me_id
    where ma_employeeid='${employeeid}'
    ORDER BY ma_attendancedate DESC
    limit 2`;
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
    console.log("error", error);
  }
});

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) {
        console.error("Error: ", err);
        return res.status(500).json({ msg: "Encryption error" });
      }
      let sql = `SELECT 
        mu_employeeid AS employeeid,
        CONCAT(me_firstname, ' ', me_lastname) AS fullname,
        ma_accessname AS accesstype,
        mu_status AS status,
        me_profile_pic AS image,
        me_jobstatus AS jobstatus,
        md_departmentid AS departmentid,
        mu_isgeofence AS isgeofence,
        md_departmentname AS departmentname,
        mp_positionname AS position,
        ma_accessid AS accesstypeid,
        mgs_id AS geofenceid
        FROM master_user
        INNER JOIN master_access ON mu_accesstype = ma_accessid
        LEFT JOIN master_employee ON mu_employeeid = me_id
        LEFT JOIN master_department ON md_departmentid = me_department
        LEFT JOIN master_position ON mp_positionid = me_position
        LEFT JOIN master_geofence_settings ON mgs_departmentid = me_department 
        WHERE mu_username = '${username}' AND mu_password = '${encrypted}' 
        AND mu_accesstype = '2'`;

      mysql
        .mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            const user = result[0];
            if (
              user.jobstatus === "probitionary" ||
              user.jobstatus === "regular" ||
              user.jobstatus === "apprentice"
            ) {
              if (user.status === "Active") {
                let data = [];
                for (const d of JSON.parse(JSON.stringify([result[0]]))) {
                  const {
                    employeeid,
                    fullname,
                    accesstype,
                    departmentid,
                    isgeofence,
                    departmentname,
                    position,
                    jobstatus,
                    geofenceid,
                    accesstypeid,
                    subgroupid,
                    status,
                    image,
                  } = d;

                  data.push({
                    employeeid,
                    fullname,
                    accesstype,
                    departmentid,
                    isgeofence,
                    departmentname,
                    position,
                    jobstatus,
                    geofenceid,
                    accesstypeid,
                    subgroupid,
                    status,
                    image,
                    APK: EncrypterString(
                      jwt.sign(
                        JSON.stringify({
                          employeeid,
                          accesstype,
                        }),
                        process.env._SECRET_KEY
                      )
                    ),
                  });
                }
                return res.json({
                  msg: "success",
                  data: data,
                });
              } else {
                return res.json({ msg: "inactive" });
              }
            } else {
              return res.json({ msg: "resigned" });
            }
          } else {
            return res.json({ msg: "incorrect" });
          }
        })
        .catch((error) => {
          return res.json({
            msg: "error",
            data: error,
          });
        });
    });
  } catch (error) {
    res.json({
      msg: error.message,
    });
  }
});

router.post("/request", (req, res) => {
  try {
    const { employeeid } = req.body;

    let sql = `select  
              me_id,
              concat(me_firstname, ' ', me_lastname) as me_fullname,
              me_email,
              mu_password as me_password
              from master_employee
              inner join master_user on mu_employeeid = me_id
              inner join master_access on ma_accessid = mu_accesstype 
              where me_id = ? 
              and ma_accessname='Employee'`;
    let cmd = SelectStatement(sql, [employeeid]);

    Select(cmd, (err, result) => {
      if (err) {
        res.status(500).json(JsonErrorResponse(err));
      }

      if (result.length > 0) {
        let data = DataModeling(result, "me_");
        SendRequestPassword(employeeid, "Forgot Password", data);

        res.status(200).json(JsonSuccess());
      } else {
        res.status(404).json(JsonErrorResponse("Employee not found"));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region LOAN DETAILS

router.post("/loadloansdetails", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM gov_loan_details
      WHERE gld_employeeid = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gld_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/loadloans", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM gov_loans
      WHERE gl_employeeid = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gl_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getgovloans", verifyJWT, (req, res) => {
  try {
    let govloanid = req.body.govloanid;
    let sql = `SELECT
    gld_payrolldates as gld_payrolldates,
    gl_loan_type as gld_loan_type,
    gl_per_month as gld_per_month,
    concat(me_lastname,' ',me_firstname) as gld_fullname,
    gld_loanstatus as gld_loanstatus,
    DATE_FORMAT(gld_paid_dates, "%M %d %Y") as gld_paid_dates,
    gld_payment_type
    FROM gov_loan_details
    INNER JOIN gov_loans ON gov_loan_details.gld_loanid = gl_loanid
    INNER JOIN master_employee ON gov_loan_details.gld_employeeid = me_id
    WHERE gld_loanid = '${govloanid}'
    ORDER BY gld_payrolldates DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gld_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region COA AND ATTENDANCE

router.post("/loadcoa", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startdate = GetCurrentMonthFirstDay();
    let enddate = GetCurrentMonthLastDay();
    let sql = `SELECT 
      ar_requestid,
      DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
      DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
      DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
      ar_total,
      ar_createdate,
      ar_status,
      ar_reason
    FROM attendance_request
    INNER JOIN
    master_employee ON attendance_request.ar_employeeid = me_id
    where ar_employeeid ='${employeeid}'
    and ar_attendace_date between '${startdate}' and '${enddate}'
    order by ar_requestid desc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ar_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/submit", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let subgroupid = req.body.subgroupid;
    let reason = req.body.reason;
    let file = req.body.file;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = "Pending";
    let createby = "On Process";
    let approvedcount = "0";

    let total = calculateTotalHours(timein, timeout);

    const Datenow = new Date();
    const inputDate = new Date(attendancedate);
    if (inputDate > Datenow) {
      return res.json({
        msg: "nodate",
        data: "Date is in the future",
      });
    }

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [
        employeeid,
        attendancedate,
        timein,
        timeout,
        total,
        subgroupid,
        reason,
        file,
        createdate,
        createby,
        status,
        approvedcount,
      ],
    ];

    let checkStatement = SelectStatement(
      "SELECT * FROM attendance_request WHERE ar_employeeid =? and ar_attendace_date= ? and ar_status =?",
      [employeeid, attendancedate, "Pending"]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          mysql.InsertTable(
            "attendance_request",
            data,
            (insertErr, insertResult) => {
              console.log(insertResult, "result");
              if (insertErr) {
                console.error("Error inserting leave record: ", insertErr);
                res.json({ msg: "insert_failed" });
              } else {
                let emailbody = [
                  {
                    employeename: employeeid,
                    date: attendancedate,
                    timein: timein,
                    timeout: timeout,
                    reason: reason,
                    status: status,
                    requesttype: REQUEST.COA,
                  },
                ];
                SendEmailNotification(
                  employeeid,
                  subgroupid,
                  REQUEST.COA,
                  emailbody
                );

                res.json({ msg: "success" });
              }
            }
          );
        }
      })
      .catch((error) => {
        console.error(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/updatecoa", verifyJWT, (req, res) => {
  try {
    let requestid = req.body.requestid;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let reason = req.body.reason;
    let file = req.body.file;
    let requeststatus = "Pending";
    let total = calculateTotalHours(timein, timeout);
    let createdate = moment().format("YYYY-MM-DD");

    let data = [];
    let columns = [];
    let arguments = [];

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (timein) {
      data.push(timein);
      columns.push("timein");
    }

    if (timeout) {
      data.push(timeout);
      columns.push("timeout");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendace_date");
    }

    if (reason) {
      data.push(reason);
      columns.push("reason");
    }

    if (file) {
      data.push(file);
      columns.push("file");
    }

    if (total) {
      data.push(total);
      columns.push("total");
    }

    if (subgroup) {
      data.push(subgroup);
      columns.push("subgroupid");
    }

    if (requestid) {
      data.push(requestid);
      arguments.push("requestid");
    }

    let updateStatement = UpdateStatement(
      "attendance_request",
      "ar",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from attendance_request where ar_employeeid = ? and ar_attendace_date = ? and ar_status = ? and ar_timein = ? and ar_timeout = ? and ar_subgroupid = ?",
      [employeeid, attendancedate, requeststatus, timein, timeout, subgroup]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);
            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.post("/cancelcoa", verifyJWT, (req, res) => {
  try {
    let requestid = req.body.requestid;
    let requeststatus = "Cancel";

    let data = [];
    let columns = [];
    let arguments = [];

    if (requeststatus) {
      data.push(requeststatus);
      columns.push("status");
    }

    if (requestid) {
      data.push(requestid);
      arguments.push("requestid");
    }

    let updateStatement = UpdateStatement(
      "attendance_request",
      "ar",
      columns,
      arguments
    );

    Update(updateStatement, data, (err, result) => {
      if (err) console.error("Error: ", err);
      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/gethomestatus2", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;
    let sql = `select 
		DATE_FORMAT(ma_clockin, '%W, %M %e, %Y') AS logdatein,
        TIME(ma_clockin) AS logtimein,
        DATE_FORMAT(ma_clockout, '%W, %M %e, %Y') AS logdateout,
        TIME(ma_clockout) AS logtimeout
        from master_attendance
        where ma_employeeid = '${employeeid}' and ma_attendancedate = '${attendancedate}'
        order by ma_attendancedate desc 
        limit 1`;

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
    console.log("error", error);
  }
});

router.post("/filterforapp", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `       
    SELECT
    CONCAT(me_lastname, " ", me_firstname) as employeeid,
    TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d') as attendancedateout,
    DATE_FORMAT(ma_clockin, '%Y-%m-%d') as attendancedatein,
    ma_devicein as devicein,
    ma_deviceout as deviceout,
    ma_locationIn as geofencenameIn,
    ma_locationOut as geofencenameOut, 
    CONCAT(
    FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
    FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
    ) AS totalhours
    FROM master_attendance
    INNER JOIN master_employee ON ma_employeeid = me_id
    where ma_employeeid='${employeeid}'
    ORDER BY ma_attendancedate DESC`;

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
    console.log("error", error);
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region REST DAY OT APPROVAL

router.post("/loadrdot", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startdate = GetCurrentMonthFirstDay();
    let enddate = GetCurrentMonthLastDay();
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            roa_admin_comment,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        AND roa_attendancedate BETWEEN '${startdate}' AND '${enddate}'
        ORDER BY roa_rdotid DESC`;

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

router.post("/getrestdayot", verifyJWT, (req, res) => {
  try {
    let rdotid = req.body.rdotid;
    let sql = `SELECT
        roa_rdotid,
        DATE_FORMAT(roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
        DATE_FORMAT(roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
        DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
        DAYNAME(roa_attendancedate) AS roa_dayname,
        roa_status,
        roa_total_hours,
        roa_file,
        roa_admin_comment,
          (
          SELECT rra_comment 
          FROM restdayot_request_activity 
          WHERE rra_restdayotid = roa_rdotid
          ORDER BY rra_date DESC
          LIMIT 1
        ) AS roa_comment,
        DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
        roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_rdotid = '${rdotid}'
        LIMIT 1`;

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

router.put("/editrdot", verifyJWT, (req, res) => {
  try {
    let createdby = req.body.fullname;
    let createddate = GetCurrentDatetime();
    const {
      rdotid,
      status,
      clockin,
      clockout,
      total_hours,
      attendancedate,
      payrolldate,
      subgroup,
      file,
      employeeid,
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (createdby) {
      data.push(createdby);
      columns.push("createby");
    }

    if (createddate) {
      data.push(createddate);
      columns.push("createdate");
    }

    if (total_hours) {
      data.push(total_hours);
      columns.push("total_hours");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (clockin) {
      data.push(clockin);
      columns.push("timein");
    }

    if (clockout) {
      data.push(clockout);
      columns.push("timeout");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendancedate");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (file) {
      data.push(file);
      columns.push("file");
    }

    if (subgroup) {
      data.push(subgroup);
      columns.push("subgroupid");
    }

    if (rdotid) {
      data.push(rdotid);
      arguments.push("rdotid");
    }

    let updateStatement = UpdateStatement(
      "restday_ot_approval",
      "roa",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from restday_ot_approval where roa_employeeid = ? and roa_attendancedate = ? and roa_status = ?",
      [employeeid, attendancedate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);
            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/saverdot", verifyJWT, async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let fullname = req.body.fullname;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let payrolldate = req.body.payrolldate;
    let subgroupid = req.body.subgroupid;
    let file = req.body.file;
    let status = "Applied";

    let timeInDate = new Date(timein);
    let timeOutDate = new Date(timeout);
    let total_hours = 0;

    if (timeInDate && timeOutDate && timeOutDate > timeInDate) {
      total_hours = (timeOutDate - timeInDate) / (1000 * 60 * 60);
      total_hours = Math.floor(total_hours);
    }

    let sqlSalary = `SELECT 
      CASE 
        WHEN ${total_hours} <= 3 THEN 0
        WHEN ${total_hours} <= 8 THEN
          CASE 
            WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30) / 2
            ELSE (s.ms_monthly / 313 * 12 * 1.30) / 2
          END
        ELSE
          CASE 
            WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30)
            ELSE (s.ms_monthly / 313 * 12 * 1.30)
          END
      END AS ot_total
      FROM master_salary s 
      WHERE s.ms_employeeid = '${employeeid}'`;

    Select(sqlSalary, (err, result) => {
      if (err) {
        console.error(err);
        return res.json(JsonErrorResponse(err));
      }

      let ot_total = result && result.length > 0 ? result[0].ot_total : 0;

      let sqlInsert = InsertStatement("restday_ot_approval", "roa", [
        "employeeid",
        "fullname",
        "timein",
        "timeout",
        "attendancedate",
        "status",
        "total_hours",
        "ot_total",
        "file",
        "createdate",
        "createby",
        "payrolldate",
        "subgroupid",
        "approvalcount",
      ]);

      let data = [
        [
          employeeid,
          fullname,
          timein,
          timeout,
          attendancedate,
          status,
          total_hours,
          ot_total,
          file,
          new Date().toISOString(),
          employeeid,
          payrolldate,
          subgroupid,
          0,
        ],
      ];

      let checkStatement = SelectStatement(
        "SELECT * FROM restday_ot_approval WHERE roa_employeeid=? AND roa_attendancedate=? AND roa_status=?",
        [employeeid, attendancedate, status]
      );

      Check(checkStatement)
        .then((result) => {
          if (result.length > 0) {
            return res.json(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            InsertTable(sqlInsert, data, (err, result) => {
              if (err) {
                console.log(err);
                return res.json(JsonErrorResponse(err));
              }

              res.json(JsonSuccess());
            });
          }
        })
        .catch((error) => {
          console.log(error);
          res.json(JsonErrorResponse(error));
        });
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/cancelrdot", verifyJWT, (req, res) => {
  try {
    let requestid = req.body.requestid;
    let requeststatus = "Cancel";

    let data = [];
    let columns = [];
    let arguments = [];

    if (requeststatus) {
      data.push(requeststatus);
      columns.push("status");
    }

    if (requestid) {
      data.push(requestid);
      arguments.push("rdotid");
    }

    let updateStatement = UpdateStatement(
      "restday_ot_approval",
      "roa",
      columns,
      arguments
    );

    Update(updateStatement, data, (err, result) => {
      if (err) console.error("Error: ", err);
      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/filterrdot", (req, res) => {
  try {
    const { employeeid, status, startdate, enddate } = req.body;

    console.log(employeeid, status, startdate, enddate);

    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            roa_admin_comment,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'`;

    if (status) {
      sql += ` AND roa_status = '${status}'`;
    }

    sql += ` AND roa_attendancedate BETWEEN '${startdate}' AND '${enddate}'
        ORDER BY roa_rdotid DESC`;

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

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region HOLIDAY APPROVAL

router.post("/loadholiday", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startdate = GetCurrentMonthFirstDay();
    let enddate = GetCurrentMonthLastDay();
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d, %W') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_status,
    ph_nightdiff_ot_total,
    ph_normal_ot_total
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    order by ph_attendancedate asc`;

    // and ph_attendancedate between '${startdate}' and '${enddate}'

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
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

router.put("/editholiday", verifyJWT, (req, res) => {
  try {
    let createddate = GetCurrentDatetime();
    let approvecount = 0;
    const {
      holidayid,
      status,
      clockin,
      clockout,
      attendancedate,
      payrolldate,
      subgroup,
      holidayimage,
      employeeid,
    } = req.body;

    // console.log(req.body);

    let sql = `call hrmis.UpdateRequestHoliday(
      '${clockin}',
      '${clockout}',
      '${ConvertToDate(attendancedate)}',
      '${employeeid}',
      '${payrolldate}',
      '${status}',
      '${subgroup}',
      '${holidayimage}',
      '${createddate}',
      '${approvecount}',
      '${holidayid}')`;

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Applied'`,
      [ConvertToDate(attendancedate), employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery2)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPLIEDOT)
          );
        }
        return Check(validationQuery3);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPROVEDOT)
          );
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            let emailbody = [
              {
                employeename: employeeid,
                date: createddate,
                startdate: clockin,
                enddate: clockout,
                reason: status,
                status: status,
                requesttype: REQUEST.HD,
              },
            ];
            SendEmailNotification(employeeid, subgroup, REQUEST.HD, emailbody);

            //res.json(JsonSuccess());
            return res.json(JsonSuccess());
          }
        });
      })
      .catch((error) => {
        console.log(error);
        return res.json(error);
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/filterholiday", verifyJWT, (req, res) => {
  try {
    const { employeeid, status, startdate, enddate } = req.body;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d, %W') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_status,
    ph_nightdiff_ot_total,
    ph_normal_ot_total
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    `;

    if (status) {
      sql += ` and ph_status = '${status}'`;
    }

    sql += ` and ph_attendancedate between '${startdate}' and '${enddate}'
    order by ph_attendancedate desc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
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

router.post("/getholidayday", verifyJWT, (req, res) => {
  try {
    let attendancedate = req.body.attendancedate;
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
    DATE_FORMAT(ma_clockin, '%Y-%m-%d %H:%i:%s') AS ma_clockin,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d %H:%i:%s') AS ma_clockout,
    ma_attendancedate,
    mh_name as ma_name,
    mh_type as ma_type
    FROM master_attendance 
    INNER JOIN master_holiday ON master_attendance.ma_attendancedate = mh_date
    WHERE ma_attendancedate = '${attendancedate}'
    AND mh_date = '${attendancedate}'
    AND ma_employeeid = '${employeeid}'`;

    Check(sql)
      .then((result) => {
        if (result.length === 0) {
          return res.json(JsonWarningResponse(MessageStatus.NOTEXIST));
        } else {
          Select(sql, (err, result) => {
            if (err) {
              console.error(err);
              res.json(JsonErrorResponse(err));
            }

            if (result != 0) {
              let data = DataModeling(result, "ma_");
              res.json(JsonDataResponse(data));
            } else {
              res.json(JsonDataResponse(result));
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region OVERTIME

router.post("/loadovertime", verifyJWT, (req, res) => {
  try {
    const { employeeid, startdate, enddate, overtimestatus } = req.body;
    let sql = `
      SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        pao_payroll_date,
        pao_status
      FROM payroll_approval_ot
      WHERE pao_employeeid = '${employeeid}'
      AND pao_attendancedate BETWEEN '${startdate}' AND '${enddate}'
    `;
    if (overtimestatus) {
      sql += ` AND pao_status = '${overtimestatus}'`;
    }
    sql += " ORDER BY pao_id DESC";

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/loadotcurrentmonth", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let overtimestatus = req.body.overtimestatus;
    let sql = `SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        pao_payroll_date,
        pao_status
    FROM payroll_approval_ot
    WHERE pao_employeeid = '${employeeid}'
    AND MONTH(pao_attendancedate) = MONTH(CURDATE())
    AND YEAR(pao_attendancedate) = YEAR(CURDATE())`;

    if (overtimestatus) {
      sql += ` AND pao_status = '${overtimestatus}'`;
    }
    sql += " ORDER BY pao_id DESC";

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getattendancedate", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;
    let sql = `SELECT
    ma_attendanceid as pao_attendanceid,
    DATE_FORMAT(ma_clockin, '%Y-%m-%d %H:%i:%s') AS pao_clockin,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d %H:%i:%s') AS pao_clockout,
    ma_attendancedate as pao_attendancedate,
    CASE 
        WHEN mh_date IS NOT NULL THEN mh_type
        WHEN (
            JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Monday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Tuesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Wednesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Thursday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Friday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Saturday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Sunday'
        )
        THEN 'Rest Day'
        ELSE TIME_FORMAT(
            JSON_UNQUOTE(JSON_EXTRACT(
                CASE DAYNAME(ma_attendancedate)
                    WHEN 'Monday' THEN ms_monday
                    WHEN 'Tuesday' THEN ms_tuesday
                    WHEN 'Wednesday' THEN ms_wednesday
                    WHEN 'Thursday' THEN ms_thursday
                    WHEN 'Friday' THEN ms_friday
                    WHEN 'Saturday' THEN ms_saturday
                    WHEN 'Sunday' THEN ms_sunday
                END,
                '$.time_in'
            )),
            '%h:%i %p'
        )
    END AS pao_starttime,
    CASE 
        WHEN mh_date IS NOT NULL THEN mh_type
        WHEN (
            JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Monday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Tuesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Wednesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Thursday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Friday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Saturday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Sunday'
        )
        THEN 'Rest Day'
        ELSE TIME_FORMAT(
            JSON_UNQUOTE(JSON_EXTRACT(
                CASE DAYNAME(ma_attendancedate)
                    WHEN 'Monday' THEN ms_monday
                    WHEN 'Tuesday' THEN ms_tuesday
                    WHEN 'Wednesday' THEN ms_wednesday
                    WHEN 'Thursday' THEN ms_thursday
                    WHEN 'Friday' THEN ms_friday
                    WHEN 'Saturday' THEN ms_saturday
                    WHEN 'Sunday' THEN ms_sunday
                END,
                '$.time_out'
            )),
            '%h:%i %p'
        )
    END AS pao_endtime,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(ma_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_in'
    )) AS pao_schedtimein,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(ma_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_out'
    )) AS pao_schedtimeout,
    mp_positionname AS pao_positioname,
    md_departmentname AS pao_departmentname,
    concat(me_lastname,' ',me_firstname) AS pao_fullname
FROM master_attendance
INNER JOIN master_shift ON master_attendance.ma_employeeid = ms_employeeid
INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
LEFT JOIN master_holiday ON ma_attendancedate = mh_date
INNER JOIN master_department ON master_employee.me_department = md_departmentid
INNER JOIN master_position ON master_employee.me_position = mp_positionid
WHERE me_id = '${employeeid}' AND 
 ma_attendancedate = '${attendancedate}'
LIMIT 1;
    `;

    Check(sql)
      .then((result) => {
        if (result.length === 0) {
          return res.json(JsonWarningResponse(MessageStatus.NOTEXIST));
        } else {
          Select(sql, (err, result) => {
            if (err) {
              console.error(err);
              res.json(JsonErrorResponse(err));
            }

            if (result != 0) {
              let data = DataModeling(result, "pao_");
              res.json(JsonDataResponse(data));
            } else {
              res.json(JsonDataResponse(result));
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getovertime", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `SELECT
        pao_id AS approvalid,
        CASE 
            WHEN mh_date IS NOT NULL THEN mh_type
            WHEN (
                JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Monday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Tuesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Wednesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Thursday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Friday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Saturday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Sunday'
            )
            THEN 'Rest Day'
            ELSE TIME_FORMAT(
                JSON_UNQUOTE(JSON_EXTRACT(
                    CASE DAYNAME(pao_attendancedate)
                        WHEN 'Monday' THEN ms_monday
                        WHEN 'Tuesday' THEN ms_tuesday
                        WHEN 'Wednesday' THEN ms_wednesday
                        WHEN 'Thursday' THEN ms_thursday
                        WHEN 'Friday' THEN ms_friday
                        WHEN 'Saturday' THEN ms_saturday
                        WHEN 'Sunday' THEN ms_sunday
                    END,
                    '$.time_in'
                )),
                '%h:%i %p'
            )
        END AS start_time,
        CASE 
            WHEN mh_date IS NOT NULL THEN mh_type
            WHEN (
                JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Monday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Tuesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Wednesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Thursday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Friday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Saturday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Sunday'
            )
            THEN 'Rest Day'
            ELSE TIME_FORMAT(
                JSON_UNQUOTE(JSON_EXTRACT(
                    CASE DAYNAME(pao_attendancedate)
                        WHEN 'Monday' THEN ms_monday
                        WHEN 'Tuesday' THEN ms_tuesday
                        WHEN 'Wednesday' THEN ms_wednesday
                        WHEN 'Thursday' THEN ms_thursday
                        WHEN 'Friday' THEN ms_friday
                        WHEN 'Saturday' THEN ms_saturday
                        WHEN 'Sunday' THEN ms_sunday
                    END,
                    '$.time_out'
                )),
                '%h:%i %p'
            )
        END AS end_time,
        JSON_UNQUOTE(JSON_EXTRACT(
            CASE DAYNAME(pao_attendancedate)
                WHEN 'Monday' THEN ms_monday
                WHEN 'Tuesday' THEN ms_tuesday
                WHEN 'Wednesday' THEN ms_wednesday
                WHEN 'Thursday' THEN ms_thursday
                WHEN 'Friday' THEN ms_friday
                WHEN 'Saturday' THEN ms_saturday
                WHEN 'Sunday' THEN ms_sunday
            END,
            '$.time_in'
        )) AS scheduledtimein,
        JSON_UNQUOTE(JSON_EXTRACT(
            CASE DAYNAME(pao_attendancedate)
                WHEN 'Monday' THEN ms_monday
                WHEN 'Tuesday' THEN ms_tuesday
                WHEN 'Wednesday' THEN ms_wednesday
                WHEN 'Thursday' THEN ms_thursday
                WHEN 'Friday' THEN ms_friday
                WHEN 'Saturday' THEN ms_saturday
                WHEN 'Sunday' THEN ms_sunday
            END,
            '$.time_out'
        )) AS scheduledtimeout,
        mp_positionname AS positionname,
        md_departmentname AS departmentname,
        pao_fullname AS fullname,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS attendancedate,
        DATE_FORMAT(pao_clockin, '%Y-%m-%d %H:%i') AS clockin,
        DATE_FORMAT(pao_clockout, '%Y-%m-%d %H:%i') AS clockout,
        pao_total_hours AS totalhours,
        pao_early_ot AS earlyot,
        pao_normal_ot AS normalot,
        pao_night_differentials AS nightdiff,
        DATE_FORMAT(pao_payroll_date, '%Y-%m-%d') AS payrolldate,
        pao_status AS status,
        pao_night_hours_pay as nightotpay,
        pao_normal_ot_pay as normalotpay,
        pao_early_ot_pay as earlyotpay,
        pao_total_ot_net_pay as totalotpay,
        pao_reason AS reason,
        pao_overtimeimage as overtimeimages,
            (
            SELECT ora_commnet 
            FROM overtime_request_activity 
            WHERE ora_overtimeid = pao_id
            ORDER BY ora_date DESC
            LIMIT 1
        ) AS comment
        FROM payroll_approval_ot
        INNER JOIN master_shift ON payroll_approval_ot.pao_employeeid = ms_employeeid
        INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
        LEFT JOIN master_holiday ON pao_attendancedate = mh_date
        INNER JOIN master_department ON master_employee.me_department = md_departmentid
        INNER JOIN master_position ON master_employee.me_position = mp_positionid
        WHERE pao_id = '${approveot_id}'
        LIMIT 1`;

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

// router.post("/addrequstot", verifyJWT, (req, res) => {
//   try {
//     let clockin = req.body.clockin;
//     let clockout = req.body.clockout;
//     let attendancedate = req.body.attendancedate;
//     let employeeid = req.body.employeeid;
//     let payrolldate = req.body.payrolldate;
//     let reason = req.body.reason;
//     let overtimestatus = req.body.overtimestatus;
//     let subgroup = req.body.subgroup;
//     let approvecount = 0;
//     let overtimeimage = req.body.overtimeimage;
//     let deviceaction = "App Manual";
//     let applieddate = GetCurrentDatetime();

//     let checkStatement = SelectStatement(
//       "SELECT * FROM payroll_approval_ot WHERE pao_employeeid=? AND pao_attendancedate=? AND pao_status=?",
//       [employeeid, attendancedate, overtimestatus]
//     );
//     Check(checkStatement)
//       .then((result) => {
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           let sql = `
//           INSERT INTO payroll_approval_ot (
//               pao_device_use,
//               pao_fullname,
//               pao_employeeid,
//               pao_attendancedate,
//               pao_clockin,
//               pao_clockout,
//               pao_total_hours,
//               pao_night_differentials,
//               pao_early_ot,
//               pao_normal_ot,
//               pao_minutes_ot,
//               pao_early_minutes_ot,
//               pao_night_minutes_ot,
//               pao_night_pay,
//               pao_total_night_min_ot,
//               pao_normal_pay,
//               pao_early_pay,
//               pao_total_min_ot,
//               pao_total_early_min_ot,
//               pao_night_hours_pay,
//               pao_night_minutes_pay,
//               pao_normal_ot_pay,
//               pao_normal_ot_minutes_pay,
//               pao_early_ot_pay,
//               pao_total_ot_net_pay,
//               pao_payroll_date,
//               pao_reason,
//               pao_status,
//               pao_subgroupid,
//               pao_approvalcount,
//               pao_overtimeimage,
//               pao_applied_date
//             )
//             SELECT
//                '${deviceaction}' AS pao_device_use,
//                 CONCAT(me.me_lastname, ' ', me.me_firstname) AS pao_fullname,
//                 me.me_id AS pao_employeeid,
//                 '${attendancedate}' AS pao_attendancedate,
//                 '${clockin}' AS pao_clockin,
//                 '${clockout}' AS pao_clockout,
//                 COALESCE(HOUR(TIMEDIFF('${clockout}', '${clockin}')), 0) AS pao_total_hours,
//                 LEAST(
//                     CASE
//                         WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))
//                             AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
//                         THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
//                         ELSE 0
//                     END,
//                     8
//                 ) AS pao_night_differentials,
//                COALESCE(CASE WHEN EXISTS (
// 						SELECT 1
// 						FROM change_shift
// 						WHERE cs_employeeid = '${employeeid}'
// 						AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 				THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 					 THEN CASE
// 							-- Clock-in before or on the scheduled time-in
// 							WHEN '${clockin}' <=
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 								-- Tuesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 								-- Wednesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 								-- Thursday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 								-- Friday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 								-- Saturday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 								-- Sunday
// 								ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 							END
// 							THEN COALESCE(HOUR(TIMEDIFF(
// 								CASE
// 									-- Handle each day for clock-in
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 									ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 								END, '${clockin}'))
// 							)
// 							ELSE 0
// 						  END
// 						END
// 					  ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}') THEN 0
// 				ELSE CASE
// 						-- Clock-in before or on the scheduled time-in
// 						WHEN '${clockin}' <=
// 						CASE
// 							-- Monday
// 							WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 							-- Tuesday
// 							WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 							-- Wednesday
// 							WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 							-- Thursday
// 							WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 							-- Friday
// 							WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 							-- Saturday
// 							WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 							-- Sunday
// 							ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 						END
// 						THEN COALESCE(HOUR(TIMEDIFF(
// 							CASE
// 								-- Handle each day for clock-in
// 								WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 								ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 							END, '${clockin}'))
// 						)
// 						ELSE 0
// 					END
// 				  END
// 				END,0) AS pao_early_ot,
//                 CASE WHEN EXISTS (
// 						SELECT 1
// 						FROM change_shift
// 						WHERE cs_employeeid = '${employeeid}'
// 						AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 				THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 					 THEN CASE
// 								-- Clock-out before or on 22:00 but after the scheduled time-out
// 								WHEN '${clockout}' <= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
// 									 AND '${clockout}' >=
// 									 CASE
// 										 -- Monday
// 										 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 										 -- Tuesday
// 										 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 										 -- Wednesday
// 										 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 										 -- Thursday
// 										 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 										 -- Friday
// 										 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 										 -- Saturday
// 										 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 										 -- Sunday
// 										 ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 									 END
// 								THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
// 									CASE
// 										-- Handle each day accordingly
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 										ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 									END))
// 								)
// 								-- Clock-out after 22:00
// 								WHEN '${clockout}' >= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
// 								THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 									CASE
// 										-- Handle each day accordingly
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 										ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 									END))
// 								)
// 								ELSE 0
// 							END
// 					   ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}')
// 							THEN 0
// 							ELSE 0
// 							END
// 					 END
// 				ELSE
// 						CASE
// 							-- Clock-out before or on 22:00 but after the scheduled time-out
// 							WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
// 								 AND '${clockout}' >=
// 								 CASE
// 									 -- Monday
// 									 WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 									 -- Tuesday
// 									 WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 									 -- Wednesday
// 									 WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 									 -- Thursday
// 									 WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 									 -- Friday
// 									 WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 									 -- Saturday
// 									 WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 									 -- Sunday
// 									 ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 								 END
// 							THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
// 								CASE
// 									-- Handle each day accordingly
// 									WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 									ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 								END))
// 							)
// 							-- Clock-out after 22:00
// 							WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
// 							THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 								CASE
// 									-- Handle each day accordingly
// 									WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 									WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 									ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 								END))
// 							)
// 							ELSE 0
// 						END
// 					END AS pao_normal_ot,
// 				CASE WHEN EXISTS (
// 							SELECT 1
// 							FROM change_shift
// 							WHERE cs_employeeid = '${employeeid}'
// 							AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 					THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 						 THEN COALESCE(
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN
// 									CASE
// 										-- Clock-out beyond 22:00:00
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 												60 -- ensures only excess minutes up to 22:00:00
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Tuesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Wednesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Thursday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Friday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Saturday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Sunday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 1 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 									END
// 								ELSE 0
// 							END, 0
// 						)
// 						 ELSE 0
// 						 END
// 					ELSE COALESCE(
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
// 									CASE
// 										-- Clock-out beyond 22:00:00
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 												60 -- ensures only excess minutes up to 22:00:00
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Tuesday
// 								WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Wednesday
// 								WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Thursday
// 								WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Friday
// 								WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Saturday
// 								WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Sunday
// 								WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 									END
// 								ELSE 0
// 							END, 0
// 						)
// 					END AS pao_minutes_ot,
// 				CASE WHEN EXISTS (
// 							SELECT 1
// 							FROM change_shift
// 							WHERE cs_employeeid = '${employeeid}'
// 							AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 					THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 						 THEN CASE
// 								-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 								WHEN '${clockin}' <=
// 								CASE
// 									-- Monday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 									-- Tuesday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 									-- Wednesday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 									-- Thursday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 									-- Friday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 									-- Saturday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 									-- Sunday
// 									ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 								END
// 								THEN
// 									-- Calculate time difference and extract only the minutes part
// 									MINUTE(TIMEDIFF(
// 										CASE
// 											-- Handle each day for scheduled time-in
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 											ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 										END,
// 										'${clockin}'
// 									))
// 								ELSE 0
// 							END
// 						 ELSE 0
// 						 END
// 					ELSE CASE
// 							-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 							WHEN '${clockin}' <=
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 								-- Tuesday
// 								WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 								-- Wednesday
// 								WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 								-- Thursday
// 								WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 								-- Friday
// 								WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 								-- Saturday
// 								WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 								-- Sunday
// 								ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 							END
// 							THEN
// 								-- Calculate time difference and extract only the minutes part
// 								MINUTE(TIMEDIFF(
// 									CASE
// 										-- Handle each day for scheduled time-in
// 										WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 										ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 									END,
// 									'${clockin}'
// 								))
// 							ELSE 0
// 						END
// 					END
// 					AS pao_early_minutes_ot,
// 				  COALESCE(
// 					CASE
// 						WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
// 						THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
// 						ELSE 0
// 					END, 0
// 				) AS pao_night_minutes_ot,
//                 ROUND(COALESCE(
// 				CASE
// 					WHEN s.ms_payrolltype = 'Daily'
// 					THEN s.ms_monthly / 8 * 1.25 * 1.10
// 					ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10
// 				END, 0), 2) * LEAST(
// 				CASE
// 					WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))
// 						AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
// 					THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))), 0)
// 					ELSE 0
// 				END,
// 				8
// 			) + (ROUND(COALESCE(
// 				CASE
// 					WHEN s.ms_payrolltype = 'Daily'
// 					THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
// 					ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
// 				END, 0), 2) * COALESCE(
// 				CASE
// 					WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
// 					THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
// 					ELSE 0
// 				END, 0)
// 			) AS pao_night_pay,
// 				ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                         ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//                     END, 0), 2) * COALESCE(
// 					CASE
// 						WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
// 						THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
// 						ELSE 0
// 					END, 0
// 				)AS pao_total_night_min_ot,
//                 ROUND(COALESCE(
// 							CASE
// 								WHEN s.ms_payrolltype = 'Daily'
// 								THEN s.ms_monthly / 8 * 1.25
// 								ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
// 							END, 0), 2) * (CASE WHEN EXISTS (
// 								SELECT 1
// 								FROM change_shift
// 								WHERE cs_employeeid = '${employeeid}'
// 								AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 						THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 							 THEN CASE
// 										-- Clock-out before or on 22:00 but after the scheduled time-out
// 										WHEN '${clockout}' <= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
// 											 AND '${clockout}' >=
// 											 CASE
// 												 -- Monday
// 												 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 												 -- Tuesday
// 												 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 												 -- Wednesday
// 												 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 												 -- Thursday
// 												 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 												 -- Friday
// 												 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 												 -- Saturday
// 												 WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 												 -- Sunday
// 												 ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 											 END
// 										THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
// 											CASE
// 												-- Handle each day accordingly
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 												ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 											END))
// 										)
// 										-- Clock-out after 22:00
// 										WHEN '${clockout}' >= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
// 										THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 											CASE
// 												-- Handle each day accordingly
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 												ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 											END))
// 										)
// 										ELSE 0
// 									END
// 							   ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}')
// 									THEN 0
// 									ELSE 0
// 									END
// 							 END
// 						ELSE
// 								CASE
// 									-- Clock-out before or on 22:00 but after the scheduled time-out
// 									WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
// 										 AND '${clockout}' >=
// 										 CASE
// 											 -- Monday
// 											 WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 											 -- Tuesday
// 											 WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 											 -- Wednesday
// 											 WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 											 -- Thursday
// 											 WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 											 -- Friday
// 											 WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 											 -- Saturday
// 											 WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 											 -- Sunday
// 											 ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 										 END
// 									THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
// 										CASE
// 											-- Handle each day accordingly
// 											WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 											ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 										END))
// 									)
// 									-- Clock-out after 22:00
// 									WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
// 									THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CASE
// 											-- Handle each day accordingly
// 											WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 											ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 										END))
// 									)
// 									ELSE 0
// 								END
// 							END) + (ROUND(COALESCE(
// 							CASE
// 								WHEN s.ms_payrolltype = 'Daily'
// 								THEN s.ms_monthly / 8 * 1.25 / 60
// 								ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
// 							END, 0), 2) * (CASE WHEN EXISTS (
// 								SELECT 1
// 								FROM change_shift
// 								WHERE cs_employeeid = '${employeeid}'
// 								AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 						THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 							 THEN COALESCE(
// 								CASE
// 									-- Monday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN
// 										CASE
// 											-- Clock-out beyond 22:00:00
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 													60 -- ensures only excess minutes up to 22:00:00
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Tuesday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Wednesday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Thursday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Friday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Saturday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Sunday
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 1 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 										END
// 									ELSE 0
// 								END, 0
// 							)
// 							 ELSE 0
// 							 END
// 						ELSE COALESCE(
// 								CASE
// 									-- Monday
// 									WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
// 										CASE
// 											-- Clock-out beyond 22:00:00
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 													60 -- ensures only excess minutes up to 22:00:00
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Tuesday
// 									WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Wednesday
// 									WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Thursday
// 									WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Friday
// 									WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Saturday
// 									WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 										END
// 									-- Sunday
// 									WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
// 										CASE
// 											WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 												LEAST(
// 													MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 													CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 													60
// 												)
// 											ELSE
// 												MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 										END
// 									ELSE 0
// 								END, 0
// 							)
// 						END))AS pao_normal_pay,
// 						ROUND(COALESCE(
// 							CASE
// 								WHEN s.ms_payrolltype = 'Daily'
// 								THEN s.ms_monthly / 8 * 1.25
// 								ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
// 							END, 0), 2) * (COALESCE(CASE WHEN EXISTS (
// 								SELECT 1
// 								FROM change_shift
// 								WHERE cs_employeeid = '${employeeid}'
// 								AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 						THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 							 THEN CASE
// 									-- Clock-in before or on the scheduled time-in
// 									WHEN '${clockin}' <=
// 									CASE
// 										-- Monday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 										-- Tuesday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 										-- Wednesday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 										-- Thursday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 										-- Friday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 										-- Saturday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 										-- Sunday
// 										ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 									END
// 									THEN COALESCE(HOUR(TIMEDIFF(
// 										CASE
// 											-- Handle each day for clock-in
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 											ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 										END, '${clockin}'))
// 									)
// 									ELSE 0
// 								  END
// 								END
// 							  ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}') THEN 0
// 						ELSE CASE
// 								-- Clock-in before or on the scheduled time-in
// 								WHEN '${clockin}' <=
// 								CASE
// 									-- Monday
// 									WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 									-- Tuesday
// 									WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 									-- Wednesday
// 									WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 									-- Thursday
// 									WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 									-- Friday
// 									WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 									-- Saturday
// 									WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 									-- Sunday
// 									ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 								END
// 								THEN COALESCE(HOUR(TIMEDIFF(
// 									CASE
// 										-- Handle each day for clock-in
// 										WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 										WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 										ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 									END, '${clockin}'))
// 								)
// 								ELSE 0
// 							END
// 						  END
// 						END,0)) + (ROUND(COALESCE(
// 							CASE
// 								WHEN s.ms_payrolltype = 'Daily'
// 								THEN s.ms_monthly / 8 * 1.25 / 60
// 								ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
// 							END, 0), 2) * (CASE WHEN EXISTS (
// 								SELECT 1
// 								FROM change_shift
// 								WHERE cs_employeeid = '${employeeid}'
// 								AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 						THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 							 THEN CASE
// 									-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 									WHEN '${clockin}' <=
// 									CASE
// 										-- Monday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 										-- Tuesday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 										-- Wednesday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 										-- Thursday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 										-- Friday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 										-- Saturday
// 										WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 										-- Sunday
// 										ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 									END
// 									THEN
// 										-- Calculate time difference and extract only the minutes part
// 										MINUTE(TIMEDIFF(
// 											CASE
// 												-- Handle each day for scheduled time-in
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 												ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 											END,
// 											'${clockin}'
// 										))
// 									ELSE 0
// 								END
// 							 ELSE 0
// 							 END
// 						ELSE CASE
// 								-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 								WHEN '${clockin}' <=
// 								CASE
// 									-- Monday
// 									WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 									-- Tuesday
// 									WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 									-- Wednesday
// 									WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 									-- Thursday
// 									WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 									-- Friday
// 									WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 									-- Saturday
// 									WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 									-- Sunday
// 									ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 								END
// 								THEN
// 									-- Calculate time difference and extract only the minutes part
// 									MINUTE(TIMEDIFF(
// 										CASE
// 											-- Handle each day for scheduled time-in
// 											WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 											WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 											ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 										END,
// 										'${clockin}'
// 									))
// 								ELSE 0
// 							END
// 						END))AS pao_early_pay,
//                  ROUND(COALESCE(
// 						CASE
// 							WHEN s.ms_payrolltype = 'Daily'
// 							THEN s.ms_monthly / 8 * 1.25 / 60
// 							ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
// 						END, 0), 2) * (CASE WHEN EXISTS (
// 							SELECT 1
// 							FROM change_shift
// 							WHERE cs_employeeid = '${employeeid}'
// 							AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 					THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 						 THEN COALESCE(
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN
// 									CASE
// 										-- Clock-out beyond 22:00:00
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 												60 -- ensures only excess minutes up to 22:00:00
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Tuesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Wednesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Thursday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Friday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Saturday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Sunday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 1 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 									END
// 								ELSE 0
// 							END, 0
// 						)
// 						 ELSE 0
// 						 END
// 					ELSE COALESCE(
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
// 									CASE
// 										-- Clock-out beyond 22:00:00
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 												60 -- ensures only excess minutes up to 22:00:00
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Tuesday
// 								WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Wednesday
// 								WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Thursday
// 								WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Friday
// 								WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Saturday
// 								WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 									END
// 								-- Sunday
// 								WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
// 									CASE
// 										WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 											LEAST(
// 												MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 												CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 												60
// 											)
// 										ELSE
// 											MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 									END
// 								ELSE 0
// 							END, 0
// 						)
// 					END)
// 					 AS pao_total_min_ot,
//                      ROUND(COALESCE(
// 								CASE
// 									WHEN s.ms_payrolltype = 'Daily'
// 									THEN s.ms_monthly / 8 * 1.25 / 60
// 									ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
// 								END, 0), 2) * (CASE WHEN EXISTS (
// 									SELECT 1
// 									FROM change_shift
// 									WHERE cs_employeeid = '${employeeid}'
// 									AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 							THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 								 THEN CASE
// 										-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 										WHEN '${clockin}' <=
// 										CASE
// 											-- Monday
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 											-- Tuesday
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 											-- Wednesday
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 											-- Thursday
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 											-- Friday
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 											-- Saturday
// 											WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 											-- Sunday
// 											ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 										END
// 										THEN
// 											-- Calculate time difference and extract only the minutes part
// 											MINUTE(TIMEDIFF(
// 												CASE
// 													-- Handle each day for scheduled time-in
// 													WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 													WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 													WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 													WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 													WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 													WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 													ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 												END,
// 												'${clockin}'
// 											))
// 										ELSE 0
// 									END
// 								 ELSE 0
// 								 END
// 							ELSE CASE
// 									-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 									WHEN '${clockin}' <=
// 									CASE
// 										-- Monday
// 										WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 										-- Tuesday
// 										WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 										-- Wednesday
// 										WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 										-- Thursday
// 										WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 										-- Friday
// 										WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 										-- Saturday
// 										WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 										-- Sunday
// 										ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 									END
// 									THEN
// 										-- Calculate time difference and extract only the minutes part
// 										MINUTE(TIMEDIFF(
// 											CASE
// 												-- Handle each day for scheduled time-in
// 												WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 												WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 												ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 											END,
// 											'${clockin}'
// 										))
// 									ELSE 0
// 								END
// 							END)
// 							AS pao_total_early_min_ot,
//                 ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 * 1.10
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10
//                     END, 0), 2) AS pao_night_hours_pay,
// 				ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                         ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//                     END, 0), 2) AS pao_night_minutes_pay,
//                 ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                     END, 0), 2) AS pao_normal_ot_pay,
//                      ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 / 60
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                     END, 0), 2) AS pao_normal_ot_minutes_pay,
//                 ROUND(
// 					COALESCE(
// 						CASE
// 							WHEN s.ms_payrolltype = 'Daily'
// 							THEN s.ms_monthly / 8 * 1.25
// 							ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
// 						END, 0
// 					) * (COALESCE(CASE WHEN EXISTS (
// 						SELECT 1
// 						FROM change_shift
// 						WHERE cs_employeeid = '${employeeid}'
// 						AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
// 				THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
// 					 THEN CASE
// 							-- Clock-in before or on the scheduled time-in
// 							WHEN '${clockin}' <=
// 							CASE
// 								-- Monday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 								-- Tuesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 								-- Wednesday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 								-- Thursday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 								-- Friday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 								-- Saturday
// 								WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 								-- Sunday
// 								ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 							END
// 							THEN COALESCE(HOUR(TIMEDIFF(
// 								CASE
// 									-- Handle each day for clock-in
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 									WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 									ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 								END, '${clockin}'))
// 							)
// 							ELSE 0
// 						  END
// 						END
// 					  ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}') THEN 0
// 				ELSE CASE
// 						-- Clock-in before or on the scheduled time-in
// 						WHEN '${clockin}' <=
// 						CASE
// 							-- Monday
// 							WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 							-- Tuesday
// 							WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 							-- Wednesday
// 							WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 							-- Thursday
// 							WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 							-- Friday
// 							WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 							-- Saturday
// 							WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 							-- Sunday
// 							ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 						END
// 						THEN COALESCE(HOUR(TIMEDIFF(
// 							CASE
// 								-- Handle each day for clock-in
// 								WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 								ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 							END, '${clockin}'))
// 						)
// 						ELSE 0
// 					END
// 				  END
// 				END,0))
// 				) AS pao_early_ot_pay,
//                 -- Night Diff
//                 ((ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 * 1.10
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10
//                     END, 0), 2) * LEAST(
//                     CASE
//                         WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))
//                             AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
//                         THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
//                         ELSE 0
//                     END,
//                     8
//                 )) + (ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                         ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//                     END, 0), 2) * COALESCE(
// 					CASE
// 						WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
// 						THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
// 						ELSE 0
// 					END, 0
// 				)) +
//                 -- Normal OT
//                 (ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                     END, 0), 2) * (CASE
// 					-- Clock-out before or on 22:00 but after the scheduled time-out
// 					WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
// 						 AND '${clockout}' >=
// 						 CASE
// 							 -- Monday
// 							 WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 							 -- Tuesday
// 							 WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 							 -- Wednesday
// 							 WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 							 -- Thursday
// 							 WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 							 -- Friday
// 							 WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 							 -- Saturday
// 							 WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 							 -- Sunday
// 							 ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 						 END
// 					THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
// 						CASE
// 							-- Handle each day accordingly
// 							WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 							ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 						END))
// 					)
// 					-- Clock-out after 22:00
// 					WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
// 					THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 						CASE
// 							-- Handle each day accordingly
// 							WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
// 							ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
// 						END))
// 					)
// 					ELSE 0
// 				END
// 				)) + (ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 / 60
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                     END, 0), 2) * (COALESCE(
// 					CASE
// 						-- Monday
// 						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
// 							CASE
// 								-- Clock-out beyond 22:00:00
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
// 										60 -- ensures only excess minutes up to 22:00:00
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
// 							END
// 						-- Tuesday
// 						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
// 							CASE
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
// 										60
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
// 							END
// 						-- Wednesday
// 						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
// 							CASE
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
// 										60
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
// 							END
// 						-- Thursday
// 						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
// 							CASE
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
// 										60
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
// 							END
// 						-- Friday
// 						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
// 							CASE
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
// 										60
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
// 							END
// 						-- Saturday
// 						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
// 							CASE
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
// 										60
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
// 							END
// 						-- Sunday
// 						WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
// 							CASE
// 								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
// 									LEAST(
// 										MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
// 										CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
// 										60
// 									)
// 								ELSE
// 									MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
// 							END
// 						ELSE 0
// 					END, 0
// 				-- Early ot
// 				))) + (ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                     END, 0), 2) * (CASE
// 					-- Clock-in before or on the scheduled time-in
// 					WHEN '${clockin}' <=
// 					CASE
// 						-- Monday
// 						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 						-- Tuesday
// 						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 						-- Wednesday
// 						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 						-- Thursday
// 						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 						-- Friday
// 						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 						-- Saturday
// 						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 						-- Sunday
// 						ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 					END
// 					THEN COALESCE(HOUR(TIMEDIFF(
// 						CASE
// 							-- Handle each day for clock-in
// 							WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 							WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 							ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 						END, '${clockin}'))
// 					)
// 					ELSE 0
// 				END) + (ROUND(COALESCE(
//                     CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25 / 60
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                     END, 0), 2) * (CASE
// 					-- Check if the clock-in is earlier than or equal to the scheduled time-in
// 					WHEN '${clockin}' <=
// 					CASE
// 						-- Monday
// 						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 						-- Tuesday
// 						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 						-- Wednesday
// 						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 						-- Thursday
// 						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 						-- Friday
// 						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 						-- Saturday
// 						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 						-- Sunday
// 						ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 					END
// 					THEN
// 						-- Calculate time difference and extract only the minutes part
// 						MINUTE(TIMEDIFF(
// 							CASE
// 								-- Handle each day for scheduled time-in
// 								WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
// 								WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
// 								ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
// 							END,
// 							'${clockin}'
// 						))
// 					ELSE 0
// 				END)))) AS pao_total_ot_net_pay,
// 				'${payrolldate}' AS pao_payroll_date,
// 				'${reason}' AS pao_reason,
//                 '${overtimestatus}' AS pao_status,
// 				'${subgroup}' AS pao_subgroupid,
// 				'${approvecount}' AS pao_approvalcount,
//                 '${overtimeimage}' AS pao_overtimeimage,
// 				'${applieddate}' AS pao_applied_date
//             FROM master_salary s
//             INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//             INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//             INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//             WHERE me_id = '${employeeid}'
//             LIMIT 1`;
//           Select(sql, (err, insertresult) => {
//             if (err) {
//               console.error(err);
//               res.json(JsonErrorResponse(err));
//             } else {
//               res.json(JsonDataResponse(insertresult));
//             }
//           });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/addrequstot", verifyJWT, (req, res) => {
  try {
    let clockin = req.body.clockin;
    let clockout = req.body.clockout;
    let attendancedate = req.body.attendancedate;
    let employeeid = req.body.employeeid;
    let payrolldate = req.body.payrolldate;
    let reason = req.body.reason;
    let overtimestatus = req.body.overtimestatus;
    let subgroup = req.body.subgroup;
    let approvecount = 0;
    let overtimeimage = req.body.overtimeimage;
    let deviceaction = "App Manual";
    let applieddate = GetCurrentDatetime();

    let sql = `call hrmis.RequestOvertime(
    '${clockin}',
    '${clockout}',
    '${attendancedate}',
    '${employeeid}',
    '${payrolldate}',
    '${overtimestatus}',
    '${subgroup}',
    '${overtimeimage}',
    '${deviceaction}',
    '${applieddate}',
    '${reason}',
    '${approvecount}')`;

    let validationQuery1 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Pending'`,
      [attendancedate, employeeid]
    );

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery1)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.PENDINGOT)
          );
        }
        return Check(validationQuery2);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPLIEDOT)
          );
        }
        return Check(validationQuery3);
      })
      .then((result3) => {
        if (result3.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPROVEDOT)
          );
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            console.log(insertResult);
            return res.json(JsonSuccess());
          }
        });
      })
      .catch((error) => {
        console.log(error);
        return res.json(error);
      });
  } catch (error) {
    console.log(error);
    return res.json(JsonErrorResponse(error));
  }
});

router.post("/update", verifyJWT, (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let clockin = req.body.clockin;
    let clockout = req.body.clockout;
    let attendancedate = req.body.attendancedate;
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let overtimestatus = req.body.overtimestatus;
    let reason = req.body.reason;
    let subgroup = req.body.subgroup;
    let overtimeimage = req.body.overtimeimage;
    let deviceaction = "App Automated";
    let applieddate = GetCurrentDatetime();
    let approvecount = 0;

    let sql = `call hrmis.UpdateRequestOvertime(
      '${clockin}',
      '${clockout}',
      '${attendancedate}',
      '${employeeid}',
      '${payrolldate}',
      '${overtimestatus}',
      '${subgroup}',
      '${overtimeimage}',
      '${deviceaction}',
      '${applieddate}',
      '${reason}',
      ${approvecount},
      '${approveot_id}')`;

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery2)
      .then((result1) => {
        if (result1.length > 0) {
          return res
            .status(409)
            .json(
              JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPLIEDOT)
            );
        }
        return Check(validationQuery3);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return res
            .status(409)
            .json(
              JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPROVEDOT)
            );
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            console.log(insertResult);
            return res.json(JsonSuccess());
          }
        });
      })
      .catch((error) => {
        console.log(error);
        return res.json(error);
      });
  } catch (error) {
    console.log(error);
    return res.json(JsonErrorResponse(error));
  }
});

// router.post("/update", verifyJWT, (req, res) => {
//   try {
//     let approveot_id = req.body.approveot_id;
//     let clockin = req.body.clockin;
//     let clockout = req.body.clockout;
//     let attendancedate = req.body.attendancedate;
//     let payrolldate = req.body.payrolldate;
//     let employeeid = req.body.employeeid;
//     let overtimestatus = req.body.overtimestatus;
//     let reason = req.body.reason;
//     let subgroup = req.body.subgroup;
//     let overtimeimage = req.body.overtimeimage;
//     let deviceaction = "App Automated";
//     let applieddate = GetCurrentDatetime();

//     let checkStatement = SelectStatement(
//       "SELECT * FROM payroll_approval_ot WHERE pao_employeeid=? AND pao_attendancedate=? AND pao_status=?",
//       [employeeid, attendancedate, overtimestatus]
//     );

//     Check(checkStatement)
//       .then((result) => {
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           let sql = `UPDATE payroll_approval_ot SET
//           pao_device_use = '${deviceaction}',
//           pao_fullname = CONCAT(
//             (
//               SELECT me.me_lastname
//               FROM master_employee me
//               WHERE me.me_id = '${employeeid}'
//               LIMIT 1
//             ),
//             ' ',
//             (
//               SELECT me.me_firstname
//               FROM master_employee me
//               WHERE me.me_id = '${employeeid}'
//               LIMIT 1
//             )
//           ),
//           pao_employeeid = '${employeeid}',
//           pao_attendancedate = '${attendancedate}',
//           pao_clockin = '${clockin}',
//           pao_clockout = '${clockout}',
//           pao_total_hours = COALESCE(HOUR(TIMEDIFF('${clockout}', '${clockin}')), 0),
//           pao_night_differentials = LEAST(
//             CASE
//               WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))
//                 AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <= CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
//               THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
//               ELSE 0
//             END,
//             8
//           ),
//           pao_early_ot =  ( SELECT COALESCE(CASE WHEN EXISTS (
//                     SELECT 1
//                     FROM change_shift
//                     WHERE cs_employeeid = '${employeeid}'
//                     AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                 THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                   THEN CASE
//                       -- Clock-in before or on the scheduled time-in
//                       WHEN '${clockin}' <=
//                       CASE
//                         -- Monday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         -- Tuesday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         -- Wednesday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         -- Thursday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         -- Friday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         -- Saturday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         -- Sunday
//                         ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END
//                       THEN COALESCE(HOUR(TIMEDIFF(
//                         CASE
//                           -- Handle each day for clock-in
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END, '${clockin}'))
//                       )
//                       ELSE 0
//                     END
//                     END
//                   ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}') THEN 0
//                 ELSE CASE
//                     -- Clock-in before or on the scheduled time-in
//                     WHEN '${clockin}' <=
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                       -- Tuesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                       -- Wednesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                       -- Thursday
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                       -- Friday
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                       -- Saturday
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                       -- Sunday
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                     END
//                     THEN COALESCE(HOUR(TIMEDIFF(
//                       CASE
//                         -- Handle each day for clock-in
//                         WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END, '${clockin}'))
//                     )
//                     ELSE 0
//                   END
//                 END
//                 END,0) FROM master_salary s
//                 INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//                 INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//                 INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//                 WHERE me_id = '${employeeid}'
//                 LIMIT 1),
//           pao_normal_ot =  (SELECT CASE WHEN EXISTS (
//                       SELECT 1
//                       FROM change_shift
//                       WHERE cs_employeeid = '${employeeid}'
//                       AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                   THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                     THEN CASE
//                           -- Clock-out before or on 22:00 but after the scheduled time-out
//                           WHEN '${clockout}' <= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
//                             AND '${clockout}' >=
//                             CASE
//                               -- Monday
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                               -- Tuesday
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                               -- Wednesday
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                               -- Thursday
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                               -- Friday
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                               -- Saturday
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                               -- Sunday
//                               ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                             END
//                           THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
//                             CASE
//                               -- Handle each day accordingly
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                               ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                             END))
//                           )
//                           -- Clock-out after 22:00
//                           WHEN '${clockout}' >= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
//                           THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CASE
//                               -- Handle each day accordingly
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                               ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                             END))
//                           )
//                           ELSE 0
//                         END
//                       ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}')
//                         THEN 0
//                         ELSE 0
//                         END
//                     END
//                   ELSE
//                       CASE
//                         -- Clock-out before or on 22:00 but after the scheduled time-out
//                         WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
//                           AND '${clockout}' >=
//                           CASE
//                             -- Monday
//                             WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                             -- Tuesday
//                             WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                             -- Wednesday
//                             WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                             -- Thursday
//                             WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                             -- Friday
//                             WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                             -- Saturday
//                             WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                             -- Sunday
//                             ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                           END
//                         THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
//                           CASE
//                             -- Handle each day accordingly
//                             WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                             ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                           END))
//                         )
//                         -- Clock-out after 22:00
//                         WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
//                         THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                           CASE
//                             -- Handle each day accordingly
//                             WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                             ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                           END))
//                         )
//                         ELSE 0
//                       END
//                     END FROM master_salary s
//                     INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//                     INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//                     INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//                     WHERE me_id = '${employeeid}'
//                     LIMIT 1),
//           pao_minutes_ot =  (SELECT CASE WHEN EXISTS (
//                   SELECT 1
//                   FROM change_shift
//                   WHERE cs_employeeid = '${employeeid}'
//                   AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//               THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                 THEN COALESCE(
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN
//                       CASE
//                         -- Clock-out beyond 22:00:00
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                             60 -- ensures only excess minutes up to 22:00:00
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Tuesday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Wednesday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Thursday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Friday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Saturday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Sunday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 1 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                       END
//                     ELSE 0
//                   END, 0
//                 )
//                 ELSE 0
//                 END
//               ELSE COALESCE(
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
//                       CASE
//                         -- Clock-out beyond 22:00:00
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                             60 -- ensures only excess minutes up to 22:00:00
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Tuesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Wednesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Thursday
//                     WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Friday
//                     WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Saturday
//                     WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Sunday
//                     WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                       END
//                     ELSE 0
//                   END, 0
//                 )
//               END FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_early_minutes_ot =  (SELECT CASE WHEN EXISTS (
//                   SELECT 1
//                   FROM change_shift
//                   WHERE cs_employeeid = '${employeeid}'
//                   AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//               THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                 THEN CASE
//                     -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                     WHEN '${clockin}' <=
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                       -- Tuesday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                       -- Wednesday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                       -- Thursday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                       -- Friday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                       -- Saturday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                       -- Sunday
//                       ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                     END
//                     THEN
//                       -- Calculate time difference and extract only the minutes part
//                       MINUTE(TIMEDIFF(
//                         CASE
//                           -- Handle each day for scheduled time-in
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END,
//                         '${clockin}'
//                       ))
//                     ELSE 0
//                   END
//                 ELSE 0
//                 END
//               ELSE CASE
//                   -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                   WHEN '${clockin}' <=
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                     -- Tuesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                     -- Wednesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                     -- Thursday
//                     WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                     -- Friday
//                     WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                     -- Saturday
//                     WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                     -- Sunday
//                     ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                   END
//                   THEN
//                     -- Calculate time difference and extract only the minutes part
//                     MINUTE(TIMEDIFF(
//                       CASE
//                         -- Handle each day for scheduled time-in
//                         WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END,
//                       '${clockin}'
//                     ))
//                   ELSE 0
//                 END
//               END FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_night_minutes_ot =  (SELECT COALESCE(
//                 CASE
//                   WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
//                   THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
//                   ELSE 0
//                 END, 0
//               ) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_night_pay = (SELECT ROUND(COALESCE(
//               CASE
//                 WHEN s.ms_payrolltype = 'Daily'
//                 THEN s.ms_monthly / 8 * 1.25 * 1.10
//                 ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10
//               END, 0), 2) * LEAST(
//               CASE
//                 WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))
//                   AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
//                 THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))), 0)
//                 ELSE 0
//               END,
//               8
//             ) + (ROUND(COALESCE(
//               CASE
//                 WHEN s.ms_payrolltype = 'Daily'
//                 THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                 ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//               END, 0), 2) * COALESCE(
//               CASE
//                 WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
//                 THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
//                 ELSE 0
//               END, 0)
//             ) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_total_night_min_ot =  (SELECT ROUND(COALESCE(
//                 CASE
//                   WHEN s.ms_payrolltype = 'Daily'
//                   THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                   ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//                 END, 0), 2) * COALESCE(
//                 CASE
//                   WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
//                   THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
//                   ELSE 0
//                 END, 0
//               )
//               END FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_normal_pay = (SELECT ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                   END, 0), 2) * (CASE WHEN EXISTS (
//                     SELECT 1
//                     FROM change_shift
//                     WHERE cs_employeeid = '${employeeid}'
//                     AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                 THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                   THEN CASE
//                         -- Clock-out before or on 22:00 but after the scheduled time-out
//                         WHEN '${clockout}' <= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
//                           AND '${clockout}' >=
//                           CASE
//                             -- Monday
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                             -- Tuesday
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                             -- Wednesday
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                             -- Thursday
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                             -- Friday
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                             -- Saturday
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                             -- Sunday
//                             ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                           END
//                         THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
//                           CASE
//                             -- Handle each day accordingly
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                             ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                           END))
//                         )
//                         -- Clock-out after 22:00
//                         WHEN '${clockout}' >= CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME)
//                         THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                           CASE
//                             -- Handle each day accordingly
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                             ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                           END))
//                         )
//                         ELSE 0
//                       END
//                     ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}')
//                       THEN 0
//                       ELSE 0
//                       END
//                   END
//                 ELSE
//                     CASE
//                       -- Clock-out before or on 22:00 but after the scheduled time-out
//                       WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
//                         AND '${clockout}' >=
//                         CASE
//                           -- Monday
//                           WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                           -- Tuesday
//                           WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                           -- Wednesday
//                           WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                           -- Thursday
//                           WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                           -- Friday
//                           WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                           -- Saturday
//                           WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                           -- Sunday
//                           ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                         END
//                       THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
//                         CASE
//                           -- Handle each day accordingly
//                           WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                           ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                         END))
//                       )
//                       -- Clock-out after 22:00
//                       WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
//                       THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                         CASE
//                           -- Handle each day accordingly
//                           WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                           ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                         END))
//                       )
//                       ELSE 0
//                     END
//                   END) + (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25 / 60
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                   END, 0), 2) * (CASE WHEN EXISTS (
//                     SELECT 1
//                     FROM change_shift
//                     WHERE cs_employeeid = '${employeeid}'
//                     AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                 THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                   THEN COALESCE(
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN
//                         CASE
//                           -- Clock-out beyond 22:00:00
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                               60 -- ensures only excess minutes up to 22:00:00
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Tuesday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Wednesday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Thursday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Friday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Saturday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Sunday
//                       WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 1 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                         END
//                       ELSE 0
//                     END, 0
//                   )
//                   ELSE 0
//                   END
//                 ELSE COALESCE(
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
//                         CASE
//                           -- Clock-out beyond 22:00:00
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                               60 -- ensures only excess minutes up to 22:00:00
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Tuesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Wednesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Thursday
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Friday
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Saturday
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                         END
//                       -- Sunday
//                       WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
//                         CASE
//                           WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                             LEAST(
//                               MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                               CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                               60
//                             )
//                           ELSE
//                             MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                         END
//                       ELSE 0
//                     END, 0
//                   )
//                 END)) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//         pao_early_pay = (SELECT ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                   END, 0), 2) * (COALESCE(CASE WHEN EXISTS (
//                     SELECT 1
//                     FROM change_shift
//                     WHERE cs_employeeid = '${employeeid}'
//                     AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                 THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                   THEN CASE
//                       -- Clock-in before or on the scheduled time-in
//                       WHEN '${clockin}' <=
//                       CASE
//                         -- Monday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         -- Tuesday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         -- Wednesday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         -- Thursday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         -- Friday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         -- Saturday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         -- Sunday
//                         ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END
//                       THEN COALESCE(HOUR(TIMEDIFF(
//                         CASE
//                           -- Handle each day for clock-in
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END, '${clockin}'))
//                       )
//                       ELSE 0
//                     END
//                     END
//                   ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}') THEN 0
//                 ELSE CASE
//                     -- Clock-in before or on the scheduled time-in
//                     WHEN '${clockin}' <=
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                       -- Tuesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                       -- Wednesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                       -- Thursday
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                       -- Friday
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                       -- Saturday
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                       -- Sunday
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                     END
//                     THEN COALESCE(HOUR(TIMEDIFF(
//                       CASE
//                         -- Handle each day for clock-in
//                         WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END, '${clockin}'))
//                     )
//                     ELSE 0
//                   END
//                 END
//                 END,0)) + (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25 / 60
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                   END, 0), 2) * (CASE WHEN EXISTS (
//                     SELECT 1
//                     FROM change_shift
//                     WHERE cs_employeeid = '${employeeid}'
//                     AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                 THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                   THEN CASE
//                       -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                       WHEN '${clockin}' <=
//                       CASE
//                         -- Monday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         -- Tuesday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         -- Wednesday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         -- Thursday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         -- Friday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         -- Saturday
//                         WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         -- Sunday
//                         ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END
//                       THEN
//                         -- Calculate time difference and extract only the minutes part
//                         MINUTE(TIMEDIFF(
//                           CASE
//                             -- Handle each day for scheduled time-in
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                             ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                           END,
//                           '${clockin}'
//                         ))
//                       ELSE 0
//                     END
//                   ELSE 0
//                   END
//                 ELSE CASE
//                     -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                     WHEN '${clockin}' <=
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                       -- Tuesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                       -- Wednesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                       -- Thursday
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                       -- Friday
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                       -- Saturday
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                       -- Sunday
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                     END
//                     THEN
//                       -- Calculate time difference and extract only the minutes part
//                       MINUTE(TIMEDIFF(
//                         CASE
//                           -- Handle each day for scheduled time-in
//                           WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END,
//                         '${clockin}'
//                       ))
//                     ELSE 0
//                   END
//                 END)) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//         pao_total_min_ot =  (SELECT ROUND(COALESCE(
//                 CASE
//                   WHEN s.ms_payrolltype = 'Daily'
//                   THEN s.ms_monthly / 8 * 1.25 / 60
//                   ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                 END, 0), 2) * (CASE WHEN EXISTS (
//                   SELECT 1
//                   FROM change_shift
//                   WHERE cs_employeeid = '${employeeid}'
//                   AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//               THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                 THEN COALESCE(
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN
//                       CASE
//                         -- Clock-out beyond 22:00:00
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                             60 -- ensures only excess minutes up to 22:00:00
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Tuesday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Wednesday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Thursday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Friday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Saturday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Sunday
//                     WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 1 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                       END
//                     ELSE 0
//                   END, 0
//                 )
//                 ELSE 0
//                 END
//               ELSE COALESCE(
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
//                       CASE
//                         -- Clock-out beyond 22:00:00
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                             60 -- ensures only excess minutes up to 22:00:00
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Tuesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Wednesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Thursday
//                     WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Friday
//                     WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Saturday
//                     WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Sunday
//                     WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                       END
//                     ELSE 0
//                   END, 0
//                 )
//               END) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_total_early_min_ot = (SELECT ROUND(COALESCE(
//                     CASE
//                       WHEN s.ms_payrolltype = 'Daily'
//                       THEN s.ms_monthly / 8 * 1.25 / 60
//                       ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                     END, 0), 2) * (CASE WHEN EXISTS (
//                       SELECT 1
//                       FROM change_shift
//                       WHERE cs_employeeid = '${employeeid}'
//                       AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                   THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                     THEN CASE
//                         -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                         WHEN '${clockin}' <=
//                         CASE
//                           -- Monday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           -- Tuesday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           -- Wednesday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           -- Thursday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           -- Friday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           -- Saturday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           -- Sunday
//                           ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END
//                         THEN
//                           -- Calculate time difference and extract only the minutes part
//                           MINUTE(TIMEDIFF(
//                             CASE
//                               -- Handle each day for scheduled time-in
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                               WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                               ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                             END,
//                             '${clockin}'
//                           ))
//                         ELSE 0
//                       END
//                     ELSE 0
//                     END
//                   ELSE CASE
//                       -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                       WHEN '${clockin}' <=
//                       CASE
//                         -- Monday
//                         WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         -- Tuesday
//                         WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         -- Wednesday
//                         WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         -- Thursday
//                         WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         -- Friday
//                         WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         -- Saturday
//                         WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         -- Sunday
//                         ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END
//                       THEN
//                         -- Calculate time difference and extract only the minutes part
//                         MINUTE(TIMEDIFF(
//                           CASE
//                             -- Handle each day for scheduled time-in
//                             WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                             ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                           END,
//                           '${clockin}'
//                         ))
//                       ELSE 0
//                     END
//                   END) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_night_hours_pay = (SELECT ROUND(COALESCE(
//                 CASE
//                   WHEN s.ms_payrolltype = 'Daily'
//                   THEN s.ms_monthly / 8 * 1.25 * 1.10
//                   ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10
//                 END, 0), 2)
//                   FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_night_minutes_pay =  (SELECT ROUND(COALESCE(
//                 CASE
//                   WHEN s.ms_payrolltype = 'Daily'
//                   THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                   ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//                 END, 0), 2)
//               END FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_normal_ot_pay = ( SELECT ROUND(COALESCE(
//                 CASE
//                   WHEN s.ms_payrolltype = 'Daily'
//                   THEN s.ms_monthly / 8 * 1.25
//                   ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                 END, 0), 2)
//                   FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_normal_ot_minutes_pay = ( SELECT ROUND(COALESCE(
//                 CASE
//                   WHEN s.ms_payrolltype = 'Daily'
//                   THEN s.ms_monthly / 8 * 1.25 / 60
//                   ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                 END, 0), 2)
//                   FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_early_ot_pay = (SELECT ROUND(
//                     COALESCE(
//                       CASE
//                         WHEN s.ms_payrolltype = 'Daily'
//                         THEN s.ms_monthly / 8 * 1.25
//                         ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                       END, 0
//                     ) * (COALESCE(CASE WHEN EXISTS (
//                       SELECT 1
//                       FROM change_shift
//                       WHERE cs_employeeid = '${employeeid}'
//                       AND (cs_actualrd = '${attendancedate}' OR cs_changerd = '${attendancedate}'))
//                   THEN CASE WHEN '${attendancedate}' = (SELECT cs_actualrd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_actualrd = '${attendancedate}')
//                     THEN CASE
//                         -- Clock-in before or on the scheduled time-in
//                         WHEN '${clockin}' <=
//                         CASE
//                           -- Monday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           -- Tuesday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           -- Wednesday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           -- Thursday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           -- Friday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           -- Saturday
//                           WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           -- Sunday
//                           ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END
//                         THEN COALESCE(HOUR(TIMEDIFF(
//                           CASE
//                             -- Handle each day for clock-in
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 2 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 3 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 4 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 5 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 6 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                             WHEN DAYOFWEEK((SELECT cs_changerd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}')) = 7 THEN CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                             ELSE CAST(CONCAT((SELECT cs_actualrd FROM change_shift WHERE cs_actualrd = '${attendancedate}' AND cs_employeeid = '${employeeid}'), ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                           END, '${clockin}'))
//                         )
//                         ELSE 0
//                       END
//                       END
//                     ELSE CASE WHEN '${attendancedate}' = (SELECT cs_changerd FROM change_shift WHERE cs_employeeid = '${employeeid}' AND cs_changerd = '${attendancedate}') THEN 0
//                   ELSE CASE
//                       -- Clock-in before or on the scheduled time-in
//                       WHEN '${clockin}' <=
//                       CASE
//                         -- Monday
//                         WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         -- Tuesday
//                         WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         -- Wednesday
//                         WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         -- Thursday
//                         WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         -- Friday
//                         WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         -- Saturday
//                         WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         -- Sunday
//                         ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END
//                       THEN COALESCE(HOUR(TIMEDIFF(
//                         CASE
//                           -- Handle each day for clock-in
//                           WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                           WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                           ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                         END, '${clockin}'))
//                       )
//                       ELSE 0
//                     END
//                   END
//                   END,0))
//                   ) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_total_ot_net_pay =  (SELECT -- Night Diff
//                 ((ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25 * 1.10
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10
//                   END, 0), 2) * LEAST(
//                   CASE
//                     WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))
//                       AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
//                     THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
//                     ELSE 0
//                   END,
//                   8
//                 )) + (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
//                     ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60
//                   END, 0), 2) * COALESCE(
//                   CASE
//                     WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME)
//                     THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
//                     ELSE 0
//                   END, 0
//                 )) +
//                 -- Normal OT
//                 (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                   END, 0), 2) * (CASE
//                   -- Clock-out before or on 22:00 but after the scheduled time-out
//                   WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
//                     AND '${clockout}' >=
//                     CASE
//                       -- Monday
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                       -- Tuesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                       -- Wednesday
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                       -- Thursday
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                       -- Friday
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                       -- Saturday
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                       -- Sunday
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                     END
//                   THEN COALESCE(HOUR(TIMEDIFF('${clockout}',
//                     CASE
//                       -- Handle each day accordingly
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                     END))
//                   )
//                   -- Clock-out after 22:00
//                   WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
//                   THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                     CASE
//                       -- Handle each day accordingly
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_out') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_out') AS DATETIME)
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_out') AS DATETIME)
//                     END))
//                   )
//                   ELSE 0
//                 END
//                 )) + (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25 / 60
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                   END, 0), 2) * (COALESCE(
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK('${attendancedate}') = 2 THEN
//                       CASE
//                         -- Clock-out beyond 22:00:00
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME))),
//                             60 -- ensures only excess minutes up to 22:00:00
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Tuesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 3 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Wednesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 4 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Thursday
//                     WHEN DAYOFWEEK('${attendancedate}') = 5 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Friday
//                     WHEN DAYOFWEEK('${attendancedate}') = 6 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Saturday
//                     WHEN DAYOFWEEK('${attendancedate}') = 7 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
//                       END
//                     -- Sunday
//                     WHEN DAYOFWEEK('${attendancedate}') = 1 THEN
//                       CASE
//                         WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) THEN
//                           LEAST(
//                             MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME),
//                             CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME))),
//                             60
//                           )
//                         ELSE
//                           MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
//                       END
//                     ELSE 0
//                   END, 0
//                 -- Early ot
//                 ))) + (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
//                   END, 0), 2) * (CASE
//                   -- Clock-in before or on the scheduled time-in
//                   WHEN '${clockin}' <=
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                     -- Tuesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                     -- Wednesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                     -- Thursday
//                     WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                     -- Friday
//                     WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                     -- Saturday
//                     WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                     -- Sunday
//                     ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                   END
//                   THEN COALESCE(HOUR(TIMEDIFF(
//                     CASE
//                       -- Handle each day for clock-in
//                       WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                       WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                       ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                     END, '${clockin}'))
//                   )
//                   ELSE 0
//                 END) + (ROUND(COALESCE(
//                   CASE
//                     WHEN s.ms_payrolltype = 'Daily'
//                     THEN s.ms_monthly / 8 * 1.25 / 60
//                     ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
//                   END, 0), 2) * (CASE
//                   -- Check if the clock-in is earlier than or equal to the scheduled time-in
//                   WHEN '${clockin}' <=
//                   CASE
//                     -- Monday
//                     WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                     -- Tuesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                     -- Wednesday
//                     WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                     -- Thursday
//                     WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                     -- Friday
//                     WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                     -- Saturday
//                     WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                     -- Sunday
//                     ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                   END
//                   THEN
//                     -- Calculate time difference and extract only the minutes part
//                     MINUTE(TIMEDIFF(
//                       CASE
//                         -- Handle each day for scheduled time-in
//                         WHEN DAYOFWEEK('${attendancedate}') = 2 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 3 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_TUESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 4 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_WEDNESDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 5 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_THURSDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 6 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_FRIDAY->>'$.time_in') AS DATETIME)
//                         WHEN DAYOFWEEK('${attendancedate}') = 7 THEN CAST(CONCAT('${attendancedate}', ' ', ms.ms_SATURDAY->>'$.time_in') AS DATETIME)
//                         ELSE CAST(CONCAT('${attendancedate}', ' ', ms.ms_SUNDAY->>'$.time_in') AS DATETIME)
//                       END,
//                       '${clockin}'
//                     ))
//                   ELSE 0
//                 END)))) FROM master_salary s
//               INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
//               INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
//               INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
//               WHERE me_id = '${employeeid}'
//               LIMIT 1),
//           pao_payroll_date = '${payrolldate}',
//           pao_reason = '${reason}',
//           pao_status = '${overtimestatus}',
//           pao_subgroupid = '${subgroup}',
//           pao_overtimeimage = '${overtimeimage}',
//           pao_applied_date = '${applieddate}'
//           WHERE pao_id = '${approveot_id}'`;

//           mysql
//             .Update(sql)
//             .then((result) => {
//               res.json(JsonSuccess());
//             })
//             .catch((error) => {
//               res.json(JsonErrorResponse(error));
//             });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/cancelot", verifyJWT, (req, res) => {
  try {
    let requestid = req.body.requestid;
    let requeststatus = "Cancel";

    let data = [];
    let columns = [];
    let arguments = [];

    if (requeststatus) {
      data.push(requeststatus);
      columns.push("status");
    }

    if (requestid) {
      data.push(requestid);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "payroll_approval_ot",
      "pao",
      columns,
      arguments
    );

    Update(updateStatement, data, (err, result) => {
      if (err) console.error("Error: ", err);
      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region OVERTIME MEAL

router.post("/loadotmeal", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startdate = GetCurrentMonthFirstDay();
    let enddate = GetCurrentMonthLastDay();
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_attendancedate BETWEEN '${startdate}' AND '${enddate}'
    ORDER BY oma_attendancedate DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", verifyJWT, (req, res) => {
  try {
    const {
      mealotid,
      employeeid,
      clockin,
      clockout,
      totalovertime,
      attendancedate,
      payroll_date,
      otmeal_amount,
      approvalcount,
      status,
      subgroupid,
      image,
    } = req.body;
    let applieddate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let data = [];
    let columns = [];
    let arguments = [];

    if (
      payroll_date == null ||
      payroll_date == "" ||
      payroll_date == undefined
    ) {
      return res
        .status(500)
        .json(JsonWarningResponse("No Payroll Date", "Please select a date"));
    }

    if (employeeid) {
      data.push(employeeid);
      columns.push("employeeid");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendancedate");
    }

    if (clockin) {
      data.push(clockin);
      columns.push("clockin");
    }

    if (clockout) {
      data.push(clockout);
      columns.push("clockout");
    }

    if (totalovertime) {
      data.push(totalovertime);
      columns.push("totalovertime");
    }

    if (otmeal_amount) {
      data.push(otmeal_amount);
      columns.push("otmeal_amount");
    }

    if (payroll_date) {
      data.push(payroll_date);
      columns.push("payroll_date");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (subgroupid) {
      data.push(subgroupid);
      columns.push("subgroupid");
    }

    if (image) {
      data.push(image);
      columns.push("image");
    }

    if (approvalcount) {
      data.push(approvalcount);
      columns.push("approvalcount");
    }

    if (applieddate) {
      data.push(applieddate);
      columns.push("applieddate");
    }

    if (mealotid) {
      data.push(mealotid);
      arguments.push("mealid");
    }

    let updateStatement = UpdateStatement(
      "ot_meal_allowances",
      "oma",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from ot_meal_allowances where oma_employeeid = ? and oma_attendancedate = ? and oma_status = ?",
      [employeeid, attendancedate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getotmeal", verifyJWT, (req, res) => {
  try {
    let mealotid = req.body.mealotid;
    let sql = `SELECT 
    oma_mealid,
    oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%Y-%m-%dT%H:%i') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%Y-%m-%dT%H:%i') AS oma_clockout,
    oma_totalovertime,
    oma_subgroupid,
    oma_payroll_date,
    oma_otmeal_amount,
    oma_approvalcount,
    oma_image,
    oma_status
    FROM  ot_meal_allowances
    WHERE oma_mealid = '${mealotid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/submit", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let applieddate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    const {
      clockin,
      clockout,
      attendancedate,
      payroll_date,
      subgroupid,
      status,
      image,
      otmeal_amount,
    } = req.body;
    let totalovertime = "0";
    let approvalcount = "0";

    let sql = InsertStatement("ot_meal_allowances", "oma", [
      "employeeid",
      "attendancedate",
      "clockin",
      "clockout",
      "totalovertime",
      "otmeal_amount",
      "payroll_date",
      "status",
      "subgroupid",
      "image",
      "approvalcount",
      "applieddate",
    ]);

    let data = [
      [
        employeeid,
        attendancedate,
        clockin,
        clockout,
        totalovertime,
        otmeal_amount,
        payroll_date,
        status,
        subgroupid,
        image,
        approvalcount,
        applieddate,
      ],
    ];

    let checkStatement = SelectStatement(
      "select * from ot_meal_allowances where oma_employeeid = ? and oma_attendancedate = ? and oma_status = ?",
      [employeeid, attendancedate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) console.error("Error: ", err);

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getattendance", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;

    let sql = `
    SELECT
    DATE_FORMAT(ma_clockin, '%Y-%m-%dT%H:%i') AS ma_clockin,
    DATE_FORMAT(ma_clockout, '%Y-%m-%dT%H:%i') AS ma_clockout
    FROM master_attendance
    WHERE ma_employeeid = '${employeeid}'
    AND ma_attendancedate = '${attendancedate}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ma_");
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

router.post("/getapprover", verifyJWT, (req, res) => {
  try {
    let subgroup = req.body.subgroup;
    let sql = `SELECT
    CONCAT(me_lastname,' ',me_firstname) as us_fullname
    FROM user_subgroup
    INNER JOIN master_user ON user_subgroup.us_userid = mu_userid
    INNER JOIN master_employee ON master_user.mu_employeeid = me_id
    WHERE us_subgroupid = '${subgroup}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "us_");
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

router.post("/cancelotmeal", verifyJWT, (req, res) => {
  try {
    let requestid = req.body.requestid;
    let requeststatus = "Cancel";

    let data = [];
    let columns = [];
    let arguments = [];

    if (requeststatus) {
      data.push(requeststatus);
      columns.push("status");
    }

    if (requestid) {
      data.push(requestid);
      arguments.push("mealid");
    }

    let updateStatement = UpdateStatement(
      "ot_meal_allowances",
      "oma",
      columns,
      arguments
    );

    Update(updateStatement, data, (err, result) => {
      if (err) console.error("Error: ", err);
      res.json(JsonSuccess());
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/filterotmeal", verifyJWT, (req, res) => {
  try {
    const { employeeid, status, startdate, enddate } = req.body;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    `;

    if (status) {
      sql += ` AND oma_status = '${status}'`;
    }

    sql += `AND oma_attendancedate BETWEEN '${startdate}' AND '${enddate}'
    ORDER BY oma_attendancedate DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});
//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region LEAVES

router.post("/countheader", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Pending' AND l_employeeid = '${employeeid}'), 0) AS ms_pending,
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Approved' AND l_employeeid = '${employeeid}'), 0) AS ms_approved,
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Rejected' AND l_employeeid = '${employeeid}'), 0) AS ms_rejected,
      IFNULL((SELECT count(*) FROM leaves WHERE l_leavestatus = 'Cancelled' AND l_employeeid = '${employeeid}'), 0) AS ms_cancelled
      FROM leaves 
      WHERE l_employeeid = '${employeeid}'
      LIMIT 1`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ms_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/loadheader", verifyJWT, (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let employeeid = req.body.employeeid;
    let sql = `select 
    ml_leavetype as leavetype,
    ml_unusedleavedays as unused,
    ml_totalleavedays as totalleave,
    ml_usedleavedays as used
    from master_leaves
    where ml_employeeid = '${employeeid}' 
    and ml_id = '${leavesettingsid}'`;

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

router.post("/loadleavetypeforapp", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) as ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    inner join master_employee on master_leaves.ml_employeeid = me_id
    where ml_employeeid = '${employeeid}'
    and ml_year = year(curdate())`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

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

router.post("/getleave", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startdate = GetCurrentMonthFirstDay();
    let enddate = GetCurrentMonthLastDay();
    let sql = `SELECT *,
        ml_leavetype
        FROM leaves
        INNER JOIN master_leaves ON leaves.l_leavetype = ml_id
        WHERE l_employeeid = '${employeeid}'
        AND l_leavestartdate BETWEEN '${startdate}' AND '${enddate}'
        ORDER BY l_leaveid DESC`;

    mysql.Select(sql, "Leaves", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/loadheaderforapp", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ml_leavetype as leavetype,
    ml_totalleavedays as totalleave,
    ml_unusedleavedays as unused,
    ml_usedleavedays as used,
    (select 
    count(l_leavestatus) as Pending
    from leaves
    where l_leavestatus = 'Pending') as Pending
    from master_leaves
    where ml_employeeid = '${employeeid}'`;

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

router.post("/submitleave", verifyJWT, async (req, res) => {
  try {
    const {
      employeeid,
      startdate,
      enddate,
      leavetype,
      reason,
      image,
      subgroup,
      durationDays,
      paidDays,
      unpaidDays,
    } = req.body;
    const createdate = moment().format("YYYY-MM-DD HH:mm:ss");
    const status = "Pending";
    const approvedcount = "0";

    const allowedStartDate = moment().add(3, "days").startOf("day");
    const startDateMoment = moment(startdate);

    if (startDateMoment.isBefore(allowedStartDate)) {
      console.log("Start date is within the 3-day rule");
      return res.json({ msg: "not allowed" });
    }

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      console.log("Invalid employee ID");
      return res.json({ msg: "Invalid employee ID" });
    }

    const dateRange = [];
    let currentDate = moment(startdate);
    const endDateMoment = moment(enddate);

    while (currentDate.isSameOrBefore(endDateMoment)) {
      dateRange.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    const checkDatesQuery = `
      SELECT ld_leavedates
      FROM leave_dates
      WHERE ld_employeeid = '${employeeid}' AND ld_leavedates IN (${dateRange
      .map((date) => `'${date}'`)
      .join(",")})
    `;
    const existingDatesResult = await mysql.mysqlQueryPromise(checkDatesQuery);

    if (existingDatesResult.length > 0) {
      console.log(
        "Leave dates conflict with existing records:",
        existingDatesResult
      );
      return res.json({
        msg: "dates_conflict",
        existingDates: existingDatesResult,
      });
    }

    const data = [
      [
        employeeid,
        startdate,
        enddate,
        leavetype,
        reason,
        image,
        status,
        createdate,
        durationDays,
        paidDays,
        unpaidDays,
        subgroup,
        approvedcount,
      ],
    ];

    mysql.InsertTable("leaves", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record:", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        let emailbody = [
          {
            employeename: employeeid,
            date: createdate,
            startdate: startdate,
            enddate: enddate,
            reason: reason,
            requesttype: REQUEST.LEAVE,
          },
        ];
        SendEmailNotification(employeeid, subgroup, REQUEST.LEAVE, emailbody);

        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submitleave route:", error);
    res.json({ msg: "error" });
  }
});

router.post("/cancelLeave", verifyJWT, async (req, res) => {
  try {
    const leaveid = req.body.leaveid;

    const updateLeaveStatusQuery = `UPDATE leaves SET l_leavestatus = 'Cancelled' WHERE l_leaveid = ${leaveid}`;

    try {
      await mysql.mysqlQueryPromise(updateLeaveStatusQuery, [leaveid]);
      res.json({ msg: "success", leaveid: leaveid, status: "cancelled" });
    } catch (updateError) {
      console.error("Error updating leave status: ", updateError);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error in /cancelLeave route: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/filterleave", verifyJWT, (req, res) => {
  try {
    const { employeeid, status, startdate, enddate } = req.body;
    let sql = `SELECT *,
        ml_leavetype
        FROM leaves
        INNER JOIN master_leaves ON leaves.l_leavetype = ml_id
        WHERE l_employeeid = '${employeeid}'
        `;

    if (status) {
      sql += ` AND l_leavestatus = '${status}'`;
    }

    sql += ` AND l_leavesstartdate BETWEEN '${startdate}' AND '${enddate}'
        ORDER BY l_leaveid DESC`;

    mysql.Select(sql, "Leaves", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region CASH ADVANCE

router.post("/getload", verifyJWT, (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM cash_advance WHERE ca_employeeid = '${employeeid}'
    order by ca_cashadvanceid desc`;

    mysql.Select(sql, "Cash_Advance", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/cancelcashadvanced", verifyJWT, async (req, res) => {
  try {
    const cashadvanceid = req.body.cashadvanceid;

    const updateCashAdvanceStatusQuery = `UPDATE cash_advance SET ca_status = 'Cancelled' WHERE ca_cashadvanceid = ${cashadvanceid}`;

    try {
      await mysql.mysqlQueryPromise(updateCashAdvanceStatusQuery, [
        cashadvanceid,
      ]);
      res.json({
        msg: "success",
        cashadvanceid: cashadvanceid,
        status: "Cancelled",
      });
    } catch (updateError) {
      console.error("Error updating cashadvance status: ", updateError);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error in /cancelcashadvance route: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/submitforapp", verifyJWT, async (req, res) => {
  try {
    const employeeid = req.body.employeeid;
    const { amount, purpose } = req.body;
    const requestdate = currentDate.format("YYYY-MM-DD");
    const status = "Pending";
    const approvaldate = "On Process";

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [employeeid, requestdate, amount, purpose, status, approvaldate],
    ];

    mysql.InsertTable("cash_advance", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submit route: ", error);
    res.json({ msg: "error" });
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region OFFICIAL BUSINESS
router.post("/getob", (req, res) => {
  try {
    const { employeeid } = req.body;
    let sql = SelectStatement(
      "select * from official_business_request where obr_employee_id = ? and obr_attendance_date between ? and ?",
      [employeeid, GetCurrentMonthFirstDay(), GetCurrentMonthLastDay()]
    );

    Select(sql, (err, result) => {
      if (err) {
        return res.status(500).json(JsonErrorResponse(err));
      }

      if (result.length != 0) {
        let data = DataModeling(result, "obr_");

        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/getobstatus", (req, res) => {
  try {
    const { employeeid, status } = req.body;
    let sql = SelectStatement(
      "select * from official_business_request where obr_employee_id = ? and obr_attendance_date between ? and ? and obr_status = ?",
      [employeeid, GetCurrentMonthFirstDay(), GetCurrentMonthLastDay(), status]
    );

    Select(sql, (err, result) => {
      if (err) {
        return res.status(500).json(JsonErrorResponse(err));
      }

      if (result.length != 0) {
        let data = DataModeling(result, "obr_");

        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/filterob", (req, res) => {
  try {
    const { employeeid, startdate, enddate } = req.body;
    let sql = SelectStatement(
      "select * from official_business_request where obr_employee_id = ? and obr_attendance_date between ? and ?",
      [employeeid, startdate, enddate]
    );

    Select(sql, (err, result) => {
      if (err) {
        return res.status(500).json(JsonErrorResponse(err));
      }

      if (result.length != 0) {
        let data = DataModeling(result, "obr_");

        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/appplyob", (req, res) => {
  try {
    const {
      employeeid,
      attendancedate,
      subgroupid,
      clockin,
      clockout,
      reason,
    } = req.body;
    let status = REQUEST_STATUS.applied;
    let applied_date = GetCurrentDatetime();

    async function ProcessData() {
      let official_business_request_sql = InsertStatement(
        "official_business_request",
        "obr",
        [
          "employee_id",
          "attendance_date",
          "subgroup_id",
          "clockin",
          "clockout",
          "applied_date",
          "reason",
          "status",
          "approval_count",
        ]
      );

      let obr_data = [
        [
          employeeid,
          attendancedate,
          subgroupid,
          clockin,
          clockout,
          applied_date,
          reason,
          status,
          0,
        ],
      ];

      Insert(official_business_request_sql, obr_data, (err, result) => {
        if (err) {
          console.log(err);

          res.status(500).json({
            msg: err,
          });
        }
        console.log(result);

        let emailbody = [
          {
            employeename: employeeid,
            date: attendancedate,
            reason: reason,
            status: MessageStatus.APPLIED,
            requesttype: REQUEST.OB,
            startdate: clockin,
            enddate: clockout,
          },
        ];

        SendEmailNotification(employeeid, subgroupid, REQUEST.OB, emailbody);

        res.status(200).json({
          msg: "success",
          data: result,
        });
      });
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

//#endregion

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}

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

function getDeviceInformation(device) {
  if (typeof device === "undefined" || " ") {
    return "app";
  } else {
    return "web";
  }
}

function calculateTotalHours(timein, timeout) {
  const datetimeIn = new Date(timein);
  const datetimeOut = new Date(timeout);
  const timeDifferenceMs = datetimeOut - datetimeIn;
  const totalHoursDecimal = timeDifferenceMs / (1000 * 60 * 60);
  return totalHoursDecimal.toFixed(2);
}

function RemoveApostrophe(str) {
  return str.replace(/'/g, "");
}

//#endregion
