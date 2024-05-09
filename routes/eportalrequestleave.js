const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestleavelayout");
});

module.exports = router;

router.post('/loadheader', (req,res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let employeeid = req.body.employeeid;
    let sql =  `select 
    ml_leavetype as leavetype,
    ml_unusedleavedays as unused,
    ml_totalleavedays as totalleave,
    ml_usedleavedays as used
    from master_leaves
    where ml_employeeid = '${employeeid}' 
    and ml_id = '${leavesettingsid}'`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      });
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/loadheaderforapp', (req,res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql =  `select 
    ml_leavetype as leavetype,
    ml_totalleavedays as totalleave,
    ml_unusedleavedays as unused,
    ml_usedleavedays as used,
    (select 
    count(l_leavestatus) as Pending
    from leaves
    where l_leavestatus = 'Pending') as Pending
    from master_leaves
    where ml_employeeid = '${employeeid}'`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      });
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});

router.get('/loadpending' , (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Pending' AND l_employeeid = '${employeeid}'`;
    
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


router.get('/loadapproved' , (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Approved' AND l_employeeid = '${employeeid}'`;
    
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


router.get('/loadrejected' , (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Rejected' AND l_employeeid = '${employeeid}'`;
    
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


router.get('/loadcancelled' , (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Cancel' AND l_employeeid = '${employeeid}'`;
    
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

router.post("/submit", async (req, res) => {
  try {
    const employeeid = req.body.employeeid;
    const { startdate, enddate, leavetype, reason, image } = req.body;
    const createdate = currentDate.format("YYYY-MM-DD");
    const status = "Pending";
    const durationDays = req.body.durationDays;
    const paidDays = req.body.paidDays;
    const unpaidDays = req.body.unpaidDays;

    console.log(startdate, enddate, leavetype, reason, employeeid, durationDays, paidDays, unpaidDays);

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [
        employeeid,
        startdate,
        enddate,
        leavetype,
        reason,
        image,
        status,
        createdate,
        durationDays,
        paidDays,
        unpaidDays
      ],
    ];

    mysql.InsertTable("leaves", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        console.log(insertResult);
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submit route: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/getleave", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT *
    FROM leaves
    WHERE l_employeeid = '${employeeid}'
    ORDER BY l_leaveid DESC;`;
    console.log(employeeid);

    mysql.Select(sql, "Leaves", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/cancelLeave", async (req, res) => {
  try {
    const leaveid = req.body.leaveid;

    const updateLeaveStatusQuery = `UPDATE leaves SET l_leavestatus = 'Cancelled' WHERE l_leaveid = ${leaveid}`;

    try {
      await mysql.mysqlQueryPromise(updateLeaveStatusQuery, [leaveid]);
      res.json({ msg: "success", leaveid: leaveid, status: "cancelled" });
    } catch (updateError) {
      console.error("Error updating leave status: ", updateError);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error in /cancelLeave route: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", (req, res) => {
  try {
    let leaveid = req.body.leaveid;
    let status = req.body.status;
    let comment = req.body.comment;

    let sqlupdate = `UPDATE 
    leaves SET l_leavestatus = '${status}', 
    l_comment = '${comment}'  
    WHERE l_leaveid = '${leaveid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        console.log(sqlupdate);

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.get("/loadleavetype", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) as ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    inner join master_employee on master_leaves.ml_employeeid = me_id
    where ml_employeeid = '${employeeid}'
    and ml_year = YEAR(CURDATE())`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getunusedleave", (req, res) => {
  try {
    let leavetype = req.body.leavetype;
    let sql = `SELECT
    ml_unusedleavedays
    FROM master_leaves
    WHERE ml_id = '${leavetype}'`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});



router.post("/loadleavetypeforapp", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) as ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    inner join master_employee on master_leaves.ml_employeeid = me_id
    where ml_employeeid = '${employeeid}'
    and ml_year = year(curdate())`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
