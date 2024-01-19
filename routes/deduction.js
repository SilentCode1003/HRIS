const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { json } = require("body-parser");
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('deductionlayout', { title: 'Express' });
  Validator(req, res, 'deductionlayout');
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql =  `SELECT
    me_profile_pic,
    gd_id,
    CONCAT(me_lastname, ' ', me_firstname) AS gd_employeeid,
    mg_idtype AS gd_idtype,
    gd_amount,
    CASE gd_period
        WHEN 1 THEN 'Once'
        WHEN 2 THEN 'Twice'
        ELSE 'Unknown'
    END AS gd_period,
    gd_cutoff
    FROM
    government_deductions
    INNER JOIN
    master_employee ON government_deductions.gd_employeeid = me_id
    INNER JOIN
    master_govid ON government_deductions.gd_idtype = mg_governmentid`;

    mysql.Select(sql, "Government_Deductions", (err, result) => {
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

router.post('/save', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let type = req.body.type;
    let amount = req.body.amount;
    let period = req.body.period;
    let cutoff = req.body.cutoff;

    let data = [];

    data.push([employeeid, type, amount, period, cutoff]);

    let sql = `SELECT * FROM government_deductions WHERE gd_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Government_Deductions", (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("government_deductions", data, (err, result) => {
          if (err) console.error("Error: ", err);

          console.log(result);

          res.json({
            msg: "success",
            data: result,
          });
        });
      }
    });

  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});

router.post('/getdeduction' , (req, res) => {
  try {
    let govdeduct = req.body.govdeduct;
    let sql =  `select 
    gd_employeeid,
    gd_idtype,
    gd_amount,
    gd_period,
    gd_cutoff
    from government_deductions
    where gd_id = '${govdeduct}'`;
    
    mysql.Select(sql, "Government_Deductions", (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

      res.json({
        msg: 'success',
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



router.post('/update', (req, res)=> {
  try {
    let govdeduct = req.body.govdeduct;
    let employeeid = req.body.employeeid;
    let type = req.body.type;
    let amount = req.body.amount;
    let period = req.body.period;
    let cutoff = req.body.cutoff;

    let sqlupdate =  `update government_deductions set
    gd_employeeid = '${employeeid}',
    gd_idtype = '${type}',
    gd_amount = '${amount}',
    gd_period = '${period}',
    gd_cutoff = '${cutoff}'
    where gd_id = '${govdeduct}'`;

    console.log(sqlupdate);

    mysql.Update(sqlupdate)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg: 'error',
        data: error,
      });
    })
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});
