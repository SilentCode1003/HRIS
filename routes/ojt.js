var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('ojtlayout', { title: 'Express' });
});

module.exports = router;