const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  InsertStatement,
  SelectStatement,
  UpdateStatement,
} = require("./repository/customhelper");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('candidatelayout', { title: 'Express' });

  Validator(req, res, "change_shiftlayout", "change_shift");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    cs_id,
    concat(me_lastname,' ',me_firstname) as cs_fullname,
    cs_actualrd,
    cs_changerd,
    cs_createby,
    cs_shiftstatus
    FROM change_shift
    INNER JOIN master_employee on change_shift.cs_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cs_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.post("/save", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = "Active";
    const { employeeid, targetrddate, actualrddate } = req.body;

    let sql = InsertStatement("change_shift", "cs", [
      "employeeid",
      "actualrd",
      "changerd",
      "shiftstatus",
      "createby",
      "createdate",
    ]);
    let data = [
      [employeeid, actualrddate, targetrddate, status, createby, createdate],
    ];

    let checkStatement = SelectStatement(
      "select * from change_shift where cs_employeeid =? and cs_actualrd= ?",
      [employeeid, actualrddate]
    );

    console.log(checkStatement);

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
    console.log(err);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getchange_shift", (req, res) => {
  try {
    let changeshift = req.body.changeshift;
    let sql = `SELECT
    cs_id,
    cs_employeeid,
    cs_actualrd,
    cs_changerd,
    cs_shiftstatus,
    cs_createby,
    cs_createdate
    FROM change_shift
    WHERE cs_id = '${changeshift}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cs_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.put("/edit", (req, res) => {
  try {
    const { changeshift, employeeid, actualrd, changerd, shiftstatus } =
      req.body;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let data = [];
    let columns = [];
    let arguments = [];

    if (employeeid) {
      data.push(employeeid);
      columns.push("employeeid");
    }

    if (actualrd) {
      data.push(actualrd);
      columns.push("actualrd");
    }

    if (changerd) {
      data.push(changerd);
      columns.push("changerd");
    }

    if (shiftstatus) {
      data.push(shiftstatus);
      columns.push("shiftstatus");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (changeshift) {
      data.push(changeshift);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "change_shift",
      "cs",
      columns,
      arguments
    );

    console.log(updateStatement, "Update");

    let checkStatement = SelectStatement(
      "select * from change_shift where cs_employeeid = ? and cs_actualrd = ? and cs_changerd = ? and cs_shiftstatus = ? and cs_createby = ? and cs_createdate = ?",
      [employeeid, actualrd, changerd, shiftstatus, createby, createdate]
    );

    console.log(checkStatement, "check");

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
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
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

// router.post("/update", (req, res) => {
//   try {
//     let changeshift = req.body.changeshift;
//     let employeeid = req.body.employeeid;
//     let actualrd = req.body.actualrd;
//     let changerd = req.body.changerd;
//     let createby = req.session.fullname;
//     let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
//     let shiftstatus = req.body.shiftstatus;

//     let sql = `  UPDATE subgroup SET
//     s_departmentid = '${departmentid}',
//     s_name = '${subgroupname}',
//     s_createby = '${createby}',
//     s_createdate = '${createdate}',
//     s_status = '${status}'
//     WHERE s_id = '${subgroupid}'`;
//     mysql
//       .Update(sql)
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
//     console.log(error);
//   }
// });

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
