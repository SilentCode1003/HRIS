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
  // res.render('memberlayout', { title: 'Express' });
  Validator(req, res, "medecineslayout", "medecines");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    mm_medecineid,
    mm_name,
    mm_category,
    mm_quantity,
    DATE_FORMAT(mm_expirydate, '%Y-%m-%d %H:%i:%s') as mm_expirydate,
    mm_manufacturer,
    DATE_FORMAT(mm_createdate, '%Y-%m-%d %H:%i:%s') as mm_createdate
    FROM master_medecines
    ORDER BY mm_quantity ASC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mm_");
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
    let createby = req.session.fullname;
    let responsible = req.session.employeeid;
    let createddate = GetCurrentDatetime();
    const {
      medecinename,
      medecinecategory,
      medecinegramsorml,
      medecineunit,
      medecinequantity,
      medecineexpdate,
      medecinedescription,
      medecinemanufacturer,
      medecineimage,
    } = req.body;

    let sql = InsertStatement("master_medecines", "mm", [
      "name",
      "medecineimage",
      "category",
      "grams_ml",
      "unit",
      "description",
      "quantity",
      "expirydate",
      "manufacturer",
      "createdate",
      "createby",
    ]);

    let data = [
      [
        medecinename,
        medecineimage,
        medecinecategory,
        medecinegramsorml,
        medecineunit,
        medecinedescription,
        medecinequantity,
        medecineexpdate,
        medecinemanufacturer,
        createddate,
        createby,
      ],
    ];

    let checkStatement = SelectStatement(
      "select * from master_medecines where mm_name=? and mm_category=?",
      [medecinename, medecinecategory]
    );

    Check(checkStatement)
      .then((result) => {
        if (result.length !== 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              return res.json(JsonErrorResponse(err));
            }

            let newMedicineId = result[0].id;
            let historySql = InsertStatement("medecine_history", "mh", [
              "history_type",
              "responsible",
              "quantity",
              "grams_ml",
              "unit",
              "medecine_name",
              "createdate",
              "createby",
            ]);

            let historyData = [
              [
                "New Stock",
                responsible,
                medecinequantity,
                medecinegramsorml,
                medecineunit,
                newMedicineId,
                createddate,
                createby,
              ],
            ];

            InsertTable(historySql, historyData, (err, result) => {
              if (err) {
                console.log(err);
                return res.json(JsonErrorResponse(err));
              }

              res.json(JsonSuccess());
            });
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

router.post("/getmedecine", (req, res) => {
  try {
    let medecineid = req.body.medecineid;
    let sql = `SELECT 
    mm_medecineid,
    mm_name,
    mm_medecineimage,
    mm_category,
    mm_grams_ml,
    mm_unit,
    mm_description,
    mm_quantity,
    DATE_FORMAT(mm_expirydate, '%Y-%m-%d') as mm_expirydate,
    mm_manufacturer
    FROM master_medecines
    WHERE mm_medecineid = '${medecineid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mm_");
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

router.put("/edit", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    const {
      medecinename,
      medecinecategory,
      medecinequantity,
      medecineexpdate,
      medecinedescription,
      medecinemanufacturer,
      medecineimage,
      medecineid,
      meddossage,
      medunit,
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (medecinename) {
      data.push(medecinename);
      columns.push("name");
    }

    if (medecineimage) {
      data.push(medecineimage);
      columns.push("medecineimage");
    }

    if (meddossage) {
      data.push(meddossage);
      columns.push("grams_ml");
    }

    if (medunit) {
      data.push(medunit);
      columns.push("unit");
    }

    if (medecinecategory) {
      data.push(medecinecategory);
      columns.push("category");
    }

    if (medecinedescription) {
      data.push(medecinedescription);
      columns.push("description");
    }

    if (medecinequantity) {
      data.push(medecinequantity);
      columns.push("quantity");
    }

    if (medecinemanufacturer) {
      data.push(medecinemanufacturer);
      columns.push("manufacturer");
    }

    if (medecineexpdate) {
      data.push(medecineexpdate);
      columns.push("expirydate");
    }

    if (createddate) {
      data.push(createddate);
      columns.push("createdate");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (medecineid) {
      data.push(medecineid);
      arguments.push("medecineid");
    }

    let updateStatement = UpdateStatement(
      "master_medecines",
      "mm",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from master_medecines where mm_name=? and mm_category=? and mm_manufacturer= ? and mm_createdate=? and mm_expirydate=? ",
      [
        medecinename,
        medecinecategory,
        medecinemanufacturer,
        createddate,
        medecineexpdate,
      ]
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

router.post("/stockin", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    let responsible = req.session.employeeid;
    const { stockinpieces, gramsMl, unit, medecineid } = req.body;
    let history_type = "Stock In";

    let sql = InsertStatement("medecine_history", "mh", [
      "history_type",
      "responsible",
      "quantity",
      "grams_ml",
      "unit",
      "medecine_name",
      "createdate",
      "createby",
    ]);

    let data = [
      [
        history_type,
        responsible,
        stockinpieces,
        gramsMl,
        unit,
        medecineid,
        createddate,
        createby,
      ],
    ];

    let checkStatement = SelectStatement(
      "select * from medecine_history where mh_history_type=? and mh_quantity=? and mh_grams_ml=? and mh_unit=? and mh_medecine_name=? and mh_createdate=? and mh_createby=?",
      [
        history_type,
        stockinpieces,
        gramsMl,
        unit,
        medecineid,
        createddate,
        createby,
      ]
    );

    Check(checkStatement)
      .then((result) => {
        if (result.length !== 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              return res.json(JsonErrorResponse(err));
            }

            let updateSql = `UPDATE master_medecines SET mm_quantity = mm_quantity + '${stockinpieces}' WHERE mm_medecineid = '${medecineid}'`;

            mysql
              .Update(updateSql)
              .then((result) => {
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

router.get("/loadstockin", (req, res) => {
  try {
    let sql = `SELECT 
    mh_historyid,
    mh_history_type,
    mh_quantity,
    mh_grams_ml,
    mh_unit,
    mm_name AS mh_medecine_name,
    DATE_FORMAT(mh_createdate, '%Y-%m-%d %H:%i:%s') as mh_createdate,
    mh_createby
    FROM medecine_history
    INNER JOIN master_medecines ON medecine_history.mh_medecine_name = mm_medecineid
    WHERE mh_history_type IN ('Stock In','New Stock')
    ORDER BY mh_historyid ASC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mh_");
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

router.get("/loadstockout", (req, res) => {
  try {
    let sql = `SELECT 
    mh_historyid,
    mh_history_type,
    mh_quantity,
    mh_grams_ml,
    mh_unit,
    mm_name AS mh_medecine_name,
    DATE_FORMAT(mh_createdate, '%Y-%m-%d %H:%i:%s') as mh_createdate,
    mh_createby
    FROM medecine_history
    INNER JOIN master_medecines ON medecine_history.mh_medecine_name = mm_medecineid
    WHERE mh_history_type IN ('Void','Stock Out')
    ORDER BY mh_historyid ASC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mh_");
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
