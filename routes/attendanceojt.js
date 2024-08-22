const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
const {
  convertExcelDate,
  convertExcelDatetime,
} = require("./repository/customhelper");
const { OJTAttendanceModel } = require("./model/model");
const { OJTAttendance } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('attendancelayout', { title: 'Express' });

  Validator(req, res, "attendanceojtlayout", "attendanceojt");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    oa_attendanceid as attendanceid,
    CONCAT(mo_lastname, " ", mo_name) as employeeid,
    DATE_FORMAT(oa_attendancedate, '%W, %M %e, %Y') as attendancedate,
    TIME_FORMAT(oa_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(oa_clockout, '%H:%i:%s') as clockout,
    oa_devicein as devicein,
    oa_deviceout as deviceout,
    CONCAT(
        FLOOR(TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) / 3600), 'h ',
        FLOOR((TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) % 3600) / 60), 'm'
    ) AS totalhours
    FROM ojt_attendance
    LEFT JOIN master_ojt ON oa_ojtid = mo_id
    ORDER BY oa_attendancedate DESC`;

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

router.post("/logs", (req, res) => {
  try {
    let attendanceid = req.body.attendanceid;
    let sql = `select 
    mo_image as image,
    concat(mo_lastname,' ',mo_name) as fullname,
	  DATE_FORMAT(oal_logdatetime, '%W, %M %e, %Y') AS logdate,
	  TIME(oal_logdatetime) AS logtime,
    oal_logtype AS logtype,
	  oal_latitude AS latitude,
    oal_longitude AS longitude,
	  oal_device AS device,
    mgs_geofencename as location
    from ojt_attendance_logs
    inner join master_ojt on ojt_attendance_logs.oal_ojtid = mo_id
    inner join master_geofence_settings on ojt_attendance_logs.oal_geofenceid = mgs_id
    where oal_attendanceid = '${attendanceid}'`;

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

router.post("/upload", (req, res) => {
  try {
    const { data } = req.body;
    let dataJson = JSON.parse(data);
    let ojt_attendance = [];
    let ojt_attendance_update = [];

    dataJson.forEach((key, item) => {
      let date = convertExcelDate(key.date);

      console.log(key.type);

      if (key.type == "IN") {
        ojt_attendance.push([
          key.id,
          date,
          `${date} ${key.time}`,
          key.latitude,
          key.longitude,
          key.device,
          key.geofenceid,
        ]);
      } else {
        ojt_attendance_update.push({
          id: key.id,
          date: date,
          time: `${date} ${key.time}`,
          latitude: key.latitude,
          longitude: key.longitude,
          device: key.device,
          geofenceid: key.geofenceid,
        });
      }
    });

    Insert_OJTAttendance(ojt_attendance)
      .then((result) => {
        Update_OJTAttendance(ojt_attendance_update)
          .then((result) => {
            res.json({
              msg: "success",
            });
          })
          .catch((error) => {
            console.error(error);
            return res.json({
              msg: error,
            });
          });
      })
      .catch((error) => {
        console.error(error);
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error(error);
    res.json({
      msg: error,
    });
  }
});

//#region FUNCTIONS
function Insert_OJTAttendance(data) {
  return new Promise((resolve, reject) => {
    console.log(data);
    if (data.length != 0) {
      mysql.InsertTable("ojt_attendance", data, (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        }

        resolve(result);
      });
    } else {
      return resolve("Not data to insert");
    }
  });
}

function Update_OJTAttendance(data) {
  return new Promise((resolve, reject) => {
    let model = OJTAttendance(data);
    let sql =
      "update ojt_attendance set oa_clockout = ?, oa_latitudeout = ?, oa_longitudeout = ?, oa_deviceout = ?, oa_geofenceidOut=? where oa_ojtid=? and oa_attendancedate=?";
    let counter = 0;

    model.forEach((item) => {
      let ojt_attendance = [
        item.time,
        item.latitude,
        item.longitude,
        item.device,
        item.geofenceid,
        item.id,
        item.date,
      ];

      mysql.UpdateMultiple(sql, ojt_attendance, (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        }

        counter += 1;

        if (counter == model.length) {
          console.log("Data: ", counter);
          resolve(result);
        }
      });
    });
  });
}
//#endregion
