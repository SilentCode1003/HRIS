var express = require("express");
var router = express.Router();

const mysql = require("./repository/hrmisdb");
const moment = require("moment");
const multer = require("multer");
const XLSX = require("xlsx");
const { Validator } = require("./controller/middleware");
const {
  convertExcelDate,
  GetCurrentDatetime,
  GetCurrentDate,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Encrypter } = require("./repository/cryptography");
const {
  generateUsernameAndPasswordForApprentice,
} = require("./repository/helper");
const {
  generateUsernameAndPasswordforemployee,
} = require("./repository/helper");
const { GenerateExcel } = require("./repository/excel");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const { DataModeling, RawData } = require("./model/hrmisdb");
const {
  JsonDataResponse,
  JsonErrorResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");

const apprenticecurrentYear = moment().format("YYYY");
const currentYear = moment().format("YY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('employeelayout', { title: 'Express' });

  Validator(req, res, "adjournementlayout", "adjournement");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    hs_id,
    CONCAT(me_lastname,' ',me_firstname) AS hs_fullname,
    hs_name,
    DATE_FORMAT(hs_startdate, '%W, %M %e, %Y') AS hs_startdate,
    DATE_FORMAT(hs_enddate, '%W, %M %e, %Y') AS hs_enddate,
    DATE_FORMAT(hs_lift_date, '%W, %M %e, %Y') AS hs_liftdate,
    hs_createby,
    hs_status
    FROM hold_suspension
    INNER JOIN master_employee ON hold_suspension.hs_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hs_");

        console.log(data);
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

router.post("/save", (req, res) => {
  try {
    const { name, description, employeeid, startdate, enddate, liftdate } =
      req.body;
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    let status = "Active";

    let sql = InsertStatement("hold_suspension", "hs", [
      "name",
      "description",
      "employeeid",
      "startdate",
      "enddate",
      "lift_date",
      "createdate",
      "createby",
      "status",
    ]);
    let data = [
      [
        name,
        description,
        employeeid,
        startdate,
        enddate,
        liftdate,
        createdate,
        createby,
        status,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from hold_suspension where hs_employeeid=? and hs_name=? and hs_description=? and hs_startdate=? and hs_enddate=?",
      [employeeid, name, description, startdate, enddate]
    );

    Check(checkStatement)
      .then((result) => {
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

router.post("/getadjournemployee", (req, res) => {
  try {
    let adjournid = req.body.adjournid;
    let sql = `SELECT
        me_profile_pic AS hs_image,
        hs_employeeid,
        hs_name,
        DATE_FORMAT(hs_enddate,'%Y-%m-%d') AS hs_enddate,
        DATE_FORMAT(hs_startdate,'%Y-%m-%d') AS hs_startdate,
        hs_description,
        hs_status
        FROM hold_suspension
        INNER JOIN master_employee ON hold_suspension.hs_employeeid = me_id
        WHERE hs_id = '${adjournid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hs_");

        console.log(data);
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

router.put("/edit", (req, res) => {
  try {
    const {
      employeeid,
      adjournid,
      startdate,
      name,
      enddate,
      description,
      status,
    } = req.body;
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();

    let data = [];
    let columns = [];
    let arguments = [];

    if (name) {
      data.push(name);
      columns.push("name");
    }

    if (description) {
      data.push(description);
      columns.push("description");
    }

    if (startdate) {
      data.push(startdate);
      columns.push("startdate");
    }

    if (enddate) {
      data.push(enddate);
      columns.push("enddate");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (adjournid) {
      data.push(adjournid);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "hold_suspension",
      "hs",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from hold_suspension where hs_employeeid=? and hs_name=? and hs_description=? and hs_startdate=? and hs_enddate=? and hs_status=?",
      [employeeid, name, description, startdate, enddate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            console.log(result);

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

router.post("/addlift", (req, res) => {
  try {
    let adjournid = req.body.adjournid;
    let sql = `SELECT
        CONCAT(me_lastname,' ',me_firstname) as hs_fullname,
        hs_employeeid,
        hs_name,
        DATE_FORMAT(hs_lift_date, '%Y-%m-%d') as hs_lift_date
        FROM hold_suspension
        INNER JOIN master_employee ON hold_suspension.hs_employeeid = me_id
        WHERE hs_id = '${adjournid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hs_");

        console.log(data);
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

// router.post("/saveliftdate", (req, res) => {
//   try {
//     const { adjournid, liftdate, employeeid } = req.body;
//     let createby = req.session.fullname;
//     let createdate = GetCurrentDatetime();
//     let status = "Lifted";

//     // Step 1: Retrieve data from hold_suspension table using adjournid
//     let selectHoldSuspension = `SELECT hs_employeeid, hs_startdate, hs_lift_date FROM hold_suspension WHERE hs_id = ${adjournid}`;

//     Select(selectHoldSuspension, (err, holdSuspensionData) => {
//       if (err) {
//         return res.json(JsonErrorResponse(err));
//       }

//       if (holdSuspensionData.length === 0) {
//         return res.json(
//           JsonWarningResponse("No record found for the given adjournid.")
//         );
//       }

//       let { hs_employeeid, hs_startdate, hs_lift_date } = holdSuspensionData[0];

//       // Step 2: Calculate suspension duration in days (from hs_startdate to hs_liftdate)
//       let startDate = new Date(hs_startdate);
//       let liftDate = new Date(liftdate); // Using the provided liftdate
//       let durationDays = Math.ceil(
//         (liftDate - startDate) / (1000 * 60 * 60 * 24)
//       );

//       // Step 3: Get the monthly salary of the employee from master_salary table
//       let selectSalary = `SELECT ms_monthly FROM master_salary WHERE ms_employeeid = ${employeeid}`;

//       Select(selectSalary, (err, salaryData) => {
//         if (err) {
//           return res.json(JsonErrorResponse(err));
//         }

//         if (salaryData.length === 0) {
//           return res.json(
//             JsonWarningResponse(
//               "Salary information not found for the employee."
//             )
//           );
//         }

//         let ms_monthly = salaryData[0].ms_monthly;

//         // Step 4: Calculate the salary per day and total suspension pay
//         let salaryPerDay = ms_monthly / 30; // Assuming 30 days in a month
//         let totalSuspensionPay = salaryPerDay * durationDays;

//         // Step 5: Prepare the UpdateStatement and InsertStatement
//         let data = [];
//         let columns = [];
//         let arguments = [];

//         if (status) {
//           data.push(status);
//           columns.push("status");
//         }

//         if (liftdate) {
//           data.push(liftdate);
//           columns.push("lift_date");
//         }

//         if (adjournid) {
//           data.push(adjournid);
//           arguments.push("id");
//         }

//         let updateStatement = UpdateStatement(
//           "hold_suspension",
//           "hs",
//           columns,
//           arguments
//         );

//         let insertStatement = InsertStatement("hold_suspension_pay", "hsp", [
//           "hold_suspensionid",
//           "employeeid",
//           "lift_date",
//           "duration_day",
//           "salary_per_day",
//           "total_suspension_pay",
//         ]);

//         let suspensionPayData = [
//           [
//             adjournid,
//             hs_employeeid,
//             liftdate,
//             durationDays,
//             salaryPerDay,
//             totalSuspensionPay,
//           ],
//         ];

//         // Step 6: Check if the record already exists based on hs_employeeid and liftdate
//         let checkStatement = `SELECT * FROM hold_suspension WHERE hs_employeeid=${employeeid} AND hs_lift_date=${liftdate}`;

//         Select(checkStatement, (err, checkResult) => {
//           if (err) {
//             return res.json(JsonErrorResponse(err));
//           }

//           if (checkResult.length != 0) {
//             return res.json(JsonWarningResponse("Record already exists."));
//           }

//           // Step 7: Update hold_suspension with lift date and insert into hold_suspension_pay
//           Update(updateStatement, data, (err, result) => {
//             if (err) {
//               console.error("Error: ", err);
//               return res.json(JsonErrorResponse(err));
//             }

//             console.log(result);
//             InsertTable(insertStatement, suspensionPayData, (err, result) => {
//               if (err) {
//                 console.error(err);
//                 return res.json(JsonErrorResponse(err));
//               }

//               res.json(
//                 JsonSuccess(
//                   "Lift date updated and suspension pay inserted successfully"
//                 )
//               );
//             });
//           });
//         });
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/saveliftdate", (req, res) => {
  try {
    const { adjournid, liftdate, employeeid } = req.body;
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    let status = "Lifted";

    // Step 1: Retrieve data from hold_suspension table using adjournid
    let selectHoldSuspension = `SELECT hs_employeeid, hs_startdate, hs_lift_date FROM hold_suspension WHERE hs_id = ${adjournid}`;

    Select(selectHoldSuspension, (err, holdSuspensionData) => {
      if (err) {
        return res.json(JsonErrorResponse(err));
      }

      if (holdSuspensionData.length === 0) {
        return res.json(
          JsonWarningResponse("No record found for the given adjournid.")
        );
      }

      let { hs_employeeid, hs_startdate, hs_lift_date } = holdSuspensionData[0];

      // Step 2: Calculate total duration in days (from hs_startdate to hs_liftdate)
      let startDate = new Date(hs_startdate);
      let liftDate = new Date(liftdate); // Using the provided liftdate
      let durationDays = Math.ceil(
        (liftDate - startDate) / (1000 * 60 * 60 * 24)
      );

      // Step 3: Retrieve employee's work schedule to determine rest days
      let selectShift = `SELECT ms_employeeid, ms_monday, ms_tuesday, ms_wednesday, ms_thursday, ms_friday, ms_saturday, ms_sunday FROM master_shift WHERE ms_employeeid = ${employeeid}`;

      Select(selectShift, (err, shiftData) => {
        if (err) {
          return res.json(JsonErrorResponse(err));
        }

        if (shiftData.length === 0) {
          return res.json(
            JsonWarningResponse("Shift information not found for the employee.")
          );
        }

        let restDaysCount = 0;
        let currentDate = new Date(hs_startdate);

        // Step 4: Loop through each date in the range and check if it's a rest day
        while (currentDate <= liftDate) {
          let dayOfWeek = currentDate.toLocaleString("en-US", {
            weekday: "long",
          });

          let isRestDay = false;
          switch (dayOfWeek) {
            case "Monday":
              isRestDay =
                JSON.parse(shiftData[0].ms_monday).time_in === "00:00:00";
              break;
            case "Tuesday":
              isRestDay =
                JSON.parse(shiftData[0].ms_tuesday).time_in === "00:00:00";
              break;
            case "Wednesday":
              isRestDay =
                JSON.parse(shiftData[0].ms_wednesday).time_in === "00:00:00";
              break;
            case "Thursday":
              isRestDay =
                JSON.parse(shiftData[0].ms_thursday).time_in === "00:00:00";
              break;
            case "Friday":
              isRestDay =
                JSON.parse(shiftData[0].ms_friday).time_in === "00:00:00";
              break;
            case "Saturday":
              isRestDay =
                JSON.parse(shiftData[0].ms_saturday).time_in === "00:00:00";
              break;
            case "Sunday":
              isRestDay =
                JSON.parse(shiftData[0].ms_sunday).time_in === "00:00:00";
              break;
          }

          if (isRestDay) {
            restDaysCount++;
          }

          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Step 5: Adjust the total suspension days by subtracting rest days
        let adjustedDurationDays = durationDays - restDaysCount;

        // Step 6: Get the monthly salary and payroll type of the employee from master_salary table
        let selectSalary = `SELECT ms_monthly, ms_payrolltype FROM master_salary WHERE ms_employeeid = ${employeeid}`;

        Select(selectSalary, (err, salaryData) => {
          if (err) {
            return res.json(JsonErrorResponse(err));
          }

          if (salaryData.length === 0) {
            return res.json(
              JsonWarningResponse(
                "Salary information not found for the employee."
              )
            );
          }

          let { ms_monthly, ms_payrolltype } = salaryData[0];
          let salaryPerDay;

          // Step 7: Validate payroll type and calculate salary per day
          if (ms_payrolltype === "Monthly") {
            salaryPerDay = (ms_monthly * 12) / 313; // Assuming 313 working days per year
          } else if (ms_payrolltype === "Daily") {
            salaryPerDay = ms_monthly;
          } else {
            return res.json(
              JsonWarningResponse(
                "Payroll type not recognized for the employee."
              )
            );
          }

          // Step 8: Calculate the total suspension pay
          let totalSuspensionPay = salaryPerDay * adjustedDurationDays;

          // Step 9: Check if the record exists in hold_suspension_pay
          let checkExistingPayStatement = `SELECT hsp_id FROM hold_suspension_pay WHERE hsp_hold_suspensionid=${adjournid} AND hsp_employeeid='${employeeid}'`;

          Select(checkExistingPayStatement, (err, payCheckResult) => {
            if (err) {
              return res.json(JsonErrorResponse(err));
            }

            if (payCheckResult.length > 0) {
              // Update existing record
              let hsp_id = payCheckResult[0].hsp_id;

              let updateSuspensionPayStatement = UpdateStatement(
                "hold_suspension_pay",
                "hsp",
                [
                  "lift_date",
                  "duration_day",
                  "salary_per_day",
                  "total_suspension_pay",
                ],
                ["id"]
              );

              let updateData = [
                liftdate,
                adjustedDurationDays,
                salaryPerDay,
                totalSuspensionPay,
                hsp_id,
              ];

              Update(
                updateSuspensionPayStatement,
                updateData,
                (err, result) => {
                  if (err) {
                    console.error("Error updating suspension pay: ", err);
                    return res.json(JsonErrorResponse(err));
                  }

                  // Also update the liftdate in the hold_suspension table
                  let updateHoldSuspension = `UPDATE hold_suspension SET hs_lift_date = '${liftdate}', hs_status = '${status}' WHERE hs_id = ${adjournid}`;

                  Update(updateHoldSuspension, [], (err, result) => {
                    if (err) {
                      console.error("Error updating hold suspension: ", err);
                      return res.json(JsonErrorResponse(err));
                    }

                    return res.json(
                      JsonSuccess(
                        "Suspension pay and lift date updated successfully."
                      )
                    );
                  });
                }
              );
            } else {
              // Insert a new record
              let insertSuspensionPayStatement = InsertStatement(
                "hold_suspension_pay",
                "hsp",
                [
                  "hold_suspensionid",
                  "employeeid",
                  "lift_date",
                  "duration_day",
                  "salary_per_day",
                  "total_suspension_pay",
                ]
              );

              let suspensionPayData = [
                [
                  adjournid,
                  hs_employeeid,
                  liftdate,
                  adjustedDurationDays,
                  salaryPerDay,
                  totalSuspensionPay,
                ],
              ];

              InsertTable(
                insertSuspensionPayStatement,
                suspensionPayData,
                (err, result) => {
                  if (err) {
                    console.error("Error inserting suspension pay: ", err);
                    return res.json(JsonErrorResponse(err));
                  }

                  // Also update the liftdate in the hold_suspension table
                  let updateHoldSuspension = `UPDATE hold_suspension SET hs_lift_date = '${liftdate}', hs_status = '${status}' WHERE hs_id = ${adjournid}`;

                  console.log(updateHoldSuspension,'UPDATE');
                  

                  Update(updateHoldSuspension, [], (err, result) => {
                    if (err) {
                      console.error("Error updating hold suspension: ", err);
                      return res.json(JsonErrorResponse(err));
                    }

                    return res.json(
                      JsonSuccess(
                        "Lift date updated and suspension pay inserted successfully."
                      )
                    );
                  });
                }
              );
            }
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/viewdatesdetails", (req, res) => {
  try {
    let adjournid = req.body.adjournid;
    let sql = `WITH RECURSIVE DateSeries AS (
         SELECT 
             hs.hs_id,
             hs.hs_employeeid,
             hs.hs_startdate AS date_value,
             hs.hs_enddate,
             hs.hs_lift_date,
             DAYNAME(hs.hs_startdate) AS day_name
         FROM 
             hold_suspension hs
         WHERE 
             hs.hs_id = ${adjournid}
         UNION ALL
 
         SELECT 
             ds.hs_id,
             ds.hs_employeeid,
             DATE_ADD(ds.date_value, INTERVAL 1 DAY) AS date_value,
             ds.hs_enddate,
             ds.hs_lift_date,

             DAYNAME(DATE_ADD(ds.date_value, INTERVAL 1 DAY)) AS day_name
         FROM 
             DateSeries ds
         WHERE 
             ds.date_value < ds.hs_enddate
     )
 
     SELECT 
         ds.hs_id as hs_adjournid,  
         ds.hs_employeeid hs_employeeid,
         DATE_FORMAT(ds.date_value, '%Y-%m-%d') AS hs_date_value, 
         DAYNAME(ds.date_value) AS hs_day_name,
         CASE 
           WHEN ds.date_value = ds.hs_lift_date THEN 'Lifted'
           WHEN ds.date_value > ds.hs_lift_date THEN NULL
             WHEN ds.day_name = 'Monday' AND JSON_UNQUOTE(ms.ms_monday->"$.time_in") = '00:00:00' THEN 'Rest Day'
             WHEN ds.day_name = 'Tuesday' AND JSON_UNQUOTE(ms.ms_tuesday->"$.time_in") = '00:00:00' THEN 'Rest Day'
             WHEN ds.day_name = 'Wednesday' AND JSON_UNQUOTE(ms.ms_wednesday->"$.time_in") = '00:00:00' THEN 'Rest Day'
             WHEN ds.day_name = 'Thursday' AND JSON_UNQUOTE(ms.ms_thursday->"$.time_in") = '00:00:00' THEN 'Rest Day'
             WHEN ds.day_name = 'Friday' AND JSON_UNQUOTE(ms.ms_friday->"$.time_in") = '00:00:00' THEN 'Rest Day'
             WHEN ds.day_name = 'Saturday' AND JSON_UNQUOTE(ms.ms_saturday->"$.time_in") = '00:00:00' THEN 'Rest Day'
             WHEN ds.day_name = 'Sunday' AND JSON_UNQUOTE(ms.ms_sunday->"$.time_in") = '00:00:00' THEN 'Rest Day'        
             ELSE 'Adjourned'
         END AS hs_adjourn_status
     FROM 
         DateSeries ds
     JOIN 
         master_shift ms
     ON 
         ds.hs_employeeid = ms.ms_employeeid
     ORDER BY 
         ds.date_value`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "hs_");

        console.log(data);
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
