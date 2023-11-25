const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('resignedlayout', { title: 'Express' });
  Validator(req, res, 'resignedlayout');
});

module.exports = router;

router.get('/load', (req, res,) => {
    try {
      let sql = `select 
      mr_resignedid,
      concat(me_firstname,'',me_lastname) as mr_employeeid,
      mr_reason,
      mr_dateresigned,
      mr_status,
      mr_createby,
      mr_createdate
      from master_resigned
      left join master_employee on master_resigned.mr_employeeid = me_id
      where mr_status = 'Resigned'`;
      
      mysql.Select(sql, 'Master_Resigned', (err, result) => {
        if (err) console.error('Error: ', err);
  
        res.json({
          msg: 'success', data: result
        });
      });
    } catch (error) {
      console.log(error);
    }
  });

//   router.post('/save', (req, res) => {
//     try {
      
//       let newEmployeeId = req.body.newEmployeeId;
//       let reason = req.body.reason; 
//       let dateresigned = req.body.dateresigned;
//       let status = req.body.status;
//       let createby = req.session.fullname; 
//       let createdate = currentDate.format('YYYY-MM-DD');
  
    
//       let data = [];
    
//       data.push([
//         newEmployeeId, reason, dateresigned, status, createby, createdate,
//       ])
//       let query = `SELECT * FROM master_resigned WHERE mr_employeeid = '${newEmployeeId}'`;
//       mysql.Select(query, 'Master_Resigned', (err, result) => {
//         if (err) console.error("Error: ", err);
  
//         if (result.length != 0) {
//           res.json({
//             msg: "exist"
//           });
//         }
//         else {
//           mysql.InsertTable('master_resigned', data, (err, result) => {
//             if (err) console.error('Error: ', err);
  
//             console.log(result);
  
//             res.json({
//               msg: 'success'
//             })
//           })
//         }
//       });
  
      
//     } catch (error) {
//       res.json({
//         msg: 'error'
//       })
//     }
//   });

