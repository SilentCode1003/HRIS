var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");
const mysql  = require("./repository/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('paymentlayout', { title: 'Express' });
  Validator(req, res, "otherdeductionslayout");
});

module.exports = router;


router.get('/load', (req, res) => {
    try {
      let sql =  `SELECT
      me_profile_pic,
      od_id,
      CONCAT(me_lastname, ' ', me_firstname) AS od_employeeid,
      md_idtype AS od_idtype,
      od_amount,
      CASE od_period
          WHEN 1 THEN 'Once'
          WHEN 2 THEN 'Twice'
          ELSE 'Unknown'
      END AS od_period,
      od_cutoff
      FROM
      other_deductions
      INNER JOIN
      master_employee ON other_deductions.od_employeeid = me_id
      INNER JOIN
      master_deductions ON other_deductions.od_idtype = md_deductionid`;
  
      mysql.Select(sql, "Other_Deductions", (err, result) => {
        if (err) console.error("Error", err);
  
        res.json({
          msg: 'success',
          data: result,
        });
      });
    } catch (error) {
      res.json({
        msg: error,
      });
    }
  });