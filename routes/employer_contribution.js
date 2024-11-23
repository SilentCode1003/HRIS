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
  Validator(req, res, "employer_contributionlayout", "employer_contribution");
});

module.exports = router;

router.post("/load", (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let sql = `SELECT
            ec_contributionid,
            CONCAT(me_lastname, ' ', me_firstname) AS ec_fullname,
            ec_monthly,
            DATE_FORMAT(ec_payrolldate, '%Y-%m-%d') AS ec_payrolldate,
            ec_pagibig,
            ec_sss,
            ec_philhealth,
            ec_contribution_total,
            DATE_FORMAT(ec_createdate, '%Y-%m-%d %H:%i:%s') AS ec_createdate
        FROM
            employers_contribution
        INNER JOIN
            master_employee ON employers_contribution.ec_employeeid = me_id
        WHERE
            ec_payrolldate = '${payrolldate}'
        `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ec_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/exportreports", (req, res) => {
  try {
    const payrolldate = req.body.payrolldate;

    const sql = `
            SELECT
                CONCAT(me_lastname, ' ', me_firstname) as Full_Name,
                ec_monthly as Monthly,
                ec_payrolldate as Payroll_Date,
                pd_cutoff as Cut_Off,
                ec_pagibig as PagIbig_Employer,
                ec_sss as SSS_Employer,
                ec_philhealth as PhilHealth_Employer,
                ec_wisp as WSIP_Employer,
                ec_emp_pagibig as PagIbig_Employee,
                ec_emp_philhealth as PhilHealth_Employee,
                ec_emp_sss as SSS_Employee,
                ec_emp_wisp as WISP_Employee,
                ec_contribution_total as Total_Contribution,
                DATE_FORMAT(ec_createdate, '%Y-%m-%d %H:%i:%s') AS Create_Date
            FROM employers_contribution
            INNER JOIN master_employee ON employers_contribution.ec_employeeid = me_id
            JOIN payroll_date ON employers_contribution.ec_payrolldate = pd_payrolldate
            WHERE ec_payrolldate = '${payrolldate}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(JsonErrorResponse(err));
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "No data found" });
      }

      result = result.map((row) => {
        return {
          ...row,
          Monthly: formatNumber(row.Monthly),
          Cut_Off: row.Cut_Off,
          PagIbig_Employer: formatNumber(row.PagIbig_Employer),
          SSS_Employer: formatNumber(row.SSS_Employer),
          PhilHealth_Employer: formatNumber(row.PhilHealth_Employer),
          WSIP_Employer: formatNumber(row.WSIP_Employer),
          PagIbig_Employee: formatNumber(row.PagIbig_Employee),
          PhilHealth_Employee: formatNumber(row.PhilHealth_Employee),
          SSS_Employee: formatNumber(row.SSS_Employee),
          WISP_Employee: formatNumber(row.WISP_Employee),
          Total_Contribution: formatNumber(row.Total_Contribution),
          Payroll_Date: formatDate(row.Payroll_Date),
          Create_Date: formatDateTime(row.Create_Date),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(result);
      const workbook = XLSX.utils.book_new();
      const worksheetName = `Contribution_${payrolldate}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

      const headers = Object.keys(result[0]);
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
        `attachment; filename="Employer_Contribution_${payrolldate}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(excelBuffer);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/getcontribution", (req, res) => {
  try {
    let contributionid = req.body.contributionid;
    let sql = `SELECT
            CONCAT(me_lastname, ' ', me_firstname) as ec_fullname,
            me_profile_pic as ec_image,
            ec_monthly,
            DATE_FORMAT(ec_payrolldate, '%Y-%m-%d') AS ec_payrolldate,
            pd_cutoff as ec_cutoff,
            ec_pagibig,
            ec_sss,
            ec_philhealth,
            ec_wisp,
            ec_emp_pagibig,
            ec_emp_philhealth,
            ec_emp_sss,
            ec_emp_wisp,
            ec_contribution_total,
            DATE_FORMAT(ec_createdate, '%Y-%m-%d %H:%i:%s') AS ec_createdate
        FROM employers_contribution
        INNER JOIN master_employee ON employers_contribution.ec_employeeid = me_id
        JOIN payroll_date ON employers_contribution.ec_payrolldate = pd_payrolldate
        WHERE ec_contributionid = '${contributionid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "ec_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

//#region function

function formatNumber(value) {
  return typeof value === "number" && !isNaN(value)
    ? `₱${value.toFixed(2)}`
    : "₱0.00";
}

function formatDate(value) {
  if (value) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return "";
}

function formatDateTime(value) {
  if (value) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().replace("T", " ").substring(0, 19);
    }
  }
  return "";
}

//#endregion
