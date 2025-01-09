const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");
const { Select, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { SelectStatement, InsertStatement } = require("./repository/customhelper");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('salarylayout', { title: 'Express' });
  Validator(req, res, "retropaylayout", "retropay");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    rp_employeeid,
    rp_fullname,
    rp_salary,
    DATE_FORMAT(MIN(rp_payrolldate), '%Y-%m-%d') AS rp_payroll_start_date,
    DATE_FORMAT(MAX(rp_payrolldate), '%Y-%m-%d') AS rp_payroll_end_date,
    p_salary AS rp_payslip_salary,
    ms_payrolltype AS rp_payrolltype,
    mp_positionname AS rp_positionname,
    md_departmentname AS rp_departmentname
    FROM 
        retro_payslip
    INNER JOIN payslip ON retro_payslip.rp_employeeid = payslip.p_employeeid
    INNER JOIN master_salary ON retro_payslip.rp_employeeid = master_salary.ms_employeeid
    INNER JOIN master_employee ON retro_payslip.rp_employeeid = master_employee.me_id
    INNER JOIN master_department ON master_employee.me_department = master_department.md_departmentid
    INNER JOIN master_position ON master_employee.me_position = master_position.mp_positionid
    GROUP BY 
    rp_employeeid,
    rp_fullname,
    rp_salary,
    p_salary,
    ms_payrolltype,
    mp_positionname,
    md_departmentname`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }


      if (result != 0) {
        let data = DataModeling(result, "rp_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    const employeeid = req.body.employeeid;
    const monthly = parseFloat(req.body.monthly);
    const startpayrolldate = req.body.startpayrolldate;
    const endpayrolldate = req.body.endpayrolldate;
    const basic_adjustments = req.body.basic_adjustments;
    const allowances = parseFloat(req.body.allowances);

    const selectpayrolldate = `
      SELECT DISTINCT 
      DATE_FORMAT(p_payrolldate, '%Y-%m-%d') AS p_payrolldate
      FROM payslip
      WHERE p_payrolldate BETWEEN '${startpayrolldate}' AND '${endpayrolldate}'
      AND p_employeeid = '${employeeid}'`;

    Select(selectpayrolldate, (err, result) => {
      if (err) {
        console.error(err);
        return res.json(JsonErrorResponse(err));
      }


      if (result.length > 0) {
        result.forEach((row) => {
          const payrolldate = row.p_payrolldate;
          const cutoff = monthly / 2;
          const perday = (monthly / 313) * 12;
          const cuttoff_and_allowances = cutoff + allowances;
          const nightdiff_ot = perday * 0.35 + perday;
          const normal_ot = perday * 0.25 + perday;
          const per_hour = perday / 8;

          const sql = `
            CALL hrmis.GenerateRetroPay(
              '${payrolldate}', 
              '${employeeid}', 
              '${monthly}', 
              '${cutoff}', 
              '${basic_adjustments}', 
              '${allowances}', 
              '${perday}', 
              '${cuttoff_and_allowances}',
              '${nightdiff_ot}', 
              '${normal_ot}',
              '${per_hour}'
            )`;

          mysql.StoredProcedure(sql, (errUpdate, resultUpdate) => {
            if (errUpdate) {
              console.error("Error in InsertRetroPay: ", errUpdate);
              return res.json(JsonErrorResponse(errUpdate));
            }
          });
        });

        res.json({
          msg: "success",
          data: result.map((row) => row.p_payrolldate),
        });
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/viewretropay", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startpayrolldate = req.body.startpayrolldate;
    let endpayrolldate = req.body.endpayrolldate;
    let sql = `SELECT 
    me_profile_pic as rp_image,
    rp.rp_employeeid,
    rp.rp_fullname,
    rp.rp_salary,
    p.p_salary as rp_old_salary,
    (SELECT 
        SUM(CASE WHEN rp_sub.rp_total_netpay > 0 THEN rp_sub.rp_total_netpay ELSE 0 END)
    FROM retro_payslip rp_sub 
    WHERE rp_sub.rp_employeeid = rp.rp_employeeid
    ) AS rp_retro_netpay,
    (SELECT 
        SUM(CASE WHEN p_sub.p_total_netpay > 0 THEN p_sub.p_total_netpay ELSE 0 END)
    FROM payslip p_sub 
    WHERE p_payrolldate BETWEEN '${startpayrolldate}' AND '${endpayrolldate}'
    AND p_sub.p_employeeid = rp.rp_employeeid
    ) AS rp_payslip_netpay,
    (
        (SELECT 
            SUM(CASE WHEN rp_sub.rp_total_netpay > 0 THEN rp_sub.rp_total_netpay ELSE 0 END)
        FROM retro_payslip rp_sub 
        WHERE rp_sub.rp_employeeid = rp.rp_employeeid
        ) - 
         (SELECT 
        SUM(CASE WHEN p_sub.p_total_netpay > 0 THEN p_sub.p_total_netpay ELSE 0 END)
    FROM payslip p_sub 
    WHERE p_payrolldate BETWEEN '${startpayrolldate}' AND '${endpayrolldate}'
    AND p_sub.p_employeeid = rp.rp_employeeid
    )
    ) AS rp_total_retro_pay
FROM 
    retro_payslip rp
LEFT JOIN 
    payslip p ON rp.rp_employeeid = p.p_employeeid
INNER JOIN
    master_employee ON rp.rp_employeeid = me_id
WHERE
    rp.rp_employeeid = '${employeeid}'
GROUP BY 
    rp.rp_employeeid, rp.rp_fullname, rp.rp_salary, p.p_salary`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }


      if (result != 0) {
        let data = DataModeling(result, "rp_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getretropay", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT
    rp.rp_payrolldate,
    rp.rp_total_netpay,
    p.p_total_netpay as rp_payslip_netpay
    FROM
        retro_payslip rp
    INNER JOIN
        payslip p ON rp.rp_employeeid = p.p_employeeid AND rp.rp_payrolldate = p.p_payrolldate
    WHERE
        rp.rp_employeeid = '${employeeid}'
    ORDER BY
        rp.rp_payrolldate`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }


      if (result != 0) {
        let data = DataModeling(result, "rp_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/insertadjustment", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let payrolldate = req.body.payrolldate;
    let totalretropay = req.body.totalretropay;
    let adjustmenttype = "Retro Active Pay";
    let adjustmentreason = "Retro Active Pay";
    let origindate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let adjustmentstatus = "Active";
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let createby = req.session.fullname;

    let sql = InsertStatement("payroll_adjustments", "pa", [
      "employeeid",
      "origindate",
      "adjustmenttype",
      "adjust_amount",
      "payrolldate",
      "reason",
      "createby",
      "createdate",
      "adjustmentstatus",
    ]);
    let data = [
      [
        employeeid,
        origindate,
        adjustmenttype,
        totalretropay,
        payrolldate,
        adjustmentreason,
        createby,
        createdate,
        adjustmentstatus,
      ],
    ];

    let checkStatement = SelectStatement(
      "SELECT * FROM payroll_adjustments WHERE pa_employeeid =? and pa_adjustmenttype= ?",
      [employeeid, adjustmenttype]
    );


    Check(checkStatement)
      .then((result) => {
        console.log(result);
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});


router.get("/viewpayrolldates", (req, res) => {
  try {
    let sql = `SELECT DISTINCT DATE_FORMAT(p_payrolldate, '%Y-%m-%d') AS p_payrolldate
               FROM payslip
               ORDER BY p_payrolldate ASC`;
               
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
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});



  
  //#region FUNCTION
  function Check(sql) {
    return new Promise((resolve, reject) => {
      Select(sql, (err, result) => {
        if (err) reject(err);
  
        resolve(result);
      });
    });
  }
  //#endregion
