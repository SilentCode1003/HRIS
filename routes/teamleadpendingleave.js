const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { ValidatorForTeamLead } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, 'teamleadpendingleavelayout');
});

module.exports = router;


router.get('/load', (req, res,) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `select 
    l_leaveid,
    concat(me_firstname,'',me_lastname) as l_employeeid,
    l_leavestartdate,
    l_leaveenddate,
    l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    where l_leavestatus = 'Pending'
    AND me_department = '${departmentid}'
    AND l_employeeid NOT IN (
      SELECT tu_employeeid FROM teamlead_user)`;
    
    mysql.Select(sql, 'Leaves', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    console.log(error);
  }
})
module.exports = router;