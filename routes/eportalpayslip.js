var express = require("express");
const { Validator } = require("./controller/middleware");
const { Encrypter } = require("./repository/crytography");
const e = require("express");
const { mysqlQueryPromise } = require("./repository/hrmisdb");
const { error } = require("jquery");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalpaysliplayout', { title: 'Express' });
  Validator(req, res, "eportalpaysliplayout", "eportalindex");
});

module.exports = router;

router.post("/viewpayslip", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let password = req.body.password;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      console.log(encrypted);

      let sql = `select 
      me_id
      from master_employee
      inner join master_user on master_employee.me_id = mu_employeeid
      where mu_password = '${encrypted}' and me_id = '${employeeid}'`;

      mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            res.json({
              msg: "success",
              data: result,
            });
          } else {
            return res.status(500).json({
              msg: "Incorrect",
            });
          }
        })
        .catch((error) => {
          res.json({
            msg: "error",
            data: error,
          });
        });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
