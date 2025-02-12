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
      INNER JOIN master_employee on payroll_adjustments.pa_employeeid = me_id
      order by pa_adjustmentid desc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
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

    let checkStatement = SelectStatement(
      "SELECT * FROM payroll_adjustments WHERE pa_employeeid =? and pa_adjustmenttype= ? and pa_origindate= ? and pa_adjustmentstatus =?",
      [employeeid, adjustmenttype, origindate, adjustmentstatus]
    );

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

router.post("/upload", (req, res) => {
  try {
    const data = req.body.data;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let adjustmentstatus = "Active";

    let dataJson = JSON.parse(data);
    let existingAdjustments = [];

    const checkAndInsert = async (row) => {
      return new Promise((resolve) => {
        const { employeeid, payrolldate, adjustmenttype, adjust_amount, reason } = row;

        let sql = `SELECT * FROM payroll_adjustments WHERE pa_employeeid = ? AND pa_payrolldate = ? AND pa_adjustmenttype = ?`;
        let cmd = SelectStatement(sql, [employeeid, payrolldate, adjustmenttype]);
        Select(cmd, (err, result) => {
          if (result && result.length > 0) {
            existingAdjustments.push(row);
            resolve();
          } else {
            let cmd = InsertStatement("payroll_adjustments", "pa", [
              "employeeid",
              "payrolldate",
              "adjustmenttype",
              "adjust_amount",
              "reason",
              "createby",
              "createdate",
              "adjustmentstatus",
            ]);

            let data = [[employeeid, payrolldate, adjustmenttype, adjust_amount, reason, createby, createdate, adjustmentstatus]];
            InsertTable(cmd, data, (err, result) => {
              if (err) console.error("Error: ", err);
              resolve();
            });
          }
        });
      });
    };

    Promise.all(dataJson.map(checkAndInsert)).then(() => {
      if (existingAdjustments.length > 0) {
        res.status(200).json({
          msg: "Some records already exist",
          data: existingAdjustments,
        });
      } else {
        res.status(200).json({ msg: "success" });
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ msg: error });
  }
});

router.get("/loaddeductions", (req, res) => {
  try {
    let sql = `SELECT 
      pad_adjustmentid,
      concat(me_lastname,' ',me_firstname) as pad_fullname,
      pad_adjustmenttype,
      pad_adjust_amount,
      pad_payrolldate,
      pad_createby,
      pad_adjustmentstatus
      FROM payroll_adjustments_deductions
      INNER JOIN master_employee on payroll_adjustments_deductions.pad_employeeid = me_id
      order by pad_adjustmentid desc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pad_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.post("/savedeductions", (req, res) => {
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

    let sql = InsertStatement("payroll_adjustments_deductions", "pad", [
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
      "SELECT * FROM payroll_adjustments_deductions WHERE pad_employeeid =? and pad_adjustmenttype= ? and pad_origindate= ?",
      [employeeid, adjustmenttype, origindate]
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
    console.log(err);
    res.json(JsonErrorResponse(error));
  }
});


router.post("/getpayrolladjustmentdeductions", (req, res) => {
  try {
    let adjustmentid = req.body.adjustmentid;
    let sql = `SELECT
      me_profile_pic as pad_image,
      pad_adjustmentid,
      pad_employeeid,
      pad_origindate,
      pad_adjustmenttype,
      pad_adjust_amount,
      pad_payrolldate,
      pad_reason,
      pad_adjustmentstatus
      FROM payroll_adjustments_deductions
      INNER JOIN master_employee ON payroll_adjustments_deductions.pad_employeeid = me_id
      WHERE pad_adjustmentid = '${adjustmentid}'
      AND pad_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pad_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.put("/editdeductions", (req, res) => {
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
      "payroll_adjustments_deductions",
      "pad",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "SELECT * FROM payroll_adjustments_deductions WHERE pad_employeeid =? and pad_adjustmenttype= ? and pad_origindate= ? and pad_adjustmentstatus =?",
      [employeeid, adjustmenttype, origindate, adjustmentstatus]
    );

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


router.post("/uploaddeductions", (req, res) => {
  try {
    const data = req.body.data;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let adjustmentstatus = "Active";

    let dataJson = JSON.parse(data);
    let existingAdjustments = [];

    const checkAndInsert = async (row) => {
      return new Promise((resolve) => {
        const { employeeid, payrolldate, adjustmenttype, adjust_amount, reason } = row;

        let sql = `SELECT * FROM payroll_adjustments_deductions WHERE pad_employeeid = ? AND pad_payrolldate = ? AND pad_adjustmenttype = ?`;
        let cmd = SelectStatement(sql, [employeeid, payrolldate, adjustmenttype]);
        Select(cmd, (err, result) => {
          if (result && result.length > 0) {
            existingAdjustments.push(row);
            resolve();
          } else {
            let cmd = InsertStatement("payroll_adjustments_deductions", "pad", [
              "employeeid",
              "payrolldate",
              "adjustmenttype",
              "adjust_amount",
              "reason",
              "createby",
              "createdate",
              "adjustmentstatus",
            ]);

            let data = [[employeeid, payrolldate, adjustmenttype, adjust_amount, reason, createby, createdate, adjustmentstatus]];
            InsertTable(cmd, data, (err, result) => {
              if (err) console.error("Error: ", err);
              resolve();
            });
          }
        });
      });
    };

    Promise.all(dataJson.map(checkAndInsert)).then(() => {
      if (existingAdjustments.length > 0) {
        res.status(200).json({
          msg: "Some records already exist",
          data: existingAdjustments,
        });
      } else {
        res.status(200).json({ msg: "success" });
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ msg: error });
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
