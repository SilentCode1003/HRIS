const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('disciplinarylayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = `SELECT 
    oda_disciplinaryid,
    me_id as oda_employeeid,
    mo_offenseid as oda_offenseid,
    mda_actioncode as oda_actionid,
    mv_description as oda_violation,
    oda_date,
    oda_createby,
    oda_createdate,
    oda_status
    from offense_disciplinary_actions
    LEFT JOIN master_employee ON offense_disciplinary_actions.oda_employeeid = me_id
    LEFT JOIN master_offense ON offense_disciplinary_actions.oda_offenseid = mo_offenseid
    LEFT JOIN master_disciplinary_action ON offense_disciplinary_actions.oda_actionid = mda_actionid
    LEFT JOIN master_violation ON offense_disciplinary_actions.oda_violation = mv_violationid`;

    mysql.Select(sql, 'Offense_Disciplinary_Actions', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    res.json({
      msg: error
    })

  }
});

router.post('/getactionoffense', (req, res) => {
  try {
    let description = req.body.description;
    let sql = `
    SELECT 
        mda.mda_actionid AS actionid,
        mda.mda_actioncode AS actioncode,
        mo.mo_offenseid AS offenseid,
        mo.mo_offensename AS offensename,
        mda.mda_description AS actiondescription,
        mv.mv_violationid AS violationid,
        mv.mv_description AS violationdescription
      FROM master_disciplinary_action mda
      RIGHT JOIN master_offense mo ON mo.mo_offenseid = mda.mda_offenseid
      RIGHT JOIN master_violation mv ON mda.mda_actionid = mv.mv_actionid
      WHERE mv.mv_description = '${description}'
    `;

    mysql.mysqlQueryPromise(sql)
      .then((result) => {
        console.log(
          result
        );

        res.json({
          msg: 'success',
          data: result
        })
      })
      .catch((error) => {
        return res.json({
          msg: error
        })
      });
  } catch (error) {
    console.error('Error: ', error);
    res.json({
      msg: 'error',
      data: null
    });
  }
});

router.post('/getactioncode', (req, res) => {
  try {
    let actioncode = req.body.actioncode;
    let index = actioncode[0];
    let sql = `
    SELECT 
    mda_actionid as actionid,
    mda_actioncode as actioncode,
    mda_description as description,
    mo_offensename as offencename,
    mo_offenseid as offenseid
    FROM master_disciplinary_action
    inner join master_offense on mda_offenseid = mo_offenseid
    where mda_actioncode like '${index}%'
    `;

    mysql.mysqlQueryPromise(sql)
      .then((result) => {
        console.log(
          result
        );

        res.json({
          msg: 'success',
          data: result
        })
      })
      .catch((error) => {
        return res.json({
          msg: error
        })
      });
  } catch (error) {
    console.error('Error: ', error);
    res.json({
      msg: 'error',
      data: null
    });
  }
});

router.post('/getoffensename', (req ,res) => {
  try {
    let offensename = req.body.offensename;
    let sql =`  SELECT 
    mda_actionid as actionid,
    mda_actioncode as actioncode,
    mda_description as description,
    mo_offensename as offencename,
    mo_offenseid as offenseid
    FROM master_disciplinary_action
    inner join master_offense on mda_offenseid = mo_offenseid
    where mo_offensename like '${offensename}'`;

    mysql.mysqlQueryPromise(sql)
      .then((result) => {
        console.log(
          result
        );

        res.json({
          msg: 'success',
          data: result
        })
      })
      .catch((error) => {
        return res.json({
          msg: error
        })
      });
  } catch (error) {
    console.error('Error: ',error);
    res.json({
      ms: 'error',
      data: null
    });
    
  }
});

router.post('/getoffenseaction',(res,req) => {
  try {
    let actioncode = req.body.actioncode;
    let index = offensename[0];
    let sql = `  SELECT 
    mda_actioncode as actioncode,
    mda_description as description
    FROM master_disciplinary_action
    inner join master_offense on mda_offenseid = mo_offenseid
    where mda_actioncode like '${actioncode}%'
    AND mo_offensename like '${index}'`; 


    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      console.log(
        result
      );

      res.json({
        msg: 'success',
        data: result
      })
    })
    .catch((error) => {
      return res.json({
        msg: error
      })
    });
} catch (error) {
  console.error('Error: ',error);
  res.json({
    ms: 'error',
    data: null
  });
  
}
});