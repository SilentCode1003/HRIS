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
  // req.session.fullname = "DEV42";
  // req.session.employeeid = "999999";
  // req.session.accesstype = "Admin";

  // res.render("accessroutelayout", {
  //   image: req.session.image,
  //   employeeid: "999999",
  //   fullname: "DEV42",
  //   accesstype: "Admin",
  // });
  Validator(req, res, "generate13thmonthlayout", "generate13thmonth");
});

module.exports = router;

router.get("/selectyear", (req, res) => {
  try {
    let sql = `
        SELECT DISTINCT YEAR(p_payrolldate) AS p_year
        FROM payslip
        ORDER BY p_year`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //

      if (result != 0) {
        let data = DataModeling(result, "p_");

        //console.log(data);
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

router.post("/load", (req, res) => {
  try {
    let year = req.body.year;
    let sql = `SELECT
    tm_id,
    CONCAT(me_lastname,' ',me_firstname) AS tm_fullname,
    tm_year,
    tm_total_basic,
    tm_13th_month as tm_thirteenth_month,
    DATE_FORMAT(tm_generated_at, '%Y,%m,%d %H:%i:%s') AS tm_generated_at,
    tm_createby
    FROM thirteenth_month
    INNER JOIN master_employee ON thirteenth_month.tm_employeeid = me_id
    WHERE tm_year = ${year}`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //

      if (result != 0) {
        let data = DataModeling(result, "tm_");

        //console.log(data);
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

router.post("/gen13thmonth", (req, res) => {
  console.log("Hit");
  try {
    let year = req.body.year;
    let createdby = req.session.fullname;
    let sql = `CALL GenerateThirteenthMonth('${createdby}', ${year})`;

    let checkStatement = SelectStatement(
      "SELECT * FROM thirteenth_month WHERE tm_year = ?",
      [year]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          mysql.StoredProcedure(sql, (err, result) => {
            if (err) console.error("Error: ", err);

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

// router.post("/save", (req, res) => {
//   try {
//     let status = GetValue(ACT());
//     let createdby =
//       req.session.personelid == null ? "DEV42" : req.session.personelid;
//     let createddate = GetCurrentDatetime();
//     const { route, layout, access } = req.body;

//     let sql = InsertStatement("master_access_route_layout", "marl", [
//       "route",
//       "layout",
//       "accessid",
//       "status",
//       "createdby",
//       "createddate",
//     ]);
//     let data = [[route, layout, access, status, createdby, createddate]];
//     let checkStatement = SelectStatement(
//       "select * from master_access_route_layout where marl_route=? and marl_layout=? and marl_accessid=?",
//       [route, layout, access]
//     );

//     Check(checkStatement)
//       .then((result) => {
//
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           InsertTable(sql, data, (err, result) => {
//             if (err) {
//               console.log(err);
//               res.json(JsonErrorResponse(err));
//             }

//             res.json(JsonSuccess());
//           });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     console.log(err);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/getinfo13thmonth", (req, res) => {
  try {
    let tmonthid = req.body.tmonthid;
    let sql = `SELECT
    tm_id,
    CONCAT(me_lastname,' ',me_firstname) AS tm_fullname,
    tm_year,
    tm_total_basic,
    tm_13th_month as tm_thirteenth_month,
    DATE_FORMAT(tm_generated_at, '%Y,%m,%d %H:%i:%s') AS tm_generated_at,
    tm_createby
    FROM thirteenth_month
    INNER JOIN master_employee ON thirteenth_month.tm_employeeid = me_id
    WHERE tm_year = ${year}`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //

      if (result != 0) {
        let data = DataModeling(result, "tm_");

        //console.log(data);
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

router.put("/status", (req, res) => {
  try {
    let id = req.body.id;
    let status =
      req.body.status == GetValue(ACT()) ? GetValue(INACT()) : GetValue(ACT());
    let data = [status, id];

    let updateStatement = UpdateStatement(
      "master_access_route_layout",
      "marl",
      ["status"],
      ["id"]
    );

    Update(updateStatement, data, (err, result) => {
      if (err) {
        console.error("Error: ", err);
        res.json(JsonErrorResponse(err));
      }

      res.json(JsonSuccess());
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", (req, res) => {
  try {
    const { route, layout, access, id } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (route) {
      data.push(route);
      columns.push("route");
    }

    if (layout) {
      data.push(layout);
      columns.push("layout");
    }

    if (access) {
      data.push(access);
      columns.push("accessid");
    }

    if (id) {
      data.push(id);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "master_access_route_layout",
      "marl",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from master_access_route_layout where marl_route = ? and marl_layout = ? and marl_accessid = ?",
      [route, layout, access]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            //

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
