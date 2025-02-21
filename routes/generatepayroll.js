const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx", "xlsx-style");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "generatepayrolllayout", "generatepayroll");
});

module.exports = router;

// router.post("/generateandaoadaayroll", async (req, res) => {
//   try {
//     let startdate = req.body.startdate;
//     let enddate = req.body.enddate;

//     let checkExistingSql = `SELECT gp_startdate, gp_enddate FROM generate_payroll
//                             WHERE gp_startdate >= '${startdate}'
//                             AND gp_enddate <= '${enddate}'`;

//     let existingEntries = await mysql.mysqlQueryPromise(checkExistingSql);

//     if (existingEntries.length > 0) {
//       let existingDates = existingEntries.map((entry) => ({
//         startdate: entry.gp_startdate,
//         enddate: entry.gp_enddate,
//       }));

//       return res.json({
//         msg: "exist",
//         data: existingDates,
//         message: "Payroll data already exists for the specified date range",
//       });
//     }

//     let generateSql = `call hrmis.GeneratePayroll('${startdate}', '${enddate}')`;
//     let loadSql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;

//     mysql
//       .mysqlQueryPromise(generateSql)
//       .then((generateResult) => {
//         console.log("Payroll generated:", generateResult);
//         return mysql.mysqlQueryPromise(loadSql);
//       })
//       .then((loadResult) => {
//         console.log("Payroll loaded:", loadResult);
//         res.json({
//           msg: "success",
//           data: loadResult,
//         });
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//         res.json({
//           msg: "error",
//           data: error,
//         });
//       });
//   } catch (error) {
//     console.error("Error:", error);
//     res.json({
//       msg: "error",
//       data: error,
//     });
//   }
// });

router.post("/generateandaoadaayroll", async (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let checkExistingSql = `SELECT gp_startdate, gp_enddate FROM generate_payroll 
    WHERE gp_startdate >= '${startdate}' 
    AND gp_enddate <= '${enddate}'`;

    let existingEntries = await mysql.mysqlQueryPromise(checkExistingSql);

    if (existingEntries.length > 0) {
      let existingDates = existingEntries.map((entry) => ({
        startdate: entry.gp_startdate,
        enddate: entry.gp_enddate,
      }));

      return res.json({
        msg: "exist",
        data: existingDates,
        message: "Payroll data already exists for the specified date range",
      });
    }

    let generateSql = `call hrmis.GeneratePayroll('${startdate}', '${enddate}')`;
    let loadSql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;
    try {
      let generateResult = await mysql.mysqlQueryPromise(generateSql);
      console.log("Payroll generated:", generateResult);

      let loadResult = await mysql.mysqlQueryPromise(loadSql);
      let payrollDate;
      if (
        loadResult &&
        loadResult.length > 0 &&
        loadResult[0] &&
        loadResult[0][0]
      ) {
        payrollDate = loadResult[0][0].PayrollDate;
      } else {
        throw new Error("Payroll date not found in LoadPayroll result");
      }
      let contributionSql = `call hrmis.GenerateEmployersContribution('${payrollDate}')`;
      let contributionResult = await mysql.mysqlQueryPromise(contributionSql);
      res.json({
        msg: "success",
        data: contributionResult,
      });
    } catch (error) {
      console.error("Error:", error);
      res.json({
        msg: "error",
        data: error,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});


router.post("/checkmissedlogs", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `SELECT * 
    FROM master_attendance 
    WHERE ma_attendancedate BETWEEN 
    '${startdate}' AND '${enddate}' AND ma_clockout IS NULL OR ma_clockin IS NULL`;

    mysql.Select(sql, "Master_Attendance", (err, result) => {
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


router.post("/loadpayroll", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;

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


router.get("/payrolldateload", (req, res) => {
  try {
    let sql = `SELECT DISTINCT 
    DATE_FORMAT(gp_payrolldate, '%Y-%m-%d') as gp_payrolldate,
    concat(gp_startdate,' To ',gp_enddate) as gp_date_range,
    gp_cutoff
    FROM 
    generate_payroll
    order by gp_payrolldate desc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gp_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/exportbank", async (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let bankname = req.body.bankname;
    let sql = `call hrmis.ExportBankStatement('${payrolldate}', '${bankname}')`;

    const result = await mysql.mysqlQueryPromise(sql);

    const jsonData = JSON.parse(JSON.stringify(result[0]));

    if (jsonData.length === 0) {
      return res.status(404).json({ msg: "No data found" });
    }

    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook = XLSX.utils.book_new();
    const worksheetName = `${payrolldate}_${bankname}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    const headers = Object.keys(jsonData[0]);
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    });

    worksheet["!cols"] = headers.map((header, index) => ({
      wch: index === 0 ? 30 : 20,
    }));

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      bookSST: false,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bank_statement_${payrolldate}_${bankname}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(excelBuffer);
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});


router.post("/sudden_deduc_load", (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let sql = `SELECT
    sd_deduction_name,
    sd_amount
    FROM sudden_deductions
    WHERE sd_payrolldate = '${payrolldate}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "sd_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});
