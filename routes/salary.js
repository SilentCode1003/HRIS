const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('salarylayout', { title: 'Express' });
  Validator(req, res, "salarylayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `    
    SELECT 
   ms_id,
   concat(me_lastname,' ',me_firstname) as ms_employeeid,
   ms_monthly,
   ms_allowances,
   ms_basic_adjustments,
   ms_payrolltype
   FROM master_salary
    LEFT JOIN master_employee ON master_salary.ms_employeeid = me_id`;

    mysql.Select(sql, "Master_Salary", (err, result) => {
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

router.post("/save", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let monthly = req.body.monthly;
    let allowances = req.body.allowances;
    let adjustments = req.body.adjustments;
    let payrolltype = req.body.payrolltype;

    let data = [];

    data.push([employeeid, monthly, allowances, adjustments, payrolltype]);

    let sql = `SELECT * FROM master_salary WHERE ms_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Master_Salary", (err, result) => {
      if (err) console.log("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("master_salary", data, (err, result) => {
          if (err) console.log("Error: ", err);

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
      msg: "error",
      data: error,
    });
  }
});

router.post('/getsalary', (req, res) => {
  try {
    let salaryid = req.body.salaryid;
    let sql = `select 
    ms_employeeid,
    ms_monthly,
    ms_allowances,
    ms_basic_adjustments,
    ms_payrolltype
    from master_salary
    where ms_id = '${salaryid}'`;
    
    mysql.Select(sql, "Master_Salary", (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

      res.json({
        msg: 'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});


router.post('/update', (req ,res) => {
  try {
    let salaryid = req.body.salaryid;
    let employeeid = req.body.employeeid;
    let monthly = req.body.monthly;
    let allowances = req.body.allowances;
    let adjustments = req.body.adjustments;
    let payrolltype = req.body.payrolltype;
    let sqlupdate = `update master_salary set 
    ms_employeeid = '${employeeid}',
    ms_monthly = '${monthly}',
    ms_allowances = '${allowances}',
    ms_basic_adjustments = '${adjustments}',
    ms_payrolltype = '${payrolltype}'
    where ms_id = '${salaryid}'`;

    console.log(sqlupdate);


    mysql.Update(sqlupdate)
      .then((result) =>{
        console.log(result);
    
        res.json({
          msg: 'success',
          data: result,
        })
      })
      .catch((error) =>{
        res.json({
          msg:'error',
          data: error,
        })
        
      });
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    })
  }
});