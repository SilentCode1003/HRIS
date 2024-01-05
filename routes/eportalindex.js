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


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


router.post("/clockin", (req, res) => {
  const employee_id = req.session.employeeid;

  if (!employee_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }

  const { latitude, longitude } = req.body;
  const clockinTime = moment().format("HH:mm:ss");
  const attendancedate = moment().format("YYYY-MM-DD");
  const devicein = "web"

  const attendanceData = [
    [
      employee_id,
      attendancedate,
      clockinTime,
      latitude,
      longitude,
      devicein,
    ],
  ];

  mysql.InsertTable("master_attendance", attendanceData, (err, result) => {
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
  });
});


router.post("/clockout", (req, res) => {
  const employee_id = req.session.employeeid;

  if (!employee_id) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized. Employee not logged in.",
    });
  }

  const { latitude, longitude } = req.body;
  const clockoutTime = moment().format("HH:mm:ss");
  const attendancedate = moment().format("YYYY-MM-DD");
  const deviceout = "web";

  const attendanceData = [
    [
      employee_id,
      attendancedate,
      null, // Placeholder for clockout time, as it will be updated later
      null, // Placeholder for latitudeout
      null, // Placeholder for longitudeout
      deviceout,
    ],
  ];

  mysql.InsertTable("master_attendance", attendanceData, (err, result) => {
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
      message: "Clock-out allowed.",
    });
  });
});

// ... (remaining code)

module.exports = router;
