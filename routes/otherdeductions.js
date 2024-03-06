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



  router.post('/save', (req, res) => {
    try {
      let employeeid = req.body.employeeid;
      let idtype = req.body.idtype;
      let amount = req.body.amount;
      let period = req.body.period;
      let cutoff = req.body.cutoff;
  
      let data = [employeeid, idtype, amount, period, cutoff];
  
      let sql = `SELECT * FROM other_deductions WHERE od_employeeid = '${employeeid}' AND od_idtype = '${type}'`;
  
      mysql.Select(sql, "Other_Deductions", (err, result) => {
        if (err) {
          console.error("Error: ", err);
          res.json({
            msg: "error",
          });
          return;
        }
  
        if (result.length !== 0) {
          res.json({
            msg: "exist",
          });
        } else {
          mysql.InsertTable("other_deductions", [data], (err, result) => {
            if (err) {
              console.error("Error: ", err);
              res.json({
                msg: "error",
              });
              return;
            }
  
            console.log(result);
  
            res.json({
              msg: "success",
              data: result,
            });
          });
        }
      });
    } catch (error) {
      console.error("Error: ", error);
      res.json({
        msg: "error",
      });
    }
  });


  router.post('/getotherdeduction' , (req, res) => {
    try {
      let otherdeduct = req.body.otherdeduct;
      let sql =  `select 
      od_employeeid,
      od_idtype,
      od_amount,
      od_period,
      od_cutoff
      from other_deductions
      where od_id = '${otherdeduct}'`;
      
      mysql.Select(sql, "Other_Deductions", (err, result) => {
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
      let otherdeduct = req.body.otherdeduct;
      let employeeid = req.body.employeeid;
      let idtype = req.body.idtype;
      let amount = req.body.amount;
      let period = req.body.period;
      let cutoff = req.body.cutoff;
  
      let sqlupdate =  `update other_deductions set
      od_employeeid = '${employeeid}',
      od_idtype = '${idtype}',
      od_amount = '${amount}',
      od_period = '${period}',
      od_cutoff = '${cutoff}'
      where od_id = '${otherdeduct}'`;
  
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