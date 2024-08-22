const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
  JsonSuccess,
  JsonWarningResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "payroll_adjustmentslayout", "payroll_adjustments");
});

module.exports = router;

router.post("/getimage", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
      me_profile_pic
      FROM master_employee
      WHERE me_id = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "me_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
      pa_adjustmentid,
      concat(me_lastname,' ',me_firstname) as pa_fullname,
      pa_adjustmenttype,
      pa_adjust_amount,
      pa_payrolldate,
      pa_createby,
      pa_adjustmentstatus
      FROM payroll_adjustments
      INNER JOIN master_employee on payroll_adjustments.pa_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result, "result");

      if (result != 0) {
        let data = DataModeling(result, "pa_");

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
    let adjustmentstatus = "Active";
    const {
      employeeid,
      adjustmenttype,
      adjustmentamount,
      adjustmentreason,
      origindate,
      payrolldate,
    } = req.body;

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
        adjustmentamount,
        payrolldate,
        adjustmentreason,
        createby,
        createdate,
        adjustmentstatus,
      ],
    ];

    let checkStatement = SelectStatement(
      "SELECT * FROM payroll_adjustments WHERE pa_employeeid =? and pa_adjustmenttype= ? and pa_origindate= ?",
      [employeeid, adjustmenttype, origindate]
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

router.post("/getpayrolladjustment", (req, res) => {
  try {
    let adjustmentid = req.body.adjustmentid;
    let sql = `SELECT
      me_profile_pic as pa_image,
      pa_adjustmentid,
      pa_employeeid,
      pa_origindate,
      pa_adjustmenttype,
      pa_adjust_amount,
      pa_payrolldate,
      pa_reason,
      pa_adjustmentstatus
      FROM payroll_adjustments
      INNER JOIN master_employee ON payroll_adjustments.pa_employeeid = me_id
      WHERE pa_adjustmentid = '${adjustmentid}'
      AND pa_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result, "result");

      if (result != 0) {
        let data = DataModeling(result, "pa_");

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
    const {
      adjustmentid,
      employeeid,
      origindate,
      adjustmenttype,
      adjust_amount,
      payrolldate,
      adjustmentstatus,
      reason,
    } = req.body;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let data = [];
    let columns = [];
    let arguments = [];

    if (employeeid) {
      data.push(employeeid);
      columns.push("employeeid");
    }

    if (origindate) {
      data.push(origindate);
      columns.push("origindate");
    }

    if (adjustmenttype) {
      data.push(adjustmenttype);
      columns.push("adjustmenttype");
    }

    if (adjust_amount) {
      data.push(adjust_amount);
      columns.push("adjust_amount");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (adjustmentstatus) {
      data.push(adjustmentstatus);
      columns.push("adjustmentstatus");
    }

    if (reason) {
      data.push(reason);
      columns.push("reason");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (adjustmentid) {
      data.push(adjustmentid);
      arguments.push("adjustmentid");
    }

    let updateStatement = UpdateStatement(
      "payroll_adjustments",
      "pa",
      columns,
      arguments
    );

    console.log(data);

    let checkStatement = SelectStatement(
      "SELECT * FROM payroll_adjustments WHERE pa_employeeid =? and pa_adjustmenttype= ? and pa_origindate= ? and pa_adjustmentstatus =?",
      [employeeid, adjustmenttype, origindate, adjustmentstatus]
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
