const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { ValidatorForTeamLead } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, "teamleadgeofencelayout", "teamleadgeofence");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
    mgs_id,
    mgs_geofencename,
    md.md_departmentname AS mgs_departmentid,
    mgs_latitude,
    mgs_longitude,
    mgs_radius,
    mgs_location,
    mgs_status
    FROM master_geofence_settings
    LEFT JOIN master_department md ON master_geofence_settings.mgs_departmentid = md.md_departmentid
    WHERE mgs_departmentid = '${departmentid}'`;

    mysql.Select(sql, "Master_Geofence_Settings", (err, result) => {
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

router.post("/save", async (req, res) => {
  try {
    let geofencename = req.body.geofencename;
    let departmentid = req.session.departmentid;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let radiusInput = req.body.radius;
    let radius = parseFloat(radiusInput) || 0;
    if (!isNaN(radius) && Number.isInteger(radius)) {
      radius = parseFloat(radiusInput + ".01");
    }
    let location = req.body.location;
    let data = [];

    const checkQuery = `select * from master_geofence_settings 
      where mgs_departmentid = '${departmentid}' 
      and mgs_latitude = '${latitude}' 
      and mgs_longitude = '${longitude}'`;
    const checkParams = [departmentid, latitude, longitude];

    const existingRecord = await mysql.mysqlQueryPromise(
      checkQuery,
      checkParams
    );

    if (existingRecord.length > 0) {
      res.json({ msg: "exist" });
      return;
    }

    data.push([
      geofencename,
      departmentid,
      latitude,
      longitude,
      radius,
      location,
      "Active",
    ]);

    mysql.InsertTable(
      "master_geofence_settings",
      data,
      (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error inserting record: ", insertErr);
          res.json({ msg: "insert_failed" });
        } else {
          console.log(insertResult);
          res.json({ msg: "success" });
        }
      }
    );
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/update", (req, res) => {
  try {
    let geofenceid = req.body.geofenceid;
    let geofencename = req.body.geofencename;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let radius = req.body.radius;
    let location = req.body.location;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_geofence_settings SET   
    mgs_geofencename ='${geofencename}',
    mgs_latitude ='${latitude}',
    mgs_longitude ='${longitude}',
    mgs_radius ='${radius}', 
    mgs_location ='${location}', 
    mgs_status ='${status}'
    WHERE mgs_id ='${geofenceid}'`;

    console.log(sqlupdate);

    mysql
      .Update(sqlupdate)
      .then((result) => {
        console.log(result);

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
