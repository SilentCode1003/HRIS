const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('candidatelayout', { title: 'Express' });

  Validator(req, res, 'attendancerequestlayout');
});

module.exports = router;


router.get('/load', (req, res) => {
    try {
        let sql = `SELECT * FROM attendance_request`;

        mysql.Select(sql, "Attendance_Request", (err, result) => {
            if (err) console.error("Error Fetching Data: ", err);

            console.log(result);
            res.json({
                msg:'success',
                data: result,
            });
        });

    } catch (error) {
        res.json({
            msg:'error',
            data: error,
        });
    }
});