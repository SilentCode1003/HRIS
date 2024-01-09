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
      // Replace with your actual logic to update geo-fence parameters in MongoDB
      // For example, if you have a Mongoose model for geo-fence settings
      const GeoFenceSettings = mongoose.model('GeoFenceSettings', {
          latitude: Number,
          longitude: Number,
          radius: Number,
      });

      const existingSettings = await GeoFenceSettings.findOne();

      if (existingSettings) {
          // Update existing settings
          existingSettings.latitude = geofenceLatitude;
          existingSettings.longitude = geofenceLongitude;
          existingSettings.radius = geofenceRadius;
          await existingSettings.save();
      } else {
          // Create new settings if they don't exist
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
        let sql =``;

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