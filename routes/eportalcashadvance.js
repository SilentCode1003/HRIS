const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalcashadvancelayout', { title: 'Express' });
  Validator(req, res, 'eportalcashadvancelayout');
});

module.exports = router;

router.post('/submit', async (req, res) => {
  try {
    const employeeid = req.session.employeeid; 
    const { amount, purpose,} = req.body;
    const requestdate = currentDate.format('YYYY-MM-DD');
    const status = 'Pending';
    const approvaldate = 'On Process';
   
    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: 'Invalid employee ID' });
    }

    const data = [
      [employeeid, requestdate, amount, purpose, status, approvaldate]
    ];

   
    mysql.InsertTable('cash_advance', data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error('Error inserting leave record: ', insertErr);
        res.json({ msg: 'insert_failed' });
      } else {
        console.log(insertResult);
        res.json({ msg: 'success' });
      }
    });
  } catch (error) {
    console.error('Error in /submit route: ', error);
    res.json({ msg: 'error' });
  }
});



router.post('/submitforapp', async (req, res) => {
  try {
    const employeeid = req.body.employeeid; 
    const { amount, purpose,} = req.body;
    const requestdate = currentDate.format('YYYY-MM-DD');
    const status = 'Pending';
    const approvaldate = 'On Process';
   
    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: 'Invalid employee ID' });
    }

    const data = [
      [employeeid, requestdate, amount, purpose, status, approvaldate]
    ];

   
    mysql.InsertTable('cash_advance', data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error('Error inserting leave record: ', insertErr);
        res.json({ msg: 'insert_failed' });
      } else {
        console.log(insertResult);
        res.json({ msg: 'success' });
      }
    });
  } catch (error) {
    console.error('Error in /submit route: ', error);
    res.json({ msg: 'error' });
  }
});



router.get('/load',(req , res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT * FROM cash_advance WHERE ca_employeeid = '${employeeid}'
    order by ca_cashadvanceid desc`;

    mysql.Select(sql, 'Cash_Advance', (err, result) => {
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

router.post('/getload',(req , res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM cash_advance WHERE ca_employeeid = '${employeeid}'
    order by ca_cashadvanceid desc`;

    mysql.Select(sql, 'Cash_Advance', (err, result) => {
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

router.post('/update', (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let status = req.body.status; 

    let sqlupdate =  `UPDATE 
        cash_advance SET ca_status = '${status}'
        WHERE ca_cashadvanceid = '${cashadvanceid}'`;

    mysql.Update(sqlupdate)
    .then((result) =>{
      console.log(sqlupdate);
  
      res.json({
        msg: 'success',
        data: result
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
      msg: 'error'
    })
  }
});


router.post('/getca', (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let sql = `select ca_amount as amount,
    ca_purpose as purpose,
    ca_status as status
    from cash_advance
    where ca_cashadvanceid = '${cashadvanceid}'`;

    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
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
    res.json({
      msg:error
    })
    
  }
});


router.post("/cancelcashadvanced", async (req, res) => {
  try {
    const cashadvanceid = req.body.cashadvanceid;

    const updateCashAdvanceStatusQuery = `UPDATE cash_advance SET ca_status = 'Cancelled' WHERE ca_cashadvanceid = ${cashadvanceid}`;

    try {
      await mysql.mysqlQueryPromise(updateCashAdvanceStatusQuery, [cashadvanceid]);
      res.json({ msg: "success", cashadvanceid: cashadvanceid, status: "Cancelled" });
    } catch (updateError) {
      console.error("Error updating cashadvance status: ", updateError);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error in /cancelcashadvance route: ", error);
    res.json({ msg: "error" });
  }
});
