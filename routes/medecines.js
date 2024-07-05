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

      //console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "mm_");

        //console.log(data);
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
    let createddate = GetCurrentDatetime();
    const { medecinename, medecinecategory, medecinequantity,
      medecineexpdate, medecinedescription, medecinemanufacturer,
      medecineimage
     } = req.body;

    let sql = InsertStatement("master_medecines", "mm", [
      "name",
      "medecineimage",
      "category",
      "description",
      "quantity",
      "expirydate",
      "manufacturer",
      "createdate",
      "createby",
    ]);

    console.log(InsertStatement);

    let data = [[
      medecinename, 
      medecineimage, 
      medecinecategory, 
      medecinedescription, 
      medecinequantity, 
      medecineexpdate,
      medecinemanufacturer,
      createddate,
      createby,
    ]];
    console.log(data);
    let checkStatement = SelectStatement(
      "select * from master_medecines where mm_name=? and mm_category=?",      
      [medecinename, medecinecategory]
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
    console.log(err);
    res.json(JsonErrorResponse(error));
  }
});


router.post("/getmedecine", (req, res) => {
  try {
    let medecineid = req.body.medecineid;
    let sql = `SELECT 
    mm_name,
    mm_medecineimage,
    mm_category,
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
    const { medecinename, medecinecategory, medecinequantity, medecineexpdate
      , medecinedescription, medecinemanufacturer, medecineimage, medecineid
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

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from master_medecines where mm_name=? and mm_category=? and mm_manufacturer= ? and mm_createdate=? ",      
      [medecinename, medecinecategory, medecinemanufacturer, createddate]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            //console.log(result);

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
