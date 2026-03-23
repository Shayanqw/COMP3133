var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST users — log body and confirm receipt */
router.post('/', function(req, res) {
  console.log(req.body);
  res.send('POST received!');
});

module.exports = router;
