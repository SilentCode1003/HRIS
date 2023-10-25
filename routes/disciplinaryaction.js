const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('disciplinaryactionlayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = `SELECT 
    mda_actionid,
    mda_actioncode,
    mo_offensename as mda_offenseid,
    mda_description,
    mda_createdate,
    mda_createby,
    mda_status
    from master_disciplinary_action
    LEFT JOIN master_offense ON master_disciplinary_action.mda_offenseid = mo_offenseid`;

    mysql.Select(sql, 'Master_Disciplinary_Action', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    res.json({
      msg:error
    })
    
  }
});

router.post('/save', async (req, res) => {
  try {
    let actioncode = req.body.actioncode;
    let offenseid = req.body.offenseid; // Get the offense name from the request
    let description = req.body.description;
    let createdate = currentDate.format('YYYY-MM-DD');
    let createby = req.body.createby;
    let status = req.body.status;
    console.log('Received department name:', offenseid);

    let offenseIdQuery = `SELECT mo_offenseid FROM master_offense WHERE mo_offensename = '${offenseid}'`;

    const offenseIdResult = await mysql.mysqlQueryPromise(offenseIdQuery, [offenseid]);

    if (offenseIdResult.length > 0) {
      const offenseID = offenseIdResult[0].mo_offenseid; // Retrieve the offense ID

      const data = [
        [actioncode, offenseID, description, createdate, createby, status]
      ];

      mysql.InsertTable('master_disciplinary_action', data, (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error inserting record: ', insertErr);
          res.json({ msg: 'insert_failed' });
        } else {
          console.log(insertResult);
          res.json({ msg: 'success' });
        }
      });
    } else {
      res.json({ msg: 'offense_not_found' });
    }
  } catch (error) {
    console.log(error);
    console.error('Error: ', error);
    res.json({ msg: 'error' });
  }
});
