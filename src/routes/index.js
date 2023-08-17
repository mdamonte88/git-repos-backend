var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('<p>GIT Repository - API Data</p>');
});

module.exports = router;
