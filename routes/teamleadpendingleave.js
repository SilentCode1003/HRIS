const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorForTeamLead } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, 'teamleadpendingleavelayout');
});

module.exports = router;


router.get('/load', (req, res,) => {
  try {
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    l_leaveid,
    concat(me_lastname,' ',me_firstname) as l_employeeid,
    DATE_FORMAT(l_leavestartdate, '%Y-%m-%d %H:%i:%s') AS l_leavestartdate,
    DATE_FORMAT(l_leaveenddate, '%Y-%m-%d %H:%i:%s') AS l_leaveenddate,
    l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    FROM leaves
    INNER JOIN
    master_employee ON leaves.l_employeeid = me_id
    WHERE l_leavestatus = 'Pending' AND l_subgroupid = '${subgroupid}'
    AND me_department = '${departmentid}'
    AND l_employeeid NOT IN (
        SELECT tu_employeeid FROM teamlead_user)
      AND l_approvalcount = (
        SELECT ats_count
        FROM aprroval_stage_settings
        WHERE ats_accessid = '${accesstypeid}'
    )`;
    
    mysql.Select(sql, 'Leaves', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    console.log(error);
  }
});



router.post('/leaveaction', (req, res) => {
  console.log('HIT');
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;
    let leaveid = req.body.leaveid;
    let status = req.body.status;
    let comment = req.body.comment;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
  
    let data = [];
  
    data.push([
      employeeid,
      departmentid,
      leaveid,
      subgroupid,
      status,
      createdate,
      comment,
    ])
    
    mysql.InsertTable("leave_request_activity", data, (err, result) => {
      if (err) console.error('Error: ', err);

      console.log(result);

      res.json({
        msg: 'success',
        data: result,
      })
    });
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});