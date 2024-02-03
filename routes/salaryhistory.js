const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('salarylayout', { title: 'Express' });
  Validator(req, res, "salaryhistorylayout");
});

module.exports = router;

router.get('/load', (req, res) => {
    try {
        let sql = `select
        me_profile_pic,
        sh_id, 
        sh_date,
        concat(me_lastname,' ',me_firstname) as sh_employeeid,
        sh_monthly,
        sh_allowances
       from salary_history
       inner join master_employee on salary_history.sh_employeeid = me_id
       order by sh_id desc`;

        mysql.Select(sql, "Salary_History", (err, result) => {
            if (err) console.error("Error: ", err);

            res.json({
                msg: "success",
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