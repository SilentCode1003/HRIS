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
  Validator(req, res, "banklayout", "bank");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `select 
    mb_id,
    mb_name,
    mb_status,
    mb_createdby,
    mb_createddate
    from master_bank order by mb_id asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mb_");

        console.log(data);
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

router.post("/save", (req, res) => {
  try {
    let status = GetValue(ACT());
    let createdby =
      req.session.personelid == null ? "DEV42" : req.session.personelid;
    let createddate = GetCurrentDatetime();
    const { bank } = req.body;

    let sql = InsertStatement("master_bank", "mb", [
      "name",
      "status",
      "createdby",
      "createddate",
    ]);
    let data = [[bank, status, createdby, createddate]];
    let checkStatement = SelectStatement(
      "select * from master_bank where mb_name=?",
      [bank]
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

router.put("/status", (req, res) => {
  try {
    let id = req.body.id;
    let status =
      req.body.status == GetValue(ACT()) ? GetValue(INACT()) : GetValue(ACT());
    let data = [status, id];

    let updateStatement = UpdateStatement(
      "master_bank",
      "mb",
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
    const { bank, id } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (bank) {
      data.push(bank);
      columns.push("name");
    }

    if (id) {
      data.push(id);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "master_bank",
      "mb",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from master_bank where mb_name = ?",
      [bank]
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
