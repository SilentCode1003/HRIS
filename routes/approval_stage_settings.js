const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { JsonErrorResponse, JsonDataResponse, JsonWarningResponse, JsonSuccess, MessageStatus } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const { InsertStatement, SelectStatement, UpdateStatement } = require("./repository/customhelper");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "approval_stage_settingslayout",
    "approval_stage_settings"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    ats_id,
    ma_accessname as ats_accessid,
    md_departmentname as ats_departmentid,
    ats_count,
    ats_createdby,
    ats_createddate
    FROM aprroval_stage_settings
    INNER JOIN master_access on aprroval_stage_settings.ats_accessid = ma_accessid
    INNER JOIN master_department on aprroval_stage_settings.ats_departmentid = md_departmentid`;

      Select(sql, (err, result) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
        }
  
        console.log(result);
  
        if (result != 0) {
          let data = DataModeling(result, "ats_");
  
          console.log(data);
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
    let accessid = req.body.accessid;
    let departmentid = req.body.departmentid;
    let count = req.body.approvalcount;
    let createdby = req.session.fullname;
    let createddate = currentDate.format("YYYY-MM-DD HH:mm:ss");


    let sql = InsertStatement("aprroval_stage_settings", "ats", [
      "accessid",
      "departmentid",
      "count",
      "createdby",
      "createddate",
    ]);
    let data = [[
      accessid,
      departmentid, 
      count, 
      createdby, 
      createddate]];
    let checkStatement = SelectStatement(
      "select * from aprroval_stage_settings where ats_accessid=? and ats_departmentid=?",
      [accessid, departmentid]
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
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getstagesettings", (req, res) => {
  try {
    let approvalstage = req.body.approvalstage;
    let sql = `SELECT
    ats_id,
    ats_accessid,
    ats_departmentid,
    ats_count,
    ats_createdby,
    ats_createddate
    FROM aprroval_stage_settings
    INNER JOIN master_access ON aprroval_stage_settings.ats_accessid = ma_accessid
    INNER JOIN master_department on aprroval_stage_settings.ats_departmentid = md_departmentid
    WHERE  ats_id = '${approvalstage}'`;


    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "ats_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});



router.put("/edit", (req, res) => {
  try {
    const { approvalstage, accessid, approvalcount, departmentid } = req.body;

    console.log(accessid);
    console.log(approvalstage);
    console.log(approvalcount);
    console.log(departmentid);

    let data = [];
    let columns = [];
    let arguments = [];

    if (departmentid) {
      data.push(departmentid);
      columns.push("departmentid");
    }

    if (accessid) {
      data.push(accessid);
      columns.push("accessid");
    }

    if (approvalcount) {
      data.push(approvalcount);
      columns.push("count");
    }

    if (approvalstage) {
      data.push(approvalstage);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "aprroval_stage_settings",
      "ats",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from aprroval_stage_settings where ats_accessid = ? and ats_departmentid = ? and ats_count = ?",
      [accessid, departmentid, approvalcount]
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

// router.post("/update", (req, res) => {
//   try {
//     let approvalstage = req.body.approvalstage;
//     let accessid = req.body.accessid;
//     let approvalcount = req.body.approvalcount;
//     let createby = req.session.fullname;
//     let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

//     console.log(approvalstage, approvalcount);

//     let checkexist = `SELECT * FROM aprroval_stage_settings 
//     WHERE ats_accessid = '${accessid}' AND ats_count = '${approvalcount}'`;

//     console.log(checkexist, "sql");

//     mysql.Select(checkexist, "Approval_Stage_Settings", (err, result) => {
//       if (err) console.error("Error: ", err);

//       if (result.length != 0) {
//         res.json({
//           msg: "exist",
//         });
//       } else {
//         let sql = `UPDATE aprroval_stage_settings SET 
//     ats_accessid = '${accessid}',
//     ats_count = '${approvalcount}',
//     ats_createdby = '${createby}',
//     ats_createddate = '${createdate}'
//     WHERE ats_id = '${approvalstage}'`;

//         console.log(sql, "sql");

//         mysql
//           .Update(sql)
//           .then((result) => {
//             res.json({
//               msg: "success",
//               data: result,
//             });
//           })
//           .catch((error) => {
//             res.json({
//               msg: "error",
//               data: error,
//             });
//           });
//       }
//     });
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

