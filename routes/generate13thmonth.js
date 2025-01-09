var express = require("express");
const mysql = require("./repository/hrmisdb");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, ACT, INACT } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Validator } = require("./controller/middleware");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "generate13thmonthlayout", "generate13thmonth");
});

module.exports = router;

router.post("/load", (req, res) => {
  try {
    let startpayrolldate = req.body.startpayrolldate;
    let endpayrolldate = req.body.endpayrolldate;
    let sql = `SELECT
        p_employeeid,
        p_fullname,
        '${startpayrolldate}' as p_start_date,
        '${endpayrolldate}' as p_end_date,
        SUM(p_accrued13thmonth) as p_accrued13thmonth
      FROM payslip
      WHERE p_payrolldate BETWEEN '${startpayrolldate}' AND '${endpayrolldate}'
      GROUP BY p_employeeid, p_fullname
      LIMIT 0, 5000`;

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
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});


router.post("/viewdetails", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startpayrolldate = req.body.startpayrolldate;
    let endpayrolldate = req.body.endpayrolldate;
    let sql = `SELECT
    p_image,
    p_employeeid,
    p_fullname,
    p_payrolldate,
    p_overall_netpay,
    p_total_deductions,
    p_total_netpay,
    p_accrued13thmonth
    FROM payslip
    WHERE p_payrolldate BETWEEN '${startpayrolldate}' AND '${endpayrolldate}'
    AND p_employeeid = '${employeeid}'`;

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
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});


router.post("/viewdetailsprfile", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let startpayrolldate = req.body.startpayrolldate;
    let endpayrolldate = req.body.endpayrolldate;

    let sql = `SELECT
      p_image,
      p_fullname,
      p_employeeid,
      SUM(p_accrued13thmonth) AS p_totalaccrued,
      SUM(p_present + p_holidaydays) AS p_present,
      SUM(p_absent) AS p_absent,
      SUM(p_lateminutes) AS p_late_minutes,
      SUM(p_latehours) AS p_late_hours
    FROM payslip
    WHERE p_payrolldate BETWEEN '${startpayrolldate}' AND '${endpayrolldate}'
    AND p_employeeid = '${employeeid}'
    GROUP BY p_image, p_fullname
    LIMIT 0, 5000`;

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


//#region OLD API


// router.get("/selectyear", (req, res) => {
//   try {
//     let sql = `
//         SELECT DISTINCT YEAR(p_payrolldate) AS p_year
//         FROM payslip
//         ORDER BY p_year`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//       //

//       if (result != 0) {
//         let data = DataModeling(result, "p_");

//         //console.log(data);
//         res.json(JsonDataResponse(data));
//       } else {
//         res.json(JsonDataResponse(result));
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.post("/load", (req, res) => {
//   try {
//     let year = req.body.year;
//     let sql = `SELECT
//     tm_id,
//     CONCAT(me_lastname,' ',me_firstname) AS tm_fullname,
//     tm_year,
//     tm_total_basic,
//     tm_13th_month as tm_thirteenth_month,
//     DATE_FORMAT(tm_generated_at, '%Y,%m,%d %H:%i:%s') AS tm_generated_at,
//     tm_createby
//     FROM thirteenth_month
//     INNER JOIN master_employee ON thirteenth_month.tm_employeeid = me_id
//     WHERE tm_year = ${year}`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//       //

//       if (result != 0) {
//         let data = DataModeling(result, "tm_");

//         //console.log(data);
//         res.json(JsonDataResponse(data));
//       } else {
//         res.json(JsonDataResponse(result));
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.post("/gen13thmonth", (req, res) => {
//   console.log("Hit");
//   try {
//     let year = req.body.year;
//     let createdby = req.session.fullname;
//     let sql = `CALL GenerateThirteenthMonth('${createdby}', ${year})`;

//     let checkStatement = SelectStatement(
//       "SELECT * FROM thirteenth_month WHERE tm_year = ?",
//       [year]
//     );

//     Check(checkStatement)
//       .then((result) => {
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           mysql.StoredProcedure(sql, (err, result) => {
//             if (err) console.error("Error: ", err);

//             res.json(JsonSuccess());
//           });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.post("/getinfo13thmonth", (req, res) => {
//   try {
//     let tmonthid = req.body.tmonthid;
//     let sql = `SELECT
//     tm_id,
//     CONCAT(me_lastname,' ',me_firstname) AS tm_fullname,
//     tm_year,
//     tm_total_basic,
//     tm_13th_month as tm_thirteenth_month,
//     DATE_FORMAT(tm_generated_at, '%Y,%m,%d %H:%i:%s') AS tm_generated_at,
//     tm_createby
//     FROM thirteenth_month
//     INNER JOIN master_employee ON thirteenth_month.tm_employeeid = me_id
//     WHERE tm_year = ${year}`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//       //

//       if (result != 0) {
//         let data = DataModeling(result, "tm_");

//         //console.log(data);
//         res.json(JsonDataResponse(data));
//       } else {
//         res.json(JsonDataResponse(result));
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.put("/status", (req, res) => {
//   try {
//     let id = req.body.id;
//     let status =
//       req.body.status == GetValue(ACT()) ? GetValue(INACT()) : GetValue(ACT());
//     let data = [status, id];

//     let updateStatement = UpdateStatement(
//       "master_access_route_layout",
//       "marl",
//       ["status"],
//       ["id"]
//     );

//     Update(updateStatement, data, (err, result) => {
//       if (err) {
//         console.error("Error: ", err);
//         res.json(JsonErrorResponse(err));
//       }

//       res.json(JsonSuccess());
//     });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.put("/edit", (req, res) => {
//   try {
//     const { route, layout, access, id } = req.body;

//     let data = [];
//     let columns = [];
//     let arguments = [];

//     if (route) {
//       data.push(route);
//       columns.push("route");
//     }

//     if (layout) {
//       data.push(layout);
//       columns.push("layout");
//     }

//     if (access) {
//       data.push(access);
//       columns.push("accessid");
//     }

//     if (id) {
//       data.push(id);
//       arguments.push("id");
//     }

//     let updateStatement = UpdateStatement(
//       "master_access_route_layout",
//       "marl",
//       columns,
//       arguments
//     );

//     console.log(updateStatement);

//     let checkStatement = SelectStatement(
//       "select * from master_access_route_layout where marl_route = ? and marl_layout = ? and marl_accessid = ?",
//       [route, layout, access]
//     );

//     Check(checkStatement)
//       .then((result) => {
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           Update(updateStatement, data, (err, result) => {
//             if (err) console.error("Error: ", err);

//             //

//             res.json(JsonSuccess());
//           });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });


//#endregion
