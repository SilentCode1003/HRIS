const mysql = require("./repository/hrmisdb");
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('eportalindexlayout', { title: 'Express' });
  Validator(req, res, 'eportalindexlayout');
});

module.exports = router;


router.post('/clockin', (req, res) => {
  // Retrieve employee_id from the session
  const employee_id = req.session.employee_id;

  if (!employee_id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized. Employee not logged in.' });
  }

  // Check if the employee is within the geofence radius
  const sql = `SELECT ma_geofencelatitude, ma_geofencelongitude, ma_geofenceradius FROM master_attendance WHERE ma_employeeid = ${employee_id}`;

  mysql.mysqlQueryPromise(sql, [employee_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }

    if (result.length > 0) {
      const { ma_geofencelatitude, ma_geofencelongitude, ma_geofenceradius } = result[0];

      // Assuming you have latitude and longitude from the request body
      const { latitude, longitude } = req.body;

      // Calculate distance between employee location and geofence center
      const distance = calculateDistance(latitude, longitude, ma_geofencelatitude, ma_geofencelongitude);

      // Check if the employee is within the geofence radius
      if (distance <= ma_geofenceradius) {
        // Employee is within the geofence, allow clock-in

        // Insert attendance record
        const clockinTime = moment().format('HH:mm:ss');
        const attendanceData = {
          ma_employeeid: employee_id,
          ma_attendancedate: moment().format('YYYY-MM-DD'),
          ma_clockin: clockinTime,
          ma_latitudeIn: latitude,
          ma_longitudein: longitude,
          ma_geofencelatitude: ma_geofencelatitude,
          ma_geofencelongitude: ma_geofencelongitude,
          ma_geofenceradius: ma_geofenceradius,
          ma_devicein: 'web' // You may adjust this based on the source of the clock-in
        };

        mysql.InsertTable('master_attendance', attendanceData, (insertErr, insertResult) => {
          if (insertErr) {
            console.error('Error inserting record: ', insertErr);
            return res.status(500).json({ status: 'error', message: 'Failed to insert attendance.' });
          }

          res.json({ status: 'success', message: 'Clock-in allowed within the geofence.' });
        });
      } else {
        // Employee is outside the geofence, deny clock-in
        res.status(403).json({ status: 'error', message: 'Clock-in denied. Employee is outside the geofence.' });
      }
    } else {
      // Geofence details not found for the employee
      res.status(404).json({ status: 'error', message: 'Geofence details not found for the employee.' });
    }
  });
  req.session.employee_id = user.employee_id;

  // Send a success response or redirect
  res.json({ status: 'success', message: 'Login successful' });
});

module.exports = router;
