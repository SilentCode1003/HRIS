const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, 'geofencesettingslayout');
});

module.exports = router;

router.post('/getgeofencesettings', (req, res) => {
    try {
      let geofenceid = req.body.geofenceid;
      let sql = ` select 
      mgs_geofencename as geofencename,
      mgs_departmentid as departmentid,
      mgs_latitude as latitude,
      mgs_longitude as longitude,
      mgs_radius as radius,
      mgs_location as location,
      mgs_status as status 
      from master_geofence_settings
      where mgs_id = '${geofenceid}'`;
      
      mysql.mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
            msg:'success',
            data: result,
        });
      })
      .catch((error) => {
        res.json({
            data: error,
        });
      })
    } catch (error) {
        res.json({
            msg:'error',
            data: error,
        });
    }
});

router.get('/load', (req, res) => {
    try {
      let sql = `  SELECT 
      mgs_id,
      mgs_geofencename,
      mgs_departmentid,
      mgs_latitude,
      mgs_longitude,
      mgs_radius,
      mgs_location,
      mgs_status
      FROM master_geofence_settings
      LEFT JOIN master_department ON  mgs_departmentid = md_departmentid;`;
  
      mysql.Select(sql, 'Master_Geofence_Settings', (err, result) => {
        if (err) console.error('Error: ', err);
  
        res.json({
          msg: 'success', data: result
        });
      });
    } catch (error) {
      res.json({
        msg:error
      })
      
    }
  });

  router.post('/save', async (req,res) => {
    try {
        let geofencename = req.body.geofencename;
        let departmentid = req.body.departmentid;
        let latitude = req.body.latitude;
        let longitude = req.body.longitude;
        let radius = req.body.radius;
        let location = req.body.location;
        let data = [];

        const checkQuery = `select * from master_geofence_settings 
        where mgs_departmentid = '${departmentid}' 
        and mgs_latitude = '${latitude}' 
        and mgs_longitude = '${longitude}'`;
        const checkParams = [departmentid, latitude, longitude];

        const existingRecord = await mysql.mysqlQueryPromise(checkQuery, checkParams);

        if (existingRecord.length > 0) {
            res.json({ msg: 'exist'});
            return;
        }

        data.push([
            geofencename,
            departmentid,
            latitude,
            longitude,
            radius,
            location,
            'Active'
        ]);


        mysql.InsertTable('master_geofence_settings', data, (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Error inserting record: ', insertErr);
              res.json({ msg: 'insert_failed' });
            } else {
              console.log(insertResult);
              res.json({ msg: 'success' });
            }
        });
    } catch (error) {
        res.json({
            msg:'error',
            data: error,
        });
    }
  });