const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportaldisciplinaryactionlayout', { title: 'Express' });
  Validator(req, res, 'eportaldisciplinaryactionlayout');
});



router.get('/load',(req , res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `        
    SELECT 
     oda_disciplinaryid,
     mo_offensename as oda_offenseid,
     mda_description as oda_actionid,
     mv_description as oda_violation,
     oda_date,
     oda_createby,
     oda_createdate,
     oda_status
     from offense_disciplinary_actions
     LEFT JOIN master_employee ON offense_disciplinary_actions.oda_employeeid = me_id
     LEFT JOIN master_offense ON offense_disciplinary_actions.oda_offenseid = mo_offenseid
     LEFT JOIN master_disciplinary_action ON offense_disciplinary_actions.oda_actionid = mda_actionid
     LEFT JOIN master_violation ON offense_disciplinary_actions.oda_violation = mv_violationid
   WHERE oda_employeeid = '${employeeid}'`;

    mysql.Select(sql, 'Offense_Disciplinary_Actions', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: "success",
        data: result,
      });
    })
  } catch (error) {
    res.json({
      msg: 'error', error
    })
    
  }
});

router.post('/loadforapp',(req , res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `        
    SELECT 
     me_id as oda_employeeid,
     oda_disciplinaryid,
     mo_offensename as oda_offenseid,
     mda_description as oda_actionid,
     mv_description as oda_violation,
     oda_date,
     oda_createby,
     oda_createdate,
     oda_status
     from offense_disciplinary_actions
     LEFT JOIN master_employee ON offense_disciplinary_actions.oda_employeeid = me_id
     LEFT JOIN master_offense ON offense_disciplinary_actions.oda_offenseid = mo_offenseid
     LEFT JOIN master_disciplinary_action ON offense_disciplinary_actions.oda_actionid = mda_actionid
     LEFT JOIN master_violation ON offense_disciplinary_actions.oda_violation = mv_violationid
   WHERE oda_employeeid = '${employeeid}'
   order by oda_disciplinaryid desc`;

    mysql.Select(sql, 'Offense_Disciplinary_Actions', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: "success",
        data: result,
      });
    })
  } catch (error) {
    res.json({
      msg: 'error', error
    })
    
  }
})


module.exports = router;