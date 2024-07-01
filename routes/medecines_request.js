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
  // res.render('memberlayout', { title: 'Express' });
  Validator(req, res, "medecines_requestlayout", "medecines_request");
});
module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    mr_requestid,
    CONCAT(me_lastname, ' ', me_firstname) AS mr_fullname,
    MAX(mm_name) AS mr_medecinename,
    MAX(mm_quantity) AS mr_quantity,
    MAX(mm_category) AS mr_medecinecategory,
    MAX(mr_quantity_request) AS mr_quantityrequest,
    MAX(DATE_FORMAT(mr_requestdate, '%Y-%m-%d %H:%i:%s')) as mr_requestdate,
    MAX(mr_approvedby) AS mr_approvedby
    FROM medecines_request
    INNER JOIN master_medecines ON medecines_request.mr_medecineid = master_medecines.mm_medecineid
    INNER JOIN master_employee ON medecines_request.mr_employeeid = master_employee.me_id
    GROUP BY mr_requestid, mr_fullname
    LIMIT 0, 50000`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result, "result");

      if (result != 0) {
        let data = DataModeling(result, "mr_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.post("/getmedecinequantity", (req, res) => {
  try {
    let medecineid = req.body.medecineid;
    let sql = `SELECT 
      mm_quantity
      FROM master_medecines
      WHERE mm_medecineid = '${medecineid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result, "result");

      if (result != 0) {
        let data = DataModeling(result, "mm_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});


router.post('/check_quantity', (req, res) => {
  try {
      const { medecinename, medecinerequestednumber } = req.body;
      let checkQuantityStatement = SelectStatement(
          "SELECT mm_quantity FROM master_medecines WHERE mm_medecineid = ?",
          [medecinename]
      );

      Check(checkQuantityStatement)
          .then((quantityResult) => {
              let availableQuantity = quantityResult[0].mm_quantity;

              if (medecinerequestednumber > availableQuantity) {
                  res.json({ status: "error", message: "Insufficient supply" });
              } else {
                  res.json({ status: "success" });
              }
          })
          .catch((error) => {
              console.log(error);
              res.status(500).json({ status: "error", message: "Error checking quantity" });
          });
  } catch (error) {
      console.log(error);
      res.status(500).json({ status: "error", message: "An unexpected error occurred" });
  }
});

router.post("/save", (req, res) => {
  try {
    let approvedby = req.session.fullname;
    let requestdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    const { employeeid, medecinename, medecinerequestednumber, medreqreason } =
      req.body;
    let checkQuantityStatement = SelectStatement(
      "SELECT mm_quantity FROM master_medecines WHERE mm_medecineid = ?",
      [medecinename]
    );

    Check(checkQuantityStatement)
      .then((quantityResult) => {
        let availableQuantity = quantityResult[0].mm_quantity;

        if (medecinerequestednumber > availableQuantity) {
          return res.json(JsonWarningResponse("Insufficient supply"));
        }

        let sql = InsertStatement("medecines_request", "mr", [
          "medecineid",
          "quantity_request",
          "employeeid",
          "requestdate",
          "approvedby",
          "reason",
        ]);

        let data = [
          [
            medecinename,
            medecinerequestednumber,
            employeeid,
            requestdate,
            approvedby,
            medreqreason,
          ],
        ];

        let checkStatement = SelectStatement(
          "SELECT * FROM medecines_request WHERE mr_employeeid = ? AND mr_medecineid = ? AND mr_requestdate = ?",
          [employeeid, medecinename, requestdate]
        );

        Check(checkStatement)
          .then((result) => {
            if (result.length > 0) {
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
