const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('attendancelayout', { title: 'Express' });

  Validator(req, res, "attendancelayout");
});

module.exports = router;

router.post("/set-geofence", async (req, res) => {
  const { geofenceLatitude, geofenceLongitude, geofenceRadius } = req.body;

  try {
    const GeoFenceSettings = mongoose.model("GeoFenceSettings", {
      latitude: Number,
      longitude: Number,
      radius: Number,
    });

    const existingSettings = await GeoFenceSettings.findOne();

    if (existingSettings) {
      existingSettings.latitude = geofenceLatitude;
      existingSettings.longitude = geofenceLongitude;
      existingSettings.radius = geofenceRadius;
      await existingSettings.save();
    } else {
      const newSettings = new GeoFenceSettings({
        latitude: geofenceLatitude,
        longitude: geofenceLongitude,
        radius: geofenceRadius,
      });
      await newSettings.save();
    }

    res
      .status(200)
      .json({ message: "Geo-fence settings updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
        me_profile_pic as image,
        ma_attendanceid as attendanceid,
        CONCAT(me_lastname, " ", me_firstname) as employeeid,
        DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') as attendancedate,
        TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
        TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
        ma_devicein as devicein,
        ma_deviceout as deviceout,
        CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
        FROM master_attendance
        LEFT JOIN master_employee ON ma_employeeid = me_id
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

router.post("/getloadforapp", (req, res) => {
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
        CONCAT(
        FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
        FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
        FROM master_attendance
        INNER JOIN master_employee ON ma_employeeid = me_id
        where ma_employeeid='${employeeid}'
        ORDER BY ma_attendancedate DESC
        LIMIT 2`;

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


router.post("/filterforapp", (req, res) => {
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


router.post("/logs", (req, res) => {
  try {
    let attendanceid = req.body.attendanceid;
    let sql = `SELECT
    me_profile_pic AS image,
    CONCAT(me_lastname, ' ', me_firstname) AS fullname,
    DATE_FORMAT(al_logdatetime, '%W, %M %e, %Y') AS logdate,
    TIME(al_logdatetime) AS logtime,
    al_logtype AS logtype,
    al_latitude AS latitude,
    al_longitude AS longitude,
    al_device AS device,
    mgs_location AS location,
    SQRT(POW(mgs_latitude - al_latitude, 2) + POW(mgs_longitude - al_longitude, 2)) * 111.32 AS distance
    FROM
    master_employee
    INNER JOIN
    attendance_logs ON me_id = al_employeeid
    LEFT JOIN
    master_geofence_settings ON me_department = mgs_departmentid
    WHERE
    al_attendanceid = '${attendanceid}'
    HAVING
    distance <= 1`;

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

// router.post('/gethomestatus', (req, res) => {
//     try {
//        //let attendancedate = req.body.attendancedate;
//         let employeeid = req.body.employeeid;
//         let sql = `SELECT
//         DATE_FORMAT(ma_clockin, '%Y-%m-%d %H:%i:%s') AS formatted_clockin,
//         DATE_FORMAT(ma_clockout, '%Y-%m-%d %H:%i:%s') AS formatted_clockout
//         FROM master_attendance
//         WHERE ma_employeeid = '${employeeid}'
//         LIMIT 1`;

//         mysql.mysqlQueryPromise(sql)
//         .then((result) => {
//             res.json({
//                 msg: 'success',
//                 data: result,
//             });
//         })
//         .catch((error) => {
//             res.json({
//                 msg: 'error',
//                 data: error,
//             });
//         });
//     } catch (error) {
//         console.log('error', error);
//     }
// });

router.post("/gethomestatus2", (req, res) => {
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
    console.log(sql);

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



// router.post('/filterforapp', (req, res) => {
//   try {
//     let startdate = req.body.startdate;
//     let enddate = req.body.enddate;
//     let sql = `SELECT ma_attendancedate as attendancedate
//     FROM master_attendance
//     WHERE ma_attendancedate BETWEEN '${startdate}' AND '${enddate}';`;

//     mysql.mysqlQueryPromise(sql)
//     .then((result) => {
//       res.json({
//         msg: 'success',
//         data: result,
//       });
//     })
//     .catch((error) => {
//       res.json({
//         msg: 'error',
//         data: error,
//       });
//     })
//   } catch (error) {
//     res.json({
//       msg: error,
//     });
//   }
// });
