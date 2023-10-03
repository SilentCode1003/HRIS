var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('rejectedleavelayout', { title: 'Express' });
});

module.exports = router;