var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");
const mysql  = require("./repository/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('paymentlayout', { title: 'Express' });
  Validator(req, res, "otherdeductionsIDlayout");
});

module.exports = router;



