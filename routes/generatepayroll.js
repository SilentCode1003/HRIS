const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "generatepayrolllayout");
});

module.exports = router;

router.post("/generateandaoadaayroll", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let generateSql = `call hrmis.GeneratePayroll('${startdate}', '${enddate}')`;
    let loadSql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;

    mysql
      .mysqlQueryPromise(generateSql)
      .then((generateResult) => {
        console.log("Payroll generated:", generateResult);
        return mysql.mysqlQueryPromise(loadSql);
      })
      .then((loadResult) => {
        console.log("Payroll loaded:", loadResult);
        res.json({
          msg: "success",
          data: loadResult,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    console.error("Error:", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});


router.post('/checkmissedlogs' , (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql =  `SELECT * 
    FROM master_attendance 
    WHERE ma_attendancedate BETWEEN 
    '${startdate}' AND '${enddate}' AND ma_clockout IS NULL`;

    mysql.Select(sql, "Master_Attendance", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg:'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    })
  }
});

router.post("/loadpayroll", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        console.log(result);
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/loadpayslipsummary", (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadPayslipSummary('${payrolldate}', '${employeeid}')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/loadpayslipdetailed", (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadPayslipDetailed('${payrolldate}', '${employeeid}')`;

    console.log(payrolldate);
    console.log(employeeid);

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getpayrolldate", (req, res) => {
  try {
    let sql = `SELECT DISTINCT 
    DATE_FORMAT(gp_payrolldate, '%Y-%m-%d') as gp_payrolldate,
    concat(gp_startdate,' To ',gp_enddate) as DateRange,
    gp_cutoff
    FROM 
    generate_payroll  
    ORDER BY 
    gp_payrolldate DESC
    LIMIT 2`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/loadpayslipsummaryforapp", (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadPayslipSummaryForApp('${payrolldate}', '${employeeid}')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        console.log(result);
        res.json({
          msg: "success",
          data: result[0],
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/exportfile", async (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `call hrmis.LoadPayrollExport('${startdate}', '${enddate}')`;

    const result = await mysql.mysqlQueryPromise(sql);

    const jsonData = JSON.parse(JSON.stringify(result[0]));

    if (jsonData.length === 0) {
      return res.status(404).json({ msg: "No data found" });
    }

    const headers = Object.keys(jsonData[0]);

    const worksheet = XLSX.utils.json_to_sheet(jsonData, { header: headers });
    const workbook = XLSX.utils.book_new();
    const worksheetName = `${startdate}_${enddate}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    const columnCount = XLSX.utils.decode_range(worksheet["!ref"]).e.c + 1;
    worksheet["!cols"] = [];
    for (let i = 0; i < columnCount; i++) {
      if (i === 0) {
        worksheet["!cols"].push({ wch: 30 }); 
      } else {
        worksheet["!cols"].push({ wch: 20 }); 
      }
    }
    const excelBuffer = XLSX.write(workbook, { type: "buffer" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payroll_data_${startdate}_${enddate}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );    
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: "error", data: error });
  }
});
