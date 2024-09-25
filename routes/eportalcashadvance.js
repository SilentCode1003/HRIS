const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();
/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalcashadvancelayout', { title: 'Express' });
  Validator(req, res, "eportalcashadvancelayout", "eportalcashadvance");
});

module.exports = router;

router.post("/submit", async (req, res) => {
  try {
    const employeeid = req.session.employeeid;
    const { amount, purpose } = req.body;
    const requestdate = currentDate.format("YYYY-MM-DD");
    const status = "Pending";
    const approvaldate = "On Process";

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [employeeid, requestdate, amount, purpose, status, approvaldate],
    ];

    mysql.InsertTable("cash_advance", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        console.log(insertResult);
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submit route: ", error);
    res.json({ msg: "error" });
  }
});


router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    ca_cashadvanceid,
    ca_requestdate,
    ca_amount,
    ca_purpose,
    ca_approvaldate
    FROM cash_advance 
    WHERE ca_employeeid = '${employeeid}'
    AND ca_status = 'Pending'
    order by ca_cashadvanceid desc`;

    console.log(employeeid, "id");
    console.log(sql);

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ca_");

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

router.get("/approved", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    ca_cashadvanceid,
    ca_requestdate,
    ca_amount,
    ca_purpose,
    ca_status,
    ca_approvaldate
    FROM cash_advance WHERE ca_employeeid = '${employeeid}'
    AND ca_status = 'Approved'
    ORDER BY ca_cashadvanceid DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ca_");

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

router.post("/getload", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT * FROM cash_advance WHERE ca_employeeid = '${employeeid}'
    order by ca_cashadvanceid desc`;

    mysql.Select(sql, "Cash_Advance", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getpending", (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let sql = `SELECT 
    ca_cashadvanceid,
    me_profile_pic as ca_image,
    CONCAT(me_lastname,' ',me_firstname) as ca_fullname,
    ca_requestdate,
    ca_amount,
    ca_purpose,
    ca_status,
    ca_approvaldate
    FROM cash_advance 
    INNER JOIN master_employee ON cash_advance.ca_employeeid = me_id
    WHERE ca_cashadvanceid = '${cashadvanceid}'
    AND ca_status = 'Pending'
    ORDER BY ca_cashadvanceid DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ca_");

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

router.post("/update", (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let status = req.body.status;

    let sqlupdate = `UPDATE 
        cash_advance SET ca_status = '${status}'
        WHERE ca_cashadvanceid = '${cashadvanceid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        console.log(sqlupdate);

        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.post("/getca", (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let sql = `SELECT 
    ca_cashadvanceid,
    me_profile_pic as ca_image,
    CONCAT(me_lastname,' ',me_firstname) as ca_fullname,
    ca_requestdate,
    ca_amount,
    ca_purpose,
    ca_status,
    ca_approvaldate
    FROM cash_advance 
    INNER JOIN master_employee ON cash_advance.ca_employeeid = me_id
    WHERE ca_cashadvanceid = '${cashadvanceid}'
    AND ca_status = 'Approved'
    ORDER BY ca_cashadvanceid DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ca_");

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

router.post("/cancelcashadvanced", async (req, res) => {
  try {
    const cashadvanceid = req.body.cashadvanceid;

    const updateCashAdvanceStatusQuery = `UPDATE cash_advance SET ca_status = 'Cancelled' WHERE ca_cashadvanceid = ${cashadvanceid}`;

    try {
      await mysql.mysqlQueryPromise(updateCashAdvanceStatusQuery, [
        cashadvanceid,
      ]);
      res.json({
        msg: "success",
        cashadvanceid: cashadvanceid,
        status: "Cancelled",
      });
    } catch (updateError) {
      console.error("Error updating cashadvance status: ", updateError);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error in /cancelcashadvance route: ", error);
    res.json({ msg: "error" });
  }
});
