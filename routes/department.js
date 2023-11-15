const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('departmentlayout', { title: 'Express' });
  Validator(req, res, 'departmentlayout');
});

module.exports = router;

router.post('/getdepartment', (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let sql = `SELECT
      md_departmentname as departmentname,
      md_departmenthead as departmenthead,
      md_status as status
      FROM master_department
      WHERE md_departmentid = '${departmentid}'`;

    mysql.mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result
          });
        } else {
          res.status(404).json({
            msg: "Department not found"
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error
    });
  }
});

router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_department';

    mysql.Select(sql, 'Master_Department', (err, result) => {
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

router.post('/save', (req, res) => {
  try {
    
    let departmentname = req.body.departmentname;
    let departmenthead = req.body.departmenthead;
    let createby = req.session.fullname; 
    let createdate = currentDate.format('YYYY-MM-DD');
    let status = req.body.status;

  
    let data = [];
  
    data.push([
      departmentname, departmenthead, createby, createdate, status,
    ])
    let query = `SELECT * FROM master_department WHERE md_departmentname = '${departmentname}'`;
    mysql.Select(query, 'Master_Department', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_department', data, (err, result) => {
          if (err) console.error('Error: ', err);

          console.log(result);

          res.json({
            msg: 'success'
          })
        })
      }
    });

    
  } catch (error) {
    res.json({
      msg: 'error'
    })
  }
  });


  router.post('/update', (req, res) => {
    try {
      let departmentid = req.body.departmentid;
      let departmentname = req.body.departmentname;
      let departmenthead = req.body.departmenthead;
      let status = req.body.status;
      
      let sqlupdate = `UPDATE master_department SET   
      md_departmentname ='${departmentname}', 
      md_departmenthead ='${departmenthead}', 
      md_status ='${status}' 
      WHERE md_departmentid ='${departmentid}'`;

      mysql.Update(sqlupdate)
      .then((result) =>{
        console.log(result);
    
        res.json({
          msg: 'success'
        })
      })
      .catch((error) =>{
        res.json({
          msg:error
        })
        
      });
      
      // mysql.Update(sqlupdate, (err,result) =>{
      //   if(err) console.error('Error: ', err);
    
      //   console.log(result);
    
      //   res.json({
      //     msg: 'success'
      //   })
      // })
    
    } catch (error) {
      res.json({
        msg: 'error'
      })
    }
    });

  // router.post('/update', async (req, res) => {
  //   try {
  //     // Retrieve request parameters
  //     let departmentid = departmentid;
  //     let departmentname = req.body.departmentname;
  //     let departmenthead = req.body.departmenthead;
  //     let status = req.body.status;
     
  //     let data = [];
  
  //     data.push([
  //       departmentid, departmentname, departmenthead, status,
  //     ])
  //     let query =  `UPDATE master_department SET
  //     md_departmentname as departmentname, 
  //     md_departmenthead as departmenthead,  
  //     md_status as status 
  //     WHERE md_departmentid = '${departmentid}'`;
  
  //     mysql.Update(query, data,(err , result) => {
  //       if(err) console.error('Error', err);

  //       console.log(data);
  //       console.log(result);

  //       res.json({
  //         msg:'success'
  //       })
  //     })

  //   } catch (error) {
  //     res.status(500).json({
  //       msg: 'error'
  //     });
  //   }
  // });