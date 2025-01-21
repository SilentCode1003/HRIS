var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  InsertStatementTransCommit,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { Select, Insert, Update, Check } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
  JsonWarningResponse,
  MessageStatus,
} = require("./repository/response");
const { REQUEST_STATUS, REQUEST } = require("./repository/enums");
const { SendEmailNotification } = require("./repository/emailsender");

const XLSX = require("xlsx", "xlsx-style");

var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "payslipsummarylayout", "payslipsummary");
});

module.exports = router;

router.get("/getallpayslip/:year/:month", (req, res) => {
  try {
    const { year, month } = req.params;
    let yearMonth = `${year}-${month}%`;

    console.log(yearMonth);

    let sql = `select 
        p_employeeid,
        p_sssid,
        p_tinid,
        p_philhealthid,
        p_fullname,
        p_position,
        p_department,
        p_payrolltype,
        sum(p_compensation) as p_compensation,
        sum(p_overall_netpay) as p_overall_netpay,
        sum(p_total_deductions) as p_total_deductions,
        sum(p_total_netpay) as p_total_netpay
        from payslip 
        where p_payrolldate like '${year}-${month}%'
        group by 
        p_employeeid,
        p_sssid,
        p_tinid,
        p_philhealthid,
        p_fullname,
        p_position,
        p_department,
        p_payrolltype`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "p_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/exportfile/:year/:month", (req, res) => {
  try {
    const { year, month } = req.params;
    let yearMonth = `${year}-${month}%`;

    let sql = `select 
    p_employeeid,
    p_sssid,
    p_tinid,
    p_philhealthid,
    SUM(p_present) as p_present,
    SUM(p_restday) as p_restday,
    SUM(p_leaveday) as P_leaveday,
    SUM(p_absent) as p_absent,
    SUM(p_restday_ot) as p_restday_ot,
    p_fullname,
    p_position,
    p_department,
    p_payrolltype,
    sum(p_salary) as p_salary,
    sum(p_allowances) as p_allowances,
    sum(p_compensation) as p_compensation,
    sum(p_approveNormalOT) as p_approveNormalOT,
    sum(p_approvedNightOT) as p_approvedNightOT,
    sum(p_approvedEarlyOT) as p_approvedEarlyOT,
    sum(p_restday_ot) as p_restday_ot,
    sum(p_regularholidayComp) as p_regularholidayComp,
    sum(p_specialholidayComp) as p_specialholidayComp,
    sum(p_regularholidayOT) as p_regularholidayOT,
    sum(p_specialholidayOT) as p_specialholidayOT,
    sum(p_leaveday) as p_leaveday,
    sum(p_payroll_adjustments) as p_payroll_adjustments,
    sum(p_suspension_pay) as p_suspension_pay,
    sum(p_overall_netpay) as p_overall_netpay,
    sum(p_absent_deductions) as p_absent_deductions,
    sum(p_leave_with_out_pay_deductions) as p_leave_with_out_pay_deductions,
    sum(p_payroll_adjustments_deductions) as p_payroll_adjustments_deductions,
    sum(p_wisp_deductions) as p_wisp_deductions,
    sum(p_late_deductions) as p_late_deductions,
    sum(p_sss_dedcutions) as p_sss_dedcutions,
    sum(p_pagibigdeductions) as p_pagibigdeductions,
    sum(p_philhealthdeductions) as p_philhealthdeductions,
    sum(p_tindeductions) as p_tindeductions,
    sum(p_healthcard) as p_healthcard,
    sum(p_sudden_deductions) as p_sudden_deductions,
    sum(p_calamity_loan) as p_calamity_loan,
    sum(p_shortterm_loan) as p_shortterm_loan,
    sum(p_housing_loan) as p_housing_loan,
    sum(p_education_loan) as p_education_loan,
    sum(p_sterling_loan) as p_sterling_loan,
    sum(p_total_deductions) as p_total_deductions,
    sum(p_total_netpay) as p_total_netpay,
    sum(p_accrued13thmonth) as p_accrued13thmonth
    from payslip 
    where p_payrolldate like '${year}-${month}%'
    group by p_employeeid,
    p_sssid,
    p_tinid,
    p_philhealthid,
    p_fullname,
    p_position,
    p_department,
    p_payrolltype`;

    async function ProcessData() {
      const result = await Check(sql);
      

      const jsonData = DataModeling(result, "p_");

      if (jsonData.length === 0) {
        return res.status(404).json({ msg: "No data found" });
      }


      console.log(jsonData);
      const headers = Object.keys(jsonData[0]);

      const worksheet = XLSX.utils.json_to_sheet(jsonData, { header: headers });
      const workbook = XLSX.utils.book_new();
      const worksheetName = `${year}-${month}`;
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
        `attachment; filename="payroll_data_${yearMonth}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.send(excelBuffer);
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
