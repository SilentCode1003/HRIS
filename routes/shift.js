const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('shiftlayout', { title: 'Express' });
  Validator(req, res, "shiftlayout");
});

module.exports = router;

router.post("/getshift", (req, res) => {
  try {
    let shiftid = req.body.shiftid;
    let sql = `call hrmis.GetShift('${shiftid}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `call hrmis.LoadShift()`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.error("Error: ", err);

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

router.post("/loadshiftforapp", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadShiftForApp('${employeeid}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.error("Error: ", err);

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

// router.post("/save", async (req, res) => {
//   try {
//     let employeeName = req.body.employeeName;
//     let department = req.body.department;
//     let mondayformat = req.body.mondayformat;
//     let tuesdayformat = req.body.tuesdayformat;
//     let wednesdayformat = req.body.wednesdayformat;
//     let thursdayformat = req.body.thursdayformat;
//     let fridayformat = req.body.fridayformat;
//     let saturdayformat = req.body.saturdayformat;
//     let sundayformat = req.body.sundayformat;

//     let data = [];

//     data.push([
//       employeeName,
//       department,
//       mondayformat,
//       tuesdayformat,
//       wednesdayformat,
//       thursdayformat,
//       fridayformat,
//       saturdayformat,
//       sundayformat,
//     ]);

//     console.log(data);

//     let sql = `SELECT * FROM master_shift WHERE ms_employeeid = '${employeeName}'`;

//     console.log(sql);

//     mysql.Select(sql, "Master_Shift", (err, result) => {
//       if (err) console.error("Error: ", err);

//       if (result.length != 0) {
//         res.json({
//           msg: "exist",
//           data: err,
//         });
//       } else {
//         mysql.InsertTable("master_shift", data, (err, result) => {
//           if (err) console.error("Error: ", err);

//           console.log(result);

//           res.json({
//             msg: "success",
//             data: result,
//           });
//         });
//       }
//     });
//   } catch (error) {
//     res.json({
//       msg: "error",
//       data: error,
//     });
//   }
// });

// router.post('/save', (req ,res) => {
//   try {
//     let employeeName = req.body.employeeName;
//     let department = req.body.department;
//     let shiftsettingsid = req.body.shiftsettingsid;
//     let sql = `call hrmis.InsertShift(
//     '${employeeName}', '${department}', '${shiftsettingsid}')`;

//     mysql.StoredProcedure(sql , (err, result) => {
//       if (err) console.error("Error :", err)

//       console.log(result);
//       res.json({
//         msg:'success',
//         data: result,
//       });
//     });
//   } catch (error) {
//     res.json({
//       msg:'error',
//       data: error,
//     });
//   }
// });

router.post('/save', async (req, res) => {
  try {
    let employeeName = req.body.employeeName;
    let department = req.body.department;
    let shiftsettingsid = req.body.shiftsettingsid;

    console.log(employeeName, department, shiftsettingsid);

    let checkSql = `SELECT * FROM master_shift WHERE ms_employeeid = '${employeeName}'`;
    
    mysql.Select(checkSql, "Master_Shift" , (err ,result) => {
      if (err) {
        console.error("Error checking data:", err);
        return res.json({
          msg: 'error',
          data: err,
        });
      }

      if (result.length > 0) {
        return res.json({
          msg: 'exist',
          data: result,
        });
      }

      let sql = `call hrmis.InsertShift('${employeeName}', '${department}', '${shiftsettingsid}')`;

      mysql.StoredProcedure(sql, (err, result) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.json({
            msg: 'error',
            data: err,
          });
        }

        console.log(result);
        res.json({
          msg: 'success',
          data: result,
        });
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.json({
      msg: 'error',
      data: error,
    });
  }
});




router.post("/update", (req, res) => {
  try {
    let shiftid = req.body.shiftid;
    let employeeName = req.body.employeeName;
    let department = req.body.department;
    let mondayformat = req.body.mondayformat;
    let tuesdayformat = req.body.tuesdayformat;
    let wednesdayformat = req.body.wednesdayformat;
    let thursdayformat = req.body.thursdayformat;
    let fridayformat = req.body.fridayformat;
    let saturdayformat = req.body.saturdayformat;
    let sundayformat = req.body.sundayformat;

    console.log(shiftid);

    let sqlupdate = `update master_shift set 
    ms_monday = '${mondayformat}',
    ms_tuesday = '${tuesdayformat}',
    ms_wednesday = '${wednesdayformat}',
    ms_thursday = '${thursdayformat}',
    ms_friday = '${fridayformat}',
    ms_saturday = '${saturdayformat}',
    ms_sunday = '${sundayformat}'
    WHERE ms_id = '${shiftid}'`;

    console.log(sqlupdate);
    mysql
      .Update(sqlupdate)
      .then((result) => {
        console.log(result);

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: 'error',
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

