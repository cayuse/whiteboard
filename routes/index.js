var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', rand: Math.floor((Math.random() * 1000000000 + 1)) });
});

module.exports = router;
