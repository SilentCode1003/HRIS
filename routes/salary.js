const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  UpdateStatement,
  InsertStatement,
  GetCurrentDate,
} = require("./repository/customhelper");
const { Select, Update, Insert, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { ro } = require("date-fns/locale");
const { JsonErrorResponse, JsonWarningResponse, MessageStatus, JsonSuccess } = require("./repository/response");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('salarylayout', { title: 'Express' });
  Validator(req, res, "salarylayout", "salary");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `    
    SELECT 
   ms_id,
   concat(me_lastname,' ',me_firstname) as ms_employeeid,
   ms_monthly,
   ms_allowances,
   ms_basic_adjustments,
   ms_payrolltype
   FROM master_salary
    LEFT JOIN master_employee ON master_salary.ms_employeeid = me_id`;

    mysql.Select(sql, "Master_Salary", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/save", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let monthly = req.body.monthly;
    let allowances = req.body.allowances;
    let adjustments = req.body.adjustments;
    let payrolltype = req.body.payrolltype;

    let data = [];

    data.push([employeeid, monthly, allowances, adjustments, payrolltype]);

    let sql = `SELECT * FROM master_salary WHERE ms_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Master_Salary", (err, result) => {
      if (err) console.log("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("master_salary", data, (err, result) => {
          if (err) console.log("Error: ", err);

          res.json({
            msg: "success",
            data: result,
          });
        });
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getsalary", (req, res) => {
  try {
    let salaryid = req.body.salaryid;
    let sql = `select 
    ms_employeeid,
    ms_monthly,
    ms_allowances,
    ms_basic_adjustments,
    ms_payrolltype
    from master_salary
    where ms_id = '${salaryid}'`;

    mysql.Select(sql, "Master_Salary", (err, result) => {
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

router.put("/edit", async (req, res) => {
  try {
    const {
      salaryid,
      employeeid,
      monthly,
      allowances,
      adjustments,
      payrolltype,
      effectivedate,
    } = req.body;
    let createdBy = req.session.fullname;
    let createDate = GetCurrentDate();

    let Oldquery = `SELECT ms_monthly FROM master_salary WHERE ms_id = '${salaryid}'`;
    let oldSalaryResult = await mysql.mysqlQueryPromise(Oldquery);

    const oldSalary = oldSalaryResult[0]?.ms_monthly || 0;
    console.log(oldSalary, 'oldSalary');

    let data = [];
    let columns = [];
    let arguments = [];

    if (employeeid) {
      data.push(employeeid);
      columns.push("employeeid");
    }

    if (monthly) {
      data.push(monthly);
      columns.push("monthly");
    }

    if (allowances) {
      data.push(allowances);
      columns.push("allowances");
    }

    if (adjustments) {
      data.push(adjustments);
      columns.push("basic_adjustments");
    }

    if (payrolltype) {
      data.push(payrolltype);
      columns.push("payrolltype");
    }

    if (salaryid) {
      data.push(salaryid);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "master_salary",
      "ms",
      columns,
      arguments
    );

    console.log(updateStatement);
    await Update(updateStatement, data, async (err, result) => {
      if (err) {
        console.error("Error: ", err);
        return res.json(JsonErrorResponse(err));
      }

      if (effectivedate) {
        const mes_perday_old_salary = (oldSalary / 313) * 12;

        console.log(mes_perday_old_salary, 'mes_perday_old_salary');

        let mes_perday_new_salary;
        if (payrolltype === "Monthly") {
          mes_perday_new_salary = (monthly / 313) * 12;
        } else {
          mes_perday_new_salary = (monthly * 313) / 12;
        }

        const formatDate = (date) => {
          let year = date.getFullYear();
          let month = String(date.getMonth() + 1).padStart(2, "0");
          let day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const getPayrollDate = (date) => {
          let day = date.getDate();
          let year = date.getFullYear();
          let month = date.getMonth() + 1;

          if (day >= 26 || day <= 10) {
            return new Date(year, month, 15);
          } else {
            return new Date(year, month, 0);
          }
        };

        let payrollDate = getPayrollDate(new Date(effectivedate));
        let formattedEffectiveDate = formatDate(new Date(effectivedate));
        let formattedPayrollDate = formatDate(payrollDate);

        let sqlInsertMovement = InsertStatement(
          "movement_effective_salary",
          "mes",
          [
            "salaryid",
            "employeeid",
            "effectivedate",
            "perday_old_salary",
            "perday_new_salary",
            "payrolldate",
            "createby",
            "createdate",
          ]
        );
        let movementData = [
          [
            salaryid,
            employeeid,
            formattedEffectiveDate,
            mes_perday_old_salary,
            mes_perday_new_salary,
            formattedPayrollDate,
            createdBy,
            createDate,
          ],
        ];

        InsertTable(sqlInsertMovement, movementData, (err, result) => {
          if (err) {
            console.error("Error: ", err);
            return res.json(JsonErrorResponse(err));
          }

          res.json(JsonSuccess());
        });
      } else {
        res.json(JsonSuccess());
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/upload", (req, res) => {
  try {
    const data = req.body.data;
    let dataJson = JSON.parse(data);
    for (const row of dataJson) {
      const { employeeid, monthly, allowance, adjustment, payrolltype } = row;
      let sql = `SELECT * FROM master_salary WHERE ms_employeeid = ?`;
      let cmd = SelectStatement(sql, [employeeid]);
      Select(cmd, (err, result) => {
        if (err) console.error("Error: ", err);
        if (result.length != 0) {
          let data = DataModeling(result, "ms_");
          for (const content of data) {
            const { id, employeeid } = content;

            console.log(employeeid);

            let sqlupdate = UpdateStatement(
              "master_salary",
              "ms",
              ["monthly", "allowances", "basic_adjustments", "payrolltype"],
              ["employeeid"]
            );

            let data = [
              monthly,
              allowance,
              adjustment,
              payrolltype,
              employeeid,
            ];

            Update(sqlupdate, data, (err, result) => {
              if (err) console.error("Error: ", err);
            });
          }
        } else {
          let cmd = InsertStatement("master_salary", "ms", [
            "employeeid",
            "monthly",
            "allowances",
            "basic_adjustments",
            "payrolltype",
          ]);

          let data = [employeeid, monthly, allowance, adjustment, payrolltype];

          Insert(cmd, data, (err, result) => {
            if (err) console.error("Error: ", err);
          });
        }
      });
    }

    res.status(200).json({
      msg: "success",
    });
  } catch (error) {
    console.log(error);

    res.json({
      msg: error,
    });
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


  
// SAVE PAYROLL WITH MOVEMENT EFFECTIVE SALARY
// router.post("/save", async (req, res) => {
//   try {
//     let employeeid = req.body.employeeid;
//     let monthly = req.body.monthly;
//     let allowances = req.body.allowances;
//     let adjustments = req.body.adjustments;
//     let payrolltype = req.body.payrolltype;
//     let effectivedate = new Date(req.body.effectivedate);
//     let createdBy = req.session.fullname;
//     let createDate = GetCurrentDate();

//     const formatDate = (date) => {
//       let year = date.getFullYear();
//       let month = String(date.getMonth() + 1).padStart(2, '0');
//       let day = String(date.getDate()).padStart(2, '0');
//       return `${year}-${month}-${day}`;
//     };

//     const getPayrollDate = (date) => {
//       let day = date.getDate();
//       let year = date.getFullYear();
//       let month = date.getMonth() + 1;

//       if (day >= 26 || day <= 10) {
//         return new Date(year, month - 1, 15); 
//       } else {
//         return new Date(year, month, 0); 
//       }
//     };

//     let payrollDate = getPayrollDate(effectivedate);

//     let formattedEffectiveDate = formatDate(effectivedate);
//     let formattedPayrollDate = formatDate(payrollDate);

//     let sqlInsertSalary = InsertStatement("master_salary", "ms", [
//       "employeeid",
//       "monthly",
//       "allowances",
//       "basic_adjustments",
//       "payrolltype",
//     ]);
//     let salaryData = [
//       [employeeid, monthly, allowances, adjustments, payrolltype],
//     ];

//     let checkStatement = SelectStatement(
//       "SELECT * FROM master_salary WHERE ms_employeeid = ? AND ms_payrolltype = ? AND ms_monthly = ?",
//       [employeeid, payrolltype, monthly]
//     );

//     let existingRecord = await Check(checkStatement);
//     if (existingRecord != 0) {
//       return res.json(JsonWarningResponse(MessageStatus.EXIST));
//     }

//     InsertTable(sqlInsertSalary, salaryData, async (err, result) => {
//       if (err) {
//         console.log(err);
//         return res.json(JsonErrorResponse(err));
//       }

//       let insertedSalaryId = result[0].id;

//       let sqlInsertMovement = InsertStatement(
//         "movement_effective_salary",
//         "mes",
//         [
//           "salaryid",
//           "employeeid",
//           "effectivedate",
//           "payrolldate",
//           "createby",
//           "createdate",
//         ]
//       );
//       let movementData = [
//         [
//           insertedSalaryId,
//           employeeid,
//           formattedEffectiveDate, 
//           formattedPayrollDate,  
//           createdBy,
//           createDate,
//         ],
//       ];

//       InsertTable(sqlInsertMovement, movementData, (err, result) => {
//         if (err) {
//           console.log(err);
//           return res.json(JsonErrorResponse(err));
//         }

//         res.json(JsonSuccess());
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });


// router.put("/edit", async (req, res) => {
//   try {
//     const {
//       salaryid,
//       employeeid,
//       monthly,
//       allowances,
//       adjustments,
//       payrolltype,
//       effectivedate,
//     } = req.body;
//     let createdBy = req.session.fullname;
//     let createDate = GetCurrentDate();
    
//     let data = [];
//     let columns = [];
//     let arguments = [];

//     if (employeeid) {
//       data.push(employeeid);
//       columns.push("employeeid");
//     }

//     if (monthly) {
//       data.push(monthly);
//       columns.push("monthly");
//     }

//     if (allowances) {
//       data.push(allowances);
//       columns.push("allowances");
//     }

//     if (adjustments) {
//       data.push(adjustments);
//       columns.push("basic_adjustments");
//     }

//     if (payrolltype) {
//       data.push(payrolltype);
//       columns.push("payrolltype");
//     }

//     if (salaryid) {
//       data.push(salaryid);
//       arguments.push("id");
//     }

//     let updateStatement = UpdateStatement(
//       "master_salary",
//       "ms",
//       columns,
//       arguments
//     );

//     console.log(updateStatement);

//     await Update(updateStatement, data, async (err, result) => {
//       if (err) {
//         console.error("Error: ", err);
//         return res.json(JsonErrorResponse(err));
//       }

//       if (effectivedate) {
//         const formatDate = (date) => {
//           let year = date.getFullYear();
//           let month = String(date.getMonth() + 1).padStart(2, "0");
//           let day = String(date.getDate()).padStart(2, "0");
//           return `${year}-${month}-${day}`;
//         };

//         const getPayrollDate = (date) => {
//           let day = date.getDate();
//           let year = date.getFullYear();
//           let month = date.getMonth() + 1;

//           if (day >= 26 || day <= 10) {
//             return new Date(year, month, 15);
//           } else {
//             return new Date(year, month, 0);
//           }
//         };

//         let payrollDate = getPayrollDate(new Date(effectivedate));
//         let formattedEffectiveDate = formatDate(new Date(effectivedate));
//         let formattedPayrollDate = formatDate(payrollDate);

//         let sqlInsertMovement = InsertStatement(
//           "movement_effective_salary",
//           "mes",
//           [
//             "salaryid",
//             "employeeid",
//             "effectivedate",
//             "payrolldate",
//             "createby",
//             "createdate",
//           ]
//         );
//         let movementData = [
//           [
//             salaryid,
//             employeeid,
//             formattedEffectiveDate,
//             formattedPayrollDate,
//             createdBy,
//             createDate,
//           ],
//         ];

//         InsertTable(sqlInsertMovement, movementData, (err, result) => {
//           if (err) {
//             console.error("Error: ", err);
//             return res.json(JsonErrorResponse(err));
//           }

//           res.json(JsonSuccess());
//         });
//       } else {
//         res.json(JsonSuccess());
//       }
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });




// router.post("/update", (req, res) => {
//   try {
//     let salaryid = req.body.salaryid;
//     let employeeid = req.body.employeeid;
//     let monthly = req.body.monthly;
//     let allowances = req.body.allowances;
//     let adjustments = req.body.adjustments;
//     let payrolltype = req.body.payrolltype;
//     let sqlupdate = `update master_salary set 
//     ms_employeeid = '${employeeid}',
//     ms_monthly = '${monthly}',
//     ms_allowances = '${allowances}',
//     ms_basic_adjustments = '${adjustments}',
//     ms_payrolltype = '${payrolltype}'
//     where ms_id = '${salaryid}'`;

//     console.log(sqlupdate);

//     mysql
//       .Update(sqlupdate)
//       .then((result) => {
//         res.json({
//           msg: "success",
//           data: result,
//         });
//       })
//       .catch((error) => {
//         res.json({
//           msg: "error",
//           data: error,
//         });
//       });
//   } catch (error) {
//     res.json({
//       msg: "error",
//       data: error,
//     });
//   }
// });

  //#endregion