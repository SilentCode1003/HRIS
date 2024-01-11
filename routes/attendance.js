const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('attendancelayout', { title: 'Express' });

  Validator(req, res, 'attendancelayout');
});

module.exports = router;

router.post('/set-geofence', async (req, res) => {
  const { geofenceLatitude, geofenceLongitude, geofenceRadius } = req.body;

  try {
      const GeoFenceSettings = mongoose.model('GeoFenceSettings', {
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

      res.status(200).json({ message: 'Geo-fence settings updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/load", (req, res) => {
    try {
        let sql =`SELECT
        CONCAT(me_lastname, " ", me_firstname) as employeeid,
        ma_attendancedate as attendancedate,
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
        ORDER BY ma_attendanceid DESC`;

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
            });
        })
    } catch (error) {
        console.log('error',error)
    }
});


router.post("/getloadforapp", (req, res) => {
    try {
        let employeeid = req.body.employeeid;
        let sql =`SELECT
        CONCAT(me_lastname, " ", me_firstname) as employeeid,
        ma_attendancedate as attendancedate,
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
         where ma_employeeid = '${employeeid}'
        ORDER BY ma_attendanceid DESC;`;

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
            });
        })
    } catch (error) {
        console.log('error',error)
    }
});

router.post('/logs', (req, res) => {
    try {
        let logid = req.body.logid;
        let sql =  `select
        al_attendanceid as attendanceid,
        al_employeeid as fullname,
        TIME_FORMAT(al_logdatetime, '%H:%i:%s') as logdatetime,
        al_logtype as logtype,
        al_latitude as latitude,
        al_longitude as longitude,
        al_device as device,
        mgs_location as location
        from master_employee
        inner join attendance_logs on me_id = al_employeeid
        left join master_geofence_settings on me_department = mgs_departmentid
        where al_attendanceid = '${logid}'`;

        mysql.mysqlQueryPromise(sql)
        .then((result) => {
            res.json({
                msg:'success',
                data: result,
            });
        })
        .catch((error) => {
            res.json({
                msg:error,
            });
        })
    } catch (error) {
        res.json({
            msg:error,
        });
        
    }
});

