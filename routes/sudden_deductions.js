var express = require("express");
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
  Validator(req, res, "sudden_deductionslayout", "sudden_deductions");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
        sd_deductionsid,
        sd_deduction_name,
        DATE_FORMAT(sd_payrolldate, '%Y-%m-%d') AS sd_payrolldate,
        sd_amount,
        sd_createby,
        DATE_FORMAT(sd_createdate, '%Y-%m-%d %h:%i:%s') AS sd_createdate
        FROM sudden_deductions`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //

      if (result != 0) {
        let data = DataModeling(result, "sd_");

        //console.log(data);
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
    let createdby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    const { deduction_name, payroll_date, amount, file, description } =
      req.body;

    let sql = InsertStatement("sudden_deductions", "sd", [
      "deduction_name",
      "payrolldate",
      "amount",
      "description",
      "file",
      "createby",
      "createdate",
    ]);
    let data = [
      [
        deduction_name,
        payroll_date,
        amount,
        description,
        file,
        createdby,
        createddate,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from sudden_deductions where sd_deduction_name=? and sd_payrolldate=?",
      [deduction_name, payroll_date]
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

router.post("/getsuddendeduction", (req, res) => {
  try {
    let deductionsid = req.body.deductionsid;
    let sql = `SELECT 
        sd_deduction_name,
        DATE_FORMAT(sd_payrolldate, '%Y-%m-%d') AS sd_payrolldate,
        sd_amount,
        sd_description,
        sd_file
        FROM sudden_deductions
        WHERE sd_deductionsid = '${deductionsid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //

      if (result != 0) {
        let data = DataModeling(result, "sd_");

        //console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    const {
      deduction_name,
      payroll_date,
      amount,
      description,
      file,
      deductionsid,
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (deduction_name) {
      data.push(deduction_name);
      columns.push("deduction_name");
    }

    if (payroll_date) {
      data.push(payroll_date);
      columns.push("payrolldate");
    }

    if (amount) {
      data.push(amount);
      columns.push("amount");
    }

    if (description) {
      data.push(description);
      columns.push("description");
    }

    if (file) {
      data.push(file);
      columns.push("file");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (deductionsid) {
      data.push(deductionsid);
      arguments.push("deductionsid");
    }

    let updateStatement = UpdateStatement(
      "sudden_deductions",
      "sd",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from sudden_deductions where sd_deduction_name = ? and sd_payrolldate = ? and sd_amount = ?",
      [deduction_name, payroll_date, amount]
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
