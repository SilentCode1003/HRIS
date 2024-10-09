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
const multer = require("multer");
const xlsx = require("xlsx");
const { ca } = require("date-fns/locale");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "bankaccountlayout", "bankaccount");
});

module.exports = router;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// router.post('/upload', upload.single('file'), async (req, res) => {
//   console.log('HIT');
//   try {
//     const file = req.file;
//     const bankid = req.body.bankid;
//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//     const workbook = xlsx.read(file.buffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     const createdby = req.session.fullname;
//     const createddate = GetCurrentDatetime();
//     const status = GetValue(ACT());
//     const cardnumber = 'N/A';
//     const expiration = 'N/A';

//     console.log(data, 'DATA');
//     console.log(bankid, 'BANKID');
//     console.log(file, 'file');

//     const invalidEmployeeIds = [];
//     const validInsertData = [];
//     for (let row of data) {
//       const employeeId = row['EMPLOYEE ID'];
//       const checkStatement = SelectStatement(
//         "SELECT me_id, me_jobstatus FROM master_employee WHERE me_id = ?",
//         [employeeId]
//       );
//       const checkResult = await Check(checkStatement);
//       if (checkResult.length === 0 || checkResult[0].me_jobstatus === 'resigned') {
//         invalidEmployeeIds.push(employeeId);
//       } else {
//         validInsertData.push([
//           employeeId,
//           bankid,
//           row['ACCOUNT NUMBER'],
//           cardnumber,
//           expiration,
//           status,
//           createdby,
//           createddate,
//         ]);
//       }
//     }

//     if (invalidEmployeeIds.length > 0) {
//       return res.status(400).json({
//         error: `Some employee IDs do not exist in master_employee or have a job status of 'Resigned': ${invalidEmployeeIds.join(', ')}`,
//         invalidIds: invalidEmployeeIds
//       });
//     }

//     const sql = InsertStatement('bank_account', 'ba', [
//       'employeeid',
//       'bankid',
//       'accountnumber',
//       'cardnumber',
//       'expiration',
//       'status',
//       'createdby',
//       'createddate',
//     ]);

//     if (validInsertData.length > 0) {
//       InsertTable(sql, validInsertData, (err, result) => {
//         if (err) {
//           console.log(err);
//           return res.json(JsonErrorResponse(err));
//         }
//         const insertedIds = validInsertData.map(row => row[0]);
//         res.json({ msg: 'success', insertedIds });
//       });
//     } else {
//       res.json({ msg: 'success', insertedIds: [] }); // No valid data to insert
//     }
//   } catch (error) {
//     console.error(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const bankid = req.body.bankid;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const createdby = req.session.fullname;
    const createddate = GetCurrentDatetime();
    const status = GetValue(ACT());
    const cardnumber = "N/A";
    const expiration = "N/A";

    const invalidEmployeeIds = [];
    const validInsertData = [];
    const existingRecords = [];

    for (let row of data) {
      const employeeId = row["EMPLOYEE ID"];
      const accountNumber = row["ACCOUNT NUMBER"];

      // Check if employee exists and is not resigned
      const checkStatement = SelectStatement(
        "SELECT me_id, me_jobstatus FROM master_employee WHERE me_id = ?",
        [employeeId]
      );
      const checkResult = await Check(checkStatement);
      if (
        checkResult.length === 0 ||
        checkResult[0].me_jobstatus === "resigned"
      ) {
        invalidEmployeeIds.push(employeeId);
        continue;
      }

      // Check if the combination of employeeid, bankid, and accountnumber already exists
      const checkExistingRecordStatement = SelectStatement(
        "SELECT 1 FROM bank_account WHERE ba_employeeid = ? AND ba_bankid = ? AND ba_accountnumber = ?",
        [employeeId, bankid, accountNumber]
      );
      const existingRecordResult = await Check(checkExistingRecordStatement);
      if (existingRecordResult.length > 0) {
        existingRecords.push([employeeId, bankid, accountNumber]);
        continue;
      }

      validInsertData.push([
        employeeId,
        bankid,
        accountNumber,
        cardnumber,
        expiration,
        status,
        createdby,
        createddate,
      ]);
    }

    if (invalidEmployeeIds.length > 0) {
      return res.status(400).json({
        error: `Some employee IDs do not exist in master_employee or have a job status of 'Resigned': ${invalidEmployeeIds.join(
          ", "
        )}`,
        invalidIds: invalidEmployeeIds,
      });
    }

    if (existingRecords.length > 0) {
      return res.json({
        msg: "exist",
        existingRecords: existingRecords,
      });
    }

    const sql = InsertStatement("bank_account", "ba", [
      "employeeid",
      "bankid",
      "accountnumber",
      "cardnumber",
      "expiration",
      "status",
      "createdby",
      "createddate",
    ]);

    if (validInsertData.length > 0) {
      InsertTable(sql, validInsertData, (err, result) => {
        if (err) {
          console.log(err);
          return res.json(JsonErrorResponse(err));
        }
        const insertedIds = validInsertData.map((row) => row[0]);
        res.json({ msg: "success", insertedIds });
      });
    } else {
      res.json({ msg: "success", insertedIds: [] }); // No valid data to insert
    }
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `select 
    ba_id,
    CONCAT(me_lastname,' ',me_firstname) as ba_employeeid,
    mb_name as ba_bankid,
    ba_accountnumber,
    ba_cardnumber,
    ba_expiration,
    ba_status,
    ba_createdby,
    ba_createddate from bank_account
    inner join master_employee on me_id = ba_employeeid
    inner join master_bank on mb_id = ba_bankid
    order by ba_id asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ba_");

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
    const { employee, bank, accountnumber, cardnumber, expiration } = req.body;
    console.log(employee, bank, accountnumber, cardnumber, expiration);

    let sql = InsertStatement("bank_account", "ba", [
      "employeeid",
      "bankid",
      "accountnumber",
      "cardnumber",
      "expiration",
      "status",
      "createdby",
      "createddate",
    ]);
    let data = [
      [
        employee,
        bank,
        accountnumber,
        cardnumber,
        expiration,
        status,
        createdby,
        createddate,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from bank_account where ba_employeeid=? and ba_bankid=? and ba_accountnumber=? and ba_cardnumber=? and ba_expiration",
      [employee, bank, accountnumber, cardnumber, expiration]
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
      "bank_account",
      "ba",
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

//di pa na gawa ang UI and Backend
router.put("/edit", (req, res) => {
  try {
    const { employee, bank, accountnumber, cardnumber, expiration, id } =
      req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (employee) {
      data.push(employee);
      columns.push("employeeid");
    }

    if (bank) {
      data.push(bank);
      columns.push("bankid");
    }

    if (accountnumber) {
      data.push(accountnumber);
      columns.push("accountnumber");
    }

    if (cardnumber) {
      data.push(cardnumber);
      columns.push("cardnumber");
    }

    if (expiration) {
      data.push(expiration);
      columns.push("expiration");
    }

    if (id) {
      data.push(id);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "bank_account",
      "ba",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from bank_account where ba_employeeid = ? and ba_bankid = ?",
      [employee, bank]
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
