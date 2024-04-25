const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { error } = require("jquery");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('shiftlayout', { title: 'Express' });
  Validator(req, res, "shiftsettingslayout");
});

module.exports = router;

router.get('/load' , (req, res) => {
    try {
        let sql =  `SELECT * FROM master_shift_settings`;

        mysql.Select(sql, "Master_Shift_Settings" , (err, result) => {
            if (err) console.error("Error :" , err);

            console.log(result);
            res.json({
                msg:'success',
                data: result,
            });
        });
    } catch (error) {
        res.json({
            msg:'error',
            data: error
        });
    }
});